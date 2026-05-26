import { useNavigate } from 'react-router-dom'
import { UNIVERSES } from '../config/universes'
import UniverseLogoMark from './UniverseLogoMark'

export default function UniverseStrip() {
  const navigate = useNavigate()

  return (
    <section className="px-4 md:px-12 mt-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-yellow-400/70">
            Universe Hub
          </p>
          <h2 className="mt-1 font-heading text-3xl uppercase leading-none text-white md:text-4xl">
            Marvel and DC
          </h2>
        </div>
        <p className="hidden text-[10px] font-black uppercase tracking-[0.28em] text-gray-500 md:block">
          Explore by timeline
        </p>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent" />

        <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2 pr-1 snap-x snap-mandatory">
          {UNIVERSES.map((universe) => (
            <button
              key={universe.key}
              type="button"
              onClick={() => navigate(`/universes/${universe.key}`)}
              className="group relative flex h-[118px] min-w-[240px] snap-start flex-col justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div
                className={`pointer-events-none absolute inset-0 opacity-80 transition-opacity duration-300 group-hover:opacity-100 ${
                  universe.key === 'marvel'
                    ? 'bg-[radial-gradient(circle_at_top_left,rgba(255,47,50,0.28),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.16),transparent_48%)]'
                    : 'bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.12),transparent_48%)]'
                }`}
              />
              <div className="relative z-10">
                <UniverseLogoMark universe={universe} size="sm" showTagline />
                <p className="mt-2 max-w-[18rem] text-[10px] font-medium leading-relaxed text-gray-300/80 line-clamp-2">
                  {universe.tagline}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
