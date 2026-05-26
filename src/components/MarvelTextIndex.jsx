import { useMemo, useState } from 'react'
import UniverseMediaCard from './UniverseMediaCard'

const HERO_FILTERS = [
  { key: 'all', label: 'All Marvel', glyph: 'MV', accent: 'from-red-500/30 via-red-500/12 to-orange-400/10' },
  { key: 'spider-man', label: 'Spider-Man', glyph: 'SP', accent: 'from-red-500/30 via-rose-500/12 to-orange-400/10' },
  { key: 'iron-man', label: 'Iron Man', glyph: 'IM', accent: 'from-amber-500/30 via-orange-500/12 to-red-500/10' },
  { key: 'captain-america', label: 'Captain America', glyph: 'CA', accent: 'from-sky-400/30 via-blue-500/12 to-indigo-500/10' },
  { key: 'thor', label: 'Thor', glyph: 'TH', accent: 'from-cyan-400/30 via-sky-500/12 to-blue-500/10' },
  { key: 'hulk', label: 'Hulk', glyph: 'HK', accent: 'from-emerald-400/30 via-green-500/12 to-lime-500/10' },
  { key: 'wolverine', label: 'Wolverine', glyph: 'WV', accent: 'from-yellow-400/30 via-amber-500/12 to-orange-500/10' },
  { key: 'deadpool', label: 'Deadpool', glyph: 'DP', accent: 'from-rose-500/30 via-red-500/12 to-fuchsia-500/10' },
  { key: 'doctor-strange', label: 'Doctor Strange', glyph: 'DS', accent: 'from-violet-400/30 via-purple-500/12 to-indigo-500/10' },
  { key: 'black-panther', label: 'Black Panther', glyph: 'BP', accent: 'from-slate-200/30 via-slate-400/12 to-slate-700/10' },
  { key: 'daredevil', label: 'Daredevil', glyph: 'DD', accent: 'from-red-500/30 via-rose-500/12 to-orange-500/10' },
  { key: 'loki', label: 'Loki', glyph: 'LK', accent: 'from-emerald-400/30 via-teal-500/12 to-cyan-500/10' },
  { key: 'scarlet-witch', label: 'Scarlet Witch', glyph: 'SW', accent: 'from-fuchsia-500/30 via-pink-500/12 to-red-500/10' },
  { key: 'black-widow', label: 'Black Widow', glyph: 'BW', accent: 'from-zinc-300/30 via-zinc-500/12 to-zinc-800/10' },
  { key: 'ant-man', label: 'Ant-Man', glyph: 'AM', accent: 'from-red-500/25 via-indigo-500/12 to-cyan-500/10' },
  { key: 'punisher', label: 'The Punisher', glyph: 'P', accent: 'from-zinc-300/30 via-zinc-500/12 to-zinc-700/10' },
  { key: 'ghost-rider', label: 'Ghost Rider', glyph: 'GR', accent: 'from-orange-500/30 via-red-500/12 to-amber-500/10' },
  { key: 'blade', label: 'Blade', glyph: 'BL', accent: 'from-red-500/25 via-black/20 to-zinc-700/10' },
  { key: 'fantastic-four', label: 'Fantastic Four', glyph: 'F4', accent: 'from-sky-400/30 via-cyan-500/12 to-blue-500/10' },
  { key: 'x-men', label: 'X-Men', glyph: 'X', accent: 'from-fuchsia-500/30 via-violet-500/12 to-indigo-500/10' },
]

const HERO_MATCHES = {
  'scarlet-witch': ['wanda', 'scarlet-witch'],
}

const HERO_IMAGE_HINTS = {
  all: ['The Avengers', 'Avengers: Endgame', 'Avengers: Infinity War', 'Iron Man'],
  'spider-man': ['Spider-Man: No Way Home', 'Spider-Man: Homecoming', 'Spider-Man 2'],
  'iron-man': ['Iron Man', 'Iron Man 2', 'Iron Man 3'],
  'captain-america': ['Captain America: The Winter Soldier', 'Captain America: Civil War', 'Captain America: The First Avenger'],
  thor: ['Thor: Ragnarok', 'Thor', 'Thor: Love and Thunder'],
  hulk: ['The Incredible Hulk', 'Hulk Vs.', 'Planet Hulk'],
  wolverine: ['Logan', 'The Wolverine', 'X-Men Origins: Wolverine'],
  deadpool: ['Deadpool & Wolverine', 'Deadpool 2', 'Deadpool'],
  'doctor-strange': ['Doctor Strange in the Multiverse of Madness', 'Doctor Strange'],
  'black-panther': ['Black Panther', 'Black Panther: Wakanda Forever'],
  daredevil: ['Daredevil: Born Again', 'Daredevil', 'The Defenders'],
  loki: ['Loki'],
  'scarlet-witch': ['WandaVision', 'Agatha All Along', 'Doctor Strange in the Multiverse of Madness'],
  'black-widow': ['Black Widow'],
  'ant-man': ['Ant-Man and the Wasp: Quantumania', 'Ant-Man and the Wasp', 'Ant-Man'],
  punisher: ['The Punisher'],
  'ghost-rider': ['Ghost Rider', 'Ghost Rider: Spirit of Vengeance'],
  blade: ['Blade', 'Blade II', 'Blade: Trinity'],
  'fantastic-four': ['Fantastic Four: First Steps', 'Fantastic Four', 'Fantastic Four: Rise of the Silver Surfer'],
  'x-men': ['X-Men: Days of Future Past', 'X2', 'X-Men'],
}

function getHeroTags(heroKey) {
  return HERO_MATCHES[heroKey] || [heroKey]
}

