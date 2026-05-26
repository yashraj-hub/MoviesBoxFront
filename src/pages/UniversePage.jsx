import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowDownUp, ChevronLeft, Filter, Sparkles } from 'lucide-react'
import { apiFetch } from '../utils/apiFetch'
import { UNIVERSE_MAP } from '../config/universes'
import UniverseLogoMark from '../components/UniverseLogoMark'
import UniverseMediaCard from '../components/UniverseMediaCard'
import MarvelTextIndex from '../components/MarvelTextIndex'

const ORDER_OPTIONS = [
  { key: 'timeline', label: 'Timeline Order', description: 'Watch order' },
  { key: 'release', label: 'Release Order', description: 'Chronological watch order' },
]

const phaseFallback = [
  { key: 'legacy', label: 'Legacy & Origins', from: 1900, to: 2007, description: 'Foundations, early experiments, and classic entries.' },
  { key: 'phase-1', label: 'Phase One', from: 2008, to: 2012, description: 'The first modern chapter.' },
  { key: 'phase-2', label: 'Phase Two', from: 2013, to: 2015, description: 'Expansion and crossovers.' },
  { key: 'phase-3', label: 'Phase Three', from: 2016, to: 2019, description: 'The big saga stretch.' },
  { key: 'modern', label: 'Modern Era', from: 2020, to: 2100, description: 'Streaming era and new chapters.' },
]

function getYear(item) {
  const raw = String(item.releaseDate || item.firstAirDate || '')
  if (raw.length < 4) return null
  const year = Number.parseInt(raw.slice(0, 4), 10)
  return Number.isFinite(year) ? year : null
}

function compareByOrder(a, b, orderMode) {
  const yearA = getYear(a) ?? 0
  const yearB = getYear(b) ?? 0
  const releaseA = String(a.releaseDate || a.firstAirDate || '')
  const releaseB = String(b.releaseDate || b.firstAirDate || '')

  if (orderMode === 'release') {
    if (releaseA !== releaseB) return releaseA.localeCompare(releaseB)
    return (b.popularity ?? 0) - (a.popularity ?? 0)
  }

  if (yearA !== yearB) return yearA - yearB
  return (b.popularity ?? 0) - (a.popularity ?? 0)
}

function buildPhases(timeline = []) {
  if (Array.isArray(timeline) && timeline.length > 0) return timeline
  return phaseFallback
}

function buildTiles(items, collections) {
  const tiles = [
    {
      key: 'all',
      label: 'All Titles',
      count: items.length,
      cover: items.find((item) => item.posterPath || item.posterUrl)?.posterPath
        || items.find((item) => item.posterPath || item.posterUrl)?.posterUrl
        || null,
      sourceLabels: [],
    },
    ...(collections || []).map((collection) => ({
      key: collection.key,
      label: collection.label,
      count: collection.count,
      cover: collection.items?.[0]?.posterPath || collection.items?.[0]?.posterUrl || null,
      sourceLabels: collection.items || [],
    })),
  ]

  return tiles
}

function sortItemsForPhase(items, orderMode) {
  return [...items].sort((a, b) => compareByOrder(a, b, orderMode))
}

function buildTimelineSections(items, phases, orderMode) {
  return phases
    .map((phase) => {
      const phaseItems = items.filter((item) => {
        const year = getYear(item)
        if (!year) return false
        return year >= phase.from && year <= phase.to
      })

      return {
        ...phase,
        items: sortItemsForPhase(phaseItems, orderMode),
        count: phaseItems.length,
      }
    })
    .filter((phase) => phase.items.length > 0)
}

function sortCuratedItems(items, orderMode) {
  return [...items].sort((a, b) => {
    if (orderMode === 'release') {
      const da = String(a.releaseDate || a.firstAirDate || '')
      const db = String(b.releaseDate || b.firstAirDate || '')
      if (da !== db) return da.localeCompare(db)
    }

    const oa = Number.isFinite(Number(a.orderIndex)) ? Number(a.orderIndex) : 0
    const ob = Number.isFinite(Number(b.orderIndex)) ? Number(b.orderIndex) : 0
    if (oa !== ob) return oa - ob

    return (b.popularity ?? 0) - (a.popularity ?? 0)
  })
}

function filterItemsByHero(items, heroKey) {
  if (!heroKey || heroKey === 'all') return items
  return items.filter((item) => Array.isArray(item.heroTags) && item.heroTags.includes(heroKey))
}

