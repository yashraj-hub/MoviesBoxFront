import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { apiFetch } from '../utils/apiFetch'
import ProductionLogo from './ProductionLogo'
import MovieCard from './MovieCard'

const CARDS_MOBILE = 4
const CARDS_DESKTOP = 5

export default function ProductionHouseRail({ category, companyId, name, logoUrl }) {
  const navigate = useNavigate()
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [slide, setSlide] = useState(0)
  const [apiPage, setApiPage] = useState(1)
  const [apiTotalPages, setApiTotalPages] = useState(1)
  const [source, setSource] = useState('tmdb')
  const [fetching, setFetching] = useState(false)
  const [visible, setVisible] = useState(false)
  const [cardsPerSlide, setCardsPerSlide] = useState(CARDS_MOBILE)
  const railRef = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const sync = () => setCardsPerSlide(mq.matches ? CARDS_DESKTOP : CARDS_MOBILE)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (movies.length === 0) return
    setSlide((s) => {
      const maxSlide = Math.max(0, Math.ceil(movies.length / cardsPerSlide) - 1)
      return Math.min(s, maxSlide)
    })
  }, [cardsPerSlide, movies.length])

  // Lazy load — fetch only when scrolled into view
  useEffect(() => {
    const el = railRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight + 200) { setVisible(true); return }
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { rootMargin: '200px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    setMovies([])
    setSlide(0)
    setApiPage(1)
    setApiTotalPages(1)
    setLoading(true)

    apiFetch(`production-house/${category}/${companyId}/movies?page=1`)
      .then(r => r?.json())
      .then(d => {
        setMovies(d?.results || [])
        setApiPage(1)
        setApiTotalPages(d?.tmdbTotalPages ?? d?.totalPages ?? 1)
        setSource(d?.source || 'tmdb')
      })
      .catch(() => setMovies([]))
      .finally(() => setLoading(false))
  }, [category, companyId, visible])

  const visibleCards = movies.slice(slide * cardsPerSlide, (slide + 1) * cardsPerSlide)

  const prev = () => setSlide(s => Math.max(0, s - 1))

  const next = async () => {
    const nextSlide = slide + 1
    const neededMovies = (nextSlide + 1) * cardsPerSlide

    if (neededMovies >= movies.length && apiPage < apiTotalPages && !fetching) {
      setFetching(true)
      try {
        const nextApiPage = apiPage + 1
        const d = await apiFetch(
          `production-house/${category}/${companyId}/movies?page=${nextApiPage}`
        ).then(r => r?.json())
        setMovies(prev => [...prev, ...(d.results || [])])
        setApiPage(nextApiPage)
        // Once we switch to TMDB source, update total pages
        if (d.source === 'tmdb') {
          setApiTotalPages(d.totalPages ?? apiTotalPages)
          setSource('tmdb')
        }
      } catch (_) {}
      finally { setFetching(false) }
    }

    setSlide(nextSlide)
  }

  const canNext = (slide + 1) * cardsPerSlide < movies.length || apiPage < apiTotalPages

  return (
    <section ref={railRef} className="mb-14">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 md:px-12 mb-4 md:mb-5">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 pr-2">
          {logoUrl ? (
            <div
              className="cursor-pointer shrink-0"
              onClick={() => navigate(`/production-house/${category}/${companyId}`)}
              role="presentation"
            >
              <ProductionLogo src={logoUrl} alt={name} variant="rail" companyId={companyId} />
            </div>
          ) : (
            <span
              onClick={() => navigate(`/production-house/${category}/${companyId}`)}
              className="text-base sm:text-lg md:text-xl font-black uppercase tracking-tight text-white cursor-pointer hover:text-yellow-400 transition-colors truncate"
            >{name}</span>
          )}

        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={prev}
            disabled={slide === 0}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={next}
            disabled={!canNext || fetching}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {fetching ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Cards — mobile: 4 per slide (2×2); md+: 5 in one row */}
      {loading ? (
        <div className="px-4 md:px-12 grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
          {Array.from({ length: cardsPerSlide }).map((_, i) => (
            <div key={i} className="rounded-lg sm:rounded-xl bg-white/5 animate-pulse aspect-[2/3]" />
          ))}
        </div>
      ) : movies.length === 0 ? null : (
        <div className="px-4 md:px-12 grid grid-cols-2 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
          {visibleCards.map((m, i) => (
            <MovieCard key={m.tmdbId ?? m.id ?? i} movie={m} />
          ))}
        </div>
      )}
    </section>
  )
}
