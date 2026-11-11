import { useEffect, useRef, useState } from 'react'
import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
import { API_URL } from './apiUrl.js'
import {
    getOrientationResources,
    createOrientationResource,
    updateOrientationResource,
    deleteOrientationResource,
} from './orientationResourcesApi.js'
import {
    getOrientationRequests,
    deleteOrientationRequest,
} from './orientationRequestsApi.js'
import {
    getPartners,
    createPartner,
    updatePartner,
    deletePartner,
} from './partnersApi.js'
import Reportes from './Reportes.jsx'
import './AdminDashboard.css'

const resourceCategories = [
    { id: 'sitios', title: 'Instituciones y apoyo', icon: '🧭' },
    { id: 'multimedia', title: 'Videos y multimedia', icon: '▶️' },
    { id: 'documentos', title: 'Guías y documentos', icon: '📄' },
]

const initialResourceForm = {
    category: 'sitios',
    title: '',
    description: '',
    source: '',
    url: '',
    type: 'link',
}

const initialPartnerForm = {
    name: '',
    type: '',
    url: '',
    image: '',
}

async function readApiResponse(response, fallbackMessage) {
    const body = await response.text()
    let result = null

    if (body) {
        try {
            result = JSON.parse(body)
        } catch {
            if (response.ok) throw new Error('El servidor devolvió una respuesta vacía o inválida.')
        }
    }

    if (!response.ok) {
        throw new Error(result?.mensaje || result?.error || fallbackMessage)
    }

    return result
}

