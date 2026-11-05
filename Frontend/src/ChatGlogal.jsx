
import { useEffect, useRef, useState } from 'react'
import './ChatGlogal.css'
import { API_URL } from './apiUrl.js'

const chatUrl = `${API_URL}/api/chat`
const firstNames = ['Luna', 'Nube', 'Sol', 'Brisa', 'Estrella', 'Aurora', 'Mar', 'Violeta']
const secondNames = ['Serena', 'Valiente', 'Amable', 'Libre', 'Dorada', 'Tranquila', 'Cercana', 'Brillante']

function createNickname() {
  const values = new Uint32Array(3)
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(values)
  } else {
    values[0] = Math.floor(Math.random() * 0xffffffff)
    values[1] = Math.floor(Math.random() * 0xffffffff)
    values[2] = Math.floor(Math.random() * 0xffffffff)
  }

  return [
    firstNames[values[0] % firstNames.length],
    secondNames[values[1] % secondNames.length],
    String(values[2] % 10000).padStart(4, '0'),
  ].join(' ')
}

function getSessionNickname() {
  try {
    const storedNickname = window.sessionStorage.getItem('nebula-chat-nickname')
    if (storedNickname) return storedNickname

    const nickname = createNickname()
    window.sessionStorage.setItem('nebula-chat-nickname', nickname)
    return nickname
  } catch {
    return createNickname()
  }
}

function getInitials(nickname) {
  return nickname
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function getMessageTime(createdAt) {
  const timestamp = new Date(createdAt)
  if (Number.isNaN(timestamp.getTime())) return 'Hora no disponible'
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp)
}

