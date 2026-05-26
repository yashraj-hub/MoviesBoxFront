import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { UNIVERSES } from '../config/universes'
import UniverseLogoMark from '../components/UniverseLogoMark'

export default function UniversesPage() {
  return (
    <div className="min-h-screen pb-24 pt-24 md:pt-28">
      <div className="px-4 md:px-12">
        <div className="max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-yellow-400/80">
            Universe Hub
          </p>
          <h1 className="mt-3 font-heading text-4xl uppercase leading-none text-white md:text-6xl">
            Pick a universe and start digging.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-400 md:text-base">
            Marvel and DC are bigger than a single movie shelf, so this hub groups the live-action films,
            TV shows, animated runs, cartoons, and legacy entries into a single exploration flow.
          </p>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {UNIVERSES.map((universe) => (
            <Link
              key={universe.key}
              to={`/universes/${universe.key}`}
              className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
            >
              <div
                className={`absolute inset-0 opacity-80 transition-opacity duration-300 group-hover:opacity-100 ${
                  universe.key === 'marvel'
                    ? 'bg-[radial-gradient(circle_at_top_left,rgba(255,47,50,0.26),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]'
                    : 'bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.24),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]'
                }`}
              />
              <div className="relative z-10 flex h-full min-h-[280px] flex-col justify-between">
                <div>
                  <UniverseLogoMark universe={universe} size="lg" />
                  <p className="mt-5 max-w-xl text-sm leading-relaxed text-gray-300 md:text-base">
                    {universe.tagline}
                  </p>
                </div>

                <div className="mt-8 flex items-center justify-between gap-4">
                  <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-gray-400">
                    <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                    {universe.heroCopy}
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-white transition-colors group-hover:border-white/20">
                    Explore
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
