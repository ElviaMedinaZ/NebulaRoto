import { useEffect, useRef, useState } from 'react'
import { getAdminSession, logoutAdmin } from './adminAuthApi.js'
import './App.css'
import LineaEscucha from './LineasEscucha.jsx'
import CentrosAyuda from './CentrosAyuda.jsx'
import ModulosPreventivos from './ChatGlogal.jsx'
import RutasLegales from './RecursosOrientacion.jsx'
import AdminDashboard from './Admin.jsx'; // Nuestro panel técnico completo
import LoginAdmin from './LoginAdmin.jsx'
import SingUpAdmin from './SingUpAdmin.jsx'
import Socios from './Socios.jsx'
import IA from './IA.jsx'
import Autoevaluacion from './Autoevaluacion.jsx'
import ReporteModal from './ReporteModal.jsx'
import ConsultaReporteModal from './ConsultaReporteModal.jsx'
import { createOrientationRequest } from './orientationRequestsApi.js'
import logo from './assets/Logo.png'
import miImagen from './assets/Circ_AI.png'
import miImagenParpadeo from './assets/Circ_Ai_Parpadeo.png'
import './NebulaMobile.css'

const quickActions = [
  { title: 'Centros de ayuda', description: 'Encuentra instituciones y refugios cercanos.', icon: '📍', page: 'centros' },
  { title: 'Chat global de acompañamiento', description: 'Participa en una conversación comunitaria abierta. No compartas datos personales.', icon: '💬', page: 'modulos' },
  { title: 'Recursos de orientación', description: 'Accede a información confiable, multimedia y contactos profesionales.', icon: '📚', page: 'rutas' },
]

const pageRoutes = ['linea', 'centros', 'modulos', 'rutas', 'login', 'login-admin', 'signup-admin', 'socios', 'ia', 'admin']
const homeSections = ['inicio', 'pilares', 'nosotros', 'servicios', 'proceso', 'contacto']
const quickExitUrl = 'https://www.shein.com.mx/'

const aiMessages = [
  '¡Hola! hazme clic para platicar conmigo.',
  '¿Quieres conversar? pulsame y empecemos.',
  'Estoy aquí para escucharte. Haz clic sobre mi.',
  '¿Buscas orientación? Pulsa aquí para abrir nuestro chat.',
  'Puedes hablar conmigo cuando quieras. ¡Haz clic!',
  'Hola, este es un espacio para ti. pulsa para entrar.',
  '¿Te gustaría platicar? Haz clic aquí para comenzar.',
]

const violentometroLevels = [
  {
    id: 'advertencia',
    label: 'Advertencia',
    marker: '01',
    color: '#d39a00',
    tint: '#fff7dd',
    summary: 'Señales que pueden parecer pequeñas, pero afectan tu bienestar.',
    conductTitle: 'Señales para reconocer',
    conducts: [
      'Bromas hirientes o comentarios que te ridiculizan',
      'Celos y desconfianza constantes',
      'Chantajes o manipulación para que hagas algo',
      'Ignorarte, menospreciarte o descalificarte',
      'Intentar controlar tus amistades, decisiones o redes',
    ],
    recommendationTitle: 'Pon atención a lo que sientes',
    recommendations: [
      'Reconoce cómo te hacen sentir estas conductas; no tienes que minimizarlas.',
      'Si te resulta seguro, conversa sobre tus límites con alguien de confianza.',
      'Busca información y orientación antes de que la situación te rebase.',
    ],
  },
  {
    id: 'reaccion',
    label: 'Reacción',
    marker: '02',
    color: '#e66b27',
    tint: '#fff0e8',
    summary: 'Conductas que ya pueden limitar tu libertad y seguridad.',
    conductTitle: 'Conductas que requieren apoyo',
    conducts: [
      'Humillarte, intimidarte o amenazarte',
      'Aislarte de tus amistades o familia',
      'Controlar tu dinero, tus actividades o tu teléfono',
      'Empujarte, golpearte o forzarte a hacer algo',
      'Usar el miedo o la presión para tener el control',
    ],
    recommendationTitle: 'Acércate a una red de apoyo',
    recommendations: [
      'Cuéntale a una persona de confianza lo que está ocurriendo.',
      'Contacta un servicio especializado para conocer opciones seguras.',
      'Si puedes hacerlo sin ponerte en riesgo, acuerda una palabra clave o un plan para pedir ayuda.',
    ],
  },
  {
    id: 'peligro',
    label: 'Peligro',
    marker: '03',
    color: '#c52d50',
    tint: '#ffedf1',
    summary: 'Situaciones graves que pueden poner en riesgo tu integridad o tu vida.',
    conductTitle: 'Señales de riesgo inmediato',
    conducts: [
      'Amenazas graves de hacerte daño',
      'Agresión sexual o lesiones graves',
      'Uso de armas u objetos para amenazarte',
      'Impedirte salir o buscar ayuda mediante la fuerza',
      'Amenazas de muerte o riesgo de que la violencia escale',
    ],
    recommendationTitle: 'Prioriza tu seguridad ahora',
    recommendations: [
      'Si estás en peligro inmediato en México, llama al 911 o busca un lugar seguro.',
      'No enfrentes a quien te agrede si eso puede aumentar el riesgo.',
      'Contacta a una persona de confianza y pide apoyo especializado para planear los siguientes pasos.',
    ],
  },
]

