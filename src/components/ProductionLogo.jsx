import { productionLogoUsesInvert } from '../config/invertProductionLogos'

/**
 * Production logos on black — image only, optional soft halo.
 * Certain studios (see invertProductionLogos) get CSS invert for dark artwork.
 */
const HALO =
  'drop-shadow-[0_0_10px_rgba(255,255,255,0.28)] drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]'

export default function ProductionLogo({
  src,
  alt,
  companyId,
  variant = 'rail',
  className = '',
  imgClassName = '',
}) {
  const invert = productionLogoUsesInvert(companyId)
  const filter = invert ? 'invert opacity-95' : HALO

  const styles = {
    rail: {
      img: `max-h-11 sm:max-h-14 md:max-h-16 w-auto max-w-[min(200px,55vw)] object-contain object-center ${filter}`,
    },
    sm: {
      img: `h-8 w-auto max-w-[160px] object-contain object-center ${filter}`,
    },
    hero: {
      img: `h-4 md:h-6 w-auto max-w-[140px] object-contain object-center ${filter}`,
    },
    detail: {
      img: `h-8 w-auto max-w-[150px] object-contain object-center ${filter}`,
    },
    pageHero: {
      img: `h-24 md:h-32 w-auto max-w-[300px] object-contain object-center ${filter}`,
    },
  }

  const v = styles[variant] || styles.rail

  return (
    <span className={`inline-flex items-center justify-center shrink-0 ${className}`}>
      <img src={src} alt={alt} className={`${v.img} ${imgClassName}`} loading="lazy" />
    </span>
  )
}
