import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Star } from 'lucide-react'
import { apiFetch } from '../utils/apiFetch'

export default function TVHeroSection() {
  const navigate = useNavigate()
  const [shows, setShows] = useState([])
  const [active, setActive] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    apiFetch('tv/discover/trending?limit=5')
      .then((res) => res?.json())
      .then((data) => {
        if (!mounted) return
        setShows(Array.isArray(data?.results) ? data.results : [])
      })
      .catch(() => {
        if (!mounted) return
        setShows([])
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (shows.length < 2) return
    const id = setInterval(() => {
      setActive((current) => (current + 1) % shows.length)
    }, 5000)
    return () => clearInterval(id)
  }, [shows.length])

  const current = useMemo(() => shows[active] || null, [shows, active])

  if (loading) {
    return <div className="h-[72vh] w-full animate-pulse bg-white/5" />
  }

  if (!current) {
    return <div className="h-[72vh] w-full bg-[#0a0a0a]" />
  }

  const backdrop = current.backdropUrl || current.posterUrl || null
  const year = current.firstAirDate ? current.firstAirDate.slice(0, 4) : null

  return (
    <section
      className="relative h-[72vh] w-full overflow-hidden bg-[#0a0a0a] cursor-pointer"
      onClick={() => navigate(`/tv/${current.id}`)}
      role="presentation"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {backdrop ? (
            <motion.img
              src={backdrop}
              alt=""
              className="h-[120%] w-full object-cover object-center"
              initial={{ scale: 1.03 }}
              animate={{ scale: 1 }}
              transition={{ duration: 6, ease: 'easeOut' }}
              loading="eager"
            />
          ) : null}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-black/38" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/22 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/28 to-black/5" />

      <div className="relative z-10 flex h-full flex-col justify-end px-4 md:px-12 pb-12 md:pb-16">
        <div className="max-w-4xl">
          {current.logoUrl ? (
            <img
              src={current.logoUrl}
              alt={current.name}
              className="mb-4 max-h-20 w-auto max-w-[360px] object-contain md:max-h-24 md:max-w-[480px]"
              loading="eager"
            />
          ) : (
            <h1 className="max-w-4xl font-heading text-5xl md:text-7xl uppercase leading-[0.88] text-white">
              {current.name}
            </h1>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.25em] text-gray-300">
            {year ? <span>{year}</span> : null}
            {typeof current.voteAverage === 'number' ? (
              <span className="inline-flex items-center gap-1 text-white">
                <Star className="h-3.5 w-3.5 text-yellow-400" />
                {current.voteAverage.toFixed(1)}
              </span>
            ) : null}
            {current.originalLanguage ? <span>{current.originalLanguage.toUpperCase()}</span> : null}
            {current.status ? <span>{current.status}</span> : null}
          </div>
          {current.overview ? (
            <p className="mt-5 max-w-2xl line-clamp-3 text-sm leading-7 text-gray-200">
              {current.overview}
            </p>
          ) : null}

        </div>
      </div>
    </section>
  )
}