function Violentometro({ onNavigateToPage }) {
  const [activeLevelId, setActiveLevelId] = useState('advertencia')
  const activeLevel = violentometroLevels.find((level) => level.id === activeLevelId)

  return (
    <section className="violentometro-section" aria-labelledby="violentometro-title">
      <div className="container">
        <div className="violentometro-heading">
          <span className="violentometro-kicker">Una guía para reconocer señales</span>
          <h2 id="violentometro-title">Violentómetro interactivo</h2>
          <p>Elige un nivel para conocer ejemplos de conductas y recomendaciones de apoyo. Ninguna forma de violencia es tu culpa.</p>
        </div>

        <div className="violentometro-levels" aria-label="Selecciona un nivel del violentómetro">
          {violentometroLevels.map((level) => (
            <button
              className={`violentometro-level${activeLevelId === level.id ? ' is-active' : ''}`}
              key={level.id}
              type="button"
              style={{ '--level-color': level.color, '--level-tint': level.tint }}
              aria-pressed={activeLevelId === level.id}
              aria-controls="violentometro-details"
              onClick={() => setActiveLevelId(level.id)}
            >
              <span className="violentometro-level-top">
                <span className="violentometro-marker">{level.marker}</span>
                <span className="violentometro-level-label">{level.label}</span>
                <span className="violentometro-chevron" aria-hidden="true">↗</span>
              </span>
              <span className="violentometro-level-summary">{level.summary}</span>
            </button>
          ))}
        </div>

        <div
          className="violentometro-details"
          id="violentometro-details"
          style={{ '--level-color': activeLevel.color, '--level-tint': activeLevel.tint }}
          aria-live="polite"
        >
          <div className="violentometro-details-heading">
            <span className="violentometro-level-tag">
              <span aria-hidden="true" />
              Nivel {activeLevel.marker} · {activeLevel.label}
            </span>
            <p>{activeLevel.summary}</p>
          </div>

          <div className="violentometro-details-grid">
            <div className="violentometro-conducts">
              <h3>{activeLevel.conductTitle}</h3>
              <ul>
                {activeLevel.conducts.map((conduct) => (
                  <li key={conduct}>{conduct}</li>
                ))}
              </ul>
            </div>
            <aside className="violentometro-recommendation">
              <span className="violentometro-recommendation-icon" aria-hidden="true">✳</span>
              <h3>{activeLevel.recommendationTitle}</h3>
              <ul>
                {activeLevel.recommendations.map((recommendation) => (
                  <li key={recommendation}>{recommendation}</li>
                ))}
              </ul>
              <div className="violentometro-actions">
                <button type="button" onClick={() => onNavigateToPage('linea')}>Hablar con alguien</button>
                <button type="button" onClick={() => onNavigateToPage('centros')}>Ver centros de ayuda</button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}

function getRouteFromHash() {
  const fragment = window.location.hash.slice(1)
  if (pageRoutes.includes(fragment)) {
    return { page: fragment, section: null }
  }
  if (homeSections.includes(fragment)) {
    return { page: 'home', section: fragment }
  }
  return { page: 'home', section: null }
}

function App() {
  const [activePage, setActivePage] = useState(() => getRouteFromHash().page)
  const [activeSection, setActiveSection] = useState(() => getRouteFromHash().section)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuToggleRef = useRef(null)
  const mobileNavigationRef = useRef(null)
  const [isDarkMode, setIsDarkMode] = useState(() => window.localStorage.getItem('nebula-theme') === 'dark')
  const [isAiBlinking, setIsAiBlinking] = useState(false)
  const [aiMessage, setAiMessage] = useState(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isReportLookupOpen, setIsReportLookupOpen] = useState(false)
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false)
  const [isSendingOrientationRequest, setIsSendingOrientationRequest] = useState(false)
  const [orientationPhone, setOrientationPhone] = useState('')
  const [orientationRequestError, setOrientationRequestError] = useState('')
  const [orientationRequestNotice, setOrientationRequestNotice] = useState('')
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [isCheckingAdminSession, setIsCheckingAdminSession] = useState(() => getRouteFromHash().page === 'admin')
  const [adminSessionError, setAdminSessionError] = useState('')

  const isAdminPage = ['admin', 'login-admin', 'signup-admin'].includes(activePage)

  useEffect(() => {
    if (activePage !== 'admin' || isAdminAuthenticated) return undefined
    let isCurrent = true
    getAdminSession()
      .then(() => { if (isCurrent) setIsAdminAuthenticated(true) })
      .catch((error) => {
        if (isCurrent && error.message !== 'Inicia sesión para continuar.' && !error.message.includes('sesión expiró')) {
          setAdminSessionError(error.message)
        }
      })
      .finally(() => { if (isCurrent) setIsCheckingAdminSession(false) })

    return () => { isCurrent = false }
  }, [activePage, isAdminAuthenticated])

  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'light'
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('nebula-theme', theme)
  }, [isDarkMode])

  useEffect(() => {
    const syncRoute = () => {
      const route = getRouteFromHash()
      setActivePage(route.page)
      setIsMobileMenuOpen(false)
      setActiveSection(route.section)
      setIsCheckingAdminSession(route.page === 'admin' && !isAdminAuthenticated)
      setAdminSessionError('')
    }

    window.addEventListener('popstate', syncRoute)
    window.addEventListener('hashchange', syncRoute)
    return () => {
      window.removeEventListener('popstate', syncRoute)
      window.removeEventListener('hashchange', syncRoute)
    }
  }, [isAdminAuthenticated])

  useEffect(() => {
    let showTimer, hideTimer
    let lastMessageIndex = -1
    const scheduleMessage = () => {
      showTimer = window.setTimeout(() => {
        let nextMessageIndex
        do { nextMessageIndex = Math.floor(Math.random() * aiMessages.length) } while (nextMessageIndex === lastMessageIndex)
        lastMessageIndex = nextMessageIndex
        setAiMessage(aiMessages[nextMessageIndex])
        hideTimer = window.setTimeout(() => {
          setAiMessage(null)
          showTimer = window.setTimeout(scheduleMessage, 3500)
        }, 5000)
      }, 900)
    }
    scheduleMessage()
    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
    }
  }, [])

  useEffect(() => {
    let blinkTimer, openEyesTimer
    const scheduleBlink = () => {
      blinkTimer = window.setTimeout(() => {
        setIsAiBlinking(true)
        openEyesTimer = window.setTimeout(() => {
          setIsAiBlinking(false)
          scheduleBlink()
        }, 140)
      }, 2800 + Math.random() * 4200)
    }
    scheduleBlink()
    return () => {
      window.clearTimeout(blinkTimer)
      window.clearTimeout(openEyesTimer)
    }
  }, [])

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
        mobileMenuToggleRef.current?.focus()
      }
    }
    const handleResize = () => { if (window.innerWidth > 768) setIsMobileMenuOpen(false) }

    window.addEventListener('keydown', handleEscape)
    window.addEventListener('resize', handleResize)
    mobileNavigationRef.current?.querySelector('button')?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('resize', handleResize)
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    if (activePage !== 'home' || !activeSection) return
    document.getElementById(activeSection)?.scrollIntoView({ behavior: 'smooth' })
  }, [activePage, activeSection])

  useEffect(() => {
    if (activePage !== 'home') { window.scrollTo({ top: 0, behavior: 'auto' }) }
  }, [activePage])

  const updateLocation = (fragment) => {
    if (window.location.hash !== `#${fragment}`) {
      window.history.pushState(null, '', `#${fragment}`)
    }
  }

  const navigateToPage = (page) => {
    setIsMobileMenuOpen(false)
    const destination = page === 'home' ? 'inicio' : page
    updateLocation(destination)
    setActivePage(page)
    setActiveSection(null)
    setIsCheckingAdminSession(page === 'admin' && !isAdminAuthenticated)
  }

  const navigateToSection = (sectionId) => {
    setIsMobileMenuOpen(false)
    updateLocation(sectionId)
    setActivePage('home')
    setActiveSection(sectionId)
  }

  const navigateHome = () => {
    navigateToPage('home')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openAssessment = () => {
    setIsMobileMenuOpen(false)
    setIsAssessmentModalOpen(true)
  }

  const handleOrientationRequestSubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const formData = new FormData(form)
    setIsSendingOrientationRequest(true)
    setOrientationRequestError('')
    setOrientationRequestNotice('')

    try {
      await createOrientationRequest({
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        message: formData.get('message'),
      })
      form.reset()
      setOrientationPhone('')
      setOrientationRequestNotice('Tu mensaje se envió correctamente. Nos pondremos en contacto contigo.')
    } catch (error) {
      setOrientationRequestError(error.message)
    } finally {
      setIsSendingOrientationRequest(false)
    }
  }

  const completeAdminAuthentication = () => {
    setAdminSessionError('')
    setIsAdminAuthenticated(true)
    navigateToPage('admin')
    setIsCheckingAdminSession(false)
  }

  const handleAdminLogout = async () => {
    await logoutAdmin()
    setIsAdminAuthenticated(false)
    navigateToPage('login-admin')
  }

  const renderPage = () => {
    switch (activePage) {
      case 'linea': return <LineaEscucha />
      case 'centros': return <CentrosAyuda />
      case 'modulos': return <ModulosPreventivos />
      case 'rutas': return <RutasLegales />
      case 'admin':
        if (isCheckingAdminSession) {
          return <main className="admin-session-loading" role="status">Verificando sesión administrativa…</main>
        }
        return isAdminAuthenticated
          ? <AdminDashboard onLogout={handleAdminLogout} />
          : <LoginAdmin
              onBack={navigateHome}
              onSignup={() => navigateToPage('signup-admin')}
              onAuthenticated={completeAdminAuthentication}
              initialError={adminSessionError}
            />
      case 'login-admin':
        return (
          <LoginAdmin
            onBack={navigateHome}
            onSignup={() => navigateToPage('signup-admin')}
            onAuthenticated={completeAdminAuthentication}
            initialError={adminSessionError}
          />
        )
      case 'signup-admin':
        return (
          <SingUpAdmin
            onBack={navigateHome}
            onLogin={() => navigateToPage('login-admin')}
            onAuthenticated={completeAdminAuthentication}
            initialError={adminSessionError}
          />
        )
      case 'socios': return <Socios />
      case 'ia': return <IA />
      case 'home':
      default:
        return (
          <>
            <section id="inicio" className="hero-section">
              <div className="container hero-content">
                <div className="hero-copy">
                  <span className="eyebrow">Un lugar para entender y orientarte</span>
                  <h1>Tu bienestar <span>también importa.</span></h1>
                  <p>Información, orientación y herramientas para reconocer señales de violencia y buscar apoyo. A tu ritmo, con privacidad y sin juicios.</p>
                  <div className="hero-buttons">
                    <button type="button" className="btn-primary" onClick={openAssessment}>
                      Realizar autoevaluación <span aria-hidden="true">→</span>
                    </button>
                    <button type="button" className="btn-secondary desktop-about-button" onClick={() => navigateToSection('nosotros')}>Conocer NEBULA</button>
                    <button type="button" className="btn-secondary mobile-help-button" onClick={() => navigateToPage('centros')}>Encontrar ayuda</button>
                  </div>
                </div>

                <section className="mobile-shortcuts" aria-labelledby="mobile-shortcuts-title">
                  <h2 id="mobile-shortcuts-title">Accesos rápidos</h2>
                  <div className="mobile-shortcuts-grid">
                    <button type="button" onClick={() => navigateToPage('centros')}><span aria-hidden="true">📍</span>Centros de ayuda</button>
                    <button type="button" onClick={() => navigateToPage('linea')}><span aria-hidden="true">☎</span>Líneas de escucha</button>
                    <button type="button" onClick={() => setIsReportModalOpen(true)}><span aria-hidden="true">✎</span>Crear reporte</button>
                    <button type="button" onClick={() => setIsReportLookupOpen(true)}><span aria-hidden="true">⌕</span>Consultar folio</button>
                  </div>
                </section>

                <div className="hero-visual" aria-label="Panel informativo de Nebula">
                  <div className="assessment-preview-card">
                    <div className="assessment-preview-header">
                      <div>
                        <span className="assessment-eyebrow">Un momento para ti</span>
                        <h2>¿Cómo te has sentido?</h2>
                      </div>
                      <span className="assessment-heart" aria-hidden="true">♡</span>
                    </div>
                    <div className="assessment-progress-labels"><span>Tu espacio es privado</span><span>Matriz oficial</span></div>
                    <div className="assessment-progress" aria-hidden="true"><span /></div>
                    <p className="assessment-prompt">A veces, lo que vivimos puede ser difícil de nombrar.</p>
                    <button type="button" className="assessment-start" onClick={openAssessment}>
                      Comenzar con calma <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section id="pilares" className="advantages-section">
              <div className="container">
                <h2>Nuestros Pilares</h2>
                <div className="advantages-grid">
                  <div className="advantage-card"><div className="card-icon">🛡️</div><h3>Confidencialidad</h3><p>Espacios seguros y canales protegidos para salvaguardar tu privacidad.</p></div>
                  <div className="advantage-card"><div className="card-icon">🤝</div><h3>Red de Apoyo</h3><p>Conexión directa con organizaciones y profesionales especializados.</p></div>
                  <div className="advantage-card"><div className="card-icon">📚</div><h3>Educación y Guías</h3><p>Recursos claros para identificar señales de alerta.</p></div>
                </div>
              </div>
            </section>

            <section id="nosotros" className="about-section">
              <div className="container about-grid">
                <div className="about-text">
                  <h2>Sobre el Proyecto Nebula</h2>
                  <p>Plataforma integral de tecnología social orientada a prevenir y erradicar la violencia hacia la mujer.</p>
                </div>
              </div>
            </section>

            <section className="quick-actions-section" id="servicios">
              <div className="container">
                <h2>Nuestros servicios y recursos</h2>
                <div className="quick-actions-grid">
                  {quickActions.map((action) => (
                    <a key={action.title} className="quick-action-card" href="#" onClick={(e) => { e.preventDefault(); navigateToPage(action.page) }}>
                      <div className="quick-action-media"><span>{action.icon}</span></div>
                      <div className="quick-action-body"><h3>{action.title}</h3><p>{action.description}</p></div>
                    </a>
                  ))}
                </div>
              </div>
            </section>

            <Violentometro onNavigateToPage={navigateToPage} />

            <section className="report-lookup-section" aria-labelledby="report-lookup-title">
              <div className="container report-lookup-grid">
                <article className="report-lookup-card">
                  <h2 id="report-lookup-title">¿Deseas consultar tu reporte?</h2>
                  <button type="button" className="report-lookup-link" onClick={() => setIsReportLookupOpen(true)}>Consultar por folio →</button>
                </article>
                <article className="report-create-card">
                  <h2>Reportar de forma anónima</h2>
                  <button type="button" className="report-create-link" onClick={() => setIsReportModalOpen(true)}>Ir al formulario →</button>
                </article>
              </div>
            </section>

            <section id="contacto" className="cta-contact-section">
              <div className="container">
                <h2>¿Necesitas Orientación?</h2>
                <form className="contact-form" onSubmit={handleOrientationRequestSubmit}>
                  <div className="form-group">
                    <input type="text" name="name" placeholder="Tu Nombre o Alias (Opcional)" maxLength="120" />
                    <input type="email" name="email" placeholder="Correo electrónico de contacto" maxLength="254" required />
                    <input type="tel" name="phone" placeholder="Teléfono (Opcional)" maxLength="10" value={orientationPhone} onChange={(e) => setOrientationPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
                  </div>
                  <textarea name="message" placeholder="Cuéntanos cómo podemos ayudarte..." rows="4" maxLength="3000" required />
                  {orientationRequestError && <p className="contact-form-message is-error">{orientationRequestError}</p>}
                  {orientationRequestNotice && <p className="contact-form-message is-success">{orientationRequestNotice}</p>}
                  <button type="submit" className="btn-primary" disabled={isSendingOrientationRequest}>
                    {isSendingOrientationRequest ? 'Enviando…' : 'Enviar Mensaje'}
                  </button>
                </form>
              </div>
            </section>
          </>
        )
    }
  }

  return (
    <div className="nebula-app" data-page={activePage} data-menu-open={isMobileMenuOpen} data-dialog-open={isReportModalOpen || isReportLookupOpen || isAssessmentModalOpen}>
      {!isAdminPage && (
        <header className="header">
          <div className="container header-container">
            <a href="#inicio" className="logo" onClick={(e) => { e.preventDefault(); navigateHome() }}>
              <span className="logo-icon"><img src={logo} alt="Logo Nebula" /></span>
              <span className="logo-text">NEBULA</span>
            </a>
            <nav className="nav" aria-label="Navegación principal">
              <a href="#inicio" className="nav-link" onClick={(e) => { e.preventDefault(); navigateHome() }}>Inicio</a>
              <a href="#pilares" className="nav-link" onClick={(e) => { e.preventDefault(); navigateToSection('pilares') }}>Pilares</a>
              <a href="#servicios" className="nav-link" onClick={(e) => { e.preventDefault(); navigateToSection('servicios') }}>Recursos</a>
              <a href="#socios" className="nav-link" onClick={(e) => { e.preventDefault(); navigateToPage('socios') }}>Socios</a>
              <button type="button" className="nav-link" onClick={openAssessment}>Autoevaluación</button>
              <a href="#login-admin" className="nav-link nav-admin-link" onClick={(e) => { e.preventDefault(); navigateToPage('login-admin') }}>Admin</a>
              <button type="button" className="nav-link theme-toggle" onClick={() => setIsDarkMode((m) => !m)}>
                <span aria-hidden="true">{isDarkMode ? '☀' : '☾'}</span>
              </button>
            </nav>
            <button type="button" className="header-report-button" onClick={() => setIsReportModalOpen(true)}>Reportar</button>
            <a className="mobile-quick-exit" href={quickExitUrl} onClick={(e) => { e.preventDefault(); window.location.replace(quickExitUrl) }}>Salir rápido</a>
            <button ref={mobileMenuToggleRef} type="button" className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen((o) => !o)}>
              <span aria-hidden="true">{isMobileMenuOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </header>
      )}

      <main id="nebula-main-content">{renderPage()}</main>

      {isReportModalOpen && <ReporteModal onClose={() => setIsReportModalOpen(false)} />}
      {isReportLookupOpen && <ConsultaReporteModal onClose={() => setIsReportLookupOpen(false)} />}
      {isAssessmentModalOpen && (
        <Autoevaluacion
          onClose={() => setIsAssessmentModalOpen(false)}
          onFindSupport={() => { setIsAssessmentModalOpen(false); navigateToPage('centros') }}
        />
      )}

      {!isAdminPage && (
        <footer className="footer">
          <div className="container footer-bottom">
            <p>&copy; 2026 Nebula Project. Todos los derechos reservados. Espacio seguro y confidencial.</p>
          </div>
        </footer>
      )}
    </div>
  )
}

export default App