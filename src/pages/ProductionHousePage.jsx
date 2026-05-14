import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import ProductionLogo from '../components/ProductionLogo'
import MovieCard from '../components/MovieCard'

const TOKEN_KEY = 'moviesbox_token'
const API_BASE = '/api'
const LIMIT = 20

export default function ProductionHousePage() {
  const { category, companyId } = useParams()
  const navigate = useNavigate()
  const token = localStorage.getItem(TOKEN_KEY)

  const [house, setHouse] = useState(null)
  const [movies, setMovies] = useState([])
  const [apiPage, setApiPage] = useState(1)
  const [apiTotalPages, setApiTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [bgIndex, setBgIndex] = useState(0)
  const loaderRef = useRef(null)
  const bgTimerRef = useRef(null)
  const heroRef = useRef(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])

  // Fetch house info + logo
  useEffect(() => {
    fetch(`${API_BASE}/production-house/${category}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        const found = d.houses?.find(h => String(h.id) === String(companyId))
        setHouse(found || null)
      })
      .catch(() => {})
  }, [category, companyId, token])

  // Fetch first page of movies
  useEffect(() => {
    setLoading(true)
    setMovies([])
    setApiPage(1)
    window.scrollTo(0, 0)

    fetch(`${API_BASE}/production-house/${category}/${companyId}/movies?page=1`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        setMovies(d.results || [])
        setApiPage(1)
        setApiTotalPages(d.tmdbTotalPages ?? d.totalPages ?? 1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [category, companyId, token])

  // BG slideshow — cycle through loaded movie backdrops
  const bgMovies = movies.filter(m => m.backdropPath || m.posterPath)
  useEffect(() => {
    if (bgMovies.length < 2) return
    bgTimerRef.current = setInterval(() => {
      setBgIndex(i => (i + 1) % bgMovies.length)
    }, 5000)
    return () => clearInterval(bgTimerRef.current)
  }, [bgMovies.length])

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && apiPage < apiTotalPages && !fetching) {
        const next = apiPage + 1
        setFetching(true)
        fetch(`${API_BASE}/production-house/${category}/${companyId}/movies?page=${next}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(r => r.json())
          .then(d => {
            setMovies(prev => [...prev, ...(d.results || [])])
            setApiPage(next)
            setApiTotalPages(d.tmdbTotalPages ?? d.totalPages ?? apiTotalPages)
          })
          .catch(() => {})
          .finally(() => setFetching(false))
      }
    }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [apiPage, apiTotalPages, fetching, category, companyId, token])

  const bgMovie = bgMovies[bgIndex]
  const bgUrl = bgMovie?.backdropPath || bgMovie?.posterPath || null

  return (
    <div className="min-h-screen pb-24">
      {/* Hero BG */}
      <div ref={heroRef} className="relative h-[50vh] md:h-[60vh] w-full overflow-hidden bg-black">
        <AnimatePresence mode="sync">
          {bgUrl && (
            <motion.div
              key={bgIndex}
              className="absolute inset-0 w-full h-[130%] -top-[15%]"
              style={{ y: bgY }}
            >
              <motion.img
                src={bgUrl}
                alt=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="w-full h-full object-cover object-top"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-black/40" />

        {/* Back btn */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-20 left-4 md:left-12 z-30 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white transition-colors bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>

        {/* Logo — centered */}
        <div className="absolute inset-0 flex items-center justify-center z-20 px-4">
          {house?.logoUrl ? (
            <ProductionLogo src={house.logoUrl} alt={house.name} variant="pageHero" companyId={companyId} />
          ) : (
            <h1 className="text-4xl md:text-6xl font-heading text-white uppercase tracking-tighter">
              {house?.name || ''}
            </h1>
          )}
        </div>
      </div>

      {/* Movies Grid */}
      <div className="px-4 md:px-12 mt-8">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white/5 animate-pulse aspect-[2/3]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {movies.map((m, i) => (
              <MovieCard key={m.tmdbId ?? m.id ?? i} movie={m} />
            ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        <div ref={loaderRef} className="h-10 mt-8 flex items-center justify-center">
          {fetching && (
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          )}
        </div>
      </div>
    </div>
  )
}
