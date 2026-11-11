const currentHost = typeof window === 'undefined' ? 'localhost' : window.location.hostname
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

export const API_URL = configuredApiUrl
  ? configuredApiUrl.replace(/\/+$/, '')
  : import.meta.env.DEV
    ? `http://${currentHost}:3000`
    : ''
