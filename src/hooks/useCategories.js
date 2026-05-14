import { useEffect, useState } from 'react'
import { apiFetch } from '../utils/apiFetch'

export function useCategories(zone) {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    apiFetch(`categories/zone/${zone}`)
      .then(r => r?.json())
      .then(d => setCategories(d?.categories || []))
      .catch(() => {})
  }, [zone])

  return categories
}
