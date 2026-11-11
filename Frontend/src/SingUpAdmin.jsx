import { useState } from 'react'
import { registerAdmin } from './adminAuthApi.js'

// Formulario público de registro para cuentas de usuario.
function SingUpAdmin({ onBack, onLogin, onAuthenticated, initialError = '' }) {
	// Estado de validación visible y control del envío del formulario.
	const [error, setError] = useState(initialError)
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Comprueba confirmación y aceptación localmente antes de pedir el registro al backend.
	const handleSubmit = async (event) => {
		event.preventDefault()
		const form = event.currentTarget
		const values = Object.fromEntries(new FormData(form))

		if (values.password !== values.confirmPassword) {
			setError('Las contraseñas no coinciden.')
			return
		}
		if (!values.terms) {
			setError('Debes aceptar los términos de uso y privacidad.')
			return
		}

		setError('')
		setIsSubmitting(true)
		try {
			await registerAdmin({
				nombre: values.name,
				email: values.email,
				password: values.password,
				aceptaTerminos: values.terms === 'on',
			})
			onAuthenticated()
		} catch (requestError) {
			setError(requestError.message)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="admin-login-page admin-signup-page">
			{/* Panel de bienvenida que contextualiza el registro institucional. */}
			<section className="admin-login-visual" aria-label="Registro de cuenta Nebula">
				<div className="admin-login-orbit orbit-one" />
				<div className="admin-login-orbit orbit-two" />
				<div className="admin-login-visual-content">
					<span className="admin-login-mark">N</span>
					<span className="eyebrow">Administración Nebula</span>
					<h1>Construyamos una red de apoyo más fuerte.</h1>
					<p>
						Crea una cuenta para acceder a las herramientas de Nebula.
					</p>
					<div className="admin-login-status">
						<span className="live-dot" />
						<span>Registro seguro y confidencial</span>
					</div>
				</div>
			</section>

			{/* Formulario de datos de cuenta y acceso a la pantalla de inicio de sesión. */}
			<section className="admin-login-form-section">
				<div className="admin-login-form-wrap">
					<button type="button" className="admin-login-back" onClick={onBack}>
						<span aria-hidden="true">←</span> Volver al inicio
					</button>

					<div className="admin-login-heading">
						<span className="eyebrow">Crear cuenta</span>
						<h2>Únete al equipo</h2>
						<p>Registra tus datos para crear tu cuenta de usuario.</p>
					</div>

					{/* El backend asigna el rol de usuario a todas las cuentas de registro público. */}
					<form className="admin-login-form" onSubmit={handleSubmit}>
						<label htmlFor="admin-signup-name">Nombre completo</label>
						<input
							id="admin-signup-name"
							name="name"
							type="text"
							placeholder="Escribe tu nombre"
							autoComplete="name"
							minLength={2}
							maxLength={100}
							required
						/>

						<label htmlFor="admin-signup-email">Correo electrónico</label>
						<input
							id="admin-signup-email"
							name="email"
							type="email"
							placeholder="nombre@ejemplo.com"
							autoComplete="email"
							maxLength={254}
							required
						/>

						<label htmlFor="admin-signup-password">Contraseña</label>
						<input
							id="admin-signup-password"
							name="password"
							type="password"
							placeholder="Crea una contraseña"
							autoComplete="new-password"
							minLength={12}
							maxLength={72}
							required
						/>

						<label htmlFor="admin-signup-confirm-password">Confirmar contraseña</label>
						<input
							id="admin-signup-confirm-password"
							name="confirmPassword"
							type="password"
							placeholder="Repite tu contraseña"
							autoComplete="new-password"
							minLength={12}
							maxLength={72}
							required
						/>

						<label className="admin-login-check">
							<input type="checkbox" name="terms" required />
							<span>Acepto los términos de uso y privacidad</span>
						</label>

						{error && <p className="admin-auth-error" role="alert">{error}</p>}
						<button type="submit" className="admin-login-submit" disabled={isSubmitting}>
							{isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}
						</button>
					</form>

					<p className="admin-login-note">
						Cualquier correo válido puede registrarse. Las cuentas nuevas tienen el rol de usuario.
					</p>
					<p className="admin-login-switch">
						¿Ya tienes una cuenta?{' '}
						<button type="button" onClick={onLogin}>Inicia sesión</button>
					</p>
				</div>
			</section>
		</div>
	)
}

export default SingUpAdmin