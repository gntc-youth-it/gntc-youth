import { useState, useEffect } from 'react'
import type { ChurchItem } from '../api'
import { getChurches } from '../api'

export const useChurches = () => {
  const [churches, setChurches] = useState<ChurchItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchChurches = async () => {
      try {
        const data = await getChurches()
        if (!cancelled) {
          setChurches(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchChurches()

    return () => {
      cancelled = true
    }
  }, [])

  return { churches, isLoading, error }
}
