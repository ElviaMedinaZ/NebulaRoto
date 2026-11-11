import { useState, useEffect, useRef } from 'react';
import { API_URL } from './apiUrl.js'
import { getOrientationRequests, deleteOrientationRequest } from './orientationRequestsApi.js'
import Reportes from './Reportes.jsx'
import './AdminDashboard.css';

export default function AdminDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('solicitudes');
  const [searchTerm, setSearchTerm] = useState('');
  const [orientaciones, setOrientaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [deletingRequestId, setDeletingRequestId] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [statisticsError, setStatisticsError] = useState(null);
  const requestsLoaded = useRef(false);
  const statisticsLoaded = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSession = async () => {
      try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include'
        });
        const body = await response.text();
        let result = null;
        if (body) {
          try {
            result = JSON.parse(body);
          } catch {
            if (response.ok) throw new Error('El servidor devolvió una respuesta inválida.');
          }
        }
        if (!response.ok || !result?.usuario) {
          throw new Error(result?.mensaje || 'Inicia sesión para acceder al panel.');
        }
        if (isMounted) setCurrentUser(result.usuario);
      } catch (sessionError) {
        if (isMounted) setError(sessionError.message);
      } finally {
        if (isMounted) setIsLoadingSession(false);
      }
    };

    fetchSession();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!currentUser || !['admin', 'institucional'].includes(currentUser.role)
      || requestsLoaded.current) return undefined;

    let isActive = true;
    getOrientationRequests()
      .then((requests) => {
        if (!Array.isArray(requests)) throw new Error('La respuesta de solicitudes no es válida.');
        if (isActive) {
          setOrientaciones(requests);
          setError('');
          requestsLoaded.current = true;
        }
      })
      .catch((requestError) => {
        if (isActive) setError(requestError.message);
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => { isActive = false; };
  }, [activeTab, currentUser]);

  useEffect(() => {
    if (!currentUser || !['admin', 'institucional'].includes(currentUser.role)) return undefined;

    let isActive = true;
    const fetchStatistics = async () => {
      if (!statisticsLoaded.current) setStatisticsLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/statistics/dashboard`, {
          credentials: 'include'
        });
        const body = await response.text();
        let data = null;
        if (body) {
          try {
            data = JSON.parse(body);
          } catch {
            if (response.ok) throw new Error('El servidor devolvió una respuesta inválida.');
          }
        }
        if (!response.ok) {
          throw new Error(data?.mensaje || 'No se pudieron cargar las estadísticas.')
        }
        if (![data?.autoevaluaciones, data?.reportes, data?.socios]
          .every((count) => Number.isSafeInteger(count) && count >= 0)) {
          throw new Error('La respuesta de estadísticas del servidor no es válida.')
        }
        if (isActive) {
          statisticsLoaded.current = true
          setStatistics(data)
          setStatisticsError(null)
        }
      } catch (statisticsFetchError) {
        if (isActive) {
          setStatisticsError(statisticsFetchError.message)
        }
      } finally {
        if (isActive) setStatisticsLoading(false)
      }
    }

    fetchStatistics()
    const refreshInterval = window.setInterval(fetchStatistics, 30000)
    return () => {
      isActive = false
      window.clearInterval(refreshInterval)
    }
  }, [currentUser]);

  const handleDeleteRequest = async (request) => {
    if (!window.confirm('¿Eliminar esta solicitud de orientación?')) return;
    setDeletingRequestId(request._id);
    setError('');
    setNotice('');
    try {
      await deleteOrientationRequest(request._id);
      setOrientaciones((current) => current.filter((item) => item._id !== request._id));
      setNotice('Solicitud eliminada correctamente.');
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setDeletingRequestId('');
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setError('');
    try {
      if (onLogout) {
        await onLogout();
        return;
      }
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('No se pudo cerrar la sesión.');
      window.location.reload();
    } catch (logoutError) {
      setError(logoutError.message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const canAccessReviewQueues = ['admin', 'institucional'].includes(currentUser?.role);
  const isAdministrator = currentUser?.role === 'admin';
  const filteredRequests = orientaciones.filter((request) => {
    const query = searchTerm.trim().toLowerCase();
    return !query || [request.name, request.email, request.phone, request.message]
      .some((value) => value?.toLowerCase().includes(query));
  });

  return (
    <div className="admin-dashboard-container">
      
      {/* Barra lateral de Administración exclusiva */}
      <aside className="admin-sidebar">
        <div>
          <div className="admin-logo-area">
            <div className="admin-logo-icon">🔒</div>
            <div>
              <h1 className="admin-title">NEBULA</h1>
              <span className="admin-badge">
                {isLoadingSession ? 'Verificando sesión' : currentUser?.role === 'admin' ? 'Administrador' : 'Personal Institucional'}
              </span>
            </div>
          </div>

          <nav className="admin-nav-menu">
            {canAccessReviewQueues && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('solicitudes')}
                  className={`admin-nav-btn ${activeTab === 'solicitudes' ? 'active' : ''}`}
                >
                  <span>Solicitudes de Orientación</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('reportes')}
                  className={`admin-nav-btn ${activeTab === 'reportes' ? 'active' : ''}`}
                >
                  <span>Reportes Anónimos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('estadisticas')}
                  className={`admin-nav-btn ${activeTab === 'estadisticas' ? 'active' : ''}`}
                >
                  <span>Estadísticas y Tendencias</span>
                </button>
              </>
            )}

            {isAdministrator && (
              <button
                type="button"
                onClick={() => setActiveTab('gestion')}
                className={`admin-nav-btn ${activeTab === 'gestion' ? 'active' : ''}`}
              >
                <span>Instituciones y Contenido</span>
              </button>
            )}
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">AD</div>
            <div>
              <p className="admin-user-name">{currentUser?.nombre || 'Cuenta'}</p>
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
        </div>
      </aside>

      {/* Área Principal de Contenido */}
      <main className="admin-main-content">
        
        <header className="admin-header-bar">
          <div>
            <h2 className="admin-header-title">
              {isLoadingSession ? 'Verificando permisos…' :
                activeTab === 'solicitudes' && 'Gestión de Solicitudes de Orientación'}
              {activeTab === 'reportes' && 'Bandeja de Reportes Anónimos'}
              {activeTab === 'estadisticas' && 'Estadísticas Generales y Tendencias'}
              {activeTab === 'gestion' && 'Gestión de Instituciones Aliadas y Contenidos'}
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
          ) : !canAccessReviewQueues ? (
            <section className="admin-access-denied" role="alert">
              <h3>{error || 'No tienes permisos para acceder a los recursos'}</h3>
              <p>Este panel está disponible para administradores y personal institucional.</p>
            </section>
          ) : (
            <>
              <div className="metrics-cards-grid">
                {[
                  ['Solicitudes Totales', loading ? '…' : orientaciones.length],
                  ['Reportes Anónimos', statistics?.reportes],
                  ['Evaluaciones Procesadas', statistics?.autoevaluaciones],
                  ['Instituciones Activas', statistics?.socios],
                ].map(([label, count]) => (
                  <div className="metric-box" key={label}>
                    <span className="metric-box-title">{label}</span>
                    <div className="metric-box-content">
                      <span className="metric-box-number">
                        {count === undefined ? (statisticsLoading ? '…' : '—') : count.toLocaleString('es-MX')}
                      </span>
                      <span className="metric-box-tag">Base de datos</span>
                    </div>
                  </div>
                ))}
              </div>

          {activeTab === 'solicitudes' ? (
            <div className="admin-card-section">
              <div className="admin-filters-bar">
                <div className="admin-search-wrapper">
                  <input
                    type="text"
                    placeholder="Buscar por nombre, correo, teléfono o mensaje..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="admin-search-input"
                  />
                </div>
              </div>

              {error && <p className="admin-dashboard-error" role="alert">{error}</p>}
              {notice && <p className="statistics-error" role="status">{notice}</p>}

              {loading ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Cargando solicitudes desde la base de datos...</p>
              ) : filteredRequests.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No se encontraron solicitudes.</p>
              ) : (
                <div className="table-responsive">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>Nombre / Alias</th>
                        <th>Fecha</th>
                        <th>Correo</th>
                        <th>Teléfono</th>
                        <th>Mensaje</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.map((request) => (
                        <tr key={request._id}>
                          <td className="font-medium text-white">{request.name || 'Anónimo'}</td>
                          <td>{new Date(request.createdAt).toLocaleDateString('es-MX')}</td>
                          <td><a href={`mailto:${request.email}`} className="text-purple">{request.email}</a></td>
                          <td>{request.phone ? <a href={`tel:${request.phone}`}>{request.phone}</a> : 'N/D'}</td>
                          <td>{request.message}</td>
                          <td className="text-right" style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <a
                              href={`mailto:${request.email}?subject=${encodeURIComponent('Respuesta a su solicitud de orientación - NEBULA')}&body=${encodeURIComponent(`Estimado/a ${request.name || 'Usuario/a'},\n\nHemos recibido su solicitud de orientación enviada a través del sistema NEBULA:\n"${request.message}"\n\nNos ponemos en contacto con usted para brindarle el apoyo necesario:\n\n[Escriba su mensaje de orientación aquí]\n\nAtentamente,\nPersonal Institucional - Sistema NEBULA`)}`}
                              className="action-btn-review inline-block px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded text-xs transition"
                            >
                              Responder
                            </a>
                            <button
                              type="button"
                              className="action-btn-review px-3 py-1 bg-rose-900 text-white rounded text-xs"
                              onClick={() => handleDeleteRequest(request)}
                              disabled={deletingRequestId === request._id}
                            >
                              {deletingRequestId === request._id ? 'Eliminando…' : 'Eliminar'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          ) : activeTab === 'reportes' ? (
            <Reportes />
          ) : activeTab === 'estadisticas' ? (
            <>
            <section className="statistics-summary" aria-label="Totales de la plataforma">
              {[
                ['Autoevaluaciones completadas', statistics?.autoevaluaciones],
                ['Reportes registrados', statistics?.reportes],
                ['Socios', statistics?.socios],
              ].map(([label, count]) => (
                <div className="metric-box" key={label}>
                  <span className="metric-box-title">{label}</span>
                  <div className="metric-box-content">
                    <span className="metric-box-number">
                      {count === undefined ? (statisticsLoading ? '…' : '—') : count.toLocaleString('es-MX')}
                    </span>
                    <span className="metric-box-tag">Base de datos</span>
                  </div>
                </div>
              ))}
            </section>
            {statisticsError && (
              <p className="statistics-error" role="alert">{statisticsError}</p>
            )}
            <div className="stats-grid-container">
              <div className="admin-card-section">
                <h3 className="section-title-custom">Incidencia por Tipo de Violencia</h3>
                <div className="stats-bars-space">
                  <div>
                    <div className="stat-label-row">
                      <span>Psicológica / Emocional</span>
                      <span className="stat-val">45%</span>
                    </div>
                    <div className="progress-bar-bg"><div className="progress-fill-purple" style={{ width: '45%' }}></div></div>
                  </div>
                  <div>
                    <div className="stat-label-row">
                      <span>Física</span>
                      <span className="stat-val">25%</span>
                    </div>
                    <div className="progress-bar-bg"><div className="progress-fill-rose" style={{ width: '25%' }}></div></div>
                  </div>
                  <div>
                    <div className="stat-label-row">
                      <span>Económica / Patrimonial</span>
                      <span className="stat-val">18%</span>
                    </div>
                    <div className="progress-bar-bg"><div className="progress-fill-amber" style={{ width: '18%' }}></div></div>
                  </div>
                  <div>
                    <div className="stat-label-row">
                      <span>Sexual / Digital</span>
                      <span className="stat-val">12%</span>
                    </div>
                    <div className="progress-bar-bg"><div className="progress-fill-cyan" style={{ width: '12%' }}></div></div>
                  </div>
                </div>
              </div>

              <div className="admin-card-section flex-between">
                <div>
                  <h3 className="section-title-custom">Reportes y Tendencias Mensuales</h3>
                  <p className="admin-header-subtitle">Análisis comparativo de efectividad en derivación institucional.</p>
                </div>
                <div className="stats-highlight-box">
                  <p className="stats-highlight-label">Tasa de resolución y respuesta oportuna</p>
                  <p className="stats-highlight-number">94.2%</p>
                  <p className="stats-highlight-sub">Promedio de tiempo de atención: 38 minutos</p>
                </div>
              </div>
            </div>
            </>
          ) : isAdministrator ? (
            <div className="admin-card-section">
              <div className="flex-between mb-4">
                <div>
                  <h3 className="section-title-custom">Directorio de Instituciones Aliadas</h3>
                  <p className="admin-header-subtitle">Administra centros de apoyo, líneas de emergencia y contactos clave.</p>
                </div>
                <button onClick={() => alert('Función para agregar nueva institución.')} className="btn-primary-custom">
                  + Agregar Institución
                </button>
              </div>

              <div className="institutions-grid-cards">
                <div className="inst-card">
                  <h4>Centro de Justicia para las Mujeres</h4>
                  <p>Atención integral jurídica y psicológica 24/7.</p>
                  <span className="badge-status atendido">Activo</span>
                </div>
                <div className="inst-card">
                  <h4>Línea Nacional de Orientación</h4>
                  <p>Soporte telefónico anónimo y confidencial.</p>
                  <span className="badge-status atendido">Activo</span>
                </div>
                <div className="inst-card">
                  <h4>Refugio Temporal Esperanza</h4>
                  <p>Protección y hospedaje seguro en casos críticos.</p>
                  <span className="badge-status atendido">Activo</span>
                </div>
              </div>
            </div>
          ) : (
            <section className="admin-access-denied" role="alert">
              <h3>No tienes permisos para acceder a esta sección</h3>
              <p>Selecciona una sección habilitada para tu rol.</p>
            </section>
          )}
            </>
          )}

        </div>
      </main>

    </div>
  );
}