const TOKEN_KEY = 'moviesbox_token'
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

let _forceLogout = null

export function registerLogoutHandler(fn) {
  _forceLogout = fn
}

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  const res = await fetch(`${API_BASE}/${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (res.status === 401 && _forceLogout) {
    _forceLogout()
    return null
  }

  return res
}
