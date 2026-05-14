import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { apiFetch } from '../utils/apiFetch'
import MovieCard from './MovieCard'

const CARDS_PER_SLIDE = 5

export default function CategoryRail({ slug, label }) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [slide, setSlide] = useState(0)
  const [apiPage, setApiPage] = useState(1)
  const [apiTotalPages, setApiTotalPages] = useState(1)
  const [fetching, setFetching] = useState(false)
  const [visible, setVisible] = useState(false)
  const railRef = useRef(null)

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
    setLoading(true)
    apiFetch(`categories/${slug}/movies?page=1`)
      .then(r => r?.json())
      .then(d => {
        setMovies(d?.results || [])
        setApiTotalPages(d?.totalPages ?? 1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [visible, slug])

  const visibleCards = movies.slice(slide * CARDS_PER_SLIDE, (slide + 1) * CARDS_PER_SLIDE)
  const canNext = (slide + 1) * CARDS_PER_SLIDE < movies.length || apiPage < apiTotalPages

  const prev = () => setSlide(s => Math.max(0, s - 1))

  const next = async () => {
    const nextSlide = slide + 1
    const needed = (nextSlide + 1) * CARDS_PER_SLIDE
    if (needed >= movies.length && apiPage < apiTotalPages && !fetching) {
      setFetching(true)
      try {
        const nextPage = apiPage + 1
        const d = await apiFetch(`categories/${slug}/movies?page=${nextPage}`).then(r => r?.json())
        setMovies(prev => [...prev, ...(d.results || [])])
        setApiPage(nextPage)
        setApiTotalPages(d.totalPages ?? apiTotalPages)
      } catch (_) {}
      finally { setFetching(false) }
    }
    setSlide(nextSlide)
  }

  return (
    <section ref={railRef} className="mb-14 min-h-[200px]">
      <div className="flex items-center justify-between px-4 md:px-12 mb-5">
        <h2 className="text-xl font-black uppercase tracking-tight text-white">{label}</h2>
        <div className="flex items-center gap-2">
          <button onClick={prev} disabled={slide === 0}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={next} disabled={!canNext || fetching}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed">
            {fetching
              ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              : <ChevronRight className="w-5 h-5" />
            }
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-4 md:px-12 grid grid-cols-5 gap-4">
          {Array.from({ length: CARDS_PER_SLIDE }).map((_, i) => (
            <div key={i} className="rounded-xl bg-white/5 animate-pulse aspect-[2/3]" />
          ))}
        </div>
      ) : movies.length === 0 ? null : (
        <div className="px-4 md:px-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {visibleCards.map((m, i) => (
            <MovieCard key={m.tmdbId ?? m.id ?? i} movie={m} />
          ))}
        </div>
      )}
    </section>
  )
}
