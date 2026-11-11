import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('solicitudes');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUrgency, setFilterUrgency] = useState('todos');
  const [selectedItem, setSelectedItem] = useState(null);

  // Estados inicializados vacíos para llenarse con la base de datos real
  const [orientaciones, setOrientaciones] = useState([]);
  const [reportes, setReportes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Cargar datos reales desde la Base de Datos al abrir el panel
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setLoading(true);
        
        // Petición para solicitudes de orientación (ajusta la URL a tu ruta de backend)
        const resOri = await fetch('http://localhost:4000/api/orientation-requests', {
          credentials: 'include' // Necesario si manejas sesiones/cookies de admin
        });
        if (resOri.ok) {
          const dataOri = await resOri.json();
          setOrientaciones(dataOri);
        }

        // Petición para reportes anónimos (ajusta la URL a tu ruta de backend)
        const resRep = await fetch('http://localhost:4000/api/reports', {
          credentials: 'include'
        });
        if (resRep.ok) {
          const dataRep = await resRep.json();
          setReportes(dataRep);
        }

      } catch (err) {
        console.error('Error al conectar con la base de datos:', err);
        setError('No se pudo establecer conexión con el servidor.');
      } finally {
        setLoading(false);
      }
    };

    fetchRealData();
  }, []);

  // 2. Función real para actualizar estados en la Base de Datos
  const handleUpdateStatus = async (id, nuevoEstado) => {
    try {
      const endpoint = activeTab === 'solicitudes' 
        ? `http://localhost:4000/api/orientation-requests/${id}` 
        : `http://localhost:4000/api/reports/${id}`;

      // Petición al backend para actualizar en MongoDB
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error al actualizar en el servidor');
      }

      // Actualizar estado localmente tras éxito en la BDD
      if (activeTab === 'solicitudes') {
        setOrientaciones(orientaciones.map(item => (item.id === id || item._id === id) ? { ...item, estado: nuevoEstado } : item));
      } else {
        setReportes(reportes.map(item => (item.id === id || item._id === id) ? { ...item, estado: nuevoEstado } : item));
      }

      if (selectedItem && (selectedItem.id === id || selectedItem._id === id)) {
        setSelectedItem({ ...selectedItem, estado: nuevoEstado });
      }

      alert('Estado actualizado correctamente en la base de datos.');
    } catch (err) {
      console.error(err);
      alert('Hubo un error al actualizar el registro en el servidor.');
    }
  };

  // Filtrado dinámico por buscador y urgencia
  const dataList = activeTab === 'solicitudes' ? orientaciones : reportes;
  const filteredData = dataList.filter(item => {
    const matchesSearch = 
      (item.id && item.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item._id && item._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.tipo && item.tipo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.detalle && item.detalle.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesUrgency = filterUrgency === 'todos' || item.urgencia === filterUrgency;

    return matchesSearch && matchesUrgency;
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
              <span className="admin-badge">Panel Admin</span>
            </div>
          </div>

          <nav className="admin-nav-menu">
            <button
              onClick={() => { setActiveTab('solicitudes'); setSelectedItem(null); }}
              className={`admin-nav-btn ${activeTab === 'solicitudes' ? 'active' : ''}`}
            >
              <span>Solicitudes Orientación</span>
            </button>

            <button
              onClick={() => { setActiveTab('reportes'); setSelectedItem(null); }}
              className={`admin-nav-btn ${activeTab === 'reportes' ? 'active' : ''}`}
            >
              <span>Reportes Anónimos</span>
            </button>

            <button
              onClick={() => { setActiveTab('estadisticas'); setSelectedItem(null); }}
              className={`admin-nav-btn ${activeTab === 'estadisticas' ? 'active' : ''}`}
            >
              <span>Estadísticas y Tendencias</span>
            </button>

            <button
              onClick={() => { setActiveTab('gestion'); setSelectedItem(null); }}
              className={`admin-nav-btn ${activeTab === 'gestion' ? 'active' : ''}`}
            >
              <span>Instituciones y Contenido</span>
            </button>
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">AD</div>
            <div>
              <p className="admin-user-name">Adm. Central</p>
              <p className="admin-user-status">Sesión Segura</p>
            </div>
          </div>
          <button 
            onClick={() => alert('Cierre de sesión seguro.')}
            className="admin-logout-btn"
          >
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Área Principal de Contenido */}
      <main className="admin-main-content">
        
        <header className="admin-header-bar">
          <div>
            <h2 className="admin-header-title">
              {activeTab === 'solicitudes' && 'Gestión de Solicitudes de Orientación'}
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
          
          {/* Tarjetas de Resumen Métricas */}
          <div className="metrics-cards-grid">
            <div className="metric-box">
              <span className="metric-box-title">Solicitudes Totales</span>
              <div className="metric-box-content">
                <span className="metric-box-number">{orientaciones.length}</span>
                <span className="metric-box-tag positive">Base de Datos</span>
              </div>
            </div>

            <div className="metric-box">
              <span className="metric-box-title">Reportes Anónimos</span>
              <div className="metric-box-content">
                <span className="metric-box-number">{reportes.length}</span>
                <span className="metric-box-tag urgent">Registrados</span>
              </div>
            </div>

            <div className="metric-box">
              <span className="metric-box-title">Evaluaciones Procesadas</span>
              <div className="metric-box-content">
                <span className="metric-box-number">2,850</span>
                <span className="metric-box-tag positive">+8% este mes</span>
              </div>
            </div>

            <div className="metric-box">
              <span className="metric-box-title">Instituciones Activas</span>
              <div className="metric-box-content">
                <span className="metric-box-number">18</span>
                <span className="metric-box-tag">Red Aliada</span>
              </div>
            </div>
          </div>

          {/* Sección Interactiva según Pestaña */}
          {activeTab === 'solicitudes' || activeTab === 'reportes' ? (
            <div className="admin-card-section">
              
              <div className="admin-filters-bar">
                <div className="admin-search-wrapper">
                  <input
                    type="text"
                    placeholder="Buscar por ID, tipo o detalle..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="admin-search-input"
                  />
                </div>

                <div className="admin-filter-group">
                  <span>Urgencia:</span>
                  <select
                    value={filterUrgency}
                    onChange={(e) => setFilterUrgency(e.target.value)}
                    className="admin-select"
                  >
                    <option value="todos">Todos</option>
                    <option value="Alta">Alta / Urgente</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Cargando registros desde la base de datos...</p>
              ) : filteredData.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No se encontraron registros en la base de datos.</p>
              ) : (
                <div className="table-responsive">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Urgencia</th>
                        <th>Estado</th>
                        <th className="text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((item) => (
                        <tr key={item.id || item._id}>
                          <td className="font-mono text-purple">{item.id || item._id.slice(-6)}</td>
                          <td>{item.fecha ? item.fecha.split('T')[0] : 'Reciente'}</td>
                          <td className="font-medium">{item.tipo}</td>
                          <td>
                            <span className={`badge-urgency ${(item.urgencia || 'baja').toLowerCase()}`}>
                              {item.urgencia}
                            </span>
                          </td>
                          <td>
                            <span className={`badge-status ${(item.estado || 'pendiente').toLowerCase().replace(' ', '-')}`}>
                              {item.estado}
                            </span>
                          </td>
                          <td className="text-right">
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="action-btn-review"
                            >
                              Revisar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          ) : activeTab === 'estadisticas' ? (
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
          ) : (
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
          )}

        </div>
      </main>

      {/* Modal de Detalle */}
      {selectedItem && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card">
            <div className="modal-header">
              <div>
                <span className="modal-id">{selectedItem.id || selectedItem._id}</span>
                <h3 className="modal-title">Detalle del Registro</h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="modal-close-btn">✕</button>
            </div>

            <div className="modal-body-content">
              <div>
                <span className="modal-field-label">Tipo de caso</span>
                <p className="modal-field-value">{selectedItem.tipo}</p>
              </div>
              <div>
                <span className="modal-field-label">Fecha de registro</span>
                <p className="modal-field-value">{selectedItem.fecha ? selectedItem.fecha.split('T')[0] : 'Reciente'}</p>
              </div>
              <div>
                <span className="modal-field-label">Nivel de Urgencia</span>
                <p className="modal-field-value text-rose">{selectedItem.urgencia}</p>
              </div>
              <div>
                <span className="modal-field-label">Descripción / Detalle</span>
                <p className="modal-detail-box">{selectedItem.detalle || selectedItem.message || 'Sin descripción detallada.'}</p>
              </div>

              <div className="modal-actions-box">
                <span className="modal-field-label">Actualizar Estado del Caso</span>
                <div className="modal-buttons-row">
                  <button onClick={() => handleUpdateStatus(selectedItem.id || selectedItem._id, 'En proceso')} className="btn-status-blue">
                    En Proceso
                  </button>
                  <button onClick={() => handleUpdateStatus(selectedItem.id || selectedItem._id, 'Atendido')} className="btn-status-emerald">
                    Resolver / Atendido
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setSelectedItem(null)} className="btn-secondary-custom">
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}