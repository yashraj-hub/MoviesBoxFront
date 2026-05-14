import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../utils/apiFetch'
import MovieRow from './MovieRow'
import ContinueWatchingRow from './ContinueWatchingRow'

export default function TopTrending({ category, title }) {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [deck, setDeck] = useState({ slots: [] })
  const [page, setPage] = useState(0)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    apiFetch(`trending/${category}?window=day`)
      .then(r => r?.json())
      .then(d => {
        if (!mounted) return
        setItems(Array.isArray(d?.items) ? d.items : [])
      })
      .catch(() => {
        if (!mounted) return
        setItems([])
      })
      .finally(() => {
        if (!mounted) return
        setLoading(false)
      })
    return () => { mounted = false }
  }, [category])

  const heading = title || `${category.toUpperCase()} TOP 10 TRENDING`
  const list = useMemo(() => (Array.isArray(items) ? items.slice(0, 10) : []), [items])
  const byId = useMemo(() => new Map(list.map(m => [m.id, m])), [list])
  const rankById = useMemo(() => {
    const map = new Map()
    list.forEach((m, idx) => map.set(m.id, idx + 1))
    return map
  }, [list])

  useEffect(() => {
    const slots = list.slice(0, 5).map((m, idx) => ({ slotId: idx, movieId: m.id }))
    setDeck({ slots })
  }, [list])

  const [itemsPerPage, setItemsPerPage] = useState(5)

  useEffect(() => {
    const updateLayout = () => {
      const isMobile = window.innerWidth < 768
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024
      const newItemsPerPage = isMobile ? 1 : (isTablet ? 3 : 5)
      
      if (newItemsPerPage !== itemsPerPage) {
        setItemsPerPage(newItemsPerPage)
        setPage(0)
      }
    }
    
    // Initial check
    updateLayout()
    
    window.addEventListener('resize', updateLayout)
    return () => window.removeEventListener('resize', updateLayout)
  }, [itemsPerPage])

  const pages = useMemo(() => {
    const p = []
    for (let i = 0; i < list.length; i += itemsPerPage) {
      const chunk = list.slice(i, i + itemsPerPage)
      if (chunk.length === itemsPerPage) {
        p.push(chunk)
      }
    }
    return p
  }, [list, itemsPerPage])

  useEffect(() => {
    const slots = list.slice(0, itemsPerPage).map((m, idx) => ({ slotId: idx, movieId: m.id }))
    setDeck({ slots })
  }, [list, itemsPerPage])

  useEffect(() => {
    if (loading) return
    if (pages.length < 2) return

    // We want to replace cards one by one from the CURRENT page to the NEXT page, in order.
    let transitionQueue = []
    let isTransitioning = false
    let idleCount = 0

    const interval = setInterval(() => {
      setPage(currentPage => {
        setDeck(prev => {
          const nextPageIndex = (currentPage + 1) % pages.length
          const nextPageMovies = pages[nextPageIndex]

          if (!isTransitioning) {
            // Stay idle for a few seconds before starting the next page transition
            if (idleCount < 8) { // 8 * 400ms = 3.2 seconds
              idleCount++
              return prev
            }
            idleCount = 0
            isTransitioning = true
            transitionQueue = Array.from({ length: prev.slots.length }, (_, i) => i) // sequential order based on slot length
          }

          // If there are still cards to transition
          if (transitionQueue.length > 0) {
            const slotIndex = transitionQueue.shift()
            const nextSlots = prev.slots.map((s, idx) => {
              if (idx === slotIndex && nextPageMovies[idx]) {
                return { ...s, movieId: nextPageMovies[idx].id }
              }
              return s
            })

            // If queue is empty now, we've fully transitioned to the next page
            if (transitionQueue.length === 0) {
              // Note: isTransitioning stays true for one more tick so the page updates
              return { slots: nextSlots }
            }
            return { slots: nextSlots }
          }
          
          if (isTransitioning && transitionQueue.length === 0) {
             isTransitioning = false
          }

          return prev
        })

        if (transitionQueue.length === 0 && isTransitioning) {
          return (currentPage + 1) % pages.length
        }
        return currentPage
      })
    }, 400) // Fast enough for sequential change

    return () => clearInterval(interval)
  }, [pages, loading])

  const slotMotion = {
    initial: { opacity: 0, y: 10, scale: 0.985 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
    exit: { opacity: 0, y: -10, scale: 0.985, transition: { duration: 0.25, ease: 'easeIn' } },
  }

  return (
    <section className="mt-8 md:-mt-28 relative z-30 px-6 md:px-12">
      <div className="flex items-end justify-end gap-6 mb-2 md:mb-0">
        <div className="relative z-20 -mb-4 md:-mb-8 lg:-mb-10 text-[32px] md:text-5xl lg:text-6xl font-heading italic font-black uppercase tracking-tight text-white/90 drop-shadow-[0_18px_45px_rgba(0,0,0,0.6)] text-right will-change-auto">
          {heading}
        </div>
      </div>

      {loading ? (
        <div className="h-[220px] md:h-[260px] bg-white/5 rounded-2xl animate-pulse" />
      ) : (
        <div className="relative">
          <div className="flex flex-col md:grid md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {deck.slots.map((slot) => {
              const movie = byId.get(slot.movieId)
              if (!movie) return null
              const rank = rankById.get(movie.id)
              return (
                <div key={slot.slotId} onClick={() => movie && navigate(`/movie/${movie.id}`)} className="relative w-full max-w-[85%] md:max-w-none mx-auto md:mx-0 cursor-pointer">
                  <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 aspect-[4/5] sm:aspect-[16/9] md:aspect-auto">
                    <div className="w-full h-full md:aspect-[2/3] bg-white/5 hidden md:block" />
                    <AnimatePresence initial={false} mode="sync">
                      <motion.div
                        key={movie.id}
                        variants={slotMotion}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute inset-0"
                      >
                        {movie.posterUrl ? (
                          <img src={movie.backdropUrl || movie.posterUrl} alt={movie.title} className="w-full h-full object-cover md:hidden" loading="lazy" />
                        ) : null}
                        {movie.posterUrl ? (
                          <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover hidden md:block" loading="lazy" />
                        ) : (
                          <div className="w-full h-full bg-white/5" />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  {rank != null && (
                    <div className="absolute -bottom-1 -right-2 md:-bottom-2 md:-right-3 text-[60px] md:text-[60px] font-black italic leading-none text-white/90 drop-shadow-[0_15px_35px_rgba(0,0,0,0.8)] z-10">
                      {rank}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Continue Watching Row — integrated directly below trending grid */}
          <div className="mt-6 md:mt-8">
            <ContinueWatchingRow title="CONTINUE WATCHING" endpoint="continue-watching" />
          </div>
        </div>
      )}
    </section>
  )
}
