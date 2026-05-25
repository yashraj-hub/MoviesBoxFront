const normalizeBaseUrl = (value) => (value || '').trim().replace(/\/+$/, '')

export const TV_PLAYER_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_TV_PLAYER_BASE_URL)

export const buildTVPlayerUrl = (imdbId, options = {}) => {
  if (!imdbId || !TV_PLAYER_BASE_URL) return ''
  const params = new URLSearchParams()
  if (options.season) params.set('season', String(options.season))
  if (options.episode) params.set('episode', String(options.episode))
  const query = params.toString()
  return `${TV_PLAYER_BASE_URL}/tv/${imdbId}${query ? `?${query}` : ''}`
}
