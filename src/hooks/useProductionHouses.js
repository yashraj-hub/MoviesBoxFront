import { useEffect, useState } from 'react'
import { apiFetch } from '../utils/apiFetch'

export function useProductionHouses(category) {
  const [houses, setHouses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiFetch(`production-house/${category}`)
      .then(r => r?.json())
      .then(d => setHouses(d?.houses || []))
      .catch(() => setHouses([]))
      .finally(() => setLoading(false))
  }, [category])

  return { houses, loading }
}