function resolveCuratedSections(sections, heroKey, orderMode) {
  return (sections || [])
    .map((section) => {
      const groups = (section.groups || [])
        .map((group) => {
          const filteredItems = filterItemsByHero(group.items || [], heroKey)
          if (!filteredItems.length) return null
          return {
            ...group,
            items: sortCuratedItems(filteredItems, orderMode),
            count: filteredItems.length,
          }
        })
        .filter(Boolean)

      if (!groups.length) return null

      return {
        ...section,
        groups,
      }
    })
    .filter(Boolean)
}

export default function UniversePage() {
  const { universeKey } = useParams()
  const navigate = useNavigate()
  const config = UNIVERSE_MAP.get(universeKey)
  const isMarvelUniverse = config?.key === 'marvel'

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCollectionKey, setSelectedCollectionKey] = useState('all')
  const [orderMode, setOrderMode] = useState('timeline')
  const [marvelBackdropIndex, setMarvelBackdropIndex] = useState(0)

  useEffect(() => {
    if (!universeKey) return
    setLoading(true)
    setError('')
    setData(null)
    setSelectedCollectionKey('all')
    setOrderMode('timeline')
    setMarvelBackdropIndex(0)
    window.scrollTo(0, 0)

    apiFetch(`universe/${universeKey}`)
      .then((r) => r?.json())
      .then((json) => setData(json))
      .catch(() => setError('Could not load this universe right now.'))
      .finally(() => setLoading(false))
  }, [universeKey])

  const items = data?.items || []
  const selectedCollection = useMemo(
    () => (selectedCollectionKey === 'all' ? null : (data?.collections || []).find((collection) => collection.key === selectedCollectionKey) || null),
    [data?.collections, selectedCollectionKey],
  )
  const scopedItems = selectedCollection?.items?.length ? selectedCollection.items : items
  const phases = useMemo(() => buildPhases(data?.timeline), [data?.timeline])
  const timelineSections = useMemo(
    () => buildTimelineSections(scopedItems, phases, orderMode),
    [orderMode, phases, scopedItems],
  )
  const releaseItems = useMemo(
    () => sortItemsForPhase(scopedItems, 'release'),
    [scopedItems],
  )
  const heroTiles = useMemo(
    () => (Array.isArray(data?.heroLanes) && data.heroLanes.length > 0
      ? data.heroLanes
      : buildTiles(items, data?.collections)),
    [data?.collections, data?.heroLanes, items],
  )
  const isCurated = Array.isArray(data?.sections) && data.sections.length > 0

  const stats = data?.stats || {
    total: 0,
    movies: 0,
    tv: 0,
    animated: 0,
    liveAction: 0,
    classic: 0,
  }

  const tagline = data?.universe?.tagline || config?.tagline || ''
  const phaseLabel = data?.universe?.phaseLabel || config?.phaseLabel || 'Phase'
  const selectionLabel = selectedCollection?.label || 'All titles'
  const orderLabel = ORDER_OPTIONS.find((option) => option.key === orderMode)?.label || 'Timeline Order'
  const logoImage = data?.universe?.logoImage || config?.logoImage || '/marvel-logo.svg'
  const heroStats = isMarvelUniverse
    ? [
        { label: 'All titles', value: stats.total },
        { label: 'Movies', value: stats.movies },
        { label: 'TV / series', value: stats.tv },
        { label: 'Animated', value: stats.animated },
      ]
    : [
        { label: 'All titles', value: stats.total },
        { label: 'Movies', value: stats.movies },
        { label: 'TV / series', value: stats.tv },
        { label: 'Animated', value: stats.animated },
        { label: 'Before 2000', value: stats.classic },
      ]
  const marvelSections = Array.isArray(data?.sections) ? data.sections : []
  const marvelBackdropCandidates = useMemo(() => {
    if (!isMarvelUniverse) return []
    const preferredTitles = [
      'The Avengers',
      'Avengers: Age of Ultron',
      'Avengers: Infinity War',
      'Avengers: Endgame',
      'Iron Man',
      'Iron Man 2',
      'Thor',
      'Captain America: The First Avenger',
      'Captain America: The Winter Soldier',
      'Spider-Man: Homecoming',
      'Spider-Man: No Way Home',
      'Black Panther',
      'Guardians of the Galaxy',
    ]

    return items
      .filter((item) => item.backdropPath || item.posterPath)
      .sort((a, b) => {
        const aIndex = preferredTitles.findIndex((title) => String(a.title || '').includes(title))
        const bIndex = preferredTitles.findIndex((title) => String(b.title || '').includes(title))
        const safeA = aIndex === -1 ? 999 : aIndex
        const safeB = bIndex === -1 ? 999 : bIndex
        if (safeA !== safeB) return safeA - safeB
        return (b.popularity ?? 0) - (a.popularity ?? 0)
      })
      .slice(0, 10)
  }, [isMarvelUniverse, items])

  useEffect(() => {
    if (!isMarvelUniverse || marvelBackdropCandidates.length < 2) return undefined
    const id = window.setInterval(() => {
      setMarvelBackdropIndex((current) => (current + 1) % marvelBackdropCandidates.length)
    }, 7000)

    return () => window.clearInterval(id)
  }, [isMarvelUniverse, marvelBackdropCandidates.length])

  const marvelBackdrop = marvelBackdropCandidates[marvelBackdropIndex]?.backdropPath
    || marvelBackdropCandidates[marvelBackdropIndex]?.posterPath
    || marvelBackdropCandidates[0]?.backdropPath
    || marvelBackdropCandidates[0]?.posterPath
    || null

  if (!config && !loading) {
    return (
      <div className="min-h-screen px-4 pt-28 md:px-12">
        <div className="max-w-2xl">
          <button
            type="button"
            onClick={() => navigate('/universes')}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-300"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to universes
          </button>
          <h1 className="mt-6 font-heading text-4xl uppercase text-white">Unknown universe</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 pt-20 md:pt-24">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/80" />
        {isMarvelUniverse && marvelBackdrop ? (
          <img
            src={marvelBackdrop}
            alt="Marvel Avengers background"
            className="absolute inset-0 h-full w-full object-cover opacity-32"
            loading="eager"
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_25%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent via-black/40 to-[#0a0a0a]" />
        <div className="relative px-4 py-10 md:px-12 md:py-14">
          <button
            type="button"
            onClick={() => navigate('/universes')}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-300 backdrop-blur-sm transition-colors hover:text-white"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <div className="mx-auto mt-7 flex w-full max-w-5xl flex-col items-center text-center">
            {loading ? (
              <div className="h-24 w-full max-w-3xl animate-pulse rounded-3xl bg-white/5" />
            ) : (
              isMarvelUniverse ? (
                <img
                  src={logoImage}
                  alt="Marvel logo"
                  className="mx-auto h-20 w-auto max-w-[320px] object-contain md:h-24 md:max-w-[420px]"
                  loading="eager"
                />
              ) : (
                <UniverseLogoMark universe={config || data?.universe} size="lg" />
              )
            )}

            {!isMarvelUniverse ? (
              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-gray-400 md:text-base">
                {tagline}
              </p>
            ) : null}
            {!isMarvelUniverse ? (
              <p className="mt-3 max-w-3xl text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400/70">
                {phaseLabel} guided explorer
              </p>
            ) : null}

            <div className={`mt-8 grid gap-3 sm:grid-cols-2 ${isMarvelUniverse ? 'lg:grid-cols-4' : 'lg:grid-cols-5'}`}>
              {heroStats.map((stat) => (
                <div key={stat.label} className="px-4 py-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-black uppercase tracking-tight text-white">
                    {(stat.value || 0).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="px-4 py-12 text-center text-sm text-red-300 md:px-12">{error}</div>
      ) : null}

      {loading ? (
        <div className="px-4 py-10 md:px-12">
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-[132px] w-[240px] flex-none animate-pulse rounded-[1.75rem] bg-white/5" />
            ))}
          </div>
        </div>
      ) : isMarvelUniverse ? (
        <MarvelTextIndex sections={marvelSections} phaseLabel={phaseLabel} />
      ) : isCurated ? (
        <div className="mt-10 space-y-10 px-4 md:px-12">
          {resolveCuratedSections(data?.sections, selectedCollectionKey, orderMode).map((section) => (
            <section key={section.key}>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-yellow-400/70">
                    Chapter map
                  </p>
                  <h2 className="mt-1 font-heading text-3xl uppercase leading-none text-white md:text-4xl">
                    {section.label}
                  </h2>
                </div>
                <p className="hidden text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 md:block">
                  {section.groups.reduce((sum, group) => sum + (group.count || 0), 0).toLocaleString()} titles
                </p>
              </div>

              <div className="space-y-10">
                {section.groups.map((group) => {
                  const items = sortCuratedItems(group.items || [], orderMode)
                  return (
                    <div key={group.key}>
                      <div className="mb-3 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">
                            {group.key.replace('-', ' ')}
                          </p>
                          <h3 className="mt-1 font-heading text-2xl uppercase leading-none text-white md:text-3xl">
                            {group.label}
                          </h3>
                        </div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-300">
                          {group.count.toLocaleString()} titles
                        </span>
                      </div>

                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
                        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
                        <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2 pr-1">
                          {items.map((item) => (
                            <div key={item.entryId || `${item.mediaType}-${item.id || item.title}`} className="w-[160px] flex-none sm:w-[180px] md:w-[200px]">
                              <UniverseMediaCard item={item} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <>
          <div className="px-4 pt-10 md:px-12">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                <Filter className="h-3.5 w-3.5 text-yellow-400" />
                Superhero filter
              </span>
              {heroTiles.map((tile) => (
                <button
                  key={tile.key}
                  type="button"
                  onClick={() => setSelectedCollectionKey(tile.key)}
                  className={`group relative h-[112px] w-[200px] overflow-hidden rounded-[1.5rem] border text-left transition-all duration-300 hover:-translate-y-0.5 ${
                    selectedCollectionKey === tile.key
                      ? 'border-yellow-400/40 bg-white/10'
                      : 'border-white/10 bg-white/[0.04] hover:border-white/20'
                  }`}
                >
                  <div className="absolute inset-0 bg-black/50" />
                  {tile.cover ? (
                    <img
                      src={tile.cover}
                      alt={tile.label}
                      className="absolute inset-0 h-full w-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_25%),linear-gradient(135deg,rgba(255,47,50,0.25),rgba(0,0,0,0.85))]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <div className="relative z-10 flex h-full flex-col justify-between p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-300/80">
                          Franchise
                        </p>
                        <p className="mt-1 text-lg font-black uppercase tracking-[-0.05em] text-white">
                          {tile.label}
                        </p>
                      </div>
                      <span className="rounded-full border border-white/10 bg-black/45 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-white">
                        {tile.count}
                      </span>
                    </div>
                    <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.22em] text-yellow-300/80">
                      Click to focus
                      <Sparkles className="h-3 w-3" />
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                <ArrowDownUp className="h-3.5 w-3.5 text-yellow-400" />
                Order
              </span>
              {ORDER_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setOrderMode(option.key)}
                  className={`rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] transition ${
                    orderMode === option.key
                      ? 'border-yellow-400/40 bg-yellow-400 text-black'
                      : 'border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-gray-300">
                Showing {selectionLabel}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-gray-300">
                {orderLabel}
              </span>
            </div>
          </div>

          {timelineSections.length ? (
            <div className="mt-10 space-y-10 px-4 md:px-12">
              {timelineSections.map((phase) => (
                <section key={phase.key}>
                  <div className="mb-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gray-500">
                        {phaseLabel} {phase.key.replace('-', ' ')}
                      </p>
                      <h3 className="mt-1 font-heading text-3xl uppercase leading-none text-white md:text-4xl">
                        {phase.label}
                      </h3>
                      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-400">
                        {phase.description}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-300">
                      {phase.count.toLocaleString()} titles
                    </span>
                  </div>

                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
                    <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2 pr-1">
                      {phase.items.map((item) => (
                        <div key={`${item.mediaType}-${item.tmdbId}`} className="w-[160px] flex-none sm:w-[180px] md:w-[200px]">
                          <UniverseMediaCard item={item} />
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          ) : null}

          {selectedCollectionKey !== 'all' ? (
            <div className="px-4 md:px-12 mt-14 pb-4">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 md:p-8">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-yellow-400/70">
                      Deep dive
                    </p>
                    <h2 className="mt-1 font-heading text-3xl uppercase leading-none text-white md:text-4xl">
                      Release sequence
                    </h2>
                  </div>
                  <span className="rounded-full border border-white/10 bg-black/40 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-300">
                    {releaseItems.length.toLocaleString()} titles
                  </span>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {releaseItems.slice(0, 20).map((item) => (
                    <UniverseMediaCard key={`${item.mediaType}-${item.tmdbId}`} item={item} />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
