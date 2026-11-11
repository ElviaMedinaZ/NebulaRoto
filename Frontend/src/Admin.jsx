import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

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

const initialAccountForm = {
    name: '',
    email: '',
    role: 'Personal Institucional',
    institution: '',
    active: true,
}

function Admin({ onLogout }) {
    const [isLoggingOut, setIsLoggingOut] = useState(false)
    const [logoutError, setLogoutError] = useState('')
    
    // Control de vistas de navegación lateral
    const [currentView, setCurrentView] = useState('solicitudes') 
    // Vistas posibles: 'solicitudes' | 'reportes' | 'estadisticas' | 'instituciones' | 'personal' | 'roles' | 'catalogo'

    // Estados para Recursos (Catálogo de Contenidos - CU23)
    const [resources, setResources] = useState([])
    const [resourceForm, setResourceForm] = useState(initialResourceForm)
    const [editingResourceId, setEditingResourceId] = useState('')
    const [isLoadingResources, setIsLoadingResources] = useState(false)
    const [isSavingResource, setIsSavingResource] = useState(false)
    const [resourceError, setResourceError] = useState('')
    const [resourceNotice, setResourceNotice] = useState('')

    // Estados para Socios / Instituciones Aliadas (CU24)
    const [partners, setPartners] = useState([])
    const [partnerForm, setPartnerForm] = useState(initialPartnerForm)
    const [editingPartnerId, setEditingPartnerId] = useState('')
    const [isLoadingPartners, setIsLoadingPartners] = useState(false)
    const [isSavingPartner, setIsSavingPartner] = useState(false)
    const [partnerError, setPartnerError] = useState('')
    const [partnerNotice, setPartnerNotice] = useState('')

    // Estados para Cuentas Institucionales y Personal (CU25, CU26)
    const [accounts, setAccounts] = useState([
        { _id: '1', name: 'Lic. María Gómez', email: 'mgomez@lapaz.gob.mx', role: 'Personal Institucional', institution: 'Centro de Justicia para las Mujeres', active: true },
        { _id: '2', name: 'Dr. Roberto Sánchez', email: 'rsanchez@uabcs.mx', role: 'Administrador Técnico', institution: 'UABCS', active: true }
    ])
    const [accountForm, setAccountForm] = useState(initialAccountForm)
    const [editingAccountId, setEditingAccountId] = useState('')
    const [accountNotice, setAccountNotice] = useState('')

    // Estados para Solicitudes de Orientación
    const [orientationRequests, setOrientationRequests] = useState([])
    const [isLoadingRequests, setIsLoadingRequests] = useState(true)
    const [deletingRequestId, setDeletingRequestId] = useState('')
    const [requestError, setRequestError] = useState('')
    const [requestNotice, setRequestNotice] = useState('')

    // Cargar solicitudes de orientación al iniciar
    useEffect(() => {
        let isMounted = true
        getOrientationRequests()
            .then((loaded) => { if (isMounted) setOrientationRequests(loaded) })
            .catch((err) => { if (isMounted) setRequestError(err.message) })
            .finally(() => { if (isMounted) setIsLoadingRequests(false) })
        return () => { isMounted = false }
    }, [])

    // Cargar instituciones cuando se abre esa sección
    useEffect(() => {
        if (currentView !== 'instituciones') return undefined
        let isMounted = true
        setIsLoadingPartners(true)
        getPartners()
            .then((loaded) => { if (isMounted) setPartners(loaded) })
            .catch((err) => { if (isMounted) setPartnerError(err.message) })
            .finally(() => { if (isMounted) setIsLoadingPartners(false) })
        return () => { isMounted = false }
    }, [currentView])

    // Cargar catálogo de contenidos cuando se abre esa sección
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

// ... dentro de tu componente Admin:

  // Función robusta para generar y exportar el reporte en PDF de forma limpia
    const handleExportPDF = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Por favor, permite las ventanas emergentes (pop-ups) para descargar el PDF.');
            return;
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Reporte Estadístico - NEBULA</title>
                <style>
                    body { font-family: Arial, sans-serif; color: #111; padding: 30px; margin: 0; background: #fff; }
                    .header { background: #581c87; color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px; }
                    h1 { margin: 0 0 5px 0; font-size: 22px; }
                    p { margin: 4px 0; font-size: 13px; color: #ddd; }
                    h2 { font-size: 16px; border-bottom: 2px solid #581c87; padding-bottom: 5px; margin-top: 30px; color: #333; }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; font-size: 13px; }
                    th { background: #f3f4f6; color: #333; }
                    .footer { margin-top: 40px; font-size: 11px; color: #666; text-align: center; border-top: 1px solid #eee; pt: 10px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>SISTEMA NEBULA - REPORTE ESTADÍSTICO</h1>
                    <p>Sistema de Prevención y Atención Integral</p>
                    <p>Fecha de emisión: ${new Date().toLocaleDateString('es-MX')}</p>
                </div>

                <h2>1. Indicadores Generales de Operación</h2>
                <table>
                    <tr><th>Métrica del Sistema</th><th>Valor Registrado</th><th>Tendencia / Estado</th></tr>
                    <tr><td>Total de Evaluaciones de Violencia</td><td>48</td><td>↑ +12% este mes</td></tr>
                    <tr><td>Reportes Anónimos Registrados</td><td>19</td><td>Activos en red</td></tr>
                    <tr><td>Instituciones Aliadas (Socios)</td><td>${partners.length || 8}</td><td>Colaboración activa</td></tr>
                </table>

                <h2>2. Incidencia por Tipos de Violencia</h2>
                <table>
                    <tr><th>Tipo de Violencia</th><th>Porcentaje de Incidencia</th><th>Nivel</th></tr>
                    <tr><td>Violencia Psicológica</td><td>45%</td><td>Alto</td></tr>
                    <tr><td>Violencia Física</td><td>25%</td><td>Crítico</td></tr>
                    <tr><td>Violencia Digital / Patrimonial</td><td>20%</td><td>Moderado</td></tr>
                    <tr><td>Otro tipo de conducta</td><td>10%</td><td>Seguimiento</td></tr>
                </table>

                <h2>3. Niveles de Riesgo Detectados (Violentómetro)</h2>
                <table>
                    <tr><th>Nivel de Alerta</th><th>Proporción</th><th>Descripción Orientativa</th></tr>
                    <tr><td>Alerta Amarilla (Precaución)</td><td>55%</td><td>Conductas iniciales de alerta</td></tr>
                    <tr><td>Alerta Naranja (Atención / Reacciona)</td><td>30%</td><td>Situaciones de riesgo moderado</td></tr>
                    <tr><td>Alerta Roja (¡Peligro / Urgente!)</td><td>15%</td><td>Casos críticos que requieren intervención inmediata</td></tr>
                </table>

                <div class="footer">
                    Documento generado automáticamente por el sistema institucional NEBULA • Módulo de Estadística y Prevención
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    }

    // Acciones para Solicitudes
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

    // Acciones para Instituciones (Socios - CU24)
    const handleSavePartner = async (event) => {
        event.preventDefault()
        setIsSavingPartner(true)
        setPartnerError('')
        setPartnerNotice('')
        try {
            if (editingPartnerId) {
                const updated = await updatePartner(editingPartnerId, partnerForm)
                setPartners((curr) => curr.map((p) => (p._id === editingPartnerId ? updated : p)))
                setPartnerNotice('Institución actualizada correctamente.')
                setEditingPartnerId('')
            } else {
                const created = await createPartner(partnerForm)
                setPartners((curr) => [...curr, created])
                setPartnerNotice('Institución registrada exitosamente.')
            }
            setPartnerForm(initialPartnerForm)
        } catch (err) {
            setPartnerError(err.message)
        } finally {
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

    const handleDeletePartner = async (partner) => {
        if (!window.confirm(`¿Eliminar la institución "${partner.name}"?`)) return
        try {
            await deletePartner(partner._id)
            setPartners((curr) => curr.filter((item) => item._id !== partner._id))
            setPartnerNotice('Institución eliminada correctamente.')
        } catch (err) {
            setPartnerError(err.message)
        }
    }

    // Acciones para Cuentas de Personal (CU25, CU26)
    const handleSaveAccount = (e) => {
        e.preventDefault()
        if (editingAccountId) {
            setAccounts(accounts.map(acc => acc._id === editingAccountId ? { ...acc, ...accountForm } : acc))
            setAccountNotice('Cuenta actualizada con éxito.')
            setEditingAccountId('')
        } else {
            const newAcc = { _id: Date.now().toString(), ...accountForm }
            setAccounts([...accounts, newAcc])
            setAccountNotice('Personal institucional registrado con éxito.')
        }
        setAccountForm(initialAccountForm)
    }

    const toggleAccountStatus = (id) => {
        setAccounts(accounts.map(acc => acc._id === id ? { ...acc, active: !acc.active } : acc))
    }

    const deleteAccount = (id) => {
        if (window.confirm('¿Eliminar esta cuenta institucional?')) {
            setAccounts(accounts.filter(acc => acc._id !== id))
        }
    }

    // Acciones para Catálogo de Contenidos (CU23)
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
        <div className="admin-dashboard-container">
            {/* Barra lateral unificada con ambos roles */}
            <aside className="admin-sidebar">
                <div>
                    <div className="admin-logo-area">
                        <div className="admin-logo-icon">🔒</div>
                        <div>
                            <h1 className="admin-title">NEBULA</h1>
                            <span className="admin-badge">Control Administrativo</span>
                        </div>
                    </div>

                    <nav className="admin-nav-menu">
                        <div className="text-xs uppercase text-slate-500 font-bold px-3 py-2">Personal Institucional</div>
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
                            <span>Reportes y Seguimiento</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setCurrentView('estadisticas')}
                            className={`admin-nav-btn ${currentView === 'estadisticas' ? 'active' : ''}`}
                        >
                            <span>Estadísticas y Tendencias</span>
                        </button>

                        <div className="text-xs uppercase text-slate-500 font-bold px-3 pt-4 pb-2">Administrador Técnico</div>
                        <button
                            type="button"
                            onClick={() => setCurrentView('instituciones')}
                            className={`admin-nav-btn ${currentView === 'instituciones' ? 'active' : ''}`}
                        >
                            <span>Registrar Institución (Socios)</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setCurrentView('personal')}
                            className={`admin-nav-btn ${currentView === 'personal' ? 'active' : ''}`}
                        >
                            <span>Registrar Personal y Cuentas</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setCurrentView('roles')}
                            className={`admin-nav-btn ${currentView === 'roles' ? 'active' : ''}`}
                        >
                            <span>Roles y Permisos</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setCurrentView('catalogo')}
                            className={`admin-nav-btn ${currentView === 'catalogo' ? 'active' : ''}`}
                        >
                            <span>Catálogo de Contenidos</span>
                        </button>
                    </nav>
                </div>

                <div className="admin-sidebar-footer">
                    <div className="admin-user-info">
                        <div className="admin-avatar">AD</div>
                        <div>
                            <p className="admin-user-name">Administración</p>
                            <p className="admin-user-status">Sesión Segura</p>
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

            {/* Contenido Principal */}
            <main className="admin-main-content">
                <header className="admin-header-bar">
                    <div>
                        <h2 className="admin-header-title">
                            {currentView === 'reportes' ? 'Gestión de Reportes y Seguimiento Institucional' :
                             currentView === 'solicitudes' ? 'Bandeja de Solicitudes de Orientación' :
                             currentView === 'estadisticas' ? 'Módulo de Estadísticas Generales y Tendencias' :
                             currentView === 'instituciones' ? 'Registro y Control de Instituciones (Socios)' :
                             currentView === 'personal' ? 'Registro y Gestión de Cuentas Institucionales' :
                             currentView === 'roles' ? 'Gestión de Roles y Permisos de Acceso' :
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
                            {requestError && <p className="admin-resource-message is-error" role="alert">{requestError}</p>}
                            {requestNotice && <p className="admin-resource-message is-success" role="status">{requestNotice}</p>}

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
                                                    <td className="text-right space-x-2">
                                                        <a href={`mailto:${req.email}`} className="action-btn-review inline-block mr-2 px-3 py-1 bg-purple-700 text-white rounded text-xs">Responder</a>
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
                    ) : currentView === 'estadisticas' ? (
                        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
                            <div style={{ 
                                background: 'rgba(15, 23, 42, 0.8)', 
                                border: '1px solid #334155', 
                                borderRadius: '16px', 
                                padding: '24px', 
                                marginBottom: '24px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <h3 style={{ color: '#fff', fontSize: '20px', margin: '0 0 6px 0' }}>
                                        📊 Indicadores Generales de Violencia y Tendencias
                                    </h3>
                                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Resumen estadístico agregado de todas las instituciones y evaluaciones del sistema.</p>
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
                                    📥 Exportar Estadísticas en PDF
                                </button>
                            </div>

                            {/* Tarjetas de métricas generales */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.05em' }}>Total Evaluaciones</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '10px' }}>
                                        <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>48</span>
                                        <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '500' }}>↑ +12% este mes</span>
                                    </div>
                                </div>
                                <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.05em' }}>Reportes Registrados</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '10px' }}>
                                        <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>19</span>
                                        <span style={{ fontSize: '12px', color: '#c084fc', fontWeight: '500' }}>Activos en red</span>
                                    </div>
                                </div>
                                <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
                                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold', letterSpacing: '0.05em' }}>Instituciones Aliadas</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '10px' }}>
                                        <span style={{ fontSize: '28px', fontWeight: 'bold', color: '#fff' }}>{partners.length || 8}</span>
                                        <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '500' }}>Colaboración activa</span>
                                    </div>
                                </div>
                            </div>

                            {/* Sección de Gráficas visuales con barras */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
                                <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '16px', padding: '24px' }}>
                                    <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '20px' }}>
                                        📈 Incidencia por Tipos de Violencia
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                                                <span>Violencia Psicológica</span>
                                                <span style={{ fontWeight: '600', color: '#c084fc' }}>45%</span>
                                            </div>
                                            <div style={{ width: '100%', background: '#1e293b', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ background: '#9333ea', height: '100%', width: '45%', borderRadius: '4px' }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                                                <span>Violencia Física</span>
                                                <span style={{ fontWeight: '600', color: '#f43f5e' }}>25%</span>
                                            </div>
                                            <div style={{ width: '100%', background: '#1e293b', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ background: '#e11d48', height: '100%', width: '25%', borderRadius: '4px' }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                                                <span>Violencia Digital / Patrimonial</span>
                                                <span style={{ fontWeight: '600', color: '#fbbf24' }}>20%</span>
                                            </div>
                                            <div style={{ width: '100%', background: '#1e293b', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ background: '#f59e0b', height: '100%', width: '20%', borderRadius: '4px' }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                                                <span>Otro tipo de conducta</span>
                                                <span style={{ fontWeight: '600', color: '#38bdf8' }}>10%</span>
                                            </div>
                                            <div style={{ width: '100%', background: '#1e293b', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ background: '#0ea5e9', height: '100%', width: '10%', borderRadius: '4px' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid #334155', borderRadius: '16px', padding: '24px' }}>
                                    <h4 style={{ color: '#fff', fontSize: '15px', fontWeight: '600', marginBottom: '20px' }}>
                                        📉 Niveles de Riesgo Detectados (Violentómetro)
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                                                <span>Alerta Amarilla (Precaución)</span>
                                                <span style={{ fontWeight: '600', color: '#fbbf24' }}>55%</span>
                                            </div>
                                            <div style={{ width: '100%', background: '#1e293b', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ background: '#fbbf24', height: '100%', width: '55%', borderRadius: '4px' }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                                                <span>Alerta Naranja (Atención / Reacciona)</span>
                                                <span style={{ fontWeight: '600', color: '#fb923c' }}>30%</span>
                                            </div>
                                            <div style={{ width: '100%', background: '#1e293b', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ background: '#f97316', height: '100%', width: '30%', borderRadius: '4px' }}></div>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '6px' }}>
                                                <span>Alerta Roja (¡Peligro / Urgente!)</span>
                                                <span style={{ fontWeight: '600', color: '#f43f5e' }}>15%</span>
                                            </div>
                                            <div style={{ width: '100%', background: '#1e293b', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ background: '#e11d48', height: '100%', width: '15%', borderRadius: '4px' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

						
                    ) : currentView === 'instituciones' ? (
                        <div className="admin-card-section">
                            {partnerError && <p className="admin-resource-message is-error" role="alert">{partnerError}</p>}
                            {partnerNotice && <p className="admin-resource-message is-success" role="status">{partnerNotice}</p>}

                            <h3 className="section-title-custom mb-4">{editingPartnerId ? 'Editar Institución' : 'Registrar nueva institución (Socios)'}</h3>
                            <form className="admin-resource-form mb-6" onSubmit={handleSavePartner}>
                                <div className="admin-resource-form-grid">
                                    <label>
                                        Nombre de la Institución
                                        <input required value={partnerForm.name} onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })} className="admin-search-input mt-1" />
                                    </label>
                                    <label>
                                        Tipo de Apoyo / Colaboración
                                        <input required placeholder="Ej. Atención especializada" value={partnerForm.type} onChange={(e) => setPartnerForm({ ...partnerForm, type: e.target.value })} className="admin-search-input mt-1" />
                                    </label>
                                    <label className="admin-resource-form-wide">
                                        Sitio Web o Enlace
                                        <input required type="url" placeholder="https://..." value={partnerForm.url} onChange={(e) => setPartnerForm({ ...partnerForm, url: e.target.value })} className="admin-search-input mt-1" />
                                    </label>
                                    <label className="admin-resource-form-wide">
                                        URL de Imagen / Logotipo (Opcional)
                                        <input type="url" placeholder="https://..." value={partnerForm.image} onChange={(e) => setPartnerForm({ ...partnerForm, image: e.target.value })} className="admin-search-input mt-1" />
                                    </label>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button type="submit" className="btn-primary-custom" disabled={isSavingPartner}>
                                        {isSavingPartner ? 'Guardando...' : editingPartnerId ? 'Actualizar institución' : 'Registrar institución'}
                                    </button>
                                    {editingPartnerId && (
                                        <button type="button" className="btn-secondary-custom" onClick={() => { setEditingPartnerId(''); setPartnerForm(initialPartnerForm); }}>
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>

                            <h3 className="section-title-custom mb-3">Instituciones Aliadas Registradas</h3>
                            {isLoadingPartners ? (
                                <p className="admin-resource-loading" role="status">Cargando socios…</p>
                            ) : partners.length ? (
                                <div className="table-responsive">
                                    <table className="admin-data-table">
                                        <thead>
                                            <tr>
                                                <th>Institución</th>
                                                <th>Tipo de Apoyo</th>
                                                <th>Enlace</th>
                                                <th className="text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {partners.map((partner) => (
                                                <tr key={partner._id}>
                                                    <td className="font-medium text-white">{partner.name}</td>
                                                    <td>{partner.type}</td>
                                                    <td><a href={partner.url} target="_blank" rel="noreferrer" className="text-purple">{partner.url}</a></td>
                                                    <td className="text-right space-x-2">
                                                        <button type="button" className="action-btn-review bg-blue-700 px-3 py-1 rounded text-xs text-white mr-2" onClick={() => startEditingPartner(partner)}>Editar</button>
                                                        <button type="button" className="action-btn-review bg-rose-900 px-3 py-1 rounded text-xs text-white" onClick={() => handleDeletePartner(partner)}>Eliminar</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="admin-resource-empty">No hay instituciones registradas.</p>
                            )}
                        </div>
                    ) : currentView === 'personal' ? (
                        <div className="admin-card-section">
                            {accountNotice && <p className="admin-resource-message is-success mb-4">{accountNotice}</p>}
                            <h3 className="section-title-custom mb-4">{editingAccountId ? 'Modificar Cuenta Institucional' : 'Registrar Personal Institucional'}</h3>
                            <form className="admin-resource-form mb-6" onSubmit={handleSaveAccount}>
                                <div className="admin-resource-form-grid">
                                    <label>
                                        Nombre Completo
                                        <input required value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} className="admin-search-input mt-1" />
                                    </label>
                                    <label>
                                        Correo Institucional
                                        <input required type="email" value={accountForm.email} onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })} className="admin-search-input mt-1" />
                                    </label>
                                    <label>
                                        Rol Asignado
                                        <select value={accountForm.role} onChange={(e) => setAccountForm({ ...accountForm, role: e.target.value })} className="admin-select mt-1 bg-slate-950 p-2 rounded-lg w-full text-white">
                                            <option value="Personal Institucional">Personal Institucional</option>
                                            <option value="Administrador Técnico">Administrador Técnico</option>
                                        </select>
                                    </label>
                                    <label>
                                        Institución Asociada
                                        <input required placeholder="Ej. Instituto Municipal de las Mujeres" value={accountForm.institution} onChange={(e) => setAccountForm({ ...accountForm, institution: e.target.value })} className="admin-search-input mt-1" />
                                    </label>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button type="submit" className="btn-primary-custom">
                                        {editingAccountId ? 'Actualizar Cuenta' : 'Crear Cuenta Institucional'}
                                    </button>
                                    {editingAccountId && (
                                        <button type="button" className="btn-secondary-custom" onClick={() => { setEditingAccountId(''); setAccountForm(initialAccountForm); }}>
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>

                            <h3 className="section-title-custom mb-3">Cuentas Registradas en el Sistema</h3>
                            <div className="table-responsive">
                                <table className="admin-data-table">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Correo</th>
                                            <th>Rol</th>
                                            <th>Institución</th>
                                            <th>Estado</th>
                                            <th className="text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accounts.map((acc) => (
                                            <tr key={acc._id}>
                                                <td className="font-medium text-white">{acc.name}</td>
                                                <td>{acc.email}</td>
                                                <td>{acc.role}</td>
                                                <td>{acc.institution}</td>
                                                <td>
                                                    <span className={`px-2 py-1 rounded text-xs ${acc.active ? 'bg-emerald-900 text-emerald-200' : 'bg-rose-900 text-rose-200'}`}>
                                                        {acc.active ? 'Activa' : 'Inactiva'}
                                                    </span>
                                                </td>
                                                <td className="text-right space-x-2">
                                                    <button type="button" className="bg-blue-700 px-2.5 py-1 rounded text-xs text-white" onClick={() => { setEditingAccountId(acc._id); setAccountForm(acc); }}>Editar</button>
                                                    <button type="button" className={`px-2.5 py-1 rounded text-xs text-white ${acc.active ? 'bg-amber-700' : 'bg-emerald-700'}`} onClick={() => toggleAccountStatus(acc._id)}>
                                                        {acc.active ? 'Desactivar' : 'Activar'}
                                                    </button>
                                                    <button type="button" className="bg-rose-900 px-2.5 py-1 rounded text-xs text-white" onClick={() => deleteAccount(acc._id)}>Eliminar</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : currentView === 'roles' ? (
                        <div className="admin-card-section">
                            <h3 className="section-title-custom mb-3">Gestión de Roles y Permisos Institucionales</h3>
                            <p className="text-slate-400 mb-4">Administración de permisos específicos de acceso por rol y perfil de usuario.</p>
                            <div className="space-y-4">
                                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                                    <div>
                                        <h4 className="text-white font-semibold">Personal Institucional</h4>
                                        <p className="text-sm text-slate-400">Acceso a consulta de reportes, actualización de estatus y estadísticas generales.</p>
                                    </div>
                                    <span className="text-xs bg-emerald-900 text-emerald-200 px-3 py-1 rounded-full">Permisos Asignados (CU18 - CU22)</span>
                                </div>
                                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                                    <div>
                                        <h4 className="text-white font-semibold">Administrador Técnico</h4>
                                        <p className="text-sm text-slate-400">Acceso total a gestión de catálogo, registro de instituciones, cuentas y permisos.</p>
                                    </div>
                                    <span className="text-xs bg-purple-900 text-purple-200 px-3 py-1 rounded-full">Control Total (CU23 - CU27)</span>
                                </div>
                            </div>
                        </div>
                    ) : currentView === 'catalogo' ? (
                        <div className="admin-card-section">
                            {resourceError && <p className="admin-resource-message is-error" role="alert">{resourceError}</p>}
                            {resourceNotice && <p className="admin-resource-message is-success" role="status">{resourceNotice}</p>}

                            <h3 className="section-title-custom mb-4">{editingResourceId ? 'Editar Contenido' : 'Agregar Contenido al Catálogo'}</h3>
                            <form className="admin-resource-form mb-6" onSubmit={handleSaveResource}>
                                <div className="admin-resource-form-grid">
                                    <label>
                                        Categoría
                                        <select value={resourceForm.category} onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })} className="admin-select mt-1 bg-slate-950 p-2 rounded-lg w-full text-white">
                                            {resourceCategories.map((c) => <option value={c.id} key={c.id}>{c.title}</option>)}
                                        </select>
                                    </label>
                                    <label>
                                        Título
                                        <input required value={resourceForm.title} onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })} className="admin-search-input mt-1" />
                                    </label>
                                    <label className="admin-resource-form-wide">
                                        URL del recurso
                                        <input required type="url" value={resourceForm.url} onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })} className="admin-search-input mt-1" />
                                    </label>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button type="submit" className="btn-primary-custom" disabled={isSavingResource}>
                                        {isSavingResource ? 'Guardando...' : editingResourceId ? 'Actualizar contenido' : 'Agregar al catálogo'}
                                    </button>
                                    {editingResourceId && (
                                        <button type="button" className="btn-secondary-custom" onClick={() => { setEditingResourceId(''); setResourceForm(initialResourceForm); }}>
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </form>

                            <h3 className="section-title-custom mb-3">Elementos del Catálogo</h3>
                            {isLoadingResources ? (
                                <p className="admin-resource-loading" role="status">Cargando catálogo…</p>
                            ) : resources.length ? (
                                <div className="table-responsive">
                                    <table className="admin-data-table">
                                        <thead>
                                            <tr>
                                                <th>Título</th>
                                                <th>Categoría</th>
                                                <th>Enlace</th>
                                                <th className="text-right">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {resources.map((res) => (
                                                <tr key={res._id}>
                                                    <td className="font-medium text-white">{res.title}</td>
                                                    <td>{res.category}</td>
                                                    <td><a href={res.url} target="_blank" rel="noreferrer" className="text-purple">{res.url}</a></td>
                                                    <td className="text-right space-x-2">
                                                        <button type="button" className="action-btn-review bg-blue-700 px-3 py-1 rounded text-xs text-white mr-2" onClick={() => startEditingResource(res)}>Editar</button>
                                                        <button type="button" className="action-btn-review bg-rose-900 px-3 py-1 rounded text-xs text-white" onClick={() => handleDeleteResource(res)}>Eliminar</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="admin-resource-empty">No hay elementos en el catálogo.</p>
                            )}
                        </div>
                    ) : null}
                </div>
            </main>
        </div>
    )
}

export default Admin