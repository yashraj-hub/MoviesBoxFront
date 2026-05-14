/** TMDB production company IDs whose logos use dark marks — invert reads on black UI. */
export const INVERT_PRODUCTION_LOGO_IDS = new Set([
  4, // Paramount Pictures
  5, // Columbia Pictures
  923, // Legendary Pictures
  41077, // A24
  82819, // Skydance Media
  10039, // Anonymous Content
])

export function productionLogoUsesInvert(companyId) {
  if (companyId == null || companyId === '') return false
  const n = Number(companyId)
  return !Number.isNaN(n) && INVERT_PRODUCTION_LOGO_IDS.has(n)
}
