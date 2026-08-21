const TOKEN_KEY = 'moviesbox_token'
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')
const SLOW_REQUEST_MS = 1500
const REQUEST_TIMEOUT_MS = 45000

let _forceLogout = null

export function registerLogoutHandler(fn) {
  _forceLogout = fn
}

function emitServerStatus(status, detail = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('moviesbox:server-status', {
    detail: { status, ...detail },
  }))
}

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  const controller = new AbortController()
  const upstreamSignal = options.signal
  let slow = false

  const slowTimer = window.setTimeout(() => {
    slow = true
    emitServerStatus('slow', { path })
  }, SLOW_REQUEST_MS)

  const timeoutTimer = window.setTimeout(() => {
    controller.abort(new DOMException('Request timed out', 'TimeoutError'))
  }, REQUEST_TIMEOUT_MS)

  const abortFromUpstream = () => controller.abort(upstreamSignal.reason)
  if (upstreamSignal) {
    if (upstreamSignal.aborted) abortFromUpstream()
    else upstreamSignal.addEventListener('abort', abortFromUpstream, { once: true })
  }

  try {
    const res = await fetch(`${API_BASE}/${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (slow) emitServerStatus('ready')

    if (res.status === 401 && _forceLogout) {
      _forceLogout()
      return null
    }

    return res
  } catch (error) {
    if (!upstreamSignal?.aborted) {
      emitServerStatus(error?.name === 'AbortError' || error?.name === 'TimeoutError' ? 'timeout' : 'offline', { path })
    }
    throw error
  } finally {
    window.clearTimeout(slowTimer)
    window.clearTimeout(timeoutTimer)
    if (upstreamSignal) upstreamSignal.removeEventListener('abort', abortFromUpstream)
  }
}
