import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { apiFetch } from '../utils/apiFetch'
import ProductionLogo from './ProductionLogo'

function MetaDot() {
  return <span className="opacity-50">·</span>
}

function HeroSlide({ movie, showContent, bgY, contentY }) {
  const year = movie.releaseYear
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null
  const language = movie.originalLanguage?.toUpperCase()
  const rating = movie.voteAverage
  const bg = movie.backdropUrl || movie.posterUrl

  return (
    <div className="relative h-full w-full">
      <motion.div className="absolute inset-0 z-0" style={{ y: bgY }}>
        {bg && (
          <motion.img
            key={bg}
            src={bg}
            alt=""
            className="h-[120%] w-full object-cover object-center"
            initial={{ scale: 1.03 }}
            animate={{ scale: 1 }}
            transition={{ duration: 6, ease: 'easeOut' }}
            loading="eager"
          />
        )}
      </motion.div>

      <div className="absolute inset-0 bg-black/40 z-10" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent z-10 hidden md:block" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-black/20 md:from-[#0a0a0a] md:via-[#0a0a0a]/40 md:to-black/20 z-10" />

      <motion.div style={{ y: contentY }} className="relative z-20 h-full flex flex-col justify-end pb-2 md:pb-44 pl-6 md:pl-16 pr-6 md:pr-16 items-start">
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-4xl"
          >
            {movie.logoUrl ? (
              <img
                src={movie.logoUrl}
                alt={movie.title}
                className="h-12 md:h-20 lg:h-24 w-auto object-contain mb-4 drop-shadow-[0_18px_45px_rgba(0,0,0,0.85)] mx-0"
                loading="eager"
              />
            ) : (
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-heading text-white mb-3 tracking-tighter uppercase leading-[0.9] text-left">
                {movie.title}
              </h1>
            )}

            <div className="flex flex-wrap items-center justify-start gap-2 md:gap-3 text-[10px] md:text-xs text-gray-300 uppercase tracking-wide">
              {year && <span className="text-white font-bold">{year}</span>}
              {year && <MetaDot />}
              {language && <span>{language}</span>}
              {language && (runtime || rating != null || movie.status) && <MetaDot />}
              {runtime && <span>{runtime}</span>}
              {runtime && (rating != null || movie.status) && <MetaDot />}
              {rating != null && (
                <span className="text-white font-bold flex items-center gap-1">
                  <Star className="w-3 h-3 fill-red-600 text-red-600" />
                  {Number(rating).toFixed(1)}
                </span>
              )}
              {rating != null && movie.status && <MetaDot />}
              {movie.status && <span>{movie.status}</span>}
            </div>

            <p className="text-[11px] md:text-sm text-gray-200 mb-4 md:mb-6 leading-relaxed font-medium max-w-3xl opacity-90 pr-0 md:pr-32 text-left mt-3 md:mt-4 line-clamp-3 md:line-clamp-none">
              {movie.overview}
            </p>

            {movie.productionCompanies?.length > 0 && (
              <div className="flex flex-wrap items-center justify-start gap-2 md:gap-3 mt-2">
                {movie.productionCompanies.map((c) => (
                  <ProductionLogo key={c.id} src={c.logoUrl} alt={c.name} variant="hero" companyId={c.id} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export default function HeroSection({ category, showContent = true }) {
  const [items, setItems] = useState([])
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(true)
  const activeRef = useRef(0)
  const loadedBgRef = useRef(new Set())
  const containerRef = useRef(null)

  const { scrollY } = useScroll()
  const bgY = useTransform(scrollY, [0, 600], [0, 180])
  const contentY = useTransform(scrollY, [0, 600], [0, 80])

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setActive(0)
    apiFetch(`hero/${category}`)
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

  const getBgUrl = (movie) => movie?.backdropUrl || movie?.posterUrl || null

  const preloadBg = (url) => {
    if (!url) return Promise.resolve()
    if (loadedBgRef.current.has(url)) return Promise.resolve()
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        loadedBgRef.current.add(url)
        resolve()
      }
      img.onerror = () => resolve()
      img.src = url
    })
  }

  useEffect(() => {
    if (!items.length) return
    preloadBg(getBgUrl(items[0]))
    preloadBg(getBgUrl(items[1]))
  }, [items])

  useEffect(() => {
    if (!items.length) return
    let cancelled = false

    const tick = () => {
      const currentIndex = activeRef.current
      const nextIndex = (currentIndex + 1) % items.length
      const nextBg = getBgUrl(items[nextIndex])

      if (!nextBg || loadedBgRef.current.has(nextBg)) {
        activeRef.current = nextIndex
        setActive(nextIndex)
        return
      }

      preloadBg(nextBg).then(() => {
        if (cancelled) return
        activeRef.current = nextIndex
        setActive(nextIndex)
      })
    }

    const interval = setInterval(() => {
      tick()
    }, 5000)

    return () => clearInterval(interval)
  }, [items])

  const current = useMemo(() => (items.length ? items[active % items.length] : null), [items, active])
  const navigate = useNavigate()

  if (loading) {
    return <div className="h-[75vh] md:h-screen w-full bg-[#0a0a0a] animate-pulse" />
  }

  if (!current) {
    return <div className="h-[75vh] md:h-screen w-full bg-[#0a0a0a]" />
  }

  return (
    <div
      ref={containerRef}
      className="relative h-[75vh] md:h-screen w-full overflow-hidden bg-[#0a0a0a] cursor-pointer"
      onClick={() => current?.id && navigate(`/movie/${current.id}`)}
    >
      <AnimatePresence mode="sync" initial={false}>
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <HeroSlide movie={current} showContent={showContent} bgY={bgY} contentY={contentY} />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
