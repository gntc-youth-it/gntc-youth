import { useState, useEffect } from 'react'
import type { ChurchInfoResponse } from '../api'
import { getChurchInfo } from '../api'

export const useChurchInfo = (churchId: string) => {
  const [churchInfo, setChurchInfo] = useState<ChurchInfoResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!churchId) return

    let cancelled = false
    setIsLoading(true)
    setError(null)

    const fetchChurchInfo = async () => {
      try {
        const data = await getChurchInfo(churchId)
        if (!cancelled) {
          setChurchInfo(data)
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

    fetchChurchInfo()

    return () => {
      cancelled = true
    }
  }, [churchId])

  return { churchInfo, isLoading, error }
}
