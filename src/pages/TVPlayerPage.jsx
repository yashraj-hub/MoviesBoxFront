import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BookmarkCheck, BookmarkPlus, ChevronLeft, ChevronDown, Star, Clock, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import Loader from '../components/Loader'
import TVShowCard from '../components/TVShowCard'
import { apiFetch } from '../utils/apiFetch'
import { useAuth } from '../context/AuthContext'
import { buildTVPlayerUrl } from '../config/tvPlayer'

function toSeasonLabel(n) {
  if (!n && n !== 0) return ''
  return `S${String(n).padStart(2, '0')}`
}
function toEpLabel(n) {
  if (!n && n !== 0) return ''
  return `E${String(n).padStart(2, '0')}`
}
function formatSeasonLabel(season) {
  if (!season) return ''
  const base = toSeasonLabel(season.seasonNumber)
  return season.name ? `${base} · ${season.name}` : base
}

// ── Episode row (YouTube sidebar style) ──────────────────────────────────────
function EpisodeRow({ episode, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex gap-3 w-full text-left p-2 rounded-xl transition-all ${
        active ? 'bg-yellow-400/10 border border-yellow-400/30' : 'hover:bg-white/5 border border-transparent'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative shrink-0 w-32 aspect-video rounded-lg overflow-hidden bg-white/5">
        {episode.stillUrl ? (
          <img
            src={episode.stillUrl}
            alt={episode.name}
            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20 text-xs font-black">
            {toEpLabel(episode.episodeNumber)}
          </div>
        )}
        {active && (
          <div className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center">
              <div className="w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-black ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-0.5">
        <p className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${active ? 'text-yellow-400' : 'text-gray-500'}`}>
          {toEpLabel(episode.episodeNumber)}
        </p>
        <p className="text-[12px] font-bold text-white leading-snug line-clamp-2">
          {episode.name || 'Untitled'}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {episode.runtime && (
            <span className="text-[10px] text-gray-500 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />{episode.runtime}m
            </span>
          )}
          {episode.airDate && (
            <span className="text-[10px] text-gray-600">{episode.airDate}</span>
          )}
        </div>
      </div>
    </button>
  )
}

export default function TVPlayerPage() {
  const { tmdbId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [show, setShow] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [seasons, setSeasons] = useState([])
  const [selectedSeason, setSelectedSeason] = useState('')
  const [episodes, setEpisodes] = useState([])
  const [selectedEpisode, setSelectedEpisode] = useState('')
  const [seasonLoading, setSeasonLoading] = useState(false)
  const [related, setRelated] = useState([])
  const [relLoading, setRelLoading] = useState(false)
  const [inMyList, setInMyList] = useState(false)
  const [myListBusy, setMyListBusy] = useState(false)
  const [adBlockEnabled, setAdBlockEnabled] = useState(true)
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false)

  const seasonDropdownRef = useRef(null)
  const episodeListRef = useRef(null)
  const activeEpRef = useRef(null)
  const relatedLoaderRef = useRef(null)
  const relFetchingRef = useRef(false)
  const relPageRef = useRef(1)
  const relTotalPagesRef = useRef(1)

  const seasonOptions = useMemo(
    () => [...seasons].sort((a, b) => Number(b.seasonNumber) - Number(a.seasonNumber)),
    [seasons],
  )
  const selectedSeasonMeta = useMemo(
    () => seasonOptions.find(s => String(s.seasonNumber) === String(selectedSeason)) || null,
    [seasonOptions, selectedSeason],
  )
  const selectedEpisodeMeta = useMemo(
    () => episodes.find(e => String(e.episodeNumber) === String(selectedEpisode)) || null,
    [episodes, selectedEpisode],
  )

  const playerUrl = useMemo(
    () => buildTVPlayerUrl(show?.imdbId, {
      season: selectedSeason || undefined,
      episode: selectedEpisode || undefined,
    }),
    [show?.imdbId, selectedSeason, selectedEpisode],
  )

  // ad block
  useEffect(() => {
    if (!playerUrl || !adBlockEnabled) return
    const orig = window.open
    window.open = () => null
    const onBlur = () => setTimeout(() => window.focus(), 100)
    window.addEventListener('blur', onBlur)
    return () => { window.open = orig; window.removeEventListener('blur', onBlur) }
  }, [playerUrl, adBlockEnabled])

  // close season dropdown on outside click
  useEffect(() => {
    if (!seasonDropdownOpen) return
    const handler = (e) => {
      if (!seasonDropdownRef.current?.contains(e.target)) setSeasonDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [seasonDropdownOpen])

  // load show
  useEffect(() => {
    let cancelled = false
    setLoading(true); setError(''); setShow(null); setSeasons([])
    setSelectedSeason(''); setEpisodes([]); setSelectedEpisode('')
    setRelated([]); relPageRef.current = 1; relTotalPagesRef.current = 1
    window.scrollTo(0, 0)

    apiFetch(`tv/${tmdbId}`)
      .then(r => { if (!r?.ok) throw new Error(); return r.json() })
      .then(data => {
        if (cancelled) return
        setShow(data)
        const nextSeasons = Array.isArray(data.seasons) ? data.seasons : []
        setSeasons(nextSeasons)
        const first = [...nextSeasons].sort((a, b) => Number(b.seasonNumber) - Number(a.seasonNumber))[0]
        setSelectedSeason(first ? String(first.seasonNumber) : '')
      })
      .catch(() => { if (!cancelled) setError('Failed to load TV show.') })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [tmdbId])

  // load season episodes
  useEffect(() => {
    if (!tmdbId || !selectedSeason) { setEpisodes([]); setSelectedEpisode(''); return }
    let cancelled = false
    setSeasonLoading(true)
    apiFetch(`tv/${tmdbId}/season/${selectedSeason}`)
      .then(r => { if (!r?.ok) throw new Error(); return r.json() })
      .then(data => {
        if (cancelled) return
        const eps = Array.isArray(data.episodes) ? data.episodes : []
        setEpisodes(eps)
        setSelectedEpisode(eps.length ? String(eps[0].episodeNumber) : '')
      })
      .catch(() => { if (!cancelled) { setEpisodes([]); setSelectedEpisode('') } })
      .finally(() => { if (!cancelled) setSeasonLoading(false) })
    return () => { cancelled = true }
  }, [tmdbId, selectedSeason])

  // scroll active episode into view in sidebar
  useEffect(() => {
    if (activeEpRef.current && episodeListRef.current) {
      activeEpRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedEpisode])

  // my list check
  useEffect(() => {
    if (!user?.id || !tmdbId) return
    let cancelled = false
    apiFetch(`my-list/check/${tmdbId}?mediaType=tv`)
      .then(r => r?.json())
      .then(d => { if (!cancelled) setInMyList(Boolean(d?.inList)) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [tmdbId, user?.id])

  // load related
  const loadRelated = useCallback(async (page) => {
    const r = await apiFetch(`tv/${tmdbId}/related?page=${page}&limit=20`)
    if (!r?.ok) throw new Error()
    return r.json()
  }, [tmdbId])

  useEffect(() => {
    if (!tmdbId) return
    let cancelled = false
    setRelLoading(true)
    loadRelated(1)
      .then(d => { setRelated(d?.results || []); relTotalPagesRef.current = d?.totalPages ?? 1 })
      .catch(() => {})
      .finally(() => { if (!cancelled) setRelLoading(false) })
    return () => { cancelled = true }
  }, [tmdbId, loadRelated])

  useEffect(() => {
    const el = relatedLoaderRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting || relFetchingRef.current) return
      if (relPageRef.current >= relTotalPagesRef.current) return
      const next = relPageRef.current + 1
      relFetchingRef.current = true
      setRelLoading(true)
      loadRelated(next)
        .then(d => {
          setRelated(prev => [...prev, ...(d?.results || [])])
          relPageRef.current = next
          relTotalPagesRef.current = d?.totalPages ?? relTotalPagesRef.current
        })
        .catch(() => {})
        .finally(() => { relFetchingRef.current = false; setRelLoading(false) })
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadRelated])

  // save TV watch progress when episode changes
  useEffect(() => {
    if (!show?.id || !selectedSeason || !selectedEpisode) return
    const timer = setTimeout(() => {
      apiFetch('continue-watching/tv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tmdbId: Number(show.id),
          title: show.name || '',
          posterUrl: show.posterUrl || show.backdropUrl || '',
          watchSeconds: 60,
          season: Number(selectedSeason),
          episode: Number(selectedEpisode),
        }),
      }).catch(() => {})
    }, 5000) // save after 5s of watching
    return () => clearTimeout(timer)
  }, [show?.id, show?.name, show?.posterUrl, show?.backdropUrl, selectedSeason, selectedEpisode])

  const toggleMyList = async () => {
    if (!user || myListBusy || !show) return
    setMyListBusy(true)
    try {
      if (inMyList) {
        const r = await apiFetch(`my-list/${show.id}?mediaType=tv`, { method: 'DELETE' })
        if (r?.ok) setInMyList(false)
      } else {
        const r = await apiFetch('my-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tmdbId: Number(show.id), mediaType: 'tv', title: show.name || '', posterUrl: show.posterUrl || '' }),
        })
        if (r?.ok) setInMyList(true)
      }
    } catch {} finally { setMyListBusy(false) }
  }

  if (loading && !show) return <Loader />

  if (error) return (
    <div className="min-h-screen bg-black px-4 py-8 text-white">
      <button type="button" onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-300">
        <ChevronLeft className="h-4 w-4" /> Back
      </button>
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pb-20">

      {/* ── Top hero backdrop (short) ── */}
      <div className="relative h-48 md:h-56 w-full overflow-hidden">
        {show?.backdropUrl && (
          <motion.img
            src={show.backdropUrl}
            alt={show.name}
            className="absolute inset-0 w-full h-full object-cover object-top"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-[#0a0a0a]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

        {/* Back + bookmark */}
        <div className="absolute top-16 left-4 md:left-8 flex items-center gap-3 z-10">
          <button type="button" onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/70 backdrop-blur-sm hover:text-white transition">
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>
        </div>
        {user && (
          <button type="button" onClick={toggleMyList} disabled={myListBusy}
            className={`absolute top-16 right-4 md:right-8 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-sm transition ${
              inMyList ? 'border-yellow-400/55 bg-yellow-400/15 text-yellow-400' : 'border-white/15 bg-black/30 text-white hover:text-yellow-400'
            }`}>
            {inMyList ? <BookmarkCheck className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
          </button>
        )}

        {/* Show title bottom-left */}
        <div className="absolute bottom-4 left-4 md:left-8 z-10">
          {show?.logoUrl
            ? <img src={show.logoUrl} alt={show.name} className="h-10 md:h-14 w-auto object-contain max-w-[280px]" />
            : <h1 className="text-2xl md:text-3xl font-heading uppercase text-white leading-tight">{show?.name}</h1>
          }
          <div className="flex items-center gap-3 mt-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
            {show?.firstAirDate && <span>{show.firstAirDate.slice(0, 4)}</span>}
            {typeof show?.voteAverage === 'number' && (
              <span className="flex items-center gap-1 text-white"><Star className="h-3 w-3 text-yellow-400" />{show.voteAverage.toFixed(1)}</span>
            )}
            {show?.type && <span>{show.type}</span>}
          </div>
        </div>
      </div>

      {/* ── Main content: YouTube layout ── */}
      <div className="px-4 md:px-8 mt-2">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 lg:items-start">

          {/* ── LEFT: Player + episode info ── */}
          <div className="flex-1 min-w-0">

            {/* Player */}
            <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
              {playerUrl ? (
                <iframe
                  key={`${show?.id}-${selectedSeason}-${selectedEpisode}`}
                  src={playerUrl}
                  title={show?.name}
                  className="absolute inset-0 w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  style={{ border: 'none' }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                  Set VITE_TV_PLAYER_BASE_URL to enable player
                </div>
              )}
            </div>

            {/* Episode meta + adblock */}
            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
                  {toSeasonLabel(selectedSeason)} {toEpLabel(selectedEpisode)}
                  {selectedEpisodeMeta?.name ? ` · ${selectedEpisodeMeta.name}` : ''}
                </p>
                <h2 className="text-lg font-black uppercase tracking-tight text-white mt-0.5">{show?.name}</h2>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  {selectedEpisodeMeta?.runtime && (
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{selectedEpisodeMeta.runtime}m</span>
                  )}
                  {selectedEpisodeMeta?.airDate && (
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{selectedEpisodeMeta.airDate}</span>
                  )}
                </div>
              </div>

              {/* Ad block toggle */}
              {playerUrl && (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Ad Block</span>
                  <button type="button" onClick={() => setAdBlockEnabled(v => !v)}
                    className={`relative h-4 w-8 rounded-full border transition-all ${adBlockEnabled ? 'border-green-500/40 bg-green-500/20' : 'border-white/20 bg-white/10'}`}>
                    <span className={`absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white transition-transform ${adBlockEnabled ? 'translate-x-4' : ''}`} />
                  </button>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${adBlockEnabled ? 'text-green-400' : 'text-gray-600'}`}>
                    {adBlockEnabled ? 'ON' : 'OFF'}
                  </span>
                </div>
              )}
            </div>

            {/* Episode overview */}
            {selectedEpisodeMeta?.overview && (
              <p className="mt-3 text-sm text-gray-400 leading-relaxed line-clamp-3">{selectedEpisodeMeta.overview}</p>
            )}

            {/* Show overview */}
            {show?.overview && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">About</p>
                <p className="text-sm text-gray-400 leading-relaxed">{show.overview}</p>
              </div>
            )}
          </div>

          {/* ── RIGHT: Season selector + episode list ── */}
          <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0">

            {/* Season dropdown */}
            <div ref={seasonDropdownRef} className="relative mb-3">
              <button type="button" onClick={() => setSeasonDropdownOpen(o => !o)}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-black uppercase tracking-widest text-white hover:border-yellow-400/40 transition">
                <span className="truncate">{formatSeasonLabel(selectedSeasonMeta) || 'Select Season'}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-yellow-400 transition-transform ${seasonDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {seasonDropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-white/10 bg-[#111] shadow-2xl overflow-hidden">
                  <div className="max-h-56 overflow-y-auto p-1">
                    {seasonOptions.map(season => {
                      const active = String(season.seasonNumber) === String(selectedSeason)
                      return (
                        <button key={season.seasonNumber} type="button"
                          onClick={() => { setSelectedSeason(String(season.seasonNumber)); setSeasonDropdownOpen(false) }}
                          className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-[11px] font-black uppercase tracking-widest transition ${
                            active ? 'bg-yellow-400 text-black' : 'text-gray-300 hover:bg-white/5'
                          }`}>
                          {formatSeasonLabel(season)}
                          {active && <span className="text-[9px]">Playing</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Episode count */}
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Episodes</p>
              <p className="text-[10px] font-black text-gray-600">
                {seasonLoading ? 'Loading...' : `${episodes.length} episodes`}
              </p>
            </div>

            {/* Episode list — scrollable */}
            <div
              ref={episodeListRef}
              className="flex flex-col gap-1 overflow-y-auto lg:max-h-[calc(100vh-220px)] pr-1 [-ms-overflow-style:none] [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.1)_transparent]"
            >
              {seasonLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-3 p-2">
                    <div className="w-32 aspect-video rounded-lg bg-white/5 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-2 w-16 bg-white/5 rounded animate-pulse" />
                      <div className="h-3 w-full bg-white/5 rounded animate-pulse" />
                      <div className="h-3 w-3/4 bg-white/5 rounded animate-pulse" />
                    </div>
                  </div>
                ))
              ) : (
                episodes.map(ep => (
                  <div
                    key={ep.episodeNumber}
                    ref={String(ep.episodeNumber) === String(selectedEpisode) ? activeEpRef : null}
                  >
                    <EpisodeRow
                      episode={ep}
                      active={String(ep.episodeNumber) === String(selectedEpisode)}
                      onClick={() => setSelectedEpisode(String(ep.episodeNumber))}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ── Related shows — full width below both columns ── */}
        <div className="mt-10 pt-8 border-t border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">More Like This</p>
          {relLoading && related.length === 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
              {related.map(item => <TVShowCard key={item.id} show={item} />)}
            </div>
          )}
          <div ref={relatedLoaderRef} className="h-8 flex items-center justify-center mt-4">
            {relLoading && <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />}
          </div>
        </div>
      </div>
    </div>
  )
}
