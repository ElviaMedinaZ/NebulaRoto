import { API_URL } from './apiUrl.js'

const ACCOUNTS_URL = `${API_URL}/api/accounts`

async function request(path, options = {}) {
    const response = await fetch(`${ACCOUNTS_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    })
    const body = await response.text()
    let result = null

    if (body) {
        try {
            result = JSON.parse(body)
        } catch {
            if (response.ok) throw new Error('El servidor devolvió una respuesta inválida.')
        }
    }

    if (!response.ok) {
        throw new Error(result?.mensaje || result?.error || 'No se pudo completar la operación con la cuenta.')
    }

    return result
}

export async function getAccounts() {
    return request('')
}

export async function createAccount(accountData) {
    return request('', {
        method: 'POST',
        body: JSON.stringify(accountData),
    })
}

export async function updateAccount(id, accountData) {
    return request(`/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: JSON.stringify(accountData),
    })
}

export async function deleteAccountApi(id) {
    return request(`/${encodeURIComponent(id)}`, {
        method: 'DELETE',
    })
}