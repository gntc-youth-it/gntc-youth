import { useState, useEffect } from 'react'
import type { ChurchItem } from '../api'
import { getChurches } from '../api'

export const useChurches = () => {
  const [churches, setChurches] = useState<ChurchItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const fetchChurches = async () => {
      try {
        const data = await getChurches()
        if (!cancelled) {
          setChurches(data)
        }
      } catch {
        // 실패 시 빈 배열 유지
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

  return { churches, isLoading }
}
