import { useEffect, useRef } from 'react'
import { apiFetch } from '../utils/apiFetch'

/** 
 * Unified Tracking Logic
 * - LocalStorage acts as a persistent buffer.
 * - Updates every 1 min locally.
 * - Syncs to backend every 5 mins or on tab close.
 */

const TICK_MS = 10_000 // 10 seconds local update for more responsiveness
const SYNC_MS = 30_000 // 30 seconds backend sync
const IDLE_MS = 120_000 // 2 minutes no activity = idle
const STORAGE_KEY = 'mbx_activity_buffer'

export default function SiteActiveTracker({ user }) {
  const lastActivityRef = useRef(Date.now())
  const syncingRef = useRef(false)
  
  // Helper to get buffer from storage
  const getBuffer = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : { sessions: [], activeMovie: null }
    } catch {
      return { sessions: [], activeMovie: null }
    }
  }

  // Helper to save buffer
  const saveBuffer = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  useEffect(() => {
    if (!user || user.trackingEnabled === false) return

    const markActive = () => {
      lastActivityRef.current = Date.now()
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'wheel']
    events.forEach((ev) => window.addEventListener(ev, markActive, { passive: true }))

    // This listener allows MovieDetailPage to "broadcast" what movie is being watched
    const onMovieContext = (e) => {
      const buffer = getBuffer()
      buffer.activeMovie = e.detail // { tmdbId, title, posterUrl, genreIds, originalLanguage }
      saveBuffer(buffer)
    }
    window.addEventListener('mbx_movie_context', onMovieContext)

    const flush = async (isClosing = false) => {
      if (syncingRef.current && !isClosing) return
      
      const buffer = getBuffer()
      if (!buffer.sessions || buffer.sessions.length === 0) return

      const payload = {
        activities: buffer.sessions,
        timestamp: new Date().toISOString()
      }

      const token = localStorage.getItem('moviesbox_token')
      if (!token) return

      const url = '/api/site-active/unified'
      const config = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        keepalive: true // Crucial: ensures request completes even if tab closes
      }

      try {
        syncingRef.current = true
        if (isClosing) {
          // fetch with keepalive is the modern way to replace sendBeacon for auth routes
          fetch(url, config).catch(() => {})
        } else {
          const res = await fetch(url, config)
          if (res.ok) {
            // Clear ONLY the sessions we just sent, in case more were added during fetch
            const currentBuffer = getBuffer()
            // Remove the sessions that match the ones we sent
            const sentTimestamps = new Set(payload.activities.map(a => a.timestamp))
            currentBuffer.sessions = currentBuffer.sessions.filter(a => !sentTimestamps.has(a.timestamp))
            saveBuffer(currentBuffer)
          }
        }
      } catch (err) {
        console.error('[Unified Sync Failed]', err)
      } finally {
        syncingRef.current = false
      }
    }

    const onTick = () => {
      const now = Date.now()
      if (document.visibilityState !== 'visible') return
      if (now - lastActivityRef.current > IDLE_MS) return

      const buffer = getBuffer()
      const currentActivity = {
        timestamp: new Date().toISOString(),
        duration: Math.floor(TICK_MS / 1000),
        movie: buffer.activeMovie // If null, it's just browsing
      }

      buffer.sessions.push(currentActivity)
      saveBuffer(buffer)
    }

    const tickId = setInterval(onTick, TICK_MS)
    const syncId = setInterval(() => flush(false), SYNC_MS)

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush(true)
      else markActive()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('beforeunload', () => flush(true))

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, markActive))
      window.removeEventListener('mbx_movie_context', onMovieContext)
      clearInterval(tickId)
      clearInterval(syncId)
      document.removeEventListener('visibilitychange', onVisibility)
      flush(true)
    }
  }, [user])

  return null
}
