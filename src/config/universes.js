export const UNIVERSES = [
  {
    key: 'marvel',
    label: 'Marvel',
    title: 'Marvel Universe',
    tagline: 'Phases, legacy cartoons, live-action shows, and every multiverse branch in one place.',
    accent: 'red',
    phaseLabel: 'Phase',
    logoImage: 'https://www.marvel.com/assets/marvel-logo.svg',
    heroCopy: 'Jump through the MCU phases, animated classics, street-level shows, and the older Spider-Man / X-Men eras.',
  },
  {
    key: 'dc',
    label: 'DC',
    title: 'DC Universe',
    tagline: 'Batman, Superman, animated classics, live-action series, and every elseworld worth exploring.',
    accent: 'blue',
    phaseLabel: 'Era',
    heroCopy: 'Move from golden-age serials to the Arrowverse, animated universes, and the many Batman and Superman branches.',
  },
]

export const UNIVERSE_MAP = new Map(UNIVERSES.map((item) => [item.key, item]))
