import { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import MovieCard from '../components/MovieCard'
import SearchCollectionCard from '../components/SearchCollectionCard'
import { peekSearchOpenFlags, clearSearchOpenFlags } from '../searchFocusFlags'

const TOKEN_KEY = 'moviesbox_token'
const API_BASE = '/api'
const SEARCH_DEBOUNCE_MS = 400

function releaseTs(m) {
  const d = m.releaseDate
  if (!d || String(d).length < 4) return null
  const t = Date.parse(d)
  return Number.isFinite(t) ? t : null
}

function sortMovies(movies, newestFirst) {
  return [...movies].sort((a, b) => {
    const ta = releaseTs(a)
    const tb = releaseTs(b)
    if (ta != null && tb != null && ta !== tb) {
      return newestFirst ? tb - ta : ta - tb
    }
    if (ta == null && tb == null) return (b.voteAverage ?? 0) - (a.voteAverage ?? 0)
    if (ta == null) return 1
    if (tb == null) return -1
    return (b.voteAverage ?? 0) - (a.voteAverage ?? 0)
  })
}

function groupMoviesByYear(sortedMovies, newestFirst) {
  const byYear = new Map()
  const unknown = []
  for (const m of sortedMovies) {
    const y = (m.releaseDate || '').trim().slice(0, 4)
    const key = /^\d{4}$/.test(y) ? y : null
    if (!key) {
      unknown.push(m)
      continue
    }
    if (!byYear.has(key)) byYear.set(key, [])
    byYear.get(key).push(m)
  }
  const years = [...byYear.keys()].sort((a, b) =>
    newestFirst ? Number(b) - Number(a) : Number(a) - Number(b),
  )
  const sections = years.map((year) => ({ year, movies: byYear.get(year) }))
  if (unknown.length) {
    sections.push({ year: 'No release date', movies: unknown })
  }
  return sections
}

export default function SearchPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [collectionGroups, setCollectionGroups] = useState([])
  const [otherResults, setOtherResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [source, setSource] = useState('')
  const [total, setTotal] = useState(null)
  const [newestFirst, setNewestFirst] = useState(false)

  const debounceTimerRef = useRef(null)
  const abortRef = useRef(null)

  const clearResults = useCallback(() => {
    setResults([])
    setCollectionGroups([])
    setOtherResults([])
    setSource('')
    setTotal(null)
    setSearched(false)
    setLoading(false)
  }, [])

  const startSearch = useCallback((rawQ) => {
    const q = rawQ.trim()
    if (q.length < 2) {
      abortRef.current?.abort()
      abortRef.current = null
      clearResults()
      return
    }

    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac
    const token = localStorage.getItem(TOKEN_KEY)

    setResults([])
    setCollectionGroups([])
    setOtherResults([])
    setLoading(true)
    setSearched(true)

    fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: ac.signal,
    })
      .then((r) => r.json())
      .then((d) => {
        if (abortRef.current !== ac) return
        setResults(d.results || [])
        setCollectionGroups(Array.isArray(d.collectionGroups) ? d.collectionGroups : [])
        setOtherResults(Array.isArray(d.otherResults) ? d.otherResults : [])
        setSource(d.source || '')
        setTotal(d.totalResults ?? d.total_results ?? null)
        setNewestFirst(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        if (abortRef.current !== ac) return
        setResults([])
        setCollectionGroups([])
        setOtherResults([])
        setSource('')
        setTotal(null)
      })
      .finally(() => {
        if (abortRef.current === ac) setLoading(false)
      })
  }, [clearResults])

  useEffect(() => {
    clearTimeout(debounceTimerRef.current)
    abortRef.current?.abort()

    const trimmed = query.trim()
    if (trimmed.length < 2) {
      clearResults()
      return
    }

    debounceTimerRef.current = setTimeout(() => {
      startSearch(query)
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      clearTimeout(debounceTimerRef.current)
      abortRef.current?.abort()
    }
  }, [query, startSearch, clearResults])

  const handleSubmit = (e) => {
    e.preventDefault()
    clearTimeout(debounceTimerRef.current)
    startSearch(query)
  }

  useLayoutEffect(() => {
    const { focus: fromStorage, seed } = peekSearchOpenFlags()
    const fromState = Boolean(location.state?.focusSearch)
    if (!fromStorage && !fromState) return

    if (seed) flushSync(() => setQuery(seed))

    const runFocus = () => {
      const input = inputRef.current
      if (!input) return
      input.focus({ preventScroll: true })
      const len = input.value.length
      if (len > 0) input.setSelectionRange(len, len)
      else input.select()
    }
    runFocus()
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        runFocus()
        if (fromStorage) clearSearchOpenFlags()
      })
    })

    let clearStateTimer
    if (fromState) {
      clearStateTimer = window.setTimeout(() => {
        navigate(location.pathname, { replace: true, state: {} })
      }, 150)
    }
    return () => {
      cancelAnimationFrame(raf)
      if (clearStateTimer) clearTimeout(clearStateTimer)
    }
  }, [location.pathname, location.key, location.state?.focusSearch, location.state?.t, navigate])

  const hasCollections = collectionGroups.length > 0

  const yearSections = useMemo(() => {
    const base = hasCollections ? otherResults : results
    if (!base.length) return []
    const sorted = sortMovies(base, newestFirst)
    return groupMoviesByYear(sorted, newestFirst)
  }, [hasCollections, otherResults, results, newestFirst])

  const gridClass = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4'
  const railClass = 'flex gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20'

  const showToggle = results.length > 0 && (!hasCollections || otherResults.length > 0)

  return (
    <div className="pt-24 px-4 md:px-12 pb-16">
      <div className="mx-auto mb-10 flex w-full max-w-2xl justify-center">
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies…"
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none"
          />
          <button type="submit" disabled={loading}
            className="shrink-0 rounded-2xl bg-yellow-400 px-8 py-3 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-yellow-300 disabled:opacity-50 sm:px-6">
            {loading ? '...' : 'Search'}
          </button>
        </form>
      </div>
      {searched && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">
              {loading && query.trim().length >= 2 ? (
                <span className="text-gray-400">Searching…</span>
              ) : (
                <>
                  {total != null ? `${total.toLocaleString()} results` : ''}{source ? ` · source: ${source}` : ''}
                  {total != null && results.length > 0 && total > results.length ? (
                    <span className="text-gray-600"> · loaded {results.length} for this view</span>
                  ) : null}
                </>
              )}
            </p>
            {showToggle && (
              <div className="flex rounded-full border border-white/10 bg-white/5 p-0.5 w-fit">
                <button
                  type="button"
                  onClick={() => setNewestFirst(false)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition ${
                    !newestFirst ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Timeline
                </button>
                <button
                  type="button"
                  onClick={() => setNewestFirst(true)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition ${
                    newestFirst ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Newest first
                </button>
              </div>
            )}
          </div>
          {query.trim().length > 0 && query.trim().length < 2 && (
            <p className="mb-6 text-center text-xs text-gray-500">Type at least 2 characters — search runs as you type.</p>
          )}
          {results.length === 0 && !loading && searched && query.trim().length >= 2
            ? <p className="text-gray-600">No results found.</p>
            : loading
              ? <div className={gridClass}>{Array.from({ length: 12 }).map((_, i) => <div key={i} className="rounded-xl bg-white/5 animate-pulse aspect-[2/3]" />)}</div>
              : (
                <div className="space-y-12 md:space-y-14">
                  {hasCollections && (
                    <div className="space-y-10 md:space-y-12">
                      {collectionGroups.map((g) => (
                        <section key={g.collectionId}>
                          <div className="mb-4 flex items-start gap-3 border-b border-white/10 pb-3">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-[10px] font-black text-black shadow-[0_0_20px_rgba(234,179,8,0.35)]">
                              M
                            </div>
                            <div className="min-w-0 flex-1">
                              <h2 className="text-sm font-black uppercase tracking-wide text-white sm:text-base md:text-lg">
                                {g.name}
                              </h2>
                              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-gray-500">
                                Official collection
                                {g.movies?.length ? ` · ${g.movies.length} in search` : ''}
                                {g.franchiseTotalParts ? ` · ${g.franchiseTotalParts} in franchise` : ''}
                                {' · '}
                                Release order
                              </p>
                            </div>
                          </div>
                          <div className={railClass}>
                            {g.movies?.map((m) => (
                              <SearchCollectionCard
                                key={m.tmdbId || m.id}
                                movie={m}
                                partNumber={m.partNumber}
                              />
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}

                  {(hasCollections ? otherResults.length > 0 : yearSections.length > 0) && (
                    <section>
                      <div className="mb-6 flex items-center gap-2 border-b border-white/10 pb-3">
                        <h2 className="text-base font-black uppercase tracking-[0.12em] text-white md:text-lg">
                          {hasCollections ? 'More results' : 'By year'}
                        </h2>
                        {hasCollections && (
                          <span className="text-[10px] uppercase tracking-widest text-gray-500">
                            {otherResults.length} titles
                          </span>
                        )}
                      </div>
                      <div className="space-y-10 md:space-y-12">
                        {yearSections.map(({ year, movies }) => (
                          <div key={year}>
                            <div className="mb-4 flex items-baseline gap-3 border-b border-white/5 pb-2">
                              <h3 className="text-xs font-black uppercase tracking-[0.15em] text-yellow-400/90 sm:text-sm">
                                {year}
                              </h3>
                              <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                                {movies.length} {movies.length === 1 ? 'title' : 'titles'}
                              </span>
                            </div>
                            <div className={gridClass}>
                              {movies.map((m) => (
                                <MovieCard key={m.tmdbId || m.id} movie={m} showTitle />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
        </>
      )}
    </div>
  )
}
