const API_URL = 'http://localhost:3000/api' //y

export async function getAccounts() {
    const response = await fetch(`${API_URL}/accounts`)
    if (!response.ok) throw new Error('Error al cargar las cuentas')
    return response.json()
}

export async function createAccount(accountData) {
    const response = await fetch(`${API_URL}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
    })
    if (!response.ok) throw new Error('Error al registrar la cuenta')
    return response.json()
}

export async function updateAccount(id, accountData) {
    const response = await fetch(`${API_URL}/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
    })
    if (!response.ok) throw new Error('Error al actualizar la cuenta')
    return response.json()
}

export async function deleteAccountApi(id) {
    const response = await fetch(`${API_URL}/accounts/${id}`, {
        method: 'DELETE',
    })
    if (!response.ok) throw new Error('Error al eliminar la cuenta')
    return response.json()
}