export const SEARCH_FOCUS_STORAGE_KEY = 'moviesbox:focusSearch'
export const SEARCH_SEED_STORAGE_KEY = 'moviesbox:searchSeed'

export function markSearchOpened(seed = '') {
  try {
    sessionStorage.setItem(SEARCH_FOCUS_STORAGE_KEY, '1')
    if (seed) sessionStorage.setItem(SEARCH_SEED_STORAGE_KEY, seed)
    else sessionStorage.removeItem(SEARCH_SEED_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function peekSearchOpenFlags() {
  try {
    return {
      focus: sessionStorage.getItem(SEARCH_FOCUS_STORAGE_KEY) === '1',
      seed: sessionStorage.getItem(SEARCH_SEED_STORAGE_KEY) || '',
    }
  } catch {
    return { focus: false, seed: '' }
  }
}

export function clearSearchOpenFlags() {
  try {
    sessionStorage.removeItem(SEARCH_FOCUS_STORAGE_KEY)
    sessionStorage.removeItem(SEARCH_SEED_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
