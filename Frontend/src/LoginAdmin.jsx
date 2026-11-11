import { useState } from 'react'
import { loginAdmin } from './adminAuthApi.js'

// Formulario de acceso para cuentas institucionales y administrativas de Nebula.
function LoginAdmin({ onBack, onSignup, onAuthenticated, initialError = '' }) {
	// Conserva errores visibles y evita solicitudes duplicadas mientras valida credenciales.
	const [error, setError] = useState(initialError)
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Envía los campos al backend y abre el panel solo si la API confirma el acceso.
	const handleSubmit = async (event) => {
		event.preventDefault()
		setError('')
		setIsSubmitting(true)

		try {
			await loginAdmin(Object.fromEntries(new FormData(event.currentTarget)))
			onAuthenticated()
		} catch (requestError) {
			setError(requestError.message)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="admin-login-page">
			{/* Panel visual que identifica el acceso protegido a Nebula. */}
			<section className="admin-login-visual" aria-label="Inicio de sesión de Nebula">
				<div className="admin-login-orbit orbit-one" />
				<div className="admin-login-orbit orbit-two" />
				<div className="admin-login-visual-content">
					<span className="admin-login-mark">N</span>
					<span className="eyebrow">Zona protegida</span>
					<h1>Gestión que mantiene activa la red de apoyo.</h1>
					<p>
						Inicia sesión con tu cuenta institucional o administrativa para continuar.
					</p>
					<div className="admin-login-status">
						<span className="live-dot" />
						<span>Acceso seguro y confidencial</span>
					</div>
				</div>
			</section>

			{/* Formulario de acceso y enlaces para volver o iniciar el registro. */}
			<section className="admin-login-form-section">
				<div className="admin-login-form-wrap">
					<button type="button" className="admin-login-back" onClick={onBack}>
						<span aria-hidden="true">←</span> Volver al inicio
					</button>

					<div className="admin-login-heading">
						<span className="eyebrow">Inicio de sesión</span>
						<h2>Bienvenido de nuevo</h2>
						<p>Ingresa tus datos para continuar en Nebula.</p>
					</div>

					{/* Captura credenciales para enviarlas directamente al servicio de autenticación. */}
					<form className="admin-login-form" onSubmit={handleSubmit}>
						<label htmlFor="admin-email">Correo electrónico</label>
						<input
							id="admin-email"
							name="email"
							type="email"
							placeholder="nombre@ejemplo.com"
							autoComplete="username"
							maxLength={254}
							required
						/>

						<label htmlFor="admin-password">Contraseña</label>
						<input
							id="admin-password"
							name="password"
							type="password"
							placeholder="Ingresa tu contraseña"
							autoComplete="current-password"
							required
						/>

						{error && <p className="admin-auth-error" role="alert">{error}</p>}
						<button type="submit" className="admin-login-submit" disabled={isSubmitting}>
							{isSubmitting ? 'Validando…' : 'Iniciar sesión'}
						</button>
					</form>

					<p className="admin-login-note">
						<span aria-hidden="true">🔒</span> Tus datos se mantienen protegidos.
					</p>

					<p className="admin-login-switch">
						¿No tienes cuenta?{' '}
						<button type="button" onClick={onSignup}>Crear aquí</button>
					</p>
				</div>
			</section>
		</div>
	)
}
export default LoginAdmin