import TVHeroSection from '../components/TVHeroSection'
import TVShelfRail from '../components/TVShelfRail'
import { TV_SHELVES } from '../config/tvShelves'

const SHELF_ORDER = [
  'trending',
  'topRated',
  'popular',
  'hindi',
  'animation',
  'actionAdventure',
  'crime',
  'family',
  'sciFiFantasy',
  'documentary',
  'reality',
  'talk',
  'news',
  'soap',
  'western',
  'japanese',
  'korean',
  'spanish',
]

export default function TVShowsPage() {
  const shelfMap = new Map(TV_SHELVES.map((item) => [item.key, item]))
  const shelves = SHELF_ORDER.map((key) => {
    const shelf = shelfMap.get(key)
    return shelf ? { key, ...shelf } : null
  }).filter(Boolean)

  return (
    <div className="min-h-screen pb-20">
      <TVHeroSection />

      <div className="mt-8">
        {shelves.map((shelf) => (
          <TVShelfRail
            key={shelf.key}
            shelfKey={shelf.key}
            label={shelf.label}
            kind={shelf.kind}
          />
        ))}
      </div>
    </div>
  )
}
