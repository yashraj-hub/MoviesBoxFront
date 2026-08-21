import HeroSection from '../components/HeroSection'
import TopTrending from '../components/TopTrending'
import AnimationRail from '../components/AnimationRail'

// ── Section definitions (ordered as they appear) ──────────────────────────────
const SECTIONS = [
  { key: 'cartoon-network',  label: 'Cartoon Network',      emoji: '📺', accent: 'green',   description: 'Dexter, Johnny Bravo, Powerpuff Girls & more',              id: 'sec-cn'      },
  { key: 'nickelodeon',      label: 'Nickelodeon',          emoji: '🟠', accent: 'orange',  description: 'SpongeBob, Rugrats, Hey Arnold & more',                     id: 'sec-nick'    },
  { key: 'disney-channel',   label: 'Disney Channel',       emoji: '🏰', accent: 'blue',    description: 'Kim Possible, Gravity Falls, DuckTales & more',             id: 'sec-disney'  },
  { key: 'marvel-animated',  label: 'Marvel Animated',      emoji: '⚡', accent: 'red',     description: 'X-Men, Spider-Man, Avengers Assembled & more',             id: 'sec-marvel'  },
  { key: 'dc-animated',      label: 'DC Animated',          emoji: '🦇', accent: 'blue',    description: 'Batman TAS, Justice League, Teen Titans & more',           id: 'sec-dc'      },
  { key: 'anime',            label: 'Anime',                emoji: '🌸', accent: 'pink',    description: 'Dragon Ball, Naruto, One Piece, Pokémon & more',           id: 'sec-anime'   },
  { key: 'indian-cartoons',  label: 'Indian Cartoons',      emoji: '🇮🇳', accent: 'orange', description: 'Chhota Bheem, Motu Patlu, Shiva & more',                   id: 'sec-india'   },
  { key: '90s-cartoons',     label: '90s Nostalgia',        emoji: '📼', accent: 'purple',  description: 'The classics that defined a generation',                    id: 'sec-90s'     },
  { key: '2000s-cartoons',   label: '2000s Cartoons',       emoji: '📀', accent: 'green',   description: 'The golden age of Saturday morning cartoons',              id: 'sec-2000s'   },
  { key: 'pixar',            label: 'Pixar',                emoji: '🏆', accent: 'blue',    description: 'Toy Story, Finding Nemo, The Incredibles & more',          id: 'sec-pixar'   },
  { key: 'dreamworks',       label: 'DreamWorks',           emoji: '🎭', accent: 'yellow',  description: 'Shrek, Kung Fu Panda, How to Train Your Dragon & more',    id: 'sec-dw'      },
  { key: 'studio-ghibli',    label: 'Studio Ghibli',        emoji: '🎌', accent: 'green',   description: 'Spirited Away, Totoro, Princess Mononoke & more',          id: 'sec-ghibli'  },
  { key: 'animated-movies',  label: 'Best Animated Movies', emoji: '🎬', accent: 'yellow',  description: 'The greatest animated films ever made',                     id: 'sec-movies'  },
]

export default function AnimationPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Hero — same as Bollywood/Hollywood */}
      <HeroSection category="animation" />

      {/* Top 10 Trending + Continue Watching */}
      <TopTrending category="animation" title="ANIMATION TOP 10" />

      {/* All category rails */}
      <div className="pt-10 pb-24">
        {SECTIONS.map(s => (
          <AnimationRail
            key={s.key}
            sectionKey={s.key}
            label={s.label}
            emoji={s.emoji}
            description={s.description}
            accentColor={s.accent}
            id={s.id}
          />
        ))}
      </div>
    </div>
  )
}
