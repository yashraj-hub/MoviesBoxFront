import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { apiFetch } from '../utils/apiFetch'
import TVShowCard from './TVShowCard'

const LIMIT = 20

export default function TVShelfRail({ shelfKey, label }) {
  const navigate = useNavigate()
  const [shows, setShows] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const scrollRef = useRef(null)
  const fetchingRef = useRef(false)

  const fetchShelf = useCallback(
    async (nextPage) => {
      const endpoint = `tv/discover/${shelfKey}?page=${nextPage}&limit=${LIMIT}`
      return apiFetch(endpoint).then((r) => r?.json())
    },
    [shelfKey],
  )

  const loadPage = useCallback(
    async (nextPage, append = false) => {
      if (append) {
        if (fetchingRef.current) return
        fetchingRef.current = true
        setFetching(true)
      } else {
        setLoading(true)
      }

      try {
        const data = await fetchShelf(nextPage)
        const nextResults = Array.isArray(data?.results) ? data.results : []
        setShows((prev) => (append ? [...prev, ...nextResults] : nextResults))
        setPage(nextPage)
        setTotalPages(data?.totalPages ?? 1)
      } catch {
        if (!append) setShows([])
      } finally {
        if (append) {
          fetchingRef.current = false
          setFetching(false)
        } else {
          setLoading(false)
        }
      }
    },
    [fetchShelf],
  )

  useEffect(() => {
    setShows([])
    setPage(1)
    setTotalPages(1)
    fetchingRef.current = false
    setFetching(false)
    setLoading(true)
    loadPage(1, false)

    const node = scrollRef.current
    if (node) node.scrollTo({ left: 0, behavior: 'auto' })
  }, [loadPage, shelfKey])

  const loadMore = useCallback(async () => {
    if (fetchingRef.current) return
    if (page >= totalPages) return
    await loadPage(page + 1, true)
  }, [loadPage, page, totalPages])

  const onScroll = useCallback(() => {
    const node = scrollRef.current
    if (!node) return
    const remaining = node.scrollWidth - node.scrollLeft - node.clientWidth
    if (remaining < 360) {
      loadMore()
    }
  }, [loadMore])

  const scrollByAmount = (direction) => {
    const node = scrollRef.current
    if (!node) return
    node.scrollBy({ left: direction * Math.max(280, node.clientWidth * 0.82), behavior: 'smooth' })
    if (direction > 0) loadMore()
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
            onClick={() => scrollByAmount(-1)}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount(1)}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition flex items-center justify-center"
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
        <div className="px-4 md:px-12 flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="w-[180px] flex-none sm:w-[220px] md:w-[250px] lg:w-[280px]">
              <div className="aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
            </div>
          ))}
        </div>
      ) : shows.length === 0 ? null : (
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#0a0a0a] to-transparent" />

          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="scrollbar-hide px-4 md:px-12 flex gap-4 overflow-x-auto pb-2 pr-1 snap-x snap-mandatory"
          >
            {shows.map((show) => (
              <div key={show.id} className="w-[180px] flex-none snap-start sm:w-[220px] md:w-[250px] lg:w-[280px]">
                <TVShowCard show={show} showSaveButton={false} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
