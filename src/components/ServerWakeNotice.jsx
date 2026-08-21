import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, LoaderCircle, WifiOff } from 'lucide-react'

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')
const SLOW_HEALTH_MS = 1500
const HEALTH_TIMEOUT_MS = 45000
const HIDE_READY_MS = 2500
const KEEPALIVE_MS = 8 * 60 * 1000

export default function ServerWakeNotice() {
  const [state, setState] = useState('idle')
  const hideTimerRef = useRef(null)

  useEffect(() => {
    const clearHideTimer = () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }

    const onServerStatus = (event) => {
      const next = event.detail?.status
      if (!next) return

      clearHideTimer()
      if (next === 'ready') {
        setState('ready')
        hideTimerRef.current = window.setTimeout(() => setState('idle'), HIDE_READY_MS)
        return
      }

      setState(next)
    }

    window.addEventListener('moviesbox:server-status', onServerStatus)
    return () => {
      clearHideTimer()
      window.removeEventListener('moviesbox:server-status', onServerStatus)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const ping = async (showSlow = false) => {
      if (document.visibilityState !== 'visible') return
      let healthWasSlow = false
      const controller = new AbortController()
      const slowTimer = showSlow
        ? window.setTimeout(() => {
            healthWasSlow = true
            if (mounted) setState('slow')
          }, SLOW_HEALTH_MS)
        : null
      const timeoutTimer = window.setTimeout(() => {
        controller.abort(new DOMException('Health check timed out', 'TimeoutError'))
      }, HEALTH_TIMEOUT_MS)

      try {
        const res = await fetch(`${API_BASE}/health`, {
          method: 'GET',
          cache: 'no-store',
          signal: controller.signal,
        })
        if (showSlow && healthWasSlow && mounted && res.ok) {
          setState('ready')
          hideTimerRef.current = window.setTimeout(() => setState('idle'), HIDE_READY_MS)
        }
      } catch {
        if (showSlow && mounted) setState('offline')
      } finally {
        if (slowTimer) window.clearTimeout(slowTimer)
        window.clearTimeout(timeoutTimer)
      }
    }

    ping(true)
    const intervalId = window.setInterval(() => ping(false), KEEPALIVE_MS)
    return () => {
      mounted = false
      window.clearInterval(intervalId)
    }
  }, [])

  if (state === 'idle') return null

  const isReady = state === 'ready'
  const isProblem = state === 'offline' || state === 'timeout'
  const Icon = isReady ? CheckCircle2 : isProblem ? WifiOff : LoaderCircle
  const title = isReady
    ? 'Server connected'
    : isProblem
      ? 'Server is still waking up'
      : 'Server is waking up'
  const message = isReady
    ? 'You can continue now.'
    : 'Free hosting can sleep after inactivity. This may take 30-60 seconds.'

  return (
    <div className="fixed bottom-5 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-white/10 bg-black/85 px-4 py-3 text-white shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isReady ? 'bg-green-500/15 text-green-400' : isProblem ? 'bg-red-500/15 text-red-300' : 'bg-yellow-400/15 text-yellow-300'
        }`}>
          <Icon className={`h-4 w-4 ${state === 'slow' ? 'animate-spin' : ''}`} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-widest">{title}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-gray-400">{message}</p>
        </div>
      </div>
    </div>
  )
}
