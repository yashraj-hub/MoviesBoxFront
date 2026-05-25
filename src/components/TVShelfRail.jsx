import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { apiFetch } from '../utils/apiFetch'
import TVShowCard from './TVShowCard'

export default function TVShelfRail({ shelfKey, label, kind = 'discover' }) {
  const navigate = useNavigate()
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [fetching, setFetching] = useState(false)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const endpoint =
          kind === 'trending'
            ? `tv/discover/${shelfKey}?limit=10`
            : `tv/discover/${shelfKey}?page=1&limit=20`
        const res = await apiFetch(endpoint)
        const data = await res?.json()
        if (!mounted) return
        setShows(Array.isArray(data?.results) ? data.results : [])
        setTotalPages(data?.totalPages ?? 1)
        setPage(1)
        setSlide(0)
      } catch {
        if (!mounted) return
        setShows([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [kind, shelfKey])

  const pageCards = useMemo(() => shows.slice(slide * 5, (slide + 1) * 5), [shows, slide])

  const prev = () => setSlide((current) => Math.max(0, current - 1))

  const next = async () => {
    const nextSlide = slide + 1
    const needed = (nextSlide + 1) * 5
    if (needed >= shows.length && page < totalPages && !fetching) {
      setFetching(true)
      try {
        const nextPage = page + 1
        const res = await apiFetch(`tv/discover/${shelfKey}?page=${nextPage}&limit=20`)
        const data = await res?.json()
        setShows((prevShows) => [...prevShows, ...(Array.isArray(data?.results) ? data.results : [])])
        setPage(nextPage)
        setTotalPages(data?.totalPages ?? totalPages)
      } catch {
        // ignore
      } finally {
        setFetching(false)
      }
    }
    setSlide(nextSlide)
  }

  return (
    <section className="mb-14">
      <div className="flex items-center justify-between gap-3 px-4 md:px-12 mb-4">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => navigate(`/tv-shelf/${shelfKey}`)}
            className="text-left group inline-flex flex-col items-start"
            aria-label={`Open ${label}`}
          >
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white group-hover:text-yellow-400 transition-colors">
              {label}
            </h2>
            <span className="mt-1 text-[10px] font-black uppercase tracking-[0.28em] text-gray-500 group-hover:text-gray-300 transition-colors">
              View all
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prev}
            disabled={slide === 0}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={next}
            disabled={fetching || (slide + 1) * 5 >= shows.length && page >= totalPages}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {fetching ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <ChevronRight className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-4 md:px-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : shows.length === 0 ? null : (
        <div className="px-4 md:px-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {pageCards.map((show) => (
            <TVShowCard key={show.id} show={show} />
          ))}
        </div>
      )}
    </section>
  )
}
