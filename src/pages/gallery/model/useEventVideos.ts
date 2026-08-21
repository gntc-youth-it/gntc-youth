import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { EventVideo, EventVideoGroup, SubCategory } from './types'
import { fetchEventVideos, fetchSubCategories } from '../api/galleryApi'

// 영상 탭: 전체 영상을 한 번에 불러와 수련회 행사별로 그룹핑
export const useEventVideos = (enabled: boolean) => {
  const [videos, setVideos] = useState<EventVideo[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null)
  const loadedRef = useRef(false)

  useEffect(() => {
    if (!enabled || loadedRef.current) return
    loadedRef.current = true
    let cancelled = false
    setIsLoading(true)
    Promise.all([
      fetchEventVideos(),
      // 그룹 라벨용 행사 목록: 실패해도 raw 이름으로 표시 가능하므로 무시
      fetchSubCategories('RETREAT').catch(() => [] as SubCategory[]),
    ])
      .then(([videoList, subs]) => {
        if (cancelled) return
        setVideos(videoList)
        setSubCategories(subs)
        setError(null)
      })
      .catch(() => {
        if (cancelled) return
        setError('영상을 불러오는데 실패했습니다.')
        // 탭 재진입 시 재시도 가능하도록
        loadedRef.current = false
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [enabled])

  const groups = useMemo<EventVideoGroup[]>(() => {
    const displayNameByKey = new Map<string, string>()
    const parentByChild = new Map<string, string>()
    subCategories.forEach((sub) => {
      displayNameByKey.set(sub.name, sub.displayName)
      sub.children?.forEach((child) => {
        parentByChild.set(child.name, sub.name)
      })
    })

    const groupMap = new Map<string, EventVideoGroup>()
    videos.forEach((video) => {
      // 하위 프로그램 영상은 상위 수련회 그룹으로 묶음
      const key = parentByChild.get(video.subCategory) ?? video.subCategory
      const existing = groupMap.get(key)
      if (existing) {
        existing.videos.push(video)
      } else {
        groupMap.set(key, { key, label: displayNameByKey.get(key) ?? key, videos: [video] })
      }
    })

    // 행사 목록 순서(최신 행사 우선)를 따르고, 목록에 없는 그룹은 뒤에 배치
    const orderByKey = new Map(subCategories.map((sub, idx) => [sub.name, idx]))
    return Array.from(groupMap.values()).sort(
      (a, b) => (orderByKey.get(a.key) ?? Infinity) - (orderByKey.get(b.key) ?? Infinity),
    )
  }, [videos, subCategories])

  const filteredGroups = useMemo(
    () => (selectedGroupKey ? groups.filter((g) => g.key === selectedGroupKey) : groups),
    [groups, selectedGroupKey],
  )

  const selectGroup = useCallback((key: string | null) => {
    setSelectedGroupKey(key)
  }, [])

  return {
    isLoading,
    error,
    groups,
    filteredGroups,
    selectedGroupKey,
    selectGroup,
  }
}
