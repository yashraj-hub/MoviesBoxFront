import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Star, Clock, Calendar, TrendingUp, DollarSign, ChevronLeft, Play, Volume2, VolumeX, BookmarkPlus, BookmarkCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '../utils/apiFetch'
import { useAuth } from '../context/AuthContext'
import ProductionLogo from '../components/ProductionLogo'
import MovieCard from '../components/MovieCard'

const CARDS_PER_ROW = 5

function fmt(n) {
  if (!n || n === 0) return null
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(n)
}

function runtime(mins) {
  if (!mins) return null
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

function StatBadge({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2 md:py-2.5">
      <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-yellow-400 shrink-0" />
      <div>
        <p className="text-[8px] md:text-[9px] uppercase tracking-widest text-gray-500 font-black">{label}</p>
        <p className="text-[12px] md:text-[13px] font-bold text-white">{value}</p>
      </div>
    </div>
  )
}

function CastCard({ person, credit }) {
  const navigate = useNavigate()
  const creditParam = credit === 'director' ? 'director' : 'cast'
  const openPerson = () => {
    if (!person?.id) return
    navigate(`/person?id=${person.id}&name=${encodeURIComponent(person.name || '')}&credit=${creditParam}`)
  }
  return (
    <button
      type="button"
      onClick={openPerson}
      className="flex-none w-24 text-center border-0 bg-transparent p-0 cursor-pointer rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400/70"
    >
      <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5 border border-white/10 mx-auto mb-2 transition-transform duration-300 hover:scale-105 hover:border-yellow-400/35">
        {person.profileUrl
          ? <img src={person.profileUrl} alt={person.name} className="w-full h-full object-cover" loading="lazy" />
          : <div className="w-full h-full bg-white/10 flex items-center justify-center text-gray-600 text-lg font-black">{person.name[0]}</div>
        }
      </div>
      <p className="text-[11px] font-bold text-white leading-tight truncate">{person.name}</p>
      {person.character && <p className="text-[10px] text-gray-500 truncate mt-0.5">{person.character}</p>}
    </button>
  )
}

// ── Hero with trailer crossfade ───────────────────────────────────────────────
function MovieHero({ movie, onBack, myList }) {
  const [showTrailer, setShowTrailer] = useState(false)
  const [muted, setMuted] = useState(true)
  const iframeRef = useRef(null)
  const timerRef = useRef(null)

  const trailerSrc = movie.trailerKey
    ? `https://www.youtube.com/embed/${movie.trailerKey}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&enablejsapi=1`
    : null

  const postToIframe = (cmd) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: 'command', func: cmd }),
      '*'
    )
  }

  const toggleMute = () => {
    const next = !muted
    setMuted(next)
    postToIframe(next ? 'mute' : 'unMute')
  }

  useEffect(() => {
    if (!trailerSrc) return
    timerRef.current = setTimeout(() => setShowTrailer(true), 5000)
    return () => clearTimeout(timerRef.current)
  }, [trailerSrc])

  // YouTube postMessage — state 0 = ended → show poster again
  useEffect(() => {
    const onMessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.event === 'onStateChange' && data.info === 0) {
          setShowTrailer(false)
        }
      } catch (_) {}
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Reset on movie change
  useEffect(() => {
    setShowTrailer(false)
    setMuted(true)
  }, [movie.tmdbId])

  return (
    <div className="relative h-[45vw] min-h-[280px] md:h-[80vh] w-full overflow-hidden bg-black">

      {/* Poster — always underneath */}
      {movie.backdropUrl && (
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="eager"
        />
      )}

      {/* Trailer iframe — preloads hidden, fades in after 5s */}
      {trailerSrc && (
        <AnimatePresence>
          {showTrailer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5 }}
              className="absolute inset-0 w-full h-full"
            >
              <iframe
                ref={iframeRef}
                src={trailerSrc}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="w-full h-full scale-[1.15] pointer-events-none"
                style={{ border: 'none' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Overlays */}
      <div className="absolute inset-0 bg-black/30 z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/10 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent z-10" />

      {/* Mute/Unmute — trailer chal raha ho tab dikhao */}
      <AnimatePresence>
        {showTrailer && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => { e.stopPropagation(); toggleMute() }}
            className="absolute bottom-6 md:bottom-10 right-4 md:right-12 z-20 w-10 h-10 rounded-full bg-black/40 border border-white/20 backdrop-blur-sm text-white hover:bg-black/60 transition-all flex items-center justify-center"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Back btn */}
      <button
        type="button"
        onClick={onBack}
        className="absolute top-16 left-4 md:top-20 md:left-12 z-20 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-colors bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full"
      >
        <ChevronLeft className="w-3.5 h-3.5" /> Back
      </button>

      {/* My list — top right, aligned with Back; icon-only circle */}
      {myList && (
        <button
          type="button"
          onClick={myList.onToggle}
          disabled={myList.busy}
          title={myList.inList ? 'Remove from my list' : 'Save to my list'}
          aria-label={myList.inList ? 'Remove from my list' : 'Save to my list'}
          className={`absolute top-16 right-4 md:top-20 md:right-12 z-20 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border backdrop-blur-sm transition-colors disabled:opacity-50 ${
            myList.inList
              ? 'border-yellow-400/55 bg-yellow-400/15 text-yellow-400 hover:bg-yellow-400/25'
              : 'border-white/15 bg-black/30 text-white hover:border-yellow-400/45 hover:text-yellow-400'
          }`}
        >
          {myList.inList ? <BookmarkCheck className="w-5 h-5" /> : <BookmarkPlus className="w-5 h-5" />}
        </button>
      )}

      {/* Hero content */}
      <div className="absolute bottom-4 md:bottom-8 left-4 md:left-12 z-20 max-w-[70%] md:max-w-2xl">
        {movie.logoUrl
          ? <img src={movie.logoUrl} alt={movie.title} className="h-10 md:h-24 w-auto object-contain mb-2 md:mb-4 max-w-[300px]" loading="lazy" />
          : <h1 className="text-2xl md:text-6xl font-heading text-white uppercase tracking-tighter mb-2 md:mb-4 leading-tight">{movie.title}</h1>
        }
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MovieDetailPage() {
  const { tmdbId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState(false)
  const [adBlockEnabled, setAdBlockEnabled] = useState(true)
  const [inMyList, setInMyList] = useState(false)
  const [myListBusy, setMyListBusy] = useState(false)
  const [related, setRelated] = useState([])
  const [relPage, setRelPage] = useState(1)
  const [relTotalPages, setRelTotalPages] = useState(1)
  const [relLoading, setRelLoading] = useState(false)
  const [showCaptionHint, setShowCaptionHint] = useState(false)
  const captionHintShownRef = useRef(false)
  const loaderRef = useRef(null)

  // Block popups from iframe ads and refocus window
  useEffect(() => {
    if (!playing || !adBlockEnabled) return

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
  }, [playing, adBlockEnabled])

  useEffect(() => {
    setLoading(true)
    setMovie(null)
    setRelated([])
    window.scrollTo(0, 0)
    apiFetch(`movies/${tmdbId}`)
      .then(r => r?.json())
      .then(d => {
        setMovie(d)
        // Broadcast movie context to the Unified Tracker
        if (d) {
          window.dispatchEvent(new CustomEvent('mbx_movie_context', {
            detail: {
              tmdbId: d.tmdbId,
              title: d.title,
              posterUrl: d.posterUrl,
              genreIds: d.genreIds,
              originalLanguage: d.originalLanguage
            }
          }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    // Clear context when leaving the page
    return () => {
      window.dispatchEvent(new CustomEvent('mbx_movie_context', { detail: null }))
    }
  }, [tmdbId])

  useEffect(() => {
    if (!tmdbId || user === undefined || user === null) {
      setInMyList(false)
      return
    }
    apiFetch(`my-list/check/${tmdbId}`)
      .then((r) => (r ? r.json() : null))
      .then((d) => setInMyList(Boolean(d?.inList)))
      .catch(() => setInMyList(false))
  }, [tmdbId, user])

  useEffect(() => {
    if (!tmdbId) return
    setRelLoading(true)
    apiFetch(`movies/${tmdbId}/related?page=1`)
      .then(r => r?.json())
      .then(d => {
        setRelated(d?.results || [])
        setRelTotalPages(d?.totalPages || 1)
        setRelPage(1)
      })
      .catch(() => {})
      .finally(() => setRelLoading(false))
  }, [tmdbId])

   useEffect(() => {
     const el = loaderRef.current
     if (!el) return
     const obs = new IntersectionObserver(entries => {
       if (entries[0].isIntersecting && relPage < relTotalPages && !relLoading) {
         const next = relPage + 1
         setRelLoading(true)
         apiFetch(`movies/${tmdbId}/related?page=${next}`)
           .then(r => r?.json())
           .then(d => {
             setRelated(prev => [...prev, ...(d?.results || [])])
             setRelPage(next)
             setRelTotalPages(d?.totalPages || relTotalPages)
           })
           .catch(() => {})
           .finally(() => setRelLoading(false))
       }
     }, { threshold: 0.1 })
     obs.observe(el)
     return () => obs.disconnect()
   }, [relPage, relTotalPages, relLoading, tmdbId])

  if (loading) return (
    <div className="min-h-screen pt-24 px-4 md:px-12">
      <div className="h-[50vh] rounded-2xl bg-white/5 animate-pulse mb-8" />
      <div className="h-8 w-64 rounded-xl bg-white/5 animate-pulse mb-4" />
      <div className="h-4 w-full rounded-xl bg-white/5 animate-pulse" />
    </div>
  )

  if (!movie) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">Movie not found</div>
  )

  const toggleMyList = async () => {
    if (!user || myListBusy) return
    setMyListBusy(true)
    try {
      if (inMyList) {
        const r = await apiFetch(`my-list/${movie.tmdbId}`, { method: 'DELETE' })
        if (r?.ok) setInMyList(false)
      } else {
        const r = await apiFetch('my-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tmdbId: movie.tmdbId,
            title: movie.title,
            posterUrl: movie.posterUrl || '',
          }),
        })
        if (r?.ok) setInMyList(true)
      }
    } catch {
      /* ignore */
    } finally {
      setMyListBusy(false)
    }
  }

  const relatedRows = []
  for (let i = 0; i < related.length; i += CARDS_PER_ROW) {
    relatedRows.push(related.slice(i, i + CARDS_PER_ROW))
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Player Modal */}
      <AnimatePresence>
        {playing && movie?.imdbId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col"
          >
            <style>{`
              @media (max-width: 768px) and (orientation: portrait) {
                .mbx-player-wrap {
                  position: fixed;
                  top: 0; left: 0;
                  width: 100vh;
                  height: 100vw;
                  transform: rotate(90deg) translateX(0) translateY(-100%);
                  transform-origin: top left;
                }
              }
            `}</style>
            <div className="mbx-player-wrap fixed inset-0 z-[200] bg-black flex flex-col">
              <div className="flex items-center gap-3 px-4 md:px-8 py-4 shrink-0">
                <button onClick={() => setPlaying(false)} className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <div className="w-px h-4 bg-white/20" />
                {movie.logoUrl
                  ? <img src={movie.logoUrl} alt={movie.title} className="h-6 w-auto object-contain max-w-[150px]" loading="lazy" />
                  : <span className="text-[13px] font-black uppercase tracking-widest text-white">{movie.title}</span>
                }
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Ad Block</span>
                  <button
                    type="button"
                    onClick={() => setAdBlockEnabled(v => !v)}
                    className={`relative w-10 h-5 rounded-full border transition-all ${
                      adBlockEnabled ? 'bg-green-500/20 border-green-500/40' : 'bg-white/10 border-white/20'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      adBlockEnabled ? 'translate-x-5' : ''
                    }`} />
                  </button>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${
                    adBlockEnabled ? 'text-green-400' : 'text-gray-600'
                  }`}>{adBlockEnabled ? 'ON' : 'OFF'}</span>
                </div>
              </div>
              <div className="relative flex-1">
                <iframe
                  src={`https://streamimdb.ru/embed/movie/${movie.imdbId}`}
                  className="w-full h-full"
                  allowFullScreen
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  style={{ border: 'none' }}
                />
                {/* Transparent overlay to intercept ad clicks */}
                <div
                  className="absolute inset-0 z-10"
                  style={{ pointerEvents: 'none' }}
                  onClickCapture={(e) => {
                    e.stopPropagation()
                    window.focus()
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <MovieHero
        movie={movie}
        onBack={() => navigate(-1)}
        myList={
          user
            ? { inList: inMyList, busy: myListBusy, onToggle: toggleMyList }
            : null
        }
      />

      <div className="px-4 md:px-12 mt-4 space-y-8 md:space-y-12">
        {/* Stats */}
        <div className="flex flex-wrap gap-2 md:gap-3 items-center">
          <StatBadge icon={Star} label="Rating" value={movie.voteAverage ? `${movie.voteAverage} / 10` : null} />
          <StatBadge icon={Clock} label="Runtime" value={runtime(movie.runtime)} />
          <StatBadge icon={Calendar} label="Released" value={movie.releaseDate} />
          <StatBadge icon={TrendingUp} label="Votes" value={movie.voteCount?.toLocaleString()} />
          <StatBadge icon={DollarSign} label="Budget" value={fmt(movie.budget)} />
          <StatBadge icon={DollarSign} label="Revenue" value={fmt(movie.revenue)} />
          {movie.imdbId && (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="flex items-center justify-center bg-yellow-400 hover:bg-yellow-300 transition-colors rounded-full w-10 h-10 shrink-0"
              aria-label="Play"
            >
              <Play className="w-5 h-5 fill-black text-black" />
            </button>
          )}
        </div>

        {/* Overview */}
        {movie.overview && (
          <div>
            <h2 className="font-heading text-2xl md:text-3xl text-yellow-400 mb-3">Overview</h2>
            <p className="text-gray-300 text-sm leading-relaxed max-w-4xl text-justify">{movie.overview}</p>
          </div>
        )}

        {/* Directors */}
        {movie.directors?.length > 0 && (
          <div>
            <h2 className="font-heading text-2xl md:text-3xl text-yellow-400 mb-4">Direction</h2>
            <div className="flex gap-6 flex-wrap">
              {movie.directors.map(d => <CastCard key={d.id} person={d} credit="director" />)}
            </div>
          </div>
        )}

        {/* Cast */}
        {movie.cast?.length > 0 && (
          <div>
            <h2 className="font-heading text-2xl md:text-3xl text-yellow-400 mb-4">Cast</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {movie.cast.map(p => <CastCard key={p.id} person={p} credit="cast" />)}
            </div>
          </div>
        )}

        {/* Production */}
        {movie.productionCompanies?.length > 0 && (
          <div>
            <h2 className="font-heading text-2xl md:text-3xl text-yellow-400 mb-4">Production</h2>
            <div className="flex flex-wrap items-center gap-8">
              {movie.productionCompanies.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    navigate(`/company?id=${c.id}&name=${encodeURIComponent(c.name || '')}`)
                  }
                  className="p-2 -m-2 border-0 bg-transparent cursor-pointer rounded-xl transition-transform duration-300 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-400/70"
                  title={`Movies from ${c.name}`}
                >
                  <ProductionLogo src={c.logoUrl} alt={c.name} variant="detail" companyId={c.id} className="pointer-events-none" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Related */}
        <div>
          <h2 className="font-heading text-2xl md:text-3xl text-yellow-400 mb-4 md:mb-6">More Like This</h2>
          <div className="space-y-6">
            {relatedRows.map((row, i) => (
              <div key={i} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {row.map(m => <MovieCard key={m.tmdbId} movie={m} showTitle />)}
              </div>
            ))}
          </div>
          <div ref={loaderRef} className="h-10 mt-6 flex items-center justify-center">
            {relLoading && <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
          </div>
        </div>
      </div>
    </div>
  )
}