function getAllItems(sections = []) {
  return sections.flatMap((section) => section.groups.flatMap((group) => group.items))
}

function getHeroImage(sections = [], heroKey = 'all') {
  const tags = getHeroTags(heroKey)
  const candidates = getAllItems(sections).filter((item) => {
    const itemTags = Array.isArray(item.heroTags) ? item.heroTags : []
    return tags.some((tag) => itemTags.includes(tag)) && (item.posterPath || item.backdropPath)
  })

  const hints = HERO_IMAGE_HINTS[heroKey] || []
  const scored = [...candidates].sort((a, b) => {
    const score = (item) => {
      const title = String(item.title || '').toLowerCase()
      let total = 0
      if (item.isAnimated) total += 200
      if (item.mediaType === 'tv') total += 50
      if (item.featured) total += 20
      if (item.posterPath) total += 10
      if (item.backdropPath) total += 5
      if (hints.some((hint) => title.includes(hint.toLowerCase()))) total += 100
      return total + (Number(item.popularity) || 0) / 100
    }

    return score(b) - score(a)
  })

  const preferred = scored[0]
  return preferred?.posterPath || preferred?.backdropPath || candidates[0]?.posterPath || candidates[0]?.backdropPath || null
}

function filterSectionsByHero(sections = [], heroKey = 'all') {
  if (!heroKey || heroKey === 'all') return sections
  const heroTags = getHeroTags(heroKey)

  return sections
    .map((section) => {
      const groups = (section.groups || [])
        .map((group) => {
          const items = (group.items || []).filter((item) => {
            const tags = Array.isArray(item.heroTags) ? item.heroTags : []
            return heroTags.some((tag) => tags.includes(tag))
          })

          if (!items.length) return null

          return {
            ...group,
            items,
            count: items.length,
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

function countByType(items = []) {
  return {
    total: items.length,
    movies: items.filter((item) => item.mediaType === 'movie').length,
    tv: items.filter((item) => item.mediaType === 'tv').length,
    animated: items.filter((item) => item.isAnimated).length,
    liveAction: items.filter((item) => !item.isAnimated).length,
  }
}

export default function MarvelTextIndex({ sections = [], phaseLabel = 'Phase' }) {
  const [selectedHeroKey, setSelectedHeroKey] = useState('all')

  const allItems = useMemo(() => getAllItems(sections), [sections])
  const selectedSections = useMemo(
    () => filterSectionsByHero(sections, selectedHeroKey),
    [sections, selectedHeroKey],
  )
  const selectedItems = useMemo(
    () => (selectedHeroKey === 'all'
      ? allItems
      : selectedSections.flatMap((section) => section.groups.flatMap((group) => group.items))),
    [allItems, selectedHeroKey, selectedSections],
  )
  const selectedCounts = useMemo(() => countByType(selectedItems), [selectedItems])

  return (
    <div className="px-4 pb-20 pt-10 md:px-12">
      <div className="scrollbar-hide mx-auto flex max-w-7xl gap-4 overflow-x-auto pb-2 pr-1">
        {HERO_FILTERS.map((hero) => {
          const active = selectedHeroKey === hero.key
          const heroImage = getHeroImage(sections, hero.key)

          return (
            <button
              key={hero.key}
              type="button"
              onClick={() => setSelectedHeroKey(hero.key)}
              className={`group relative aspect-square w-24 flex-none overflow-hidden rounded-full border text-left transition-all duration-300 hover:-translate-y-0.5 sm:w-28 md:w-32 lg:w-36 ${
                active ? 'border-yellow-400/40 bg-white/10' : 'border-white/10 bg-white/[0.04] hover:border-white/20'
              }`}
              aria-label={hero.label}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${hero.accent}`} />
              <div className="absolute inset-0 bg-black/45" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-black/10 to-transparent" />
              <div className="relative z-10 flex h-full w-full items-center justify-center p-2 sm:p-3 md:p-4">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-black/10 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
                  {heroImage ? (
                    <img
                      src={heroImage}
                      alt={hero.label}
                      className="h-full w-full object-cover object-center"
                      loading="lazy"
                    />
                  ) : (
                    <div className="text-center">
                      <p className="font-heading text-3xl uppercase leading-none tracking-[-0.08em] text-white sm:text-4xl">
                        {hero.glyph}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-10 space-y-12">
        {selectedSections.map((section, sectionIndex) => (
          <section key={section.key} className="border-t border-white/10 pt-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-gray-500">
                  Section {sectionIndex + 1}
                </p>
                <h2 className="mt-2 font-heading text-3xl uppercase leading-none text-white md:text-4xl">
                  {section.label}
                </h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-300">
                {(section.groups || []).reduce((sum, group) => sum + (group.items?.length || 0), 0).toLocaleString()} titles
              </span>
            </div>

            <div className="mt-8 space-y-8">
              {(section.groups || []).map((group) => (
                <div key={group.key} className="border-l border-white/10 pl-4 md:pl-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-yellow-400/70">
                        {phaseLabel}
                      </p>
                      <h3 className="mt-1 font-heading text-2xl uppercase leading-none text-white md:text-3xl">
                        {group.label}
                      </h3>
                    </div>
                    <span className="rounded-full border border-white/10 bg-black/30 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-300">
                      {(group.items || []).length.toLocaleString()} titles
                    </span>
                  </div>

                  <div className="relative mt-4">
                    <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
                    <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2 pr-1">
                      {(group.items || []).map((item) => (
                        <div
                          key={item.entryId || `${item.mediaType}-${item.id || item.title}`}
                          className="w-[155px] flex-none sm:w-[165px] md:w-[175px]"
                        >
                          <UniverseMediaCard item={item} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
