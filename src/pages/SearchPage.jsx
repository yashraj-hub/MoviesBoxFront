import { useState, useMemo, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import MovieCard from '../components/MovieCard'
import SearchCollectionCard from '../components/SearchCollectionCard'
import TVShowCard from '../components/TVShowCard'
import { peekSearchOpenFlags, clearSearchOpenFlags } from '../searchFocusFlags'

const TOKEN_KEY = 'moviesbox_token'
const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')
const SEARCH_DEBOUNCE_MS = 400
const SEARCH_CACHE_KEY = 'moviesbox_search_state_v1'

function readSearchCache() {
  try {
    const raw = sessionStorage.getItem(SEARCH_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

function writeSearchCache(state) {
  try {
    sessionStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage limits/private mode
  }
}

function clearSearchCache() {
  try {
    sessionStorage.removeItem(SEARCH_CACHE_KEY)
  } catch {
    // ignore
  }
}

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
  const [initialSearch] = useState(() => readSearchCache())

  const [query, setQuery] = useState(initialSearch?.query || '')
  const [results, setResults] = useState(Array.isArray(initialSearch?.results) ? initialSearch.results : [])
  const [tvResults, setTvResults] = useState(Array.isArray(initialSearch?.tvResults) ? initialSearch.tvResults : [])
  const [collectionGroups, setCollectionGroups] = useState(Array.isArray(initialSearch?.collectionGroups) ? initialSearch.collectionGroups : [])
  const [otherResults, setOtherResults] = useState(Array.isArray(initialSearch?.otherResults) ? initialSearch.otherResults : [])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(Boolean(initialSearch?.searched))
  const [source, setSource] = useState(initialSearch?.source || '')
  const [tvSource, setTvSource] = useState(initialSearch?.tvSource || '')
  const [total, setTotal] = useState(initialSearch?.total ?? null)
  const [tvTotal, setTvTotal] = useState(initialSearch?.tvTotal ?? null)
  const [newestFirst, setNewestFirst] = useState(Boolean(initialSearch?.newestFirst))

  const debounceTimerRef = useRef(null)
  const abortRef = useRef(null)
  const tvRailRef = useRef(null)
  const skipInitialSearchRef = useRef(Boolean(initialSearch?.searched && initialSearch?.query?.trim()?.length >= 2))
  const restoredQueryRef = useRef(initialSearch?.searched ? initialSearch.query || '' : '')
  const latestSearchRef = useRef(null)

  const clearResults = useCallback(() => {
    setResults([])
    setTvResults([])
    setCollectionGroups([])
    setOtherResults([])
    setSource('')
    setTvSource('')
    setTotal(null)
    setTvTotal(null)
    setSearched(false)
    setLoading(false)
    clearSearchCache()
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
    setTvResults([])
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
        setTvResults(Array.isArray(d.tvResults) ? d.tvResults : [])
        setCollectionGroups(Array.isArray(d.collectionGroups) ? d.collectionGroups : [])
        setOtherResults(Array.isArray(d.otherResults) ? d.otherResults : [])
        setSource(d.source || '')
        setTvSource(d.tvSource || '')
        setTotal(d.totalResults ?? d.total_results ?? null)
        setTvTotal(d.tvTotalResults ?? null)
        setNewestFirst(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        if (abortRef.current !== ac) return
        setResults([])
        setTvResults([])
        setCollectionGroups([])
        setOtherResults([])
        setSource('')
        setTvSource('')
        setTotal(null)
        setTvTotal(null)
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
      return
    }

    if (skipInitialSearchRef.current) {
      skipInitialSearchRef.current = false
      return
    }

    if (restoredQueryRef.current && restoredQueryRef.current === query) {
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

  useEffect(() => {
    latestSearchRef.current = {
      query,
      results,
      tvResults,
      collectionGroups,
      otherResults,
      source,
      tvSource,
      total,
      tvTotal,
      newestFirst,
      searched,
      scrollY: window.scrollY || 0,
    }

    if (!searched || query.trim().length < 2 || loading) return
    writeSearchCache(latestSearchRef.current)
  }, [
    query,
    results,
    tvResults,
    collectionGroups,
    otherResults,
    source,
    tvSource,
    total,
    tvTotal,
    newestFirst,
    searched,
    loading,
  ])

  useEffect(() => {
    if (!initialSearch?.searched || !Number.isFinite(Number(initialSearch.scrollY))) return undefined
    const y = Number(initialSearch.scrollY)
    const raf = requestAnimationFrame(() => {
      window.scrollTo(0, y)
      window.setTimeout(() => window.scrollTo(0, y), 80)
    })
    return () => cancelAnimationFrame(raf)
  }, [initialSearch])

  useEffect(() => () => {
    if (!latestSearchRef.current?.searched || latestSearchRef.current.query.trim().length < 2) return
    writeSearchCache({
      ...latestSearchRef.current,
      scrollY: window.scrollY || 0,
    })
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    clearTimeout(debounceTimerRef.current)
    restoredQueryRef.current = ''
    startSearch(query)
  }

  const handleQueryChange = (value) => {
    restoredQueryRef.current = ''
    setQuery(value)
    if (value.trim().length < 2) {
      abortRef.current?.abort()
      abortRef.current = null
      clearResults()
    }
  }

  const scrollTvRail = useCallback((direction) => {
    const rail = tvRailRef.current
    if (!rail) return
    rail.scrollBy({
      left: direction * Math.max(320, rail.clientWidth * 0.86),
      behavior: 'smooth',
    })
  }, [])

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

  const sortedCollectionGroups = useMemo(() => {
    if (!hasCollections) return collectionGroups
    return [...collectionGroups].sort((a, b) => {
      const ta = releaseTs(a.movies?.[0])
      const tb = releaseTs(b.movies?.[0])
      if (ta != null && tb != null && ta !== tb) return newestFirst ? tb - ta : ta - tb
      return 0
    })
  }, [collectionGroups, hasCollections, newestFirst])

  const yearSections = useMemo(() => {
    const base = hasCollections ? otherResults : results
    if (!base.length) return []
    const sorted = sortMovies(base, newestFirst)
    return groupMoviesByYear(sorted, newestFirst)
  }, [hasCollections, otherResults, results, newestFirst])

  const gridClass = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4'
  const showToggle = results.length > 0 || collectionGroups.length > 0 || otherResults.length > 0
  const hasAnyResults = tvResults.length > 0 || results.length > 0 || collectionGroups.length > 0 || otherResults.length > 0

  return (
    <div className="pt-24 px-4 md:px-12 pb-16">
      <div className="mx-auto mb-10 flex w-full max-w-2xl justify-center">
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 sm:flex-row sm:items-stretch">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search movies or TV shows..."
            autoComplete="off"
            spellCheck={false}
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-yellow-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="shrink-0 rounded-2xl bg-yellow-400 px-8 py-3 text-sm font-black uppercase tracking-widest text-black transition-all hover:bg-yellow-300 disabled:opacity-50 sm:px-6"
          >
            {loading ? '...' : 'Search'}
          </button>
        </form>
      </div>

      {searched && (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">
              {loading && query.trim().length >= 2 ? (
                <span className="text-gray-400">Searching...</span>
              ) : (
                <>
                  {total != null ? `${total.toLocaleString()} results` : ''}
                  {source ? ` · movies: ${source}` : ''}
                  {tvSource ? ` · tv: ${tvSource}` : ''}
                  {total != null && results.length > 0 && total > results.length ? (
                    <span className="text-gray-600"> · loaded {results.length} for this view</span>
                  ) : null}
                </>
              )}
            </p>
            {showToggle && (
              <div className="flex w-fit rounded-full border border-white/10 bg-white/5 p-0.5">
                <button
                  type="button"
                  onClick={() => setNewestFirst(false)}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
                    !newestFirst ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Timeline
                </button>
                <button
                  type="button"
                  onClick={() => setNewestFirst(true)}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
                    newestFirst ? 'bg-yellow-400 text-black' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Newest first
                </button>
              </div>
            )}
          </div>

          {query.trim().length > 0 && query.trim().length < 2 && (
            <p className="mb-6 text-center text-xs text-gray-500">Type at least 2 characters - search runs as you type.</p>
          )}

          {!hasAnyResults && !loading && searched && query.trim().length >= 2
            ? <p className="text-gray-600">No results found.</p>
            : loading
              ? <div className={gridClass}>{Array.from({ length: 12 }).map((_, i) => <div key={i} className="aspect-[2/3] animate-pulse rounded-xl bg-white/5" />)}</div>
              : (
                <div className="space-y-12 md:space-y-14">
                  {tvResults.length > 0 && (
                    <section className="-mx-4 space-y-5 border-y border-yellow-400/10 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.11),transparent_34%),linear-gradient(135deg,rgba(250,204,21,0.055),rgba(255,255,255,0.015)_45%,transparent)] px-4 py-6 md:-mx-12 md:space-y-6 md:px-12">
                      <div className="flex items-center justify-between gap-3 border-b border-yellow-400/15 pb-3">
                        <div className="min-w-0">
                          <h2 className="text-base font-black uppercase tracking-[0.14em] text-yellow-300 md:text-lg">
                            TV Shows
                          </h2>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-gray-500">
                            {tvTotal != null ? `${tvTotal} results` : `${tvResults.length} titles`}
                          </p>
                        </div>
                        {tvResults.length > 4 ? (
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => scrollTvRail(-1)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-yellow-400/20 bg-black/35 text-yellow-200 transition hover:border-yellow-400/50 hover:text-yellow-400"
                              aria-label="Previous TV shows"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => scrollTvRail(1)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-yellow-400/20 bg-black/35 text-yellow-200 transition hover:border-yellow-400/50 hover:text-yellow-400"
                              aria-label="Next TV shows"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                      <div
                        ref={tvRailRef}
                        className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pr-1"
                      >
                        {tvResults.map((show) => (
                          <div
                            key={show.id}
                            className="w-[78vw] max-w-[360px] flex-none snap-start sm:w-[44vw] lg:w-[calc((100%-3rem)/4)] lg:max-w-none"
                          >
                            <TVShowCard
                              show={show}
                              variant="wide"
                              titleClassName="text-yellow-100 group-hover:text-yellow-300"
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {hasCollections && (
                    <div className="space-y-10 md:space-y-12">
                      {sortedCollectionGroups.map((g) => (
                        <section key={g.collectionId}>
                          <div className="mb-4 flex items-center gap-3 border-b border-white/10 pb-3">
                            <div className="min-w-0 flex-1">
                              <h2 className="text-sm font-black uppercase tracking-wide text-white sm:text-base md:text-lg">
                                {g.name}
                              </h2>
                              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-gray-500">
                                {g.movies?.length ? `${g.movies.length} in search` : ''}
                                {g.franchiseTotalParts ? ` · ${g.franchiseTotalParts} in franchise` : ''}
                                {' · release order'}
                              </p>
                            </div>
                          </div>
                          <div className={gridClass}>
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
                              <span className="text-[10px] uppercase tracking-widest text-gray-500">
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