function getAvatarColor(nickname) {
  const colors = ['rose', 'lilac', 'peach']
  const hash = [...nickname].reduce((total, character) => total + character.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function ChatGlobal() {
  const [nickname] = useState(getSessionNickname)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [notice, setNotice] = useState('')
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [isSending, setIsSending] = useState(false)
  const messageListRef = useRef(null)
  const shouldStickToBottomRef = useRef(true)
  const [showNewMessages, setShowNewMessages] = useState(false)

  useEffect(() => {
    const stream = new EventSource(`${chatUrl}/stream`)

    stream.onopen = () => setConnectionStatus('connected')
    stream.onerror = () => {
      setConnectionStatus(stream.readyState === EventSource.CONNECTING ? 'reconnecting' : 'disconnected')
    }
    stream.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        if (!message || !['string', 'number'].includes(typeof message.id) ||
            typeof message.nickname !== 'string' || typeof message.text !== 'string' ||
            !Number.isFinite(Date.parse(message.createdAt))) {
          throw new Error('Formato de mensaje inválido')
        }
        const messageList = messageListRef.current
        const isNearBottom = !messageList ||
          messageList.scrollHeight - messageList.scrollTop - messageList.clientHeight < 110
        shouldStickToBottomRef.current = isNearBottom
        if (!isNearBottom) setShowNewMessages(true)
        setMessages((currentMessages) => {
          if (currentMessages.some((currentMessage) => currentMessage.id === message.id)) {
            return currentMessages
          }
          return [...currentMessages, message]
            .sort((first, second) => new Date(first.createdAt) - new Date(second.createdAt))
            .slice(-500)
        })
      } catch (error) {
        console.error('No se pudo interpretar un mensaje recibido del chat.', error)
        setNotice('No se pudo mostrar un mensaje recibido. La conexión seguirá activa.')
      }
    }

    return () => stream.close()
  }, [])

  useEffect(() => {
    const messageList = messageListRef.current
    if (messageList && shouldStickToBottomRef.current) {
      messageList.scrollTo({ top: messageList.scrollHeight, behavior: 'auto' })
    }
  }, [messages])

  useEffect(() => {
    const expiryCheck = window.setInterval(() => {
      const oldestVisibleTimestamp = Date.now() - 24 * 60 * 60 * 1000
      setMessages((currentMessages) => currentMessages.filter(
        (message) => new Date(message.createdAt).getTime() > oldestVisibleTimestamp,
      ))
    }, 30000)

    return () => window.clearInterval(expiryCheck)
  }, [])

  const sendMessage = async (event) => {
    event.preventDefault()
    const text = draft.trim()

    if (!text) {
      setNotice('Escribe un mensaje antes de enviarlo.')
      return
    }

    setIsSending(true)
    setNotice('')

    try {
      const response = await fetch(`${chatUrl}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, text }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'No se pudo enviar el mensaje. Inténtalo de nuevo.')
      }

      setDraft('')
    } catch (error) {
      console.error('No se pudo enviar el mensaje al chat global.', error)
      setNotice(error.message || 'No se pudo enviar el mensaje. Inténtalo de nuevo.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="global-chat-page">
      <section className="gc-intro">
        <div className="gc-container gc-intro-content">
          <div>
            <span className="gc-eyebrow">
              <span aria-hidden="true">✦</span>
              Comunidad Nebula
            </span>
            <h1>Un espacio para <span>escucharnos.</span></h1>
            <p>
              Comparte, acompaña y encuentra otras voces en una conversación abierta y respetuosa.
            </p>
          </div>
          <div className="gc-intro-art" aria-hidden="true">
            <span className="gc-art-bubble gc-art-bubble-one">♡</span>
            <span className="gc-art-bubble gc-art-bubble-two">✦</span>
            <span className="gc-art-center">N</span>
          </div>
        </div>
      </section>

      <section className="gc-container gc-main" aria-label="Conversación del chat global">
        <div className="gc-layout">
          <section className="gc-conversation" aria-labelledby="gc-room-title">
            <header className="gc-room-header">
              <div className="gc-room-avatar" aria-hidden="true">
                <span>♡</span>
              </div>
              <div className="gc-room-title">
                <span className="gc-room-kicker">Sala única</span>
                <h2 id="gc-room-title">Chat global</h2>
              </div>
              <span className="gc-room-tag">
                <span className={`gc-connection-dot gc-connection-${connectionStatus}`} aria-hidden="true" />
                {connectionStatus === 'connected'
                  ? 'En vivo'
                  : connectionStatus === 'connecting'
                    ? 'Conectando…'
                    : connectionStatus === 'disconnected'
                      ? 'Sin conexión'
                      : 'Reconectando…'}
              </span>
            </header>

            <div className="gc-demo-notice" role="note">
              <span className="gc-demo-icon" aria-hidden="true">i</span>
              <p>
                Estás como <strong>{nickname}</strong>. No pedimos registro ni datos personales.
                Los mensajes son públicos. Evita compartir datos personales o información que te identifique.
              </p>
            </div>

            <div
              className="gc-message-list"
              aria-live="polite"
              aria-label="Mensajes del chat global"
              ref={messageListRef}
              onScroll={(event) => {
                const list = event.currentTarget
                const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 110
                shouldStickToBottomRef.current = nearBottom
                if (nearBottom) setShowNewMessages(false)
              }}
            >
              <div className="gc-day-divider"><span>Conversación reciente</span></div>
              <div className="gc-welcome">
                <span className="gc-welcome-icon" aria-hidden="true">☀</span>
                <div>
                  <strong>Este espacio también es tuyo</strong>
                  <p>Tu alias temporal es {nickname}. Conversemos con empatía.</p>
                </div>
              </div>

              {messages.length === 0 && (
                <p className="gc-empty-state">
                  {connectionStatus === 'connected'
                    ? 'Aún no hay mensajes recientes. Puedes iniciar la conversación.'
                    : 'Conectando con la sala. En cuanto esté disponible verás los mensajes aquí.'}
                </p>
              )}

              {messages.map((message) => {
                const isMine = message.nickname === nickname
                const color = getAvatarColor(message.nickname)

                return (
                  <article
                    key={message.id}
                    className={`gc-message${isMine ? ' gc-message-mine' : ''}`}
                  >
                    {!isMine && (
                      <div className={`gc-avatar gc-avatar-${color}`} aria-hidden="true">
                        {getInitials(message.nickname)}
                      </div>
                    )}
                    <div className="gc-message-body">
                      <div className="gc-message-meta">
                        <strong>{isMine ? 'Tú · ' : ''}{message.nickname}</strong>
                        <time dateTime={message.createdAt}>{getMessageTime(message.createdAt)}</time>
                      </div>
                      <p className="gc-message-bubble">{message.text}</p>
                    </div>
                    {isMine && (
                      <div className="gc-avatar gc-avatar-mine" aria-hidden="true">
                        {getInitials(message.nickname)}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>

            {showNewMessages && (
              <button
                type="button"
                className="gc-new-messages"
                onClick={() => {
                  const list = messageListRef.current
                  shouldStickToBottomRef.current = true
                  list?.scrollTo({ top: list.scrollHeight, behavior: 'smooth' })
                  setShowNewMessages(false)
                }}
              >
                Ver mensajes nuevos ↓
              </button>
            )}

            <form className="gc-composer" onSubmit={sendMessage}>
              <label className="gc-sr-only" htmlFor="gc-message-input">Escribe tu mensaje</label>
              <textarea
                id="gc-message-input"
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value)
                  if (notice) setNotice('')
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault()
                    event.currentTarget.form.requestSubmit()
                  }
                }}
                placeholder="Escribe algo amable..."
                rows="1"
                maxLength={1000}
                disabled={isSending}
                aria-describedby="gc-composer-hint gc-composer-notice"
              />
              <div className="gc-composer-footer">
                <span id="gc-composer-hint">Cuida tu privacidad: evita compartir datos personales.</span>
                <button type="submit" className="gc-send-button" aria-label="Enviar mensaje" disabled={isSending}>
                  <span>{isSending ? 'Enviando…' : 'Enviar'}</span>
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M3 10h13M10 4l6 6-6 6" />
                  </svg>
                </button>
              </div>
              <span id="gc-composer-notice" className="gc-form-notice" role="status">{notice}</span>
            </form>
          </section>

          <aside className="gc-guidelines" aria-labelledby="gc-guidelines-title">
            <div className="gc-guidelines-heading">
              <span className="gc-guidelines-icon" aria-hidden="true">♡</span>
              <span className="gc-section-label">Entre todas</span>
            </div>
            <h2 id="gc-guidelines-title">Hagamos de este un espacio seguro</h2>
            <p className="gc-guidelines-intro">
              Cada conversación se siente mejor cuando nos tratamos con cuidado.
            </p>
            <ul className="gc-guideline-list">
              <li>
                <span aria-hidden="true">01</span>
                <p>Escucha sin juzgar ni minimizar lo que otra persona siente.</p>
              </li>
              <li>
                <span aria-hidden="true">02</span>
                <p>Comparte solo lo que te haga sentir cómoda.</p>
              </li>
              <li>
                <span aria-hidden="true">03</span>
                <p>No publiques nombres, ubicaciones ni datos personales.</p>
              </li>
            </ul>
            <div className="gc-help-card">
              <span className="gc-help-card-icon" aria-hidden="true">✧</span>
              <strong>¿Necesitas apoyo ahora?</strong>
              <p>Encuentra opciones de orientación y ayuda cerca de ti.</p>
              <a href="#centros">Ver centros de ayuda <span aria-hidden="true">→</span></a>
            </div>
            <p className="gc-emergency">
              Si estás en peligro inmediato, llama al <a href="tel:911">911</a>.
            </p>
          </aside>
        </div>
      </section>
    </div>
  )
}

export default ChatGlobal