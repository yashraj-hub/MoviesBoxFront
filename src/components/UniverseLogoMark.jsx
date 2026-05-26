import { ChevronRight } from 'lucide-react'

export default function UniverseLogoMark({ universe, size = 'md', showTagline = true, className = '' }) {
  const isDC = universe?.key === 'dc'

  const sizes = {
    sm: {
      wrap: 'gap-3',
      main: 'text-3xl sm:text-4xl',
      tag: 'text-[9px]',
      emblem: 'h-11 w-11 text-lg',
    },
    md: {
      wrap: 'gap-4',
      main: 'text-4xl sm:text-5xl',
      tag: 'text-[10px]',
      emblem: 'h-14 w-14 text-xl',
    },
    lg: {
      wrap: 'gap-5',
      main: 'text-5xl sm:text-6xl md:text-7xl',
      tag: 'text-[10px] md:text-[11px]',
      emblem: 'h-16 w-16 md:h-20 md:w-20 text-2xl md:text-3xl',
    },
  }

  const s = sizes[size] || sizes.md

  if (isDC) {
    return (
      <div className={`inline-flex items-center ${s.wrap} ${className}`}>
        <div className={`inline-flex shrink-0 items-center justify-center rounded-full border border-sky-400/40 bg-sky-500/10 font-black tracking-tight text-sky-200 shadow-[0_0_40px_rgba(56,189,248,0.14)] ${s.emblem}`}>
          DC
        </div>
        <div className="flex flex-col">
          <span className={`font-black uppercase leading-none tracking-[-0.08em] text-white ${s.main}`}>
            {universe?.label || 'DC'}
          </span>
          {showTagline ? (
            <span className={`mt-1 inline-flex items-center gap-2 font-black uppercase tracking-[0.32em] text-sky-300/70 ${s.tag}`}>
              Elseworld Hub
              <ChevronRight className="h-3 w-3" />
            </span>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <span className={`font-black uppercase leading-none tracking-[-0.1em] text-[#ff2f32] drop-shadow-[0_2px_18px_rgba(255,47,50,0.18)] ${s.main}`}>
        {universe?.label || 'Marvel'}
      </span>
      {showTagline ? (
        <span className={`mt-1 inline-flex items-center gap-2 font-black uppercase tracking-[0.34em] text-yellow-300/70 ${s.tag}`}>
          Phase Hub
          <ChevronRight className="h-3 w-3" />
        </span>
      ) : null}
    </div>
  )
}
