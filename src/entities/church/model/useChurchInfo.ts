import { useState, useEffect } from 'react'
import type { ChurchInfoResponse } from '../api'
import { getChurchInfo } from '../api'

const cache = new Map<string, ChurchInfoResponse>()
const inflight = new Map<string, Promise<ChurchInfoResponse>>()

export const clearChurchInfoCache = (churchId?: string) => {
  if (churchId) {
    cache.delete(churchId)
  } else {
    cache.clear()
  }
}

export const useChurchInfo = (churchId: string) => {
  const [churchInfo, setChurchInfo] = useState<ChurchInfoResponse | null>(
    cache.get(churchId) ?? null
  )
  const [isLoading, setIsLoading] = useState(!cache.has(churchId) && !!churchId)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!churchId) return

    if (cache.has(churchId)) {
      setChurchInfo(cache.get(churchId)!)
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    const fetchChurchInfo = async () => {
      try {
        let promise = inflight.get(churchId)
        if (!promise) {
          promise = getChurchInfo(churchId)
          inflight.set(churchId, promise)
        }

        const data = await promise
        cache.set(churchId, data)

        if (!cancelled) {
          setChurchInfo(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
        }
      } finally {
        inflight.delete(churchId)
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
