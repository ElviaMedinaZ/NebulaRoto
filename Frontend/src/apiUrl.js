const currentHost = typeof window === 'undefined' ? 'localhost' : window.location.hostname

export const API_URL = `http://${currentHost}:3000`
