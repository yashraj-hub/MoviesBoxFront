import TVHeroSection from '../components/TVHeroSection'
import TVChannelStrip from '../components/TVChannelStrip'
import TVShelfRail from '../components/TVShelfRail'
import ContinueWatchingRow from '../components/ContinueWatchingRow'
import { TV_SHELVES } from '../config/tvShelves'

const SHELF_ORDER = [
  'trending',
  'netflix',
  'primeVideo',
  'hulu',
  'disneyPlus',
  'appleTVPlus',
  'peacock',
  'paramountPlus',
  'hbo',
  'cartoonNetwork',
  'nickelodeon',
  'hungama',
  'disneyChannel',
  'ninetyKids',
  'englishThrowbacks',
  'topRated',
  'popular',
  'animation',
  'family',
  'actionAdventure',
  'sciFiFantasy',
  'japanese',
  'korean',
  'spanish',
  'hindi',
  'crime',
  'documentary',
  'reality',
  'talk',
  'news',
  'soap',
  'western',
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

      <TVChannelStrip />

      <ContinueWatchingRow title="Continue Watching" endpoint="continue-watching" />

      <div className="mt-8">
        {shelves.map((shelf) => (
          <TVShelfRail
            key={shelf.key}
            shelfKey={shelf.key}
            label={shelf.label}
          />
        ))}
      </div>
    </div>
  )
}
