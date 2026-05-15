import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronRight as ChevronNext } from 'lucide-react'
import { apiFetch } from '../utils/apiFetch'
import ProductionLogo from './ProductionLogo'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'

function getPosterUrl(movie) {
  if (!movie) return null
  if (movie.posterUrl) return movie.posterUrl
  if (movie.posterPath) return movie.posterPath
  if (movie.poster_path) return `${TMDB_IMG}${movie.poster_path}`
  return null
}

function getTitle(movie) {
  return movie?.title || movie?.name || ''
}

function formatCount(n) {
  if (n == null) return null
  try { return Number(n).toLocaleString() } catch { return String(n) }
}

export default function MediaRail({
  title,
  logoUrl,
  primaryEndpoint,
  fallbackEndpoint,
  limit = 20,
  countLabel = 'titles',
}) {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(null)
  const [loading, setLoading] = useState(true)
  const scrollerRef = useRef(null)

  const headerCount = useMemo(() => {
    const c = formatCount(total)
    return c ? `${c} ${countLabel}` : null
  }, [countLabel, total])

  useEffect(() => {
    const ac = new AbortController()

    const parse = (d) => {
      const list = d?.items || d?.results || []
      const t = d?.totalResults ?? d?.total_results ?? d?.total ?? null
      return { list: Array.isArray(list) ? list : [], total: t }
    }

    const load = async () => {
      try {
        setLoading(true)

        const primary = await apiFetch(primaryEndpoint, { signal: ac.signal }).then(r => r?.json())
        const p = parse(primary)

        if (p.list.length > 0 || !fallbackEndpoint) {
          setItems(p.list.slice(0, limit))
          setTotal(p.total ?? p.list.length)
          return
        }

        const fallback = await apiFetch(fallbackEndpoint, { signal: ac.signal }).then(r => r?.json())
        const f = parse(fallback)
        setItems(f.list.slice(0, limit))
        setTotal(f.total ?? f.list.length)
      } catch (e) {
        if (e?.name === 'AbortError') return
        setItems([])
        setTotal(null)
      } finally {
        if (!ac.signal.aborted) setLoading(false)
      }
    }

    load()
    return () => ac.abort()
  }, [fallbackEndpoint, limit, primaryEndpoint])

  const scrollByCard = (dir) => {
    const el = scrollerRef.current
    if (!el) return
    const first = el.querySelector('[data-rail-card]')
    const cardWidth = first?.getBoundingClientRect().width || 240
    const gap = 16
    el.scrollBy({ left: dir * (cardWidth + gap) * 3, behavior: 'smooth' })
  }

  return (
    <section className="mb-14">
      <div className="flex items-center justify-between px-4 md:px-12 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          {logoUrl ? (
            <ProductionLogo src={logoUrl} alt={title} variant="sm" />
          ) : (
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white">{title}</h2>
          )}

          {headerCount && (
            <div className="flex items-center gap-1 text-[10px] md:text-[11px] font-black uppercase tracking-[0.35em] text-yellow-400 whitespace-nowrap">
              <span>{headerCount}</span>
              <ChevronNext className="w-3.5 h-3.5 opacity-70" />
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition flex items-center justify-center"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white/80 hover:text-white hover:bg-white/10 transition flex items-center justify-center"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-4 md:px-12">
          <div className="h-[220px] rounded-2xl bg-white/5 animate-pulse" />
        </div>
      ) : (
        <div className="relative">
          <div
            ref={scrollerRef}
            className="px-4 md:px-12 overflow-x-auto scroll-smooth snap-x snap-mandatory flex gap-4 md:gap-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {items.map((m, idx) => {
              const poster = getPosterUrl(m)
              const label = getTitle(m)
              return (
                <div
                  key={m.id ?? m.tmdbId ?? `${label}-${idx}`}
                  data-rail-card
                  className="snap-start flex-none w-[44vw] sm:w-[28vw] md:w-[220px] lg:w-[240px]"
                >
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                    {poster ? (
                      <img src={poster} alt={label} className="w-full aspect-[2/3] object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-white/5" />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

