import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  BookmarkCheck,
  BookmarkPlus,
  Calendar,
  ChevronLeft,
  Clock,
  Star,
} from 'lucide-react'
import { motion } from 'framer-motion'
import Loader from '../components/Loader'
import TVShowCard from '../components/TVShowCard'
import { apiFetch } from '../utils/apiFetch'
import { useAuth } from '../context/AuthContext'
import { buildTVPlayerUrl } from '../config/tvPlayer'

function toSeasonLabel(seasonNumber) {
  if (!seasonNumber && seasonNumber !== 0) return ''
  return `S${String(seasonNumber).padStart(2, '0')}`
}

function toEpisodeLabel(episodeNumber) {
  if (!episodeNumber && episodeNumber !== 0) return ''
  return `E${String(episodeNumber).padStart(2, '0')}`
}

function formatSeasonLabel(season) {
  if (!season) return ''
  const base = toSeasonLabel(season.seasonNumber)
  return season.name ? `${base} · ${season.name}` : base
}

function EpisodeCard({ episode, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex h-[20rem] w-full overflow-hidden rounded-2xl border text-left transition-all ${
        active
          ? 'border-yellow-400/70 shadow-[0_0_0_1px_rgba(250,204,21,0.18)]'
          : 'border-white/10 hover:border-yellow-400/35'
      }`}
    >
      {episode.stillUrl ? (
        <img
          src={episode.stillUrl}
          alt={episode.name || 'Episode still'}
          className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.12),transparent_42%),linear-gradient(145deg,#171717_0%,#0b0b0b_100%)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
      <div className="relative flex h-full w-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.26em] text-yellow-400/90">
              {toEpisodeLabel(episode.episodeNumber)}
            </p>
            <h3 className="mt-1 line-clamp-2 text-[1.05rem] font-black uppercase leading-[1.05] tracking-[0.08em] text-yellow-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              {episode.name || 'Untitled episode'}
            </h3>
          </div>
          {episode.runtime ? (
            <span className="rounded-full border border-white/10 bg-black/55 px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white">
              {episode.runtime}m
            </span>
          ) : null}
        </div>

        <div className="space-y-2">
          {episode.airDate ? (
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-300/80">
              {episode.airDate}
            </p>
          ) : null}
          {episode.overview ? (
            <p className="line-clamp-4 text-[13px] leading-5 text-gray-100/90">
              {episode.overview}
            </p>
          ) : (
            <p className="text-[13px] leading-5 text-gray-200/70">
              No episode synopsis available.
            </p>
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
  const [inMyListState, setInMyListState] = useState(false)
  const [myListBusy, setMyListBusy] = useState(false)
  const [adBlockEnabled, setAdBlockEnabled] = useState(true)
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false)
  const [visibleEpisodeCount, setVisibleEpisodeCount] = useState(4)
  const [episodeRailNav, setEpisodeRailNav] = useState({ canPrev: false, canNext: false })
  const relatedLoaderRef = useRef(null)
  const episodeRailRef = useRef(null)
  const episodeLoaderRef = useRef(null)
  const seasonDropdownRef = useRef(null)
  const relFetchingRef = useRef(false)
  const episodeFetchingRef = useRef(false)
  const relPageRef = useRef(1)
  const relTotalPagesRef = useRef(1)

  const seasonOptions = useMemo(
    () => [...seasons].sort((a, b) => Number(b.seasonNumber) - Number(a.seasonNumber)),
    [seasons],
  )

  const selectedSeasonMeta = useMemo(
    () => seasonOptions.find((season) => String(season.seasonNumber) === String(selectedSeason)) || null,
    [seasonOptions, selectedSeason],
  )

  const selectedEpisodeMeta = useMemo(
    () => episodes.find((episode) => String(episode.episodeNumber) === String(selectedEpisode)) || null,
    [episodes, selectedEpisode],
  )

  const currentSeasonLabel = selectedSeason ? toSeasonLabel(selectedSeason) : '--'
  const currentEpisodeLabel = selectedEpisode ? toEpisodeLabel(selectedEpisode) : '--'

  const visibleEpisodes = useMemo(
    () => episodes.slice(0, visibleEpisodeCount),
    [episodes, visibleEpisodeCount],
  )

  const updateEpisodeRailNav = useCallback(() => {
    const el = episodeRailRef.current
    if (!el) return

    const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth)
    const scrollLeft = el.scrollLeft
    setEpisodeRailNav({
      canPrev: scrollLeft > 4,
      canNext: scrollLeft < maxScrollLeft - 4,
    })
  }, [])

  const playerUrl = useMemo(
    () =>
      buildTVPlayerUrl(show?.imdbId, {
        season: selectedSeason || undefined,
        episode: selectedEpisode || undefined,
      }),
    [show?.imdbId, selectedSeason, selectedEpisode],
  )

  // Match the movie player: suppress popup attempts from iframe ads and refocus this tab.
  useEffect(() => {
    if (!playerUrl || !adBlockEnabled) return undefined

    const originalOpen = window.open
    window.open = () => null

    const onBlur = () => {
      setTimeout(() => window.focus(), 100)
    }
    window.addEventListener('blur', onBlur)

    return () => {
      window.open = originalOpen
      window.removeEventListener('blur', onBlur)
    }
  }, [playerUrl, adBlockEnabled])

  const loadRelated = useCallback(
    async (pageNumber) => {
      const res = await apiFetch(`tv/${tmdbId}/related?page=${pageNumber}&limit=20`)
      if (!res?.ok) throw new Error('Failed to load related TV shows')
      return res.json()
    },
    [tmdbId],
  )

  useEffect(() => {
    if (!seasonDropdownOpen) return undefined

    const onPointerDown = (event) => {
      if (!seasonDropdownRef.current?.contains(event.target)) {
        setSeasonDropdownOpen(false)
      }
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setSeasonDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [seasonDropdownOpen])

  useEffect(() => {
    const el = episodeRailRef.current
    if (!el) return undefined

    updateEpisodeRailNav()

    const onScroll = () => updateEpisodeRailNav()
    el.addEventListener('scroll', onScroll, { passive: true })

    const ro = new ResizeObserver(() => updateEpisodeRailNav())
    ro.observe(el)

    return () => {
      el.removeEventListener('scroll', onScroll)
      ro.disconnect()
    }
  }, [updateEpisodeRailNav, visibleEpisodes.length])

  useEffect(() => {
    let cancelled = false

    const loadShow = async () => {
      setLoading(true)
      setError('')
      setShow(null)
      setSeasons([])
      setSelectedSeason('')
      setEpisodes([])
      setSelectedEpisode('')
      setSeasonDropdownOpen(false)
      setRelated([])
      relPageRef.current = 1
      relTotalPagesRef.current = 1
      relFetchingRef.current = false
      window.scrollTo(0, 0)

      try {
        const res = await apiFetch(`tv/${tmdbId}`)
        if (!res?.ok) throw new Error(`Failed to load TV show (${res?.status || 'network'})`)
        const data = await res.json()
        if (cancelled) return

        setShow(data)
        const nextSeasons = Array.isArray(data.seasons) ? data.seasons : []
        setSeasons(nextSeasons)
        const initialSeason = nextSeasons.length
          ? [...nextSeasons].sort((a, b) => Number(b.seasonNumber) - Number(a.seasonNumber))[0]?.seasonNumber
          : ''
        setSelectedSeason(initialSeason ? String(initialSeason) : '')
      } catch (err) {
        if (cancelled) return
        setError(err?.message || 'Failed to load TV show.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadShow()
    return () => {
      cancelled = true
    }
  }, [tmdbId])

  useEffect(() => {
    let cancelled = false
    const loadSeason = async () => {
      if (!tmdbId || !selectedSeason) {
        setEpisodes([])
        setSelectedEpisode('')
        setVisibleEpisodeCount(4)
        episodeFetchingRef.current = false
        return
      }

      setSeasonLoading(true)
      try {
        const res = await apiFetch(`tv/${tmdbId}/season/${selectedSeason}`)
        if (!res?.ok) throw new Error(`Failed to load season ${selectedSeason}`)
        const data = await res.json()
        if (cancelled) return

        const nextEpisodes = Array.isArray(data.episodes) ? data.episodes : []
        setEpisodes(nextEpisodes)
        setSelectedEpisode(nextEpisodes.length ? String(nextEpisodes[0].episodeNumber) : '')
        setVisibleEpisodeCount(4)
        episodeFetchingRef.current = false
      } catch {
        if (cancelled) return
        setEpisodes([])
        setSelectedEpisode('')
        setVisibleEpisodeCount(4)
        episodeFetchingRef.current = false
      } finally {
        if (!cancelled) setSeasonLoading(false)
      }
    }

    loadSeason()
    return () => {
      cancelled = true
    }
  }, [tmdbId, selectedSeason])

  const scrollEpisodeRail = useCallback((direction) => {
    const el = episodeRailRef.current
    if (!el) return

    const step = Math.max(1, Math.round(el.clientWidth * 0.92))
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const root = episodeRailRef.current
    const target = episodeLoaderRef.current
    if (!root || !target) return undefined

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        if (episodeFetchingRef.current) return
        if (visibleEpisodeCount >= episodes.length) return

        episodeFetchingRef.current = true
        setVisibleEpisodeCount((count) => Math.min(count + 4, episodes.length))
        window.requestAnimationFrame(() => {
          episodeFetchingRef.current = false
        })
      },
      { root, threshold: 0.6 },
    )

    obs.observe(target)
    return () => obs.disconnect()
  }, [episodes.length, visibleEpisodeCount])

  useEffect(() => {
    if (!user?.id || !tmdbId) {
      return
    }

    let cancelled = false
    apiFetch(`my-list/check/${tmdbId}?mediaType=tv`)
      .then((res) => res?.json())
      .then((data) => {
        if (!cancelled) setInMyListState(Boolean(data?.inList))
      })
      .catch(() => {
        if (!cancelled) setInMyListState(false)
      })

    return () => {
      cancelled = true
    }
  }, [tmdbId, user?.id])

  useEffect(() => {
    if (!tmdbId) return

    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      setRelLoading(true)
      loadRelated(1)
        .then((data) => {
          setRelated(Array.isArray(data?.results) ? data.results : [])
          relPageRef.current = 1
          relTotalPagesRef.current = data?.totalPages ?? 1
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setRelLoading(false)
        })
    })

    return () => {
      cancelled = true
    }
  }, [tmdbId, loadRelated])

  useEffect(() => {
    const el = relatedLoaderRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return
        if (relFetchingRef.current) return
        if (relPageRef.current >= relTotalPagesRef.current) return

        const next = relPageRef.current + 1
        relFetchingRef.current = true
        setRelLoading(true)

        loadRelated(next)
          .then((data) => {
            setRelated((prev) => [...prev, ...(Array.isArray(data?.results) ? data.results : [])])
            relPageRef.current = next
            relTotalPagesRef.current = data?.totalPages ?? relTotalPagesRef.current
          })
          .catch(() => {})
          .finally(() => {
            relFetchingRef.current = false
            setRelLoading(false)
          })
      },
      { threshold: 0.1 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadRelated])

  const toggleMyList = async () => {
    if (!user || myListBusy || !show) return
    setMyListBusy(true)
    try {
      if (inMyListState) {
        const res = await apiFetch(`my-list/${show.id}?mediaType=tv`, { method: 'DELETE' })
        if (res?.ok) setInMyListState(false)
      } else {
        const res = await apiFetch('my-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tmdbId: Number(show.id),
            mediaType: 'tv',
            title: show.name || '',
            posterUrl: show.posterUrl || show.backdropUrl || '',
          }),
        })
        if (res?.ok) setInMyListState(true)
      }
    } catch {
      // ignore
    } finally {
      setMyListBusy(false)
    }
  }

  const seasonsCount = show?.seasonsCount ?? seasonOptions.length ?? 0

  if (loading && !show) {
    return <Loader />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black px-4 py-8 text-white">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black pb-24 text-white">
      <div className="relative overflow-hidden">
        <div className="relative h-[56vh] min-h-[420px] w-full overflow-hidden bg-black">
          {show?.backdropUrl ? (
            <motion.img
              src={show.backdropUrl}
              alt={show.name}
              className="absolute inset-0 h-full w-full object-cover object-center"
              initial={{ scale: 1.04, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              loading="eager"
            />
          ) : null}
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/35 to-transparent" />

          <button
            type="button"
            onClick={() => navigate(-1)}
            className="absolute top-20 left-4 md:left-12 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/70 backdrop-blur-sm transition hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          {user ? (
            <button
              type="button"
              onClick={toggleMyList}
              disabled={myListBusy}
              aria-label={inMyListState ? 'Remove from my list' : 'Save to my list'}
              className={`absolute top-20 right-4 md:right-12 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-sm transition ${
                inMyListState
                  ? 'border-yellow-400/55 bg-yellow-400/15 text-yellow-400 hover:bg-yellow-400/25'
                  : 'border-white/15 bg-black/30 text-white hover:border-yellow-400/45 hover:text-yellow-400'
              } ${myListBusy ? 'cursor-not-allowed opacity-60' : ''}`}
              title={inMyListState ? 'Remove from my list' : 'Save to my list'}
            >
              {inMyListState ? <BookmarkCheck className="h-5 w-5" /> : <BookmarkPlus className="h-5 w-5" />}
            </button>
          ) : null}

          <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-8 md:px-12 md:pb-12">
            <div className="max-w-6xl">
              {show?.logoUrl ? (
                <img
                  src={show.logoUrl}
                  alt={show?.name || 'TV show'}
                  className="mt-4 h-16 w-auto max-w-[420px] object-contain drop-shadow-2xl sm:h-20 md:h-24 lg:h-28"
                  loading="eager"
                />
              ) : (
                <h1 className="mt-4 max-w-5xl font-heading text-5xl uppercase leading-[0.88] text-white drop-shadow-2xl sm:text-6xl md:text-7xl lg:text-8xl">
                  {show?.name}
                </h1>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-gray-300">
                {show?.firstAirDate ? <span>{show.firstAirDate.slice(0, 4)}</span> : null}
                {typeof show?.voteAverage === 'number' ? (
                  <span className="inline-flex items-center gap-1 text-white">
                    <Star className="h-3.5 w-3.5 text-yellow-400" />
                    {show.voteAverage.toFixed(1)}
                  </span>
                ) : null}
                {show?.originalLanguage ? <span>{show.originalLanguage.toUpperCase()}</span> : null}
                {show?.type ? <span>{show.type}</span> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="-mt-10 px-4 relative z-10 md:px-12">
          <div className="space-y-6">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0e0e0e] shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
                <div className="border-b border-white/10 bg-white/5 px-4 py-3 md:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-gray-500">
                          Watch
                        </p>
                        <h2 className="mt-1 text-2xl font-black uppercase tracking-[0.12em] text-white md:text-3xl">
                          {show?.name || 'TV Show'}
                        </h2>
                        <p className="mt-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-400">
                          {currentSeasonLabel}
                          {selectedSeasonMeta?.name ? ` · ${selectedSeasonMeta.name}` : ''}
                          {' '}
                          {currentEpisodeLabel}
                          {selectedEpisodeMeta?.name ? ` · ${selectedEpisodeMeta.name}` : ''}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                      {playerUrl ? (
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Ad Block</span>
                          <button
                            type="button"
                            onClick={() => setAdBlockEnabled((value) => !value)}
                            className={`relative h-5 w-10 rounded-full border transition-all ${
                              adBlockEnabled ? 'border-green-500/40 bg-green-500/20' : 'border-white/20 bg-white/10'
                            }`}
                            aria-label={adBlockEnabled ? 'Disable ad block' : 'Enable ad block'}
                          >
                            <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                              adBlockEnabled ? 'translate-x-5' : ''
                            }`} />
                          </button>
                          <span className={`text-[9px] font-black uppercase tracking-widest ${
                            adBlockEnabled ? 'text-green-400' : 'text-gray-600'
                          }`}>
                            {adBlockEnabled ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      ) : null}
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-3 py-2">
                        <Clock className="h-3.5 w-3.5 text-yellow-400" />
                        {selectedEpisodeMeta?.runtime ? `${selectedEpisodeMeta.runtime}m` : 'Runtime unknown'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-3 py-2">
                        <Calendar className="h-3.5 w-3.5 text-yellow-400" />
                        {selectedEpisodeMeta?.airDate || selectedSeasonMeta?.airDate || 'Date unavailable'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative bg-black">
                  <div className="relative aspect-video w-full overflow-hidden">
                    {playerUrl ? (
                      <>
                        <iframe
                          key={`${show?.id || tmdbId}-${selectedSeason}-${selectedEpisode}`}
                          src={playerUrl}
                          title={show?.name || 'TV Player'}
                          className="absolute inset-0 h-full w-full"
                          allowFullScreen
                          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                          style={{ border: 'none' }}
                        />
                        <div
                          className="absolute inset-0 z-10"
                          style={{ pointerEvents: 'none' }}
                          onClickCapture={(e) => { e.stopPropagation(); window.focus() }}
                        />
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-gray-500">
                        Set `VITE_TV_PLAYER_BASE_URL` to load the embedded player here.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6 p-4 md:p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.28em] text-yellow-400 md:text-sm">
                          Seasons
                        </p>
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                        {seasonsCount} seasons
                      </p>
                    </div>

                    <div ref={seasonDropdownRef} className="relative max-w-md">
                      <button
                        type="button"
                        onClick={() => setSeasonDropdownOpen((open) => !open)}
                        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-yellow-400/50 bg-[#141414] px-4 py-3 text-left text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_0_0_1px_rgba(250,204,21,0.08)] transition hover:border-yellow-400 hover:bg-[#181818]"
                        aria-haspopup="listbox"
                        aria-expanded={seasonDropdownOpen}
                      >
                        <span className="truncate">{formatSeasonLabel(selectedSeasonMeta) || 'Select a season'}</span>
                        <ChevronLeft className={`h-4 w-4 shrink-0 text-yellow-400 transition-transform ${seasonDropdownOpen ? 'rotate-90' : '-rotate-90'}`} />
                      </button>

                      {seasonDropdownOpen ? (
                        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-yellow-400/40 bg-[#0d0d0d] shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
                          <div className="max-h-64 overflow-y-auto p-2">
                            {seasonOptions.map((season) => {
                              const active = String(season.seasonNumber) === String(selectedSeason)
                              return (
                                <button
                                  key={season.seasonNumber}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSeason(String(season.seasonNumber))
                                    setSeasonDropdownOpen(false)
                                  }}
                                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-black uppercase tracking-[0.14em] transition ${
                                    active
                                      ? 'bg-yellow-400 text-black'
                                      : 'text-gray-200 hover:bg-white/5 hover:text-white'
                                  }`}
                                  role="option"
                                  aria-selected={active}
                                >
                                  <span className="truncate">{formatSeasonLabel(season)}</span>
                                  {active ? <span className="ml-3 text-[10px] tracking-[0.22em]">Active</span> : null}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.28em] text-yellow-400 md:text-sm">
                          Episodes
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                          {seasonLoading ? 'Loading...' : `${episodes.length} episodes`}
                        </p>
                        <button
                          type="button"
                          onClick={() => scrollEpisodeRail(-1)}
                          disabled={!episodeRailNav.canPrev}
                          aria-label="Previous episodes"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white transition hover:border-yellow-400/50 hover:text-yellow-400 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollEpisodeRail(1)}
                          disabled={!episodeRailNav.canNext}
                          aria-label="Next episodes"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/35 text-white transition hover:border-yellow-400/50 hover:text-yellow-400 disabled:cursor-not-allowed disabled:opacity-35"
                        >
                          <ChevronLeft className="h-4 w-4 rotate-180" />
                        </button>
                      </div>
                    </div>

                    <div
                      ref={episodeRailRef}
                      className="grid grid-flow-col auto-cols-[85%] gap-3 overflow-x-auto pb-2 pr-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:auto-cols-[48%] md:auto-cols-[32%] xl:auto-cols-[calc((100%-2.25rem)/4)]"
                    >
                      {visibleEpisodes.map((episode) => (
                        <EpisodeCard
                          key={episode.episodeNumber}
                          episode={episode}
                          active={String(episode.episodeNumber) === String(selectedEpisode)}
                          onClick={() => setSelectedEpisode(String(episode.episodeNumber))}
                        />
                      ))}
                      {visibleEpisodeCount < episodes.length ? <div ref={episodeLoaderRef} className="w-2 shrink-0" aria-hidden="true" /> : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 md:p-6">
                <h2 className="font-heading text-2xl md:text-3xl text-yellow-400 mb-3">
                  Overview
                </h2>
                <p className="w-full text-sm leading-7 text-gray-300">
                  {show?.overview || 'No overview available.'}
                </p>
              </div>
            </div>

          <div className="mt-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                  Related TV
                </p>
                <h2 className="mt-2 font-heading text-3xl uppercase text-white">
                  More Like This
                </h2>
              </div>
              <p className="hidden md:block text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
                {related.length} loaded
              </p>
            </div>

            {relLoading && related.length === 0 ? (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-white/5" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {related.map((item) => (
                  <TVShowCard key={item.id} show={item} />
                ))}
              </div>
            )}

            <div ref={relatedLoaderRef} className="mt-8 flex h-10 items-center justify-center">
              {relLoading && (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
