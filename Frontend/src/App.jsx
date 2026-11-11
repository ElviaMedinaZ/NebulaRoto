import { useEffect, useRef, useState } from 'react'

import { getAdminSession, logoutAdmin } from './adminAuthApi.js'

import './App.css'

import LineaEscucha from './LineasEscucha.jsx'

import CentrosAyuda from './CentrosAyuda.jsx'

import ModulosPreventivos from './ChatGlogal.jsx'

import RutasLegales from './RecursosOrientacion.jsx'

import AdminDashboard from './Admin.jsx';

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

// Ajustes responsivos integrales del frontend público y administrativo.
import './NebulaMobile.css'



// Configuración de accesos directos que se muestran en la portada.

// Acciones rápidas que aparecen en la home y llevan a cada sección principal de la app.

const quickActions = [

  {

    title: 'Centros de ayuda',

    description: 'Encuentra instituciones y refugios cercanos.',

    icon: '📍',

    page: 'centros',

  },

  {

    title: 'Chat global de acompañamiento',

    description: 'Participa en una conversación comunitaria abierta. No compartas datos personales.',

    icon: '💬',

    page: 'modulos',

  },

  {

    title: 'Recursos de orientación',

    description: 'Accede a información confiable, multimedia y contactos profesionales.',

    icon: '📚',

    page: 'rutas',

  },

]



// Fragmentos que representan pantallas completas y secciones de la portada.

const pageRoutes = [

  'linea',

  'centros',

  'modulos',

  'rutas',

  'login',

  'login-admin',

  'signup-admin',

  'socios',

  'ia',

]



const homeSections = ['inicio', 'pilares', 'nosotros', 'servicios', 'proceso', 'contacto']



// Destino que abre el botón de salida rápida para cambiar de página de inmediato.

const quickExitUrl = 'https://www.shein.com.mx/'



// Textos que se alternan en el globo junto al acceso flotante de IA.

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

          <p>

            Elige un nivel para conocer ejemplos de conductas y recomendaciones de apoyo.

            Ninguna forma de violencia es tu culpa.

          </p>

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

                <button type="button" onClick={() => onNavigateToPage('linea')}>

                  Hablar con alguien

                </button>

                <button type="button" onClick={() => onNavigateToPage('centros')}>

                  Ver centros de ayuda

                </button>

              </div>

            </aside>

          </div>



          <p className="violentometro-note">

            Esta guía es informativa y no sustituye una valoración profesional. La violencia

            puede presentarse de distintas maneras; puedes pedir apoyo en cualquier momento.

          </p>

        </div>

      </div>

    </section>

  )

}



// Interpreta el fragmento de URL para recuperar la pantalla o sección activa.

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



// Componente principal de Nebula. Gestiona la navegación entre secciones,

// la vista de inicio y la renderización de pantallas internas.