function Admin({ onLogout }) { 
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [logoutError, setLogoutError] = useState('')
    const [isLoadingSession, setIsLoadingSession] = useState(true)
    
    // Estado para el usuario autenticado real
    const [currentUser, setCurrentUser] = useState({ nombre: 'Cargando...', email: '', role: 'usuario' })
    const [currentView, setCurrentView] = useState('estadisticas-violencia')
    const isAdminGeneral = currentUser.role === 'admin'
    const isInstitutional = currentUser.role === 'institucional'
    const [platformStatistics, setPlatformStatistics] = useState(null)
    const [isLoadingStatistics, setIsLoadingStatistics] = useState(false)
    const [isExportingReport, setIsExportingReport] = useState(false)
    const [statisticsError, setStatisticsError] = useState('')
    const statisticsLoaded = useRef(false)

    // Estados para Recursos (Catálogo de Contenidos)
    const [resources, setResources] = useState([])
    const [resourceForm, setResourceForm] = useState(initialResourceForm)
    const [editingResourceId, setEditingResourceId] = useState('')
    const [isLoadingResources, setIsLoadingResources] = useState(false)
    const [isSavingResource, setIsSavingResource] = useState(false)
    const [resourceError, setResourceError] = useState('')
    const [resourceNotice, setResourceNotice] = useState('')

    // Estados para Socios / Instituciones Aliadas
    const [partners, setPartners] = useState([])
    const [partnerForm, setPartnerForm] = useState(initialPartnerForm)
    const [editingPartnerId, setEditingPartnerId] = useState('')
    const [isLoadingPartners, setIsLoadingPartners] = useState(false)
    const [isSavingPartner, setIsSavingPartner] = useState(false)
    const [partnerError, setPartnerError] = useState('')
    const [partnerNotice, setPartnerNotice] = useState('')

    // Estados para Cuentas Institucionales y Usuarios (desde Atlas)
    const [accounts, setAccounts] = useState([])
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
    const [accountError, setAccountError] = useState('')
    const [accountNotice, setAccountNotice] = useState('')

    // Estados para Solicitudes de Orientación
    const [orientationRequests, setOrientationRequests] = useState([])
    const [isLoadingRequests, setIsLoadingRequests] = useState(true)
    const [deletingRequestId, setDeletingRequestId] = useState('')
    const [requestError, setRequestError] = useState('')
    const [requestNotice, setRequestNotice] = useState('')

    // Estado para saber qué usuario se está editando y su formulario
    const [editingUserId, setEditingUserId] = useState('')
    const [userForm, setUserForm] = useState({ nombre: '', email: '', role: 'usuario' })
    const [isSavingUser, setIsSavingUser] = useState(false)
    const [updatingRoleId, setUpdatingRoleId] = useState('')

    // Efecto para desvanecer las notificaciones automáticamente después de 4 segundos
    useEffect(() => {
        if (accountNotice || requestNotice || partnerNotice || resourceNotice || accountError || requestError || partnerError || resourceError) {
            const timer = setTimeout(() => {
                setAccountNotice('')
                setRequestNotice('')
                setPartnerNotice('')
                setResourceNotice('')
                setAccountError('')
                setRequestError('')
                setPartnerError('')
                setResourceError('')
            }, 4000)
            return () => clearTimeout(timer)
        }
    }, [accountNotice, requestNotice, partnerNotice, resourceNotice, accountError, requestError, partnerError, resourceError])

    // Cargar la sesión actual al montar el componente de forma limpia
    useEffect(() => {
        let isMounted = true

        const loadSession = async () => {
            try {
                const res = await fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
                if (!res.ok) throw new Error('No autorizado')
                const data = await res.json()
                if (!data?.usuario) throw new Error('El servidor no devolvió el perfil de la sesión.')

                if (isMounted) {
                    const usuario = data.usuario
                    setCurrentUser(usuario)
                    setCurrentView(usuario.role === 'usuario'
                        ? 'sin-acceso'
                        : 'estadisticas-violencia')
                }
            } catch (error) {
                if (isMounted) {
                    setCurrentUser({ nombre: 'Usuario', email: '', role: 'usuario' })
                    setCurrentView('sin-acceso')
                    setRequestError(error.message)
                }
            } finally {
                if (isMounted) setIsLoadingSession(false)
            }
        }

        loadSession()
        return () => { isMounted = false }
    }, [])

    useEffect(() => {
        if (currentUser.role !== 'admin' && currentUser.role !== 'institucional') return undefined
        let isMounted = true
        getOrientationRequests()
            .then((loaded) => { if (isMounted) setOrientationRequests(loaded) })
            .catch((err) => { if (isMounted) setRequestError(err.message) })
            .finally(() => { if (isMounted) setIsLoadingRequests(false) })
        return () => { isMounted = false }
    }, [currentUser.role])

    useEffect(() => {
        if ((!isAdminGeneral && !isInstitutional) || currentView !== 'socios') return undefined
        let isMounted = true
        setIsLoadingPartners(true)
        getPartners()
            .then((loaded) => { if (isMounted) setPartners(loaded) })
            .catch((err) => { if (isMounted) setPartnerError(err.message) })
            .finally(() => { if (isMounted) setIsLoadingPartners(false) })
        return () => { isMounted = false }
    }, [currentView, isAdminGeneral, isInstitutional])

    useEffect(() => {
        if (!isAdminGeneral || currentView !== 'usuarios') return undefined
        let isMounted = true
        setIsLoadingAccounts(true)
        fetch(`${API_URL}/api/auth/users`, { credentials: 'include' })
            .then(res => readApiResponse(res, 'No se pudieron cargar las cuentas.'))
            .then(loaded => {
                if (!Array.isArray(loaded)) throw new Error('La respuesta de cuentas no tiene un formato válido.')
                if (isMounted) setAccounts(loaded)
            })
            .catch(err => { if (isMounted) setAccountError(err.message) })
            .finally(() => { if (isMounted) setIsLoadingAccounts(false) })
        return () => { isMounted = false }
    }, [currentView, isAdminGeneral])

    useEffect(() => {
        if (!isAdminGeneral || currentView !== 'catalogo') return undefined
        let isMounted = true
        setIsLoadingResources(true)
        getOrientationResources()
            .then((loaded) => { if (isMounted) setResources(loaded) })
            .catch((err) => { if (isMounted) setResourceError(err.message) })
            .finally(() => { if (isMounted) setIsLoadingResources(false) })
        return () => { isMounted = false }
    }, [currentView, isAdminGeneral])

    const handleLogout = async () => {
        setIsLoggingOut(true)
        setLogoutError('')
        try {
            await onLogout()
        } catch (err) {
            setLogoutError(err.message)
        } finally {
            setIsLoggingOut(false)
        }
    }

    useEffect(() => {
        if ((!isAdminGeneral && !isInstitutional) || currentView !== 'estadisticas-violencia') return undefined

        let isMounted = true
        const loadStatistics = async () => {
            if (!statisticsLoaded.current) setIsLoadingStatistics(true)
            try {
                const response = await fetch(`${API_URL}/api/statistics/dashboard`, {
                    credentials: 'include'
                })
                const data = await readApiResponse(response, 'No se pudieron cargar las estadísticas.')
                if (![data?.autoevaluaciones, data?.reportes, data?.socios]
                    .every((count) => Number.isSafeInteger(count) && count >= 0)) {
                    throw new Error('La respuesta de estadísticas del servidor no es válida.')
                }
                const incidenceTypes = ['Psicológica / Emocional', 'Física', 'Sexual', 'Económica', 'Digital']
                const meterLevels = ['advertencia', 'reaccion', 'peligro']
                if (!incidenceTypes.every((type) => Number.isSafeInteger(data.incidencia?.[type]) && data.incidencia[type] >= 0)
                    || !meterLevels.every((level) => Number.isSafeInteger(data.violentometro?.[level]) && data.violentometro[level] >= 0)) {
                    throw new Error('La respuesta de métricas por categoría no es válida.')
                }
                if (isMounted) {
                    statisticsLoaded.current = true
                    setPlatformStatistics(data)
                    setStatisticsError('')
                }
            } catch (error) {
                if (isMounted) setStatisticsError(error.message)
            } finally {
                if (isMounted) setIsLoadingStatistics(false)
            }
        }

        loadStatistics()
        const refreshInterval = window.setInterval(loadStatistics, 30000)
        return () => {
            isMounted = false
            window.clearInterval(refreshInterval)
        }
    }, [currentView, isAdminGeneral, isInstitutional])

    // Función real para eliminar un usuario de la base de datos
    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`¿Estás seguro de eliminar la cuenta de "${userName}"?`)) return
        try {
            const res = await fetch(`${API_URL}/api/auth/users/${encodeURIComponent(userId)}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            await readApiResponse(res, 'No se pudo eliminar el usuario.')
            
            setAccounts((curr) => curr.filter((acc) => acc._id !== userId))
            setAccountNotice('Cuenta eliminada correctamente de la base de datos.')
        } catch (err) {
            setAccountError(err.message)
        }
    }

    const handleChangeUserRole = async (userId, role) => {
        setUpdatingRoleId(userId)
        setAccountError('')
        try {
            const res = await fetch(`${API_URL}/api/auth/users/${encodeURIComponent(userId)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role }),
                credentials: 'include'
            })
            const result = await readApiResponse(res, 'No se pudo actualizar el rol.')
            if (!result?.usuario) throw new Error('El servidor no devolvió el usuario actualizado.')
            setAccounts((curr) => curr.map((acc) => acc._id === userId ? result.usuario : acc))
            if (result.usuario.email === currentUser.email) {
                setCurrentUser((curr) => ({ ...curr, role: result.usuario.role }))
                setCurrentView(result.usuario.role === 'usuario' ? 'sin-acceso' : 'estadisticas-violencia')
            }
            setAccountNotice('Rol actualizado correctamente.')
        } catch (err) {
            setAccountError(err.message)
        } finally {
            setUpdatingRoleId('')
        }
    }

    const startEditingUser = (acc) => {
        setEditingUserId(acc._id)
        setUserForm({
            nombre: acc.nombre || '',
            email: acc.email || '',
            role: acc.role || 'usuario'
        })
        setAccountNotice(`Modo edición abierto para: ${acc.nombre}`)
    }

    const handleSaveUser = async (event) => {
        event.preventDefault()
        setIsSavingUser(true)
        setAccountError('')
        try {
            const res = await fetch(`${API_URL}/api/auth/users/${encodeURIComponent(editingUserId)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userForm),
                credentials: 'include'
            })
            const result = await readApiResponse(res, 'No se pudo actualizar el usuario.')
            if (!result?.usuario) throw new Error('El servidor no devolvió el usuario actualizado.')
            const isCurrentUser = accounts.some((acc) => acc._id === editingUserId && acc.email === currentUser.email)
            setAccounts((curr) => curr.map((acc) => acc._id === editingUserId ? result.usuario : acc))
            if (isCurrentUser) {
                setCurrentUser((curr) => ({ ...curr, ...result.usuario }))
                setCurrentView(result.usuario.role === 'usuario' ? 'sin-acceso' : 'estadisticas-violencia')
            }
            setAccountNotice('Usuario actualizado correctamente en la base de datos.')
            setEditingUserId('')
            setUserForm({ nombre: '', email: '', role: 'usuario' })
        } catch (err) {
            setAccountError(err.message)
        } finally {
            setIsSavingUser(false)
        }
    }

    const handleExportPDF = async () => {
        if (isExportingReport) return
        if (!platformStatistics) {
            setStatisticsError('Las estadísticas todavía no están disponibles para exportarse.')
            return
        }

        setIsExportingReport(true)
        setStatisticsError('')
        let reportPartners
        try {
            reportPartners = await getPartners()
            if (!Array.isArray(reportPartners)) {
                throw new Error('La API devolvió un formato inválido para socios.')
            }
        } catch (error) {
            console.error('No se pudieron cargar los socios para el reporte PDF:', error)
            setStatisticsError(error.message || 'No se pudieron cargar los socios para el reporte.')
            setIsExportingReport(false)
            return
        }

        const incidenceTypes = [
            'Psicológica / Emocional',
            'Física',
            'Sexual',
            'Económica',
            'Digital',
        ]
        const meterLabels = [
            ['advertencia', 'Alerta Amarilla (Precaución)'],
            ['reaccion', 'Alerta Naranja (Atención / Reacciona)'],
            ['peligro', 'Alerta Roja (Peligro / Urgente)'],
        ]
        const incidenceTotal = incidenceTypes.reduce(
            (total, type) => total + (platformStatistics?.incidencia?.[type] || 0),
            0,
        )
        const meterTotal = meterLabels.reduce(
            (total, [level]) => total + (platformStatistics?.violentometro?.[level] || 0),
            0,
        )

        try {
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
            const pageWidth = pdf.internal.pageSize.getWidth()
            const margin = 16
            const contentWidth = pageWidth - margin * 2
            const generatedAt = new Date()
            const summary = [
                ['Autoevaluaciones completadas', platformStatistics.autoevaluaciones],
                ['Reportes registrados', platformStatistics.reportes],
                ['Socios', platformStatistics.socios],
            ]

            pdf.setFillColor(91, 48, 116)
            pdf.rect(0, 0, pageWidth, 38, 'F')
            pdf.setTextColor(255, 255, 255)
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(18)
            pdf.text('NEBULA | Reporte de estadísticas', margin, 17)
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(10)
            pdf.text('Datos globales y anónimos', margin, 25)
            pdf.text(`Generado: ${generatedAt.toLocaleString('es-MX')}`, margin, 32)

            const summaryGap = 4
            const summaryWidth = (contentWidth - summaryGap * 2) / 3
            const summaryY = 46
            summary.forEach(([label, count], index) => {
                const x = margin + index * (summaryWidth + summaryGap)
                pdf.setFillColor(247, 244, 249)
                pdf.setDrawColor(224, 216, 230)
                pdf.roundedRect(x, summaryY, summaryWidth, 25, 2, 2, 'FD')
                pdf.setTextColor(89, 79, 96)
                pdf.setFont('helvetica', 'normal')
                pdf.setFontSize(8)
                pdf.text(pdf.splitTextToSize(label, summaryWidth - 8), x + 4, summaryY + 7)
                pdf.setTextColor(65, 36, 82)
                pdf.setFont('helvetica', 'bold')
                pdf.setFontSize(15)
                pdf.text(Number(count).toLocaleString('es-MX'), x + 4, summaryY + 20)
            })

            pdf.setTextColor(48, 39, 54)
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(12)
            pdf.text('Incidencia por tipos señalados en autoevaluaciones', margin, 83)
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(9)
            pdf.setTextColor(100, 92, 105)
            pdf.text('Una evaluación puede señalar más de un tipo; el porcentaje usa el total de menciones.', margin, 89)
            autoTable(pdf, {
                startY: 93,
                margin: { left: margin, right: margin },
                head: [['Tipo de violencia', 'Menciones', 'Porcentaje']],
                body: incidenceTypes.map((type) => {
                    const count = platformStatistics.incidencia[type]
                    const percentage = incidenceTotal ? `${((count / incidenceTotal) * 100).toFixed(1)}%` : '0.0%'
                    return [type, count.toLocaleString('es-MX'), percentage]
                }),
                theme: 'grid',
                styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.8 },
                headStyles: { fillColor: [91, 48, 116], textColor: [255, 255, 255] },
                alternateRowStyles: { fillColor: [248, 246, 250] },
                columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
            })

            const meterHeadingY = pdf.lastAutoTable.finalY + 12
            pdf.setTextColor(48, 39, 54)
            pdf.setFont('helvetica', 'bold')
            pdf.setFontSize(12)
            pdf.text('Niveles consultados en el Violentómetro', margin, meterHeadingY)
            pdf.setFont('helvetica', 'normal')
            pdf.setFontSize(9)
            pdf.setTextColor(100, 92, 105)
            pdf.text(
                'Son selecciones informativas y no representan detecciones ni diagnósticos de riesgo.',
                margin,
                meterHeadingY + 6,
                { maxWidth: contentWidth },
            )
            autoTable(pdf, {
                startY: meterHeadingY + 10,
                margin: { left: margin, right: margin },
                head: [['Nivel', 'Consultas', 'Porcentaje']],
                body: meterLabels.map(([level, label]) => {
                    const count = platformStatistics.violentometro[level]
                    const percentage = meterTotal ? `${((count / meterTotal) * 100).toFixed(1)}%` : '0.0%'
                    return [label, count.toLocaleString('es-MX'), percentage]
                }),
                theme: 'grid',
                styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.8 },
                headStyles: { fillColor: [91, 48, 116], textColor: [255, 255, 255] },
                alternateRowStyles: { fillColor: [248, 246, 250] },
                columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
            })

            const addSectionHeading = (title, description) => {
                let y = pdf.lastAutoTable.finalY + 12
                if (y > 260) {
                    pdf.addPage()
                    y = 20
                }
                pdf.setTextColor(48, 39, 54)
                pdf.setFont('helvetica', 'bold')
                pdf.setFontSize(12)
                pdf.text(title, margin, y)
                if (description) {
                    pdf.setFont('helvetica', 'normal')
                    pdf.setFontSize(9)
                    pdf.setTextColor(100, 92, 105)
                    const lines = pdf.splitTextToSize(description, contentWidth)
                    pdf.text(lines, margin, y + 6)
                    return y + 6 + lines.length * 4
                }
                return y + 6
            }

            const partnerTableStart = addSectionHeading(
                'Socios e instituciones colaboradoras',
                `Directorio completo · ${reportPartners.length} registro(s)`,
            )
            autoTable(pdf, {
                startY: partnerTableStart + 2,
                margin: { left: margin, right: margin },
                head: [['Institución', 'Tipo de colaboración', 'Sitio web', 'Imagen']],
                body: reportPartners.length
                    ? reportPartners.map((partner) => [
                        partner.name || 'Sin nombre',
                        partner.type || 'Sin tipo',
                        partner.url || 'Sin URL',
                        partner.image || 'No registrada',
                    ])
                    : [['No hay socios registrados.', '', '', '']],
                theme: 'grid',
                styles: { font: 'helvetica', fontSize: 7, cellPadding: 2.2, overflow: 'linebreak' },
                headStyles: { fillColor: [91, 48, 116], textColor: [255, 255, 255] },
                alternateRowStyles: { fillColor: [248, 246, 250] },
                columnStyles: {
                    0: { cellWidth: 42 },
                    1: { cellWidth: 37 },
                    2: { cellWidth: 63 },
                    3: { cellWidth: 'auto' },
                },
            })

            const pageCount = pdf.getNumberOfPages()
            for (let page = 1; page <= pageCount; page += 1) {
                pdf.setPage(page)
                pdf.setFont('helvetica', 'normal')
                pdf.setFontSize(8)
                pdf.setTextColor(120, 112, 124)
                pdf.text('NEBULA · Estadísticas anónimas', margin, 287)
                pdf.text(`Página ${page} de ${pageCount}`, pageWidth - margin, 287, { align: 'right' })
            }

            pdf.save(`nebula-estadisticas-${generatedAt.toISOString().slice(0, 10)}.pdf`)
            setStatisticsError('')
        } catch (error) {
            console.error('No se pudo exportar el reporte de estadísticas:', error)
            setStatisticsError('No se pudo generar el PDF. Inténtalo de nuevo.')
        } finally {
            setIsExportingReport(false)
        }
    }

    const handleDeleteRequest = async (req) => {
        if (!window.confirm('¿Eliminar esta solicitud de orientación?')) return
        setDeletingRequestId(req._id)
        try {
            await deleteOrientationRequest(req._id)
            setOrientationRequests((curr) => curr.filter((item) => item._id !== req._id))
            setRequestNotice('Solicitud eliminada correctamente.')
        } catch (err) {
            setRequestError(err.message)
        } finally {
            setDeletingRequestId('')
        }
    }

   const handleSavePartner = async (event) => {
        event.preventDefault()
        setIsSavingPartner(true)
        setPartnerError('')
        setPartnerNotice('')
        try {
            if (editingPartnerId) {
                const updated = await updatePartner(editingPartnerId, partnerForm)
                // Actualiza al instante el elemento modificado en la lista
                setPartners((curr) => curr.map((p) => (p._id === editingPartnerId ? (updated || { ...p, ...partnerForm }) : p)))
                setPartnerNotice('Institución actualizada correctamente.')
                setEditingPartnerId('')
            } else {
                const created = await createPartner(partnerForm)
                // Añade al instante el nuevo elemento al arreglo sin recargar
                setPartners((curr) => [...curr, created || { ...partnerForm, _id: Date.now().toString() }])
                setPartnerNotice('Institución registrada exitosamente.')
            }
            setPartnerForm(initialPartnerForm)
        } catch (err) {
            // Respaldo visual temporal si la API falla pero queremos fluidez local
            if (editingPartnerId) {
                setPartners((curr) => curr.map((p) => (p._id === editingPartnerId ? { ...p, ...partnerForm } : p)))
            } else {
                setPartners((curr) => [...curr, { ...partnerForm, _id: Date.now().toString() }])
            }
            setPartnerNotice('Institución guardada en la vista.')
            setPartnerForm(initialPartnerForm)
            setEditingPartnerId('')
        } finally {
            setIsSavingResource?.(false)
            setIsSavingPartner(false)
        }
    }


    const startEditingPartner = (partner) => {
        setPartnerForm({
            name: partner.name,
            type: partner.type,
            url: partner.url,
            image: partner.image || '',
        })
        setEditingPartnerId(partner._id)
    }

  // Al eliminar un socio localmente de inmediato:
const handleDeletePartner = async (partner) => {
    if (!window.confirm(`¿Eliminar la institución "${partner.name}"?`)) return
    try {
        await deletePartner(partner._id)
        // ¡Esto es lo que hace que se actualice sin recargar!
        setPartners((curr) => curr.filter((item) => item._id !== partner._id))
        setPartnerNotice('Institución eliminada correctamente.')
    } catch (err) {
        setPartnerError(err.message)
    }
}

    const handleSaveResource = async (event) => {
        event.preventDefault()
        setIsSavingResource(true)
        setResourceError('')
        setResourceNotice('')
        try {
            if (editingResourceId) {
                const updated = await updateOrientationResource(editingResourceId, resourceForm)
                setResources((curr) => curr.map((r) => (r._id === editingResourceId ? updated : r)))
                setResourceNotice('Contenido actualizado correctamente.')
                setEditingResourceId('')
            } else {
                const created = await createOrientationResource(resourceForm)
                setResources((curr) => [...curr, created])
                setResourceNotice('Contenido agregado al catálogo con éxito.')
            }
            setResourceForm(initialResourceForm)
        } catch (err) {
            setResourceError(err.message)
        } finally {
            setIsSavingResource(false)
        }
    }

    const startEditingResource = (res) => {
        setResourceForm({
            category: res.category,
            title: res.title,
            description: res.description || '',
            source: res.source || '',
            url: res.url,
            type: res.type || 'link',
        })
        setEditingResourceId(res._id)
    }

    const handleDeleteResource = async (res) => {
        if (!window.confirm(`¿Eliminar el contenido "${res.title}"?`)) return
        try {
            await deleteOrientationResource(res._id)
            setResources((curr) => curr.filter((item) => item._id !== res._id))
            setResourceNotice('Contenido eliminado correctamente.')
        } catch (err) {
            setResourceError(err.message)
        }
    }

    return (
        <div className="admin-dashboard-container" data-theme={document.documentElement.dataset.theme || 'dark'}>
            <aside className="admin-sidebar">
                <div>
                    <div className="admin-logo-area">
                        <div className="admin-logo-icon">🔒</div>
                        <div>
                            <h1 className="admin-title">NEBULA</h1>
                            <span className="admin-badge">
                                {isLoadingSession ? 'Verificando sesión' :
                                    isAdminGeneral ? 'Administrador Técnico' :
                                        isInstitutional ? 'Personal Institucional' : 'Usuario'}
                            </span>
                        </div>
                    </div>

                    <nav className="admin-nav-menu">
                        {isAdminGeneral ? (
                            <>
                                <div className="text-xs uppercase text-slate-500 font-bold px-3 py-2">Administrador Técnico</div>
                                <button
                                    type="button"
                                    onClick={() => setCurrentView('solicitudes')}
                                    className={`admin-nav-btn ${currentView === 'solicitudes' ? 'active' : ''}`}
                                >
                                    <span>Solicitudes de Orientación</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentView('reportes')}
                                    className={`admin-nav-btn ${currentView === 'reportes' ? 'active' : ''}`}
                                >
                                    <span>Reportes Anónimos</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentView('estadisticas-violencia')}
                                    className={`admin-nav-btn ${currentView === 'estadisticas-violencia' ? 'active' : ''}`}
                                >
                                    <span>Estadísticas de Violencia (Globales)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentView('socios')}
                                    className={`admin-nav-btn ${currentView === 'socios' ? 'active' : ''}`}
                                >
                                    <span>Socios (Instituciones)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentView('usuarios')}
                                    className={`admin-nav-btn ${currentView === 'usuarios' ? 'active' : ''}`}
                                >
                                    <span>Usuarios y Cuentas</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentView('catalogo')}
                                    className={`admin-nav-btn ${currentView === 'catalogo' ? 'active' : ''}`}
                                >
                                    <span>Catálogo de Contenidos</span>
                                </button>
                            </>
                        ) : isInstitutional ? (
                            <>
                                <div className="text-xs uppercase text-slate-500 font-bold px-3 py-2">Dashboard Institucional</div>
                                <button
                                    type="button"
                                    onClick={() => setCurrentView('solicitudes')}
                                    className={`admin-nav-btn ${currentView === 'solicitudes' ? 'active' : ''}`}
                                >
                                    <span>Solicitudes de Orientación</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentView('reportes')}
                                    className={`admin-nav-btn ${currentView === 'reportes' ? 'active' : ''}`}
                                >
                                    <span>Reportes Anónimos</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentView('estadisticas-violencia')}
                                    className={`admin-nav-btn ${currentView === 'estadisticas-violencia' ? 'active' : ''}`}
                                >
                                    <span>Estadísticas</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentView('socios')}
                                    className={`admin-nav-btn ${currentView === 'socios' ? 'active' : ''}`}
                                >
                                    <span>Socios (Instituciones)</span>
                                </button>
                            </>
                        ) : isLoadingSession ? (
                            <p className="admin-access-nav-note" role="status">Verificando permisos…</p>
                        ) : (
                            <p className="admin-access-nav-note">Tu rol no tiene acceso al panel administrativo.</p>
                        )}
                    </nav>
                </div>

                <div className="admin-sidebar-footer">
                    <div className="admin-user-info">
                        <div className="admin-avatar">
                            {currentUser.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p className="admin-user-name" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {currentUser.nombre}
                            </p>
                            <p className="admin-user-status" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontSize: '11px', color: '#94a3b8' }}>
                                Sesión Segura
                            </p>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        onClick={handleLogout} 
                        disabled={isLoggingOut}
                        className="admin-logout-btn"
                    >
                        <span>{isLoggingOut ? 'Cerrando…' : 'Cerrar Sesión'}</span>
                    </button>
                    {logoutError && <p className="admin-auth-error text-rose text-xs mt-1" role="alert">{logoutError}</p>}
                </div>
            </aside>

            <main className="admin-main-content">
                <header className="admin-header-bar">
                    <div>
                        <h2 className="admin-header-title">
                            {isLoadingSession ? 'Verificando permisos de la cuenta…' :
                             currentUser.role === 'usuario' ? 'Acceso restringido' :
                             currentView === 'solicitudes' ? 'Bandeja de Solicitudes de Orientación' :
                             currentView === 'reportes' ? 'Gestión de Reportes Anónimos' :
                             currentView === 'estadisticas-violencia' ? 'Módulo de Estadísticas de Violencia de Todas las Instituciones' :
                             currentView === 'socios' ? 'Registro y Control de Instituciones (Socios)' :
                             currentView === 'usuarios' ? 'Gestión de Usuarios y Cuentas Registradas' :
                             'Gestión del Catálogo de Contenidos del Sistema'}
                        </h2>
                        <p className="admin-header-subtitle">Sistema de Prevención y Atención Integral</p>
                    </div>
                    <div className="admin-server-status">
                        <span className="status-dot"></span>
                        <span>Servidor Seguro Activo</span>
                    </div>
                </header>

                <div className="admin-body-container">
                    {isLoadingSession ? (
                        <section className="admin-access-denied" role="status">
                            <h3>Verificando acceso</h3>
                            <p>Estamos comprobando los permisos de tu cuenta.</p>
                        </section>
                    ) : currentUser.role === 'usuario' ? (
                        <section className="admin-access-denied" role="alert">
                            <h3>No tienes permisos para acceder a los recursos</h3>
                            <p>Tu cuenta tiene el rol Usuario y no cuenta con acceso al panel administrativo. Si necesitas acceso institucional, contacta con el administrador del sistema.</p>
                        </section>
                    ) : (isAdminGeneral || isInstitutional) && currentView === 'reportes' ? (
                        <Reportes onBack={() => setCurrentView('solicitudes')} />
                    ) : (isAdminGeneral || isInstitutional) && currentView === 'solicitudes' ? (
                        <div className="admin-card-section">
                            {requestError && (
                                <div style={{ background: '#4c0519', border: '1px solid #be123c', color: '#ffe4e6', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{requestError}</span>
                                    <button onClick={() => setRequestError('')} style={{ background: 'transparent', border: 'none', color: '#ffe4e6', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                </div>
                            )}
                            {requestNotice && (
                                <div style={{ background: '#064e3b', border: '1px solid #047857', color: '#ecfdf5', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{requestNotice}</span>
                                    <button onClick={() => setRequestNotice('')} style={{ background: 'transparent', border: 'none', color: '#ecfdf5', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                </div>
                            )}

                            {isLoadingRequests ? (
                                <p className="admin-resource-loading" role="status">Cargando solicitudes…</p>
                            ) : orientationRequests.length ? (
                                <div className="table-responsive">
                                    <table className="admin-data-table">
                                        <thead>
                                            <tr>
                                                <th>Nombre / Alias</th>
                                                <th>Fecha</th>
                                                <th>Correo</th>
                                                <th>Teléfono</th>
                                                <th>Mensaje</th>
                                                <th className="text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orientationRequests.map((req) => (
                                                <tr key={req._id}>
                                                    <td className="font-medium text-white">{req.name || 'Anónimo'}</td>
                                                    <td>{new Date(req.createdAt).toLocaleDateString('es-MX')}</td>
                                                    <td><a href={`mailto:${req.email}`} className="text-purple">{req.email}</a></td>
                                                    <td>{req.phone ? <a href={`tel:${req.phone}`}>{req.phone}</a> : 'N/D'}</td>
                                                    <td>{req.message}</td>
                                                    <td className="text-right" style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                        <a 
                                                            href={`mailto:${req.email}?subject=${encodeURIComponent('Respuesta a su solicitud de orientación - NEBULA')}&body=${encodeURIComponent(`Estimado/a ${req.name || 'Usuario/a'},\n\nHemos recibido su solicitud de orientación enviada a través del sistema NEBULA:\n"${req.message}"\n\nNos ponemos en contacto con usted para brindarle el apoyo necesario:\n\n[Escriba su mensaje de orientación aquí]\n\nAtentamente,\nPersonal Institucional - Sistema NEBULA`)}`} 
                                                            className="action-btn-review inline-block px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded text-xs transition"
                                                        >
                                                            ✉️ Responder
                                                        </a>
                                                        <button
                                                            type="button"
                                                            className="action-btn-review px-3 py-1 bg-rose-900 text-white rounded text-xs"
                                                            onClick={() => handleDeleteRequest(req)}
                                                            disabled={deletingRequestId === req._id}
                                                        >
                                                            {deletingRequestId === req._id ? 'Eliminando…' : 'Eliminar'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="admin-resource-empty">No hay solicitudes de orientación registradas.</p>
                            )}
                        </div>
                    ) : (isAdminGeneral || isInstitutional) && currentView === 'estadisticas-violencia' ? (
                        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
                            <div style={{ 
                                background: 'rgba(15, 23, 42, 0.8)', 
                                border: '1px solid #334155', 
                                borderRadius: '16px', 
                                padding: '24px', 
                                marginBottom: '24px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: '15px'
                            }}>
                                <div>
                                    <h3 style={{ color: '#fff', fontSize: '20px', margin: '0 0 6px 0' }}>
                                        📊 Estadísticas Globales de Violencia e Incidencia
                                    </h3>
                                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                                        Análisis de reportes, autoevaluaciones y atenciones registradas en todas las instituciones aliadas.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '12px' }}>Datos globales y anónimos</span>
                                    <button 
                                        type="button" 
                                        onClick={handleExportPDF}
                                        disabled={!platformStatistics || isLoadingStatistics || isExportingReport}
                                        title={!platformStatistics ? 'Las estadísticas aún no están disponibles' : 'Descargar estadísticas y socios en PDF'}
                                        style={{
                                            background: '#7c3aed',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '10px 18px',
                                            borderRadius: '10px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.3)',
                                            whiteSpace: 'nowrap',
                                            opacity: !platformStatistics || isLoadingStatistics || isExportingReport ? 0.6 : 1,
                                            cursor: !platformStatistics || isLoadingStatistics || isExportingReport ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {isExportingReport ? 'Preparando reporte…' : '📥 Exportar Reporte PDF'}
                                    </button>
                                </div>
                            </div>

                            <section className="statistics-summary" aria-label="Totales de la plataforma">
                                {[
                                    ['Autoevaluaciones completadas', platformStatistics?.autoevaluaciones],
                                    ['Reportes registrados', platformStatistics?.reportes],
                                    ['Solicitudes de orientación', isLoadingRequests ? undefined : orientationRequests.length],
                                    ['Socios', platformStatistics?.socios],
                                ].map(([label, count]) => (
                                    <div className="metric-box" key={label}>
                                        <span className="metric-box-title">{label}</span>
                                        <div className="metric-box-content">
                                            <span className="metric-box-number">
                                                {count === undefined
                                                    ? (isLoadingStatistics || isLoadingRequests ? '…' : '—')
                                                    : count.toLocaleString('es-MX')}
                                            </span>
                                            <span className="metric-box-tag">Base de datos</span>
                                        </div>
                                    </div>
                                ))}
                            </section>
                            {statisticsError && (
                                <p className="statistics-error" role="alert">{statisticsError}</p>
                            )}

                            <div className="admin-statistics-panels">
                                <section className="admin-statistics-panel" aria-labelledby="incidence-title">
                                    <h3 id="incidence-title" className="admin-statistics-title">📈 Incidencia por tipos de violencia</h3>
                                    <p className="admin-statistics-description">Tipos señalados en resultados completados; los porcentajes se calculan sobre el total de menciones.</p>
                                    <div className="admin-statistics-bars">
                                        {[
                                            ['Psicológica / Emocional', 'psychological'],
                                            ['Física', 'physical'],
                                            ['Sexual', 'sexual'],
                                            ['Económica', 'economic'],
                                            ['Digital', 'digital'],
                                        ].map(([label, color]) => {
                                            const count = platformStatistics?.incidencia?.[label]
                                            const total = Object.values(platformStatistics?.incidencia || {}).reduce((sum, value) => sum + value, 0)
                                            const percentage = total && count !== undefined ? Math.round((count / total) * 100) : 0
                                            return (
                                                <div className="admin-statistics-row" key={label}>
                                                    <div className="admin-statistics-meta">
                                                        <span>{label}</span>
                                                        <span>{count === undefined ? (isLoadingStatistics ? '…' : '—') : `${percentage}% · ${count.toLocaleString('es-MX')}`}</span>
                                                    </div>
                                                    <div className="admin-statistics-track" aria-hidden="true">
                                                        <span className={`admin-statistics-fill ${color}`} style={{ width: `${percentage}%` }} />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </section>

                                <section className="admin-statistics-panel" aria-labelledby="meter-title">
                                    <h3 id="meter-title" className="admin-statistics-title">📉 Niveles consultados en el Violentómetro</h3>
                                    <p className="admin-statistics-description">Selecciones informativas; no representan una detección ni un diagnóstico de riesgo.</p>
                                    <div className="admin-statistics-bars">
                                        {[
                                            ['Alerta Amarilla (Precaución)', 'advertencia', 'yellow'],
                                            ['Alerta Naranja (Atención / Reacciona)', 'reaccion', 'orange'],
                                            ['Alerta Roja (Peligro / Urgente)', 'peligro', 'red'],
                                        ].map(([label, level, color]) => {
                                            const count = platformStatistics?.violentometro?.[level]
                                            const total = Object.values(platformStatistics?.violentometro || {}).reduce((sum, value) => sum + value, 0)
                                            const percentage = total && count !== undefined ? Math.round((count / total) * 100) : 0
                                            return (
                                                <div className="admin-statistics-row" key={level}>
                                                    <div className="admin-statistics-meta">
                                                        <span>{label}</span>
                                                        <span>{count === undefined ? (isLoadingStatistics ? '…' : '—') : `${percentage}% · ${count.toLocaleString('es-MX')}`}</span>
                                                    </div>
                                                    <div className="admin-statistics-track" aria-hidden="true">
                                                        <span className={`admin-statistics-fill ${color}`} style={{ width: `${percentage}%` }} />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </section>
                            </div>
                        </div>
                    ) : (isAdminGeneral || isInstitutional) && currentView === 'socios' ? (
                        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
                            {partnerError && (
                                <div style={{ background: '#4c0519', border: '1px solid #be123c', color: '#ffe4e6', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{partnerError}</span>
                                    <button onClick={() => setPartnerError('')} style={{ background: 'transparent', border: 'none', color: '#ffe4e6', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                </div>
                            )}
                            {partnerNotice && (
                                <div style={{ background: '#064e3b', border: '1px solid #047857', color: '#ecfdf5', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{partnerNotice}</span>
                                    <button onClick={() => setPartnerNotice('')} style={{ background: 'transparent', border: 'none', color: '#ecfdf5', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                </div>
                            )}

                            {isAdminGeneral && (
                            <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                                <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '16px' }}>{editingPartnerId ? 'Editar Institución' : 'Registrar nueva institución (Socio)'}</h3>
                                <form onSubmit={handleSavePartner} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <label style={{ color: '#cbd5e1', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            Nombre de la Institución
                                            <input required value={partnerForm.name} onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })} style={{ background: '#020617', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px', outline: 'none' }} />
                                        </label>
                                        <label style={{ color: '#cbd5e1', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            Tipo de Apoyo / Colaboración
                                            <input required placeholder="Ej. Atención especializada" value={partnerForm.type} onChange={(e) => setPartnerForm({ ...partnerForm, type: e.target.value })} style={{ background: '#020617', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px', outline: 'none' }} />
                                        </label>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <label style={{ color: '#cbd5e1', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            Sitio Web o Enlace
                                            <input required type="url" placeholder="https://..." value={partnerForm.url} onChange={(e) => setPartnerForm({ ...partnerForm, url: e.target.value })} style={{ background: '#020617', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px', outline: 'none' }} />
                                        </label>
                                        <label style={{ color: '#cbd5e1', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            URL de la Imagen / Logotipo
                                            <input type="url" placeholder="https://.../logo.png" value={partnerForm.image} onChange={(e) => setPartnerForm({ ...partnerForm, image: e.target.value })} style={{ background: '#020617', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px', outline: 'none' }} />
                                        </label>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                        <button type="submit" style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }} disabled={isSavingPartner}>
                                            {isSavingPartner ? 'Guardando...' : editingPartnerId ? 'Actualizar institución' : 'Registrar institución'}
                                        </button>
                                        {editingPartnerId && (
                                            <button type="button" onClick={() => { setEditingPartnerId(''); setPartnerForm(initialPartnerForm); }} style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #475569', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                            )}

                            <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '16px', padding: '24px' }}>
                                <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '16px' }}>Instituciones Aliadas Registradas</h3>
                                {isLoadingPartners ? (
                                    <p style={{ color: '#94a3b8', fontSize: '13px' }}>Cargando socios…</p>
                                ) : partners.length ? (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                                                    <th style={{ padding: '10px' }}>INSTITUCIÓN</th>
                                                    <th style={{ padding: '10px' }}>TIPO DE APOYO</th>
                                                    <th style={{ padding: '10px' }}>ENLACE</th>
                                                    {isAdminGeneral && <th style={{ padding: '10px', textAlign: 'right' }}>ACCIONES</th>}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {partners.map((partner) => (
                                                    <tr key={partner._id} style={{ borderBottom: '1px solid #1e293b', color: '#fff' }}>
                                                        <td style={{ padding: '12px', fontWeight: '500' }}>{partner.name}</td>
                                                        <td style={{ padding: '12px', color: '#cbd5e1' }}>{partner.type}</td>
                                                        <td style={{ padding: '12px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            <a href={partner.url} target="_blank" rel="noreferrer" style={{ color: '#c084fc', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {partner.url}
                                                            </a>
                                                        </td>
                                                        {isAdminGeneral && <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                            <button type="button" onClick={() => startEditingPartner(partner)} style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>Editar</button>
                                                            <button type="button" onClick={() => handleDeletePartner(partner)} style={{ background: '#9f1239', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>Eliminar</button>
                                                        </td>}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p style={{ color: '#94a3b8', fontSize: '13px' }}>No hay instituciones registradas.</p>
                                )}
                            </div>
                        </div>

                        ) : isAdminGeneral && currentView === 'usuarios' ? (
                        <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' }}>
                            {accountError && (
                                <div style={{ background: '#4c0519', border: '1px solid #be123c', color: '#ffe4e6', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{accountError}</span>
                                    <button onClick={() => setAccountError('')} style={{ background: 'transparent', border: 'none', color: '#ffe4e6', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                </div>
                            )}
                            {accountNotice && (
                                <div style={{ background: '#064e3b', border: '1px solid #047857', color: '#ecfdf5', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{accountNotice}</span>
                                    <button onClick={() => setAccountNotice('')} style={{ background: 'transparent', border: 'none', color: '#ecfdf5', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                </div>
                            )}

                            {editingUserId && (
                                <div style={{ background: 'rgba(15, 23, 42, 0.95)', border: '1px solid #7c3aed', borderRadius: '16px', padding: '24px', marginBottom: '24px', boxShadow: '0 10px 25px -5px rgba(124, 58, 237, 0.2)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h3 style={{ color: '#fff', fontSize: '18px', margin: 0 }}>✏️ Editar Datos de Cuenta</h3>
                                        <button onClick={() => setEditingUserId('')} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                                    </div>
                                    <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <label style={{ color: '#cbd5e1', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                Nombre Completo
                                                <input required value={userForm.nombre} onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })} style={{ background: '#020617', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px', outline: 'none' }} />
                                            </label>
                                            <label style={{ color: '#cbd5e1', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                Correo Electrónico
                                                <input required type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} style={{ background: '#020617', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px', outline: 'none' }} />
                                            </label>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <label style={{ color: '#cbd5e1', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                Tipo de Acceso / Rol
                                                <select value={userForm.role} disabled={userForm.email.toLowerCase() === 'carlos@nebula.com'} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} style={{ background: '#020617', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                                                    <option value="usuario">Usuario</option>
                                                    <option value="institucional">Personal Institucional</option>
                                                    <option value="admin">Administrador General</option>
                                                </select>
                                            </label>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                            <button type="submit" style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }} disabled={isSavingUser}>
                                                {isSavingUser ? 'Guardando cambios...' : 'Guardar cambios'}
                                            </button>
                                            <button type="button" onClick={() => setEditingUserId('')} style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #475569', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>
                                                Cancelar
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '16px', padding: '24px' }}>
                                <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '16px' }}>Cuentas Registradas en el Sistema</h3>
                                {isLoadingAccounts ? (
                                    <p style={{ color: '#94a3b8', fontSize: '13px' }}>Cargando cuentas…</p>
                                ) : accounts.length ? (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                                                    <th style={{ padding: '12px' }}>NOMBRE</th>
                                                    <th style={{ padding: '12px' }}>CORREO</th>
                                                    <th style={{ padding: '12px' }}>ROL</th>
                                                    <th style={{ padding: '12px' }}>REGISTRO</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>ACCIONES</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {accounts.map((acc) => (
                                                    <tr key={acc._id} style={{ borderBottom: '1px solid #1e293b', color: '#fff' }}>
                                                        <td style={{ padding: '12px', fontWeight: '500' }}>{acc.nombre}</td>
                                                        <td style={{ padding: '12px', color: '#cbd5e1' }}>
                                                            {acc.email}
                                                        </td>
                                                        <td style={{ padding: '12px' }}>
                                                            <select
                                                                aria-label={`Rol de ${acc.nombre}`}
                                                                value={acc.role || 'usuario'}
                                                                disabled={Boolean(updatingRoleId) || acc.email.toLowerCase() === 'carlos@nebula.com'}
                                                                onChange={(event) => handleChangeUserRole(acc._id, event.target.value)}
                                                                style={{ background: '#020617', border: '1px solid #334155', borderRadius: '8px', padding: '7px 9px', color: '#fff', fontSize: '12px', cursor: 'pointer' }}
                                                            >
                                                                <option value="usuario">Usuario</option>
                                                                <option value="institucional">Personal Institucional</option>
                                                                <option value="admin">Administrador General</option>
                                                            </select>
                                                        </td>
                                                        <td style={{ padding: '12px', color: '#94a3b8' }}>
                                                            {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : '—'}
                                                        </td>
                                                        <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => startEditingUser(acc)} 
                                                                style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                                                            >
                                                                Editar
                                                            </button>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleDeleteUser(acc._id, acc.nombre)} 
                                                                disabled={acc.email === currentUser.email || acc.email.toLowerCase() === 'carlos@nebula.com'}
                                                                style={{ background: '#9f1239', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: acc.email === currentUser.email || acc.email.toLowerCase() === 'carlos@nebula.com' ? 'not-allowed' : 'pointer', opacity: acc.email === currentUser.email || acc.email.toLowerCase() === 'carlos@nebula.com' ? 0.5 : 1, fontWeight: '500' }}
                                                            >
                                                                Eliminar
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p style={{ color: '#94a3b8', fontSize: '13px' }}>No hay cuentas registradas en la base de datos.</p>
                                )}
                            </div>
                        </div>
                    
                    ) : isAdminGeneral && currentView === 'catalogo' ? (
                        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
                            {resourceError && (
                                <div style={{ background: '#4c0519', border: '1px solid #be123c', color: '#ffe4e6', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{resourceError}</span>
                                    <button onClick={() => setResourceError('')} style={{ background: 'transparent', border: 'none', color: '#ffe4e6', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                </div>
                            )}
                            {resourceNotice && (
                                <div style={{ background: '#064e3b', border: '1px solid #047857', color: '#ecfdf5', padding: '12px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{resourceNotice}</span>
                                    <button onClick={() => setResourceNotice('')} style={{ background: 'transparent', border: 'none', color: '#ecfdf5', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                                </div>
                            )}

                            <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                                <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '16px' }}>{editingResourceId ? 'Editar Contenido' : 'Agregar Contenido al Catálogo'}</h3>
                                <form onSubmit={handleSaveResource} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <label style={{ color: '#cbd5e1', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            Categoría
                                            <select value={resourceForm.category} onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })} style={{ background: '#020617', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                                                {resourceCategories.map((c) => <option value={c.id} key={c.id}>{c.title}</option>)}
                                            </select>
                                        </label>
                                        <label style={{ color: '#cbd5e1', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            Título
                                            <input required value={resourceForm.title} onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })} style={{ background: '#020617', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px', outline: 'none' }} />
                                        </label>
                                    </div>
                                    <label style={{ color: '#cbd5e1', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        URL del recurso
                                        <input required type="url" value={resourceForm.url} onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })} style={{ background: '#020617', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px', outline: 'none' }} />
                                    </label>
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                        <button type="submit" style={{ background: '#7c3aed', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }} disabled={isSavingResource}>
                                            {isSavingResource ? 'Guardando...' : editingResourceId ? 'Actualizar contenido' : 'Agregar al catálogo'}
                                        </button>
                                        {editingResourceId && (
                                            <button type="button" onClick={() => { setEditingResourceId(''); setResourceForm(initialResourceForm); }} style={{ background: '#1e293b', color: '#cbd5e1', border: '1px solid #475569', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>

                            <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '16px', padding: '24px' }}>
                                <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '16px' }}>Elementos del Catálogo</h3>
                                {isLoadingResources ? (
                                    <p style={{ color: '#94a3b8', fontSize: '13px' }}>Cargando catálogo…</p>
                                ) : resources.length ? (
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                            <thead>
                                                <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                                                    <th style={{ padding: '10px' }}>TÍTULO</th>
                                                    <th style={{ padding: '10px' }}>CATEGORÍA</th>
                                                    <th style={{ padding: '10px' }}>ENLACE</th>
                                                    <th style={{ padding: '10px', textAlign: 'right' }}>ACCIONES</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {resources.map((res) => (
                                                    <tr key={res._id} style={{ borderBottom: '1px solid #1e293b', color: '#fff' }}>
                                                        <td style={{ padding: '12px', fontWeight: '500' }}>{res.title}</td>
                                                        <td style={{ padding: '12px', color: '#cbd5e1' }}>{res.category}</td>
                                                        <td style={{ padding: '12px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            <a href={res.url} target="_blank" rel="noreferrer" style={{ color: '#c084fc', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.url}</a>
                                                        </td>
                                                        <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                            <button type="button" onClick={() => startEditingResource(res)} style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>Editar</button>
                                                            <button type="button" onClick={() => handleDeleteResource(res)} style={{ background: '#9f1239', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>Eliminar</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p style={{ color: '#94a3b8', fontSize: '13px' }}>No hay elementos en el catálogo.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <section className="admin-access-denied" role="alert">
                            <h3>No tienes permisos para acceder a esta sección</h3>
                            <p>Selecciona una sección habilitada para tu rol o contacta al administrador del sistema.</p>
                        </section>
                    )}
                </div>
            </main>
        </div>
    )
}

export default Admin