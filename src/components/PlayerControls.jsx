import { useCallback, useEffect, useRef, useState } from 'react'
import { RotateCcw, RotateCw, Play, Pause, Volume2, VolumeX } from 'lucide-react'

const SEEK_SECS = 10

/**
 * A slim controls strip rendered OUTSIDE the iframe wrapper (below it),
 * so it never blocks the player's own UI.
 *
 * Props:
 *  isYouTube  — enables postMessage seek
 *  iframeRef  — ref to <iframe>
 *  duration   — total seconds (for progress display)
 */
export default function PlayerControls({ iframeRef, isYouTube = false, duration = 0 }) {
  const [paused, setPaused] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [volume, setVolume] = useState(100)
  const [muted, setMuted] = useState(false)
  const [flash, setFlash] = useState(null)

  const elapsedRef = useRef(0)
  const pausedRef = useRef(false)
  const flashTimer = useRef(null)

  // fake elapsed ticker
  useEffect(() => {
    const id = setInterval(() => {
      if (!pausedRef.current) {
        elapsedRef.current += 1
        setElapsed(elapsedRef.current)
      }
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const ytPost = useCallback((func, args = []) => {
    if (!isYouTube || !iframeRef?.current) return
    try {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: 'command', func, args }), '*'
      )
    } catch (_) {}
  }, [isYouTube, iframeRef])

  const showFlash = useCallback((msg) => {
    setFlash(msg)
    clearTimeout(flashTimer.current)
    flashTimer.current = setTimeout(() => setFlash(null), 700)
  }, [])

  const togglePlay = () => {
    const next = !pausedRef.current
    pausedRef.current = next
    setPaused(next)
    ytPost(next ? 'pauseVideo' : 'playVideo')
  }

  const seekBack = () => {
    elapsedRef.current = Math.max(0, elapsedRef.current - SEEK_SECS)
    setElapsed(elapsedRef.current)
    ytPost('seekBy', [-SEEK_SECS])
    showFlash(`-${SEEK_SECS}s`)
  }

  const seekFwd = () => {
    elapsedRef.current = elapsedRef.current + SEEK_SECS
    setElapsed(elapsedRef.current)
    ytPost('seekBy', [SEEK_SECS])
    showFlash(`+${SEEK_SECS}s`)
  }

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    ytPost(next ? 'mute' : 'unMute')
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  const pct = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0
  const VIcon = muted || volume === 0 ? VolumeX : Volume2

  return (
    <div className="relative w-full bg-black/80 backdrop-blur-sm border-t border-white/10 px-3 py-2 flex flex-col gap-2">

      {/* Flash feedback */}
      {flash && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-sm font-black px-4 py-1.5 rounded-full border border-white/10 pointer-events-none">
          {flash}
        </div>
      )}

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-white/40 tabular-nums w-9 text-right shrink-0">
          {fmt(elapsed)}
        </span>
        <div
          className="relative flex-1 h-1 bg-white/20 rounded-full cursor-pointer group"
          onClick={(e) => {
            if (!duration) return
            const rect = e.currentTarget.getBoundingClientRect()
            const newElapsed = Math.round(((e.clientX - rect.left) / rect.width) * duration)
            elapsedRef.current = newElapsed
            setElapsed(newElapsed)
            if (isYouTube) ytPost('seekTo', [newElapsed, true])
          }}
        >
          <div className="absolute left-0 top-0 h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-yellow-400 rounded-full -ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${pct}%` }}
          />
        </div>
        {duration > 0 && (
          <span className="text-[10px] font-black text-white/25 tabular-nums w-9 shrink-0">
            {fmt(duration)}
          </span>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2">
        <Btn onClick={seekBack} title="Rewind 10s">
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="text-[7px] font-black absolute bottom-0 right-0.5 leading-none">10</span>
        </Btn>

        <Btn onClick={togglePlay} title={paused ? 'Play' : 'Pause'} large>
          {paused
            ? <Play className="w-4 h-4 fill-white translate-x-px" />
            : <Pause className="w-4 h-4 fill-white" />
          }
        </Btn>

        <Btn onClick={seekFwd} title="Forward 10s">
          <RotateCw className="w-3.5 h-3.5" />
          <span className="text-[7px] font-black absolute bottom-0 right-0.5 leading-none">10</span>
        </Btn>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <Btn onClick={toggleMute} title="Mute/Unmute">
          <VIcon className="w-3.5 h-3.5" />
        </Btn>

        <input
          type="range"
          min={0} max={100}
          value={muted ? 0 : volume}
          onChange={(e) => {
            const v = Number(e.target.value)
            setVolume(v)
            setMuted(v === 0)
            if (isYouTube) { ytPost('setVolume', [v]); if (v > 0) ytPost('unMute') }
          }}
          className="w-20 h-1 accent-yellow-400 cursor-pointer"
        />

        <span className="text-[9px] font-black text-white/30 tabular-nums w-6 ml-0.5">
          {muted ? 0 : volume}
        </span>

        <span className="ml-auto text-[9px] font-black text-white/15 hidden md:block">
          ← → seek · ↑↓ vol
        </span>
      </div>
    </div>
  )
}

function Btn({ onClick, title, large = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`relative flex items-center justify-center rounded-full bg-white/10 hover:bg-yellow-400/20 border border-white/10 hover:border-yellow-400/30 text-white hover:text-yellow-300 transition-all active:scale-90 shrink-0 ${large ? 'w-8 h-8' : 'w-7 h-7'}`}
    >
      {children}
    </button>
  )
}
