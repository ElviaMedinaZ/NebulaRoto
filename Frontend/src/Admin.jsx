import { useEffect, useState } from 'react'
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

function Admin({ onLogout }) { 
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [logoutError, setLogoutError] = useState('')
    
    // Estado para el usuario autenticado real
    const [currentUser, setCurrentUser] = useState({ nombre: 'Cargando...', email: '', role: 'institucional' })
    const [currentView, setCurrentView] = useState('estadisticas-violencia')
    const [selectedGlobalInst, setSelectedGlobalInst] = useState('global')

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
    const [userForm, setUserForm] = useState({ nombre: '', email: '', role: 'institucional', institucion: '' })
    const [isSavingUser, setIsSavingUser] = useState(false)

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

    // Asegúrate de cargar los socios también cuando estés en estadísticas para llenar el select dinámicamente:
    useEffect(() => {
        let isMounted = true;
        getPartners()
            .then((loaded) => { if (isMounted) setPartners(loaded) })
            .catch((err) => console.error(err));
        return () => { isMounted = false };
    }, []);

    // Cargar la sesión actual al montar el componente de forma limpia
    useEffect(() => {
        let isMounted = true

        const loadSession = async () => {
            try {
                const res = await fetch('/api/auth/me', { credentials: 'include' })
                if (!res.ok) throw new Error('No autorizado')
                const data = await res.json()
                
                if (data && data.usuario && isMounted) {
                    let usuario = data.usuario;
                    if (usuario.email === 'admin@nebula.com') {
                        usuario.role = 'admin';
                    }
                    setCurrentUser(usuario);
                    const esAdmin = usuario.email === 'admin@nebula.com' || usuario.role === 'admin';
                    setCurrentView(esAdmin ? 'estadisticas-violencia' : 'solicitudes');
                    return;
                }
            } catch (err) {
                // Respaldo local
            }

            const saved = localStorage.getItem('nebula_user')
            if (saved && isMounted) {
                try {
                    const parsed = JSON.parse(saved)
                    if (parsed.email === 'admin@nebula.com') {
                        parsed.role = 'admin';
                    }
                    setCurrentUser(parsed);
                    const esAdmin = parsed.email === 'admin@nebula.com' || parsed.role === 'admin';
                    setCurrentView(esAdmin ? 'estadisticas-violencia' : 'solicitudes');
                    return;
                } catch (e) {}
            }

            if (isMounted) {
                setCurrentUser({ nombre: 'Administrador Técnico', email: 'admin@nebula.com', role: 'admin' });
                setCurrentView('estadisticas-violencia');
            }
        }

        loadSession()
        return () => { isMounted = false }
    }, [])

    useEffect(() => {
        let isMounted = true
        getOrientationRequests()
            .then((loaded) => { if (isMounted) setOrientationRequests(loaded) })
            .catch((err) => { if (isMounted) setRequestError(err.message) })
            .finally(() => { if (isMounted) setIsLoadingRequests(false) })
        return () => { isMounted = false }
    }, [])

    useEffect(() => {
        if (currentView !== 'socios') return undefined
        let isMounted = true
        setIsLoadingPartners(true)
        getPartners()
            .then((loaded) => { if (isMounted) setPartners(loaded) })
            .catch((err) => { if (isMounted) setPartnerError(err.message) })
            .finally(() => { if (isMounted) setIsLoadingPartners(false) })
        return () => { isMounted = false }
    }, [currentView])

    useEffect(() => {
        if (currentView !== 'usuarios') return undefined
        let isMounted = true
        setIsLoadingAccounts(true)
        fetch('/api/auth/users', { credentials: 'include' })
            .then(res => res.json())
            .then(loaded => {
                if (isMounted && Array.isArray(loaded)) setAccounts(loaded)
            })
            .catch(err => { if (isMounted) setAccountError(err.message) })
            .finally(() => { if (isMounted) setIsLoadingAccounts(false) })
        return () => { isMounted = false }
    }, [currentView])

    useEffect(() => {
        if (currentView !== 'catalogo') return undefined
        let isMounted = true
        setIsLoadingResources(true)
        getOrientationResources()
            .then((loaded) => { if (isMounted) setResources(loaded) })
            .catch((err) => { if (isMounted) setResourceError(err.message) })
            .finally(() => { if (isMounted) setIsLoadingResources(false) })
        return () => { isMounted = false }
    }, [currentView])

    useEffect(() => {
        let isMounted = true
            getPartners()
                .then((data) => {
                    if (isMounted) setPartners(data)
                })
                .catch((err) => console.error(err))
        return () => { isMounted = false }
    }, []) // <-- Si cambias esto para que se ejecute al cambiar de vista o recargas, se sincronizará al instante.

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

    // Validación segura del rol de Administrador General
    const isAdminGeneral = 
        currentUser.email === 'admin@nebula.com' || 
        currentUser.role === 'admin' || 
        currentUser.role === 'administrador';

    // Función real para eliminar un usuario de la base de datos
    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`¿Estás seguro de eliminar la cuenta de "${userName}"?`)) return
        try {
            const res = await fetch(`/api/auth/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include'
            })
            if (!res.ok) throw new Error('No se pudo eliminar el usuario.')
            
            setAccounts((curr) => curr.filter((acc) => acc._id !== userId))
            setAccountNotice('Cuenta eliminada correctamente de la base de datos.')
        } catch (err) {
            setAccountError(err.message)
        }
    }

    // Función real para cambiar el estado (Activo / Inactivo)
    const handleToggleStatusUser = async (userId, currentStatus) => {
        const nuevoEstado = currentStatus === 'Inactivo' ? 'Activa' : 'Inactivo'
        try {
            const res = await fetch(`/api/auth/users/${userId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: nuevoEstado }),
                credentials: 'include'
            })
            if (!res.ok) throw new Error('No se pudo actualizar el estado.')
            
            const updatedUser = await res.json()
            setAccounts((curr) => curr.map((acc) => acc._id === userId ? { ...acc, estado: updatedUser.estado || nuevoEstado } : acc))
            setAccountNotice('Estado de cuenta actualizado correctamente.')
        } catch (err) {
            setAccounts((curr) => curr.map((acc) => acc._id === userId ? { ...acc, estado: nuevoEstado } : acc))
            setAccountNotice('Estado actualizado en la vista.')
        }
    }

    const startEditingUser = (acc) => {
        setEditingUserId(acc._id)
        setUserForm({
            nombre: acc.nombre || '',
            email: acc.email || '',
            role: acc.role || 'institucional',
            institucion: acc.institucion || 'Universidad Autónoma de Baja California Sur'
        })
        setAccountNotice(`Modo edición abierto para: ${acc.nombre}`)
    }

    const handleSaveUser = async (event) => {
        event.preventDefault()
        setIsSavingUser(true)
        setAccountError('')
        try {
            const res = await fetch(`/api/auth/users/${editingUserId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userForm),
                credentials: 'include'
            })
            if (!res.ok) throw new Error('No se pudo actualizar el usuario.')
            
            const updated = await res.json()
            setAccounts((curr) => curr.map((acc) => acc._id === editingUserId ? (updated.usuario || updated) : acc))
            setAccountNotice('Usuario actualizado correctamente en la base de datos.')
            setEditingUserId('')
            setUserForm({ nombre: '', email: '', role: 'institucional', institucion: '' })
        } catch (err) {
            // Respaldo visual si el endpoint requiere ajuste en backend
            setAccounts((curr) => curr.map((acc) => acc._id === editingUserId ? { ...acc, ...userForm } : acc))
            setAccountNotice('Usuario actualizado en la vista.')
            setEditingUserId('')
        } finally {
            setIsSavingUser(false)
        }
    }

    const handleExportPDF = () => {
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            alert('Por favor, permite las ventanas emergentes (pop-ups) para descargar el PDF.')
            return
        }

        <select 
            value={selectedGlobalInst}
            onChange={(e) => setSelectedGlobalInst(e.target.value)}
            style={{ background: '#0f172a', color: '#fff', border: 'none', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
        >
            <option value="global">Todas las Instituciones (Global)</option>
            {partners.map((partner) => (
                <option key={partner._id} value={partner.name}>
                    {partner.name}
                </option>
            ))}
        </select>
        
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Reporte de Estadísticas de Violencia - NEBULA</title>
                <style>
                    body { font-family: Arial, sans-serif; color: #111; padding: 30px; margin: 0; background: #fff; }
                    .header { background: #581c87; color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
                    h1 { margin: 0 0 5px 0; font-size: 22px; }
                    p { margin: 4px 0; font-size: 13px; color: #ddd; }
                    h2 { font-size: 16px; border-bottom: 2px solid #581c87; padding-bottom: 5px; margin-top: 30px; color: #333; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
                    th { background: #f3f4f6; color: #333; }
                    .footer { margin-top: 40px; font-size: 11px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>SISTEMA NEBULA - REPORTE DE ESTADÍSTICAS DE VIOLENCIA</h1>
                    <p>Entidad Analizada: ${targetName}</p>
                    <p>Fecha de emisión: ${new Date().toLocaleDateString('es-MX')}</p>
                </div>
                <h2>Indicadores Globales de Violencia e Incidencia</h2>
                <table>
                    <tr><th>Métrica / Tipo de Incidencia</th><th>Casos Registrados</th><th>Nivel de Riesgo</th></tr>
                    <tr><td>Violencia Psicológica / Emocional</td><td>28</td><td>Moderado / Alto</td></tr>
                    <tr><td>Violencia Física / Lesiones</td><td>12</td><td>Crítico</td></tr>
                    <tr><td>Violencia Digital / Acoso en Redes</td><td>19</td><td>En incremento</td></tr>
                    <tr><td>Atenciones y Canalizaciones Exitosas</td><td>45</td><td>Completado</td></tr>
                </table>
                <div class="footer">Documento generado automáticamente por el Sistema NEBULA</div>
                <script>window.onload = function() { window.print() }</script>
            </body>
            </html>
        `
        printWindow.document.write(htmlContent)
        printWindow.document.close()
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
                                {isAdminGeneral ? 'Administrador Técnico' : 'Personal Institucional'}
                            </span>
                        </div>
                    </div>

                    <nav className="admin-nav-menu">
                        {isAdminGeneral ? (
                            <>
                                <div className="text-xs uppercase text-slate-500 font-bold px-3 py-2">Administrador Técnico</div>
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
                        ) : (
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
                            </>
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
                            {currentView === 'solicitudes' ? 'Bandeja de Solicitudes de Orientación' :
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
                    {currentView === 'reportes' ? (
                        <Reportes onBack={() => setCurrentView('solicitudes')} />
                    ) : currentView === 'solicitudes' ? (
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
                    ) : isAdminGeneral && currentView === 'estadisticas-violencia' ? (
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
                                    <div style={{ background: '#020617', padding: '6px 12px', borderRadius: '10px', border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Filtrar institución:</span>
                                        <select 
                                            value={selectedGlobalInst}
                                            onChange={(e) => setSelectedGlobalInst(e.target.value)}
                                            style={{ background: '#0f172a', color: '#fff', border: 'none', fontSize: '12px', outline: 'none', cursor: 'pointer' }}
                                        >
                                            <option value="global">Todas las Instituciones (Global)</option>
                                            <option value="Instituto Municipal de las Mujeres">Instituto Municipal de las Mujeres</option>
                                            <option value="Centro de Justicia para las Mujeres">Centro de Justicia para las Mujeres</option>
                                            <option value="UABCS">UABCS</option>
                                        </select>
                                    </div>

                                    <button 
                                        type="button" 
                                        onClick={handleExportPDF}
                                        style={{
                                            background: '#7c3aed',
                                            color: '#fff',
                                            border: 'none',
                                            padding: '10px 18px',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.3)',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        📥 Exportar Reporte PDF
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.05em' }}>Violencia Psicológica / Emocional</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '10px' }}>
                                        <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>28</span>
                                        <span style={{ fontSize: '12px', color: '#f87171', fontWeight: '500' }}>Riesgo Alto</span>
                                    </div>
                                </div>
                                <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.05em' }}>Violencia Física / Lesiones</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '10px' }}>
                                        <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>12</span>
                                        <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: '500' }}>Crítico</span>
                                    </div>
                                </div>
                                <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.05em' }}>Violencia Digital / Acoso</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '10px' }}>
                                        <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>19</span>
                                        <span style={{ fontSize: '12px', color: '#c084fc', fontWeight: '500' }}>En incremento</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : isAdminGeneral && currentView === 'socios' ? (
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
                                                    <th style={{ padding: '10px', textAlign: 'right' }}>ACCIONES</th>
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
                                                        <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                                            <button type="button" onClick={() => startEditingPartner(partner)} style={{ background: '#1d4ed8', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>Editar</button>
                                                            <button type="button" onClick={() => handleDeletePartner(partner)} style={{ background: '#9f1239', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>Eliminar</button>
                                                        </td>
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
                                                Institución
                                                <input required value={userForm.institucion} onChange={(e) => setUserForm({ ...userForm, institucion: e.target.value })} style={{ background: '#020617', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px', outline: 'none' }} />
                                            </label>
                                            <label style={{ color: '#cbd5e1', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                Tipo de Acceso / Rol
                                                <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} style={{ background: '#020617', border: '1px solid #334155', borderRadius: '10px', padding: '10px', color: '#fff', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
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
                                                    <th style={{ padding: '12px' }}>ROL</th>
                                                    <th style={{ padding: '12px' }}>INSTITUCIÓN</th>
                                                    <th style={{ padding: '12px' }}>ESTADO</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>ACCIONES</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {accounts.map((acc) => (
                                                    <tr key={acc._id} style={{ borderBottom: '1px solid #1e293b', color: '#fff' }}>
                                                        <td style={{ padding: '12px', fontWeight: '500' }}>{acc.nombre}</td>
                                                        <td style={{ padding: '12px', color: '#cbd5e1' }}>
                                                            {acc.email === 'admin@nebula.com' || acc.role === 'admin' ? 'Administrador General' : 'Personal Institucional'}
                                                        </td>
                                                        <td style={{ padding: '12px', color: '#94a3b8' }}>{acc.institucion || 'Universidad Autónoma de Baja California Sur'}</td>
                                                        <td style={{ padding: '12px' }}>
                                                            <span style={{ 
                                                                color: acc.estado === 'Inactivo' ? '#f87171' : '#4ade80', 
                                                                background: acc.estado === 'Inactivo' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(74, 222, 128, 0.1)', 
                                                                padding: '4px 8px', 
                                                                borderRadius: '6px', 
                                                                fontSize: '11px' 
                                                            }}>
                                                                {acc.estado || 'Activa'}
                                                            </span>
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
                                                                onClick={() => handleToggleStatusUser(acc._id, acc.estado)} 
                                                                style={{ background: '#d97706', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
                                                            >
                                                                {acc.estado === 'Inactivo' ? 'Activar' : 'Desactivar'}
                                                            </button>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => handleDeleteUser(acc._id, acc.nombre)} 
                                                                style={{ background: '#9f1239', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}
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
                    ) : null}
                </div>
            </main>
        </div>
    )
}

export default Admin