import { useEffect, useState } from 'react'
import MovieCard from './MovieCard'

const TOKEN_KEY = 'moviesbox_token'
const API_BASE = '/api'

export default function MovieRow({ title, endpoint, totalLabel }) {
  const [movies, setMovies] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(null)
  const [totalResults, setTotalResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const token = localStorage.getItem(TOKEN_KEY)

  useEffect(() => {
    setLoading(true)
    fetch(`${API_BASE}/${endpoint}?page=1`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setMovies(d.results || [])
        setTotalPages(d.totalPages ?? d.total_pages ?? null)
        setTotalResults(d.totalResults ?? d.total_results ?? null)
        setPage(1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [endpoint, token])

  const loadMore = async () => {
    setLoadingMore(true)
    const next = page + 1
    const d = await fetch(`${API_BASE}/${endpoint}?page=${next}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    setMovies(p => [...p, ...(d.results || [])])
    setPage(next)
    setLoadingMore(false)
  }

  return (
    <div className="mb-16">
      <div className="flex items-baseline gap-4 mb-6 px-4 md:px-12">
        <h2 className="font-heading text-3xl md:text-4xl text-white">{title}</h2>
        {totalResults != null && (
          <span className="text-[11px] uppercase tracking-[0.2em] text-gray-500 font-bold">{totalResults.toLocaleString()} movies</span>
        )}
      </div>
      {loading ? (
        <div className="px-4 md:px-12 text-gray-600 text-sm italic">Loading amazing movies...</div>
      ) : movies.length > 0 ? (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-5 px-4 md:px-12">
            {movies.map(m => <MovieCard key={m.tmdbId || m.id} movie={m} />)}
          </div>
          {totalPages != null && page < totalPages && (
            <div className="px-4 md:px-12 mt-10">
              <button onClick={loadMore} disabled={loadingMore}
                className="px-8 py-3.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50">
                {loadingMore ? 'Loading...' : `Load More · Page ${page + 1} of ${totalPages.toLocaleString()}`}
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
