import { API_URL } from './apiUrl.js'

const AUTH_URL = `${API_URL}/api/auth`

// Ejecuta solicitudes autenticadas con cookie y convierte respuestas de error en excepciones.
async function request(path, options = {}) {
	const response = await fetch(`${AUTH_URL}${path}`, {
		...options,
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	})
	const result = await response.json()

	if (!response.ok) {
		throw new Error(result.mensaje || 'No se pudo completar la solicitud.')
	}

	return result
}

// Envía credenciales para validar y abrir una sesión administrativa.
export function loginAdmin(credentials) {
	return request('/login', {
		method: 'POST',
		body: JSON.stringify(credentials),
	})
}

// Registra una cuenta institucional con los datos proporcionados.
export function registerAdmin(credentials) {
	return request('/register', {
		method: 'POST',
		body: JSON.stringify(credentials),
	})
}

// Pregunta al backend si existe una sesión administrativa vigente.
export function getAdminSession() {
	return request('/me')
}

// Solicita al backend invalidar la sesión y borrar la cookie.
export function logoutAdmin() {
	return request('/logout', { method: 'POST' })
}
