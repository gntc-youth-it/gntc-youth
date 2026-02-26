import { useEffect, useRef, useCallback } from 'react'

export const useInfiniteScroll = (
  onLoadMore: () => void,
  options: { enabled: boolean; rootMargin?: string }
) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const onLoadMoreRef = useRef(onLoadMore)
  onLoadMoreRef.current = onLoadMore

  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    sentinelRef.current = node
  }, [])

  useEffect(() => {
    if (!options.enabled || !sentinelRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMoreRef.current()
        }
      },
      { rootMargin: options.rootMargin ?? '200px' }
    )

    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [options.enabled, options.rootMargin])

  return setSentinelRef
}
