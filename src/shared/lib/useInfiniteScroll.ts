import { useEffect, useRef, useCallback } from 'react'

export const useInfiniteScroll = (
  onLoadMore: () => void,
  options: { enabled: boolean; rootMargin?: string; reobserveDelay?: number }
) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const onLoadMoreRef = useRef(onLoadMore)
  onLoadMoreRef.current = onLoadMore
  const enabledRef = useRef(options.enabled)
  enabledRef.current = options.enabled
  const observerRef = useRef<IntersectionObserver | null>(null)

  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    sentinelRef.current = node
  }, [])

  // Observer를 한 번만 생성 (rootMargin 변경 시에만 재생성)
  // enabled 변경 시 observer를 재생성하지 않아 즉시 초기 콜백 발동을 방지
  useEffect(() => {
    if (!sentinelRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && enabledRef.current) {
          onLoadMoreRef.current()
        }
      },
      { rootMargin: options.rootMargin ?? '200px' }
    )

    observerRef.current = observer
    observer.observe(sentinelRef.current)
    return () => {
      observer.disconnect()
      observerRef.current = null
    }
  }, [options.rootMargin])

  // enabled가 false→true로 전환될 때 (fetch 완료 후),
  // 새 콘텐츠가 렌더링될 시간을 준 뒤 sentinel을 재관찰하여
  // 아직 뷰포트 안에 있으면 다음 페이지를 로드
  useEffect(() => {
    if (!options.enabled) return

    const timerId = setTimeout(() => {
      const observer = observerRef.current
      const sentinel = sentinelRef.current
      if (observer && sentinel && enabledRef.current) {
        observer.unobserve(sentinel)
        observer.observe(sentinel)
      }
    }, options.reobserveDelay ?? 150)

    return () => clearTimeout(timerId)
  }, [options.enabled, options.reobserveDelay])

  return setSentinelRef
}
