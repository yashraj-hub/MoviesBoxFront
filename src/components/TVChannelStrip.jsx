import { useNavigate } from 'react-router-dom'
import { TV_CHANNELS } from '../config/tvChannels'

export default function TVChannelStrip() {
  const navigate = useNavigate()

  return (
    <section className="px-4 md:px-12 mt-8">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-yellow-400/70">
            Channel Strip
          </p>
          <h2 className="mt-1 font-heading text-3xl uppercase leading-none text-white md:text-4xl">
            Browse by channel
          </h2>
        </div>
        <p className="hidden text-[10px] font-black uppercase tracking-[0.28em] text-gray-500 md:block">
          Scroll sideways
        </p>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#0a0a0a] to-transparent" />

        <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2 pr-1 snap-x snap-mandatory">
          {TV_CHANNELS.map((channel) => (
            <button
              key={channel.key}
              type="button"
              onClick={() => navigate(`/tv-shelf/${channel.key}`)}
              className="group relative flex h-[92px] min-w-[150px] snap-start flex-col items-center justify-center rounded-none border-0 bg-transparent px-2 py-1 text-center transition-all duration-300 hover:-translate-y-0.5"
              aria-label={channel.label}
              title={channel.label}
            >
              <img
                src={channel.logoSrc}
                alt={channel.label}
                className={`relative z-10 mx-auto h-12 w-auto max-w-[130px] object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:scale-105 ${channel.logoClassName || ''}`}
                loading="lazy"
                draggable="false"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