function App() {

  // Estado compartido de navegación, apariencia, ventanas modales y sesión administrativa.

  const [activePage, setActivePage] = useState(() => getRouteFromHash().page)

  const [activeSection, setActiveSection] = useState(() => getRouteFromHash().section)

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const mobileMenuToggleRef = useRef(null)

  const mobileNavigationRef = useRef(null)

  const [isDarkMode, setIsDarkMode] = useState(

    () => window.localStorage.getItem('nebula-theme') === 'dark',

  )

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

  const [isCheckingAdminSession, setIsCheckingAdminSession] = useState(

    () => getRouteFromHash().page === 'admin',

  )

  const [adminSessionError, setAdminSessionError] = useState('')



  // Identifica si estamos en la vista de administración o autenticación administrativa

  const isAdminPage = ['admin', 'login-admin', 'signup-admin'].includes(activePage)



  // Confirma en el backend que la cookie corresponde a una sesión administrativa vigente.

  useEffect(() => {

    if (activePage !== 'admin' || isAdminAuthenticated) return undefined



    let isCurrent = true

    getAdminSession()

      .then(() => {

        if (isCurrent) setIsAdminAuthenticated(true)

      })

      .catch((error) => {

        if (isCurrent && error.message !== 'Inicia sesión para continuar.' && !error.message.includes('sesión expiró')) {

          setAdminSessionError(error.message)

        }

      })

      .finally(() => {

        if (isCurrent) setIsCheckingAdminSession(false)

      })



    return () => {

      isCurrent = false

    }

  }, [activePage, isAdminAuthenticated])



  // Aplica el tema seleccionado y lo conserva para la próxima visita.

  useEffect(() => {

    const theme = isDarkMode ? 'dark' : 'light'

    document.documentElement.dataset.theme = theme

    window.localStorage.setItem('nebula-theme', theme)

  }, [isDarkMode])



  // Mantiene la vista sincronizada con los botones atrás/adelante y los cambios del hash.

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



  // Alterna mensajes breves de bienvenida y limpia los temporizadores al desmontar.

  useEffect(() => {

    let showTimer

    let hideTimer

    let lastMessageIndex = -1



    const scheduleMessage = () => {

      showTimer = window.setTimeout(() => {

        let nextMessageIndex

        do {

          nextMessageIndex = Math.floor(Math.random() * aiMessages.length)

        } while (nextMessageIndex === lastMessageIndex)



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



  // Anima el parpadeo del avatar de IA en intervalos variables.

  useEffect(() => {

    let blinkTimer

    let openEyesTimer



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



  // El menú móvil se cierra con Escape y no permite desplazar el contenido del fondo.
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
    const handleResize = () => {
      if (window.innerWidth > 768) setIsMobileMenuOpen(false)
    }

    window.addEventListener('keydown', handleEscape)
    window.addEventListener('resize', handleResize)
    mobileNavigationRef.current?.querySelector('button')?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('resize', handleResize)
    }
  }, [isMobileMenuOpen])

  // Desplaza hasta la sección seleccionada después de navegar dentro de la portada.

  useEffect(() => {

    if (activePage !== 'home' || !activeSection) return



    document.getElementById(activeSection)?.scrollIntoView({ behavior: 'smooth' })

  }, [activePage, activeSection])



  // Al abrir una pantalla interna, vuelve al inicio de la página.

  useEffect(() => {

    if (activePage !== 'home') {

      window.scrollTo({ top: 0, behavior: 'auto' })

    }

  }, [activePage])



  // Actualiza el hash sin recargar el documento.

  const updateLocation = (fragment) => {

    if (window.location.hash !== `#${fragment}`) {

      window.history.pushState(null, '', `#${fragment}`)

    }

  }



  // Actualiza URL y estado para cambiar de pantalla sin recargar la aplicación.

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



  // Completa el inicio de sesión tras una respuesta exitosa del servidor.

  const completeAdminAuthentication = () => {

    setAdminSessionError('')

    setIsAdminAuthenticated(true)

    navigateToPage('admin')

    setIsCheckingAdminSession(false)

  }



  // Elimina la sesión del servidor antes de regresar a la pantalla de acceso.

  const handleAdminLogout = async () => {

    await logoutAdmin()

    setIsAdminAuthenticated(false)

    navigateToPage('login-admin')

  }



  // Decide qué pantalla mostrar; el caso por defecto compone las secciones de la portada.

  const renderPage = () => {

    switch (activePage) {

      case 'linea':

        return <LineaEscucha />

      case 'centros':

        return <CentrosAyuda />

      case 'modulos':

        return <ModulosPreventivos />

      case 'rutas':

        return <RutasLegales />

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

      case 'socios':
        return <Socios />

      case 'ia':
        return <IA />

      case 'home':
        /* fallthrough */

      default:

        return (

          <>

            {/* Presentación principal y acceso inicial a la autoevaluación. */}

            <section id="inicio" className="hero-section">

              <div className="container hero-content">

                <div className="hero-copy">

                  <span className="eyebrow">Un lugar para entender y orientarte</span>

                  <h1>Tu bienestar <span>también importa.</span></h1>

                  <p>

                    Información, orientación y herramientas para reconocer señales de violencia

                    y buscar apoyo. A tu ritmo, con privacidad y sin juicios.

                  </p>



                  <div className="hero-buttons">

                    <button type="button" className="btn-primary" onClick={openAssessment}>

                      Realizar autoevaluación <span aria-hidden="true">→</span>

                    </button>

                    <button type="button" className="btn-secondary desktop-about-button" onClick={() => navigateToSection('nosotros')}>

                      Conocer NEBULA

                    </button>

                    <button type="button" className="btn-secondary mobile-help-button" onClick={() => navigateToPage('centros')}>

                      Encontrar ayuda

                    </button>

                  </div>



                  <div className="hero-privacy-note">

                    <span aria-hidden="true">♧</span>

                    <span>No necesitas crear una cuenta para comenzar.</span>

                  </div>

                </div>



                {/* Accesos urgentes más visibles, solo en pantallas móviles. */}
                <section className="mobile-shortcuts" aria-labelledby="mobile-shortcuts-title">
                  <h2 id="mobile-shortcuts-title">Accesos rápidos</h2>
                  <div className="mobile-shortcuts-grid">
                  <button type="button" onClick={() => navigateToPage('centros')}>
                    <span aria-hidden="true">📍</span>Centros de ayuda
                  </button>
                  <button type="button" onClick={() => navigateToPage('linea')}>
                    <span aria-hidden="true">☎</span>Líneas de escucha
                  </button>
                  <button type="button" onClick={() => setIsReportModalOpen(true)}>
                    <span aria-hidden="true">✎</span>Crear reporte
                  </button>
                  <button type="button" onClick={() => setIsReportLookupOpen(true)}>
                    <span aria-hidden="true">⌕</span>Consultar folio
                  </button>
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

                    <div className="assessment-progress-labels">

                      <span>Tu espacio es privado</span>

                      <span>Matriz oficial</span>

                    </div>

                    <div className="assessment-progress" aria-hidden="true"><span /></div>

                    <p className="assessment-prompt">A veces, lo que vivimos puede ser difícil de nombrar.</p>

                    <p className="assessment-disclaimer">Esta herramienta utiliza una matriz de riesgo oficial para orientarte. No es un diagnóstico.</p>

                    <button type="button" className="assessment-start" onClick={openAssessment}>

                      Comenzar con calma <span aria-hidden="true">→</span>

                    </button>

                  </div>

                </div>

              </div>

            </section>



            {/* Principios de la plataforma y resumen de sus áreas de trabajo. */}

            <section id="pilares" className="advantages-section">

              <div className="container">

                <h2>Nuestros Pilares</h2>

                <p className="section-subtitle">

                  Principios fundamentales para garantizar un entorno seguro, informado y accesible.

                </p>

                <div className="advantages-grid">

                  <div className="advantage-card">

                    <div className="card-icon">🛡️</div>

                    <h3>Confidencialidad</h3>

                    <p>Espacios seguros y canales protegidos para salvaguardar tu privacidad en todo momento.</p>

                  </div>

                  <div className="advantage-card">

                    <div className="card-icon">🤝</div>

                    <h3>Red de Apoyo</h3>

                    <p>Conexión directa con organizaciones, colectivos y profesionales especializados.</p>

                  </div>

                  <div className="advantage-card">

                    <div className="card-icon">📚</div>

                    <h3>Educación y Guías</h3>

                    <p>Recursos claros para identificar señales de alerta y comprender los tipos de violencia.</p>

                  </div>

                  <div className="advantage-card">

                    <div className="card-icon">⚖️</div>

                    <h3>Orientación Legal</h3>

                    <p>Información clara sobre tus derechos y los pasos legales disponibles a tu alcance.</p>

                  </div>

                  <div className="advantage-card">

                    <div className="card-icon">💡</div>

                    <h3>Concientización</h3>

                    <p>Campañas activas para transformar la cultura y prevenir la violencia desde la raíz.</p>

                  </div>

                </div>

              </div>

            </section>



            {/* Descripción del proyecto y métricas ilustrativas de sus servicios. */}

            <section id="nosotros" className="about-section">

              <div className="container about-grid">

                <div className="about-text">

                  <h2>Sobre el Proyecto Nebula</h2>

                  <p>

                    Nebula nace como una plataforma integral de tecnología social orientada a visibilizar,

                    prevenir y erradicar la violencia hacia la mujer. Creemos firmemente que la información

                    accesible y oportuna salva vidas.

                  </p>

                  <p>

                    Nuestra misión es conectar a quienes necesitan orientación con herramientas claras,

                    centros de atención psicológica y jurídica, y una comunidad informada que promueve el

                    respeto y la equidad.

                  </p>

                </div>



                <div className="about-stats-graphic">

                  <div className="stat-bar-container">

                    <span>Orientación Preventiva (85%)</span>

                    <div className="progress-bar"><div className="progress-fill" style={{ width: '85%' }} /></div>

                  </div>

                  <div className="stat-bar-container">

                    <span>Atención Psicológica (70%)</span>

                    <div className="progress-bar"><div className="progress-fill" style={{ width: '70%' }} /></div>

                  </div>

                  <div className="stat-bar-container">

                    <span>Asesoría Jurídica (60%)</span>

                    <div className="progress-bar"><div className="progress-fill" style={{ width: '60%' }} /></div>

                  </div>

                  <div className="stat-bar-container">

                    <span>Canalización Efectiva (90%)</span>

                    <div className="progress-bar"><div className="progress-fill" style={{ width: '90%' }} /></div>

                  </div>

                </div>

              </div>

            </section>



            {/* Accesos a pantallas de recursos y a contenido preventivo. */}

            <section className="quick-actions-section" id="servicios">

              <div className="container">

                <h2>Nuestros servicios y recursos</h2>

                <p className="section-subtitle">Herramientas diseñadas para ofrecer soporte integral y oportuno.</p>



                <div className="quick-actions-grid">

                  {quickActions.map((action) => (

                    <a

                      key={action.title}

                      className="quick-action-card"

                      href="#"

                      onClick={(e) => {

                        e.preventDefault();

                        navigateToPage(action.page)

                      }}

                      aria-label={action.title}

                    >

                      <div className="quick-action-media" role="img" aria-label={`${action.title} imagen`}>

                        <span>{action.icon}</span>

                      </div>

                      <div className="quick-action-body">

                        <h3>{action.title}</h3>

                        <p>{action.description}</p>

                      </div>

                    </a>

                  ))}

                </div>

              </div>

            </section>



            {/* Guía visual con pasos introductorios para reconocer situaciones de riesgo. */}

            <section id="proceso" className="process-section">

              <div className="container">

                <h2>Razones de alerta</h2>

                <p className="section-subtitle">Conoce las señales de alerta y cómo identificar situaciones de riesgo.</p>

                <div className="process-steps">

                  <div className="step-item">

                    <div className="step-number">1</div>

                    <h3>Tipos de violencia</h3>

                    <p>Conoce como puede manifestarse la violencia en distintos espacios y relaciones</p>

                  </div>

                  <div className="step-item">

                    <div className="step-number">2</div>

                    <h3>Señales de alerta </h3>

                    <p>Identifica comportamientos que merecen atencion sinm juicios ni etiquetas</p>

                  </div>

                  <div className="step-item">

                    <div className="step-number">3</div>

                    <h3>Situaciones cotidianas</h3>

                    <p>Explora ejemplos y encuentra palabras para lo que estas viviendo</p>

                  </div>

                  <div className="step-item">

                    <div className="step-number">4</div>

                    <h3>Violentometro</h3>

                    <p>Una guia visual para reconocer niveles de riesgo y buscar orientacion</p>

                  </div>

                </div>

              </div>

            </section>



            <Violentometro onNavigateToPage={navigateToPage} />



            {/* Indicadores ilustrativos sobre los servicios y su alcance. */}

            <section className="skills-section">

              <div className="container">

                <h2>Impacto y Alcance de Nebula</h2>

                <p className="section-subtitle">Nuestro compromiso medido en resultados y apoyo comunitario.</p>

                <div className="skills-grid">

                  <div className="skill-circle">

                    <div className="circle-progress p-92"><span>92%</span></div>

                    <h4>Canalización Exitosa</h4>

                  </div>

                  <div className="skill-circle">

                    <div className="circle-progress p-88"><span>88%</span></div>

                    <h4>Satisfacción de Apoyo</h4>

                  </div>

                  <div className="skill-circle">

                    <div className="circle-progress p-95"><span>95%</span></div>

                    <h4>Información Verificada</h4>

                  </div>

                  <div className="skill-circle">

                    <div className="circle-progress p-99"><span>99%</span></div>

                    <h4>Confidencialidad</h4>

                  </div>

                </div>

              </div>

            </section>

            {/* Accesos a los formularios de creación y consulta de reportes anónimos. */}

            <section className="report-lookup-section" aria-labelledby="report-lookup-title">

              <div className="container report-lookup-grid">

                <article className="report-lookup-card">

                  <span className="report-lookup-icon" aria-hidden="true">▣</span>

                  <h2 id="report-lookup-title">¿Deseas consultar tu reporte?</h2>

                  <p>

                    Introduce tu folio único para conocer el estatus actual de tu seguimiento

                    de forma completamente anónima.

                  </p>

                  <button

                    type="button"

                    className="report-lookup-link"

                    onClick={() => setIsReportLookupOpen(true)}

                  >

                    Consultar por folio <span aria-hidden="true">→</span>

                  </button>

                </article>

                <article className="report-create-card">

                  <span className="report-create-eyebrow">También puedes</span>

                  <h2>Reportar de forma anónima</h2>

                  <p>

                    No necesitas crear una cuenta. Tu privacidad importa.

                  </p>

                  <button

                    type="button"

                    className="report-create-link"

                    onClick={() => setIsReportModalOpen(true)}

                  >

                    Ir al formulario <span aria-hidden="true">→</span>

                  </button>

                </article>

              </div>

            </section>

            {/* Formulario de contacto visual y datos institucionales mostrados en portada. */}

            <section id="contacto" className="cta-contact-section">

              <div className="container">

                <h2>¿Necesitas Orientación?</h2>

                <p>

                  Escríbenos para recibir información sobre centros de ayuda, o para colaborar con nuestra

                  iniciativa comunitaria.

                </p>



                <form className="contact-form" onSubmit={handleOrientationRequestSubmit}>

                  <div className="form-group">

                    <input

                      type="text"

                      name="name"

                      placeholder="Tu Nombre o Alias (Opcional)"

                      aria-label="Tu nombre o alias (opcional)"

                      maxLength="120"

                    />

                    <input

                      type="email"

                      name="email"

                      placeholder="Correo electrónico de contacto"

                      aria-label="Correo electrónico de contacto"

                      maxLength="254"

                      required

                    />

                    <input

                      type="tel"

                      name="phone"

                      placeholder="Teléfono (Opcional)"

                      aria-label="Teléfono (opcional)"

                      inputMode="numeric"

                      pattern="[0-9]{10}"

                      title="Ingresa exactamente 10 dígitos numéricos."

                      maxLength="10"

                      value={orientationPhone}

                      onChange={(event) => setOrientationPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}

                    />

                  </div>

                  <textarea

                    name="message"

                    placeholder="Cuéntanos cómo podemos ayudarte o qué información necesitas..."

                    aria-label="Mensaje"

                    rows="4"

                    maxLength="3000"

                    required

                  />

                  {orientationRequestError && <p className="contact-form-message is-error" role="alert">{orientationRequestError}</p>}

                  {orientationRequestNotice && <p className="contact-form-message is-success" role="status">{orientationRequestNotice}</p>}

                  <button type="submit" className="btn-primary" disabled={isSendingOrientationRequest}>

                    {isSendingOrientationRequest ? 'Enviando…' : 'Enviar Mensaje'}

                  </button>

                </form>

              </div>

            </section>



            <section className="contacts-info-section">

              <div className="container contacts-info-grid">

                <div>

                  <p>📍 Cobertura y Centros Aliados en Baja California Sur y México</p>

                </div>

                <div>

                  <p>📞 Línea Nacional de Ayuda: 800-108-4053</p>

                </div>

                <div>

                  <p>✉️ contacto\@proyecto-nebula.org</p>

                </div>

              </div>

            </section>

          </>

        )

    }

  }



  return (

    <div className="nebula-app" data-page={activePage} data-menu-open={isMobileMenuOpen} data-dialog-open={isReportModalOpen || isReportLookupOpen || isAssessmentModalOpen}>

      {/* Se oculta el encabezado global en las páginas administrativas */}

      {!isAdminPage && (

        <header className="header">

          <div className="container header-container">

            <a href="#inicio" className="logo" onClick={(e) => { e.preventDefault(); navigateHome() }} aria-label="Ir a la página principal">

              <span className="logo-icon">

                <img src={logo} alt="Logo Nebula" />

              </span>

              <span className="logo-text">NEBULA</span>

            </a>



            <nav className="nav" aria-label="Navegación principal">

              <a href="#inicio" className="nav-link" onClick={(e) => { e.preventDefault(); navigateHome() }}>Inicio</a>

              <a href="#pilares" className="nav-link" onClick={(e) => { e.preventDefault(); navigateToSection('pilares') }}>Pilares</a>

              <a href="#servicios" className="nav-link" onClick={(e) => { e.preventDefault(); navigateToSection('servicios') }}>Recursos</a>

              <a href="#socios" className="nav-link" onClick={(e) => { e.preventDefault(); navigateToPage('socios') }}>Socios</a>

              <button type="button" className="nav-link" onClick={openAssessment}>Autoevaluación</button>

              <a href="#login-admin" className="nav-link nav-admin-link" onClick={(e) => { e.preventDefault(); navigateToPage('login-admin') }}>Admin</a>

              <button

                type="button"

                className="nav-link theme-toggle"

                onClick={() => setIsDarkMode((currentMode) => !currentMode)}

                aria-label={`Activar modo ${isDarkMode ? 'claro' : 'oscuro'}`}

                aria-pressed={isDarkMode}

                title={`Activar modo ${isDarkMode ? 'claro' : 'oscuro'}`}

              >

                <span aria-hidden="true">{isDarkMode ? '☀' : '☾'}</span>

              </button>

            </nav>

            <button type="button" className="header-report-button" onClick={() => setIsReportModalOpen(true)}>

              Reportar

            </button>



            <a

              className="mobile-quick-exit"

              href={quickExitUrl}

              onClick={(event) => {

                event.preventDefault()

                window.location.replace(quickExitUrl)

              }}

              aria-label="Salida rápida: abrir un sitio neutral"

            >

              Salir rápido

            </a>

            <button

              ref={mobileMenuToggleRef}

              type="button"

              className="mobile-menu-toggle"

              aria-expanded={isMobileMenuOpen}

              aria-controls="nebula-mobile-navigation"

              onClick={() => setIsMobileMenuOpen((open) => !open)}

            >

              <span aria-hidden="true">{isMobileMenuOpen ? '✕' : '☰'}</span>

              <span>{isMobileMenuOpen ? 'Cerrar' : 'Menú'}</span>

            </button>



            {!['admin', 'login-admin', 'signup-admin', 'ia'].includes(activePage) && (

              <div className="header-ai">

                {aiMessage && (

                  <button

                    type="button"

                    className="ai-message"

                    onClick={() => navigateToPage('ia')}

                    aria-label={`Abrir IA: ${aiMessage}`}

                    aria-live="polite"

                  >

                    {aiMessage}

                  </button>

                )}

                <button

                  type="button"

                  className="ai-evaluation-button"

                  onClick={() => navigateToPage('ia')}

                  aria-label="Abrir evaluación de IA"

                >

                  <img

                    src={isAiBlinking ? miImagenParpadeo : miImagen}

                    alt="Evaluación de IA"

                  />

                </button>

              </div>

            )}

          </div>



          <nav

            id="nebula-mobile-navigation"

            ref={mobileNavigationRef}

            className="mobile-nav"

            aria-label="Navegación móvil"

            hidden={!isMobileMenuOpen}

          >

            <div className="mobile-nav-inner">

              <button type="button" className="mobile-nav-link" onClick={navigateHome}>Inicio</button>

              <p className="mobile-nav-heading">Herramientas y ayuda</p>

              <button type="button" className="mobile-nav-link" onClick={openAssessment}>Autoevaluación</button>

              <button type="button" className="mobile-nav-link" onClick={() => navigateToPage('centros')}>Centros de ayuda</button>

              <button type="button" className="mobile-nav-link" onClick={() => navigateToPage('linea')}>Líneas de escucha</button>

              <button type="button" className="mobile-nav-link" onClick={() => navigateToPage('rutas')}>Recursos de orientación</button>

              <button type="button" className="mobile-nav-link" onClick={() => navigateToPage('modulos')}>Chat global</button>

              <button type="button" className="mobile-nav-link" onClick={() => navigateToPage('ia')}>Asistente Kara</button>

              <p className="mobile-nav-heading">Reportes</p>

              <button type="button" className="mobile-nav-link" onClick={() => { setIsMobileMenuOpen(false); setIsReportModalOpen(true) }}>Crear reporte anónimo</button>

              <button type="button" className="mobile-nav-link" onClick={() => { setIsMobileMenuOpen(false); setIsReportLookupOpen(true) }}>Consultar por folio</button>

              <p className="mobile-nav-heading">Más opciones</p>

              <button type="button" className="mobile-nav-link" onClick={() => navigateToSection('pilares')}>Nuestros pilares</button>

              <button type="button" className="mobile-nav-link" onClick={() => navigateToSection('nosotros')}>Conocer Nebula</button>

              <button type="button" className="mobile-nav-link" onClick={() => navigateToPage('socios')}>Socios</button>

              <button type="button" className="mobile-nav-link" onClick={() => { setIsDarkMode((dark) => !dark); setIsMobileMenuOpen(false) }}>

                Cambiar a modo {isDarkMode ? 'claro' : 'oscuro'}

              </button>

              <button type="button" className="mobile-nav-link" onClick={() => navigateToPage('login-admin')}>Administración</button>

            </div>

          </nav>

        </header>

      )}



      {isMobileMenuOpen && (

        <button

          type="button"

          className="mobile-menu-scrim"

          aria-label="Cerrar menú de navegación"

          tabIndex={-1}

          onClick={() => {

            setIsMobileMenuOpen(false)

            mobileMenuToggleRef.current?.focus()

          }}

        />

      )}



      <main id="nebula-main-content">{renderPage()}</main>



      {isReportModalOpen && <ReporteModal onClose={() => setIsReportModalOpen(false)} />}



      {isReportLookupOpen && <ConsultaReporteModal onClose={() => setIsReportLookupOpen(false)} />}



      {isAssessmentModalOpen && (

        <Autoevaluacion

          onClose={() => setIsAssessmentModalOpen(false)}

          onFindSupport={() => {

            setIsAssessmentModalOpen(false)

            navigateToPage('centros')

          }}

        />

      )}



      {/* Se oculta el footer global en las páginas administrativas */}

      {!isAdminPage && (

        <footer className="footer">

          <div className="container footer-grid">

            <div className="footer-col">

              <h3>

                <img src={logo} alt="Logo Nebula" className="footer-logo-icon" />

                <span>NEBULA</span>

              </h3>

              <p>Sistema de prevención, concientización y apoyo contra la violencia hacia la mujer.</p>

            </div>

            <div className="footer-col">

              <h4>Secciones</h4>

              <ul>

                <li><a href="#inicio" onClick={(e) => { e.preventDefault(); navigateToSection('inicio') }}>Inicio</a></li>

                <li><a href="#pilares" onClick={(e) => { e.preventDefault(); navigateToSection('pilares') }}>Pilares</a></li>

                <li><a href="#nosotros" onClick={(e) => { e.preventDefault(); navigateToSection('nosotros') }}>Sobre el Proyecto</a></li>

                <li><a href="#servicios" onClick={(e) => { e.preventDefault(); navigateToSection('servicios') }}>Servicios</a></li>

              </ul>

            </div>

            <div className="footer-col">

              <h4>Recursos Útiles</h4>

              <ul>

                <li><a href="#centros" onClick={(e) => { e.preventDefault(); navigateToPage('centros') }}>Centros de Atención</a></li>

                <li><a href="#rutas" onClick={(e) => { e.preventDefault(); navigateToPage('rutas') }}>Recursos de orientacion</a></li>

                <li><a href="#linea" onClick={(e) => { e.preventDefault(); navigateToPage('linea') }}>Líneas de Emergencia</a></li>

              </ul>

            </div>

            <div className="footer-col">

              <h4>Emergencias</h4>

              <ul>

                <li><a href="tel:911">Emergencias Nacionales: 911</a></li>

                <li><a href="tel:075">Línea Mujeres: 075</a></li>

              </ul>

            </div>

          </div>

          <div className="footer-bottom">

            <p>&copy; 2026 Nebula Project. Todos los derechos reservados. Espacio seguro y confidencial.</p>

          </div>

        </footer>

      )}



      {/* Se oculta el botón flotante de salida rápida/pánico en las páginas administrativas */}

      {!isAdminPage && (

        <a

          className="panic-button"

          href={quickExitUrl}

          onClick={(event) => {

            event.preventDefault()

            window.location.replace(quickExitUrl)

          }}

          aria-label="Salida rápida: abrir un sitio neutral"

        >

          <span className="panic-icon">🚨</span>

          <span className="panic-text">SALIR</span>

        </a>

      )}

    </div>

  )

}

export default App