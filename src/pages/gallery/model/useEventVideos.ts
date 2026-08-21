import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import type { EventVideo, EventVideoGroup, EventVideoProgram, SubCategory } from './types'
import { fetchEventVideos, fetchSubCategories } from '../api/galleryApi'

// 영상 탭: 전체 영상을 한 번에 불러와 수련회 행사별로 그룹핑
export const useEventVideos = (enabled: boolean) => {
  const [videos, setVideos] = useState<EventVideo[]>([])
  const [subCategories, setSubCategories] = useState<SubCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null)
  // 그룹(행사)별로 선택된 하위 프로그램 (없으면 행사 전체)
  const [selectedProgramByGroup, setSelectedProgramByGroup] = useState<Record<string, string | null>>({})
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
    const childrenByParent = new Map<string, { name: string; displayName: string }[]>()
    subCategories.forEach((sub) => {
      displayNameByKey.set(sub.name, sub.displayName)
      childrenByParent.set(sub.name, sub.children ?? [])
      sub.children?.forEach((child) => {
        parentByChild.set(child.name, sub.name)
      })
    })

    const groupMap = new Map<string, EventVideoGroup>()
    videos.forEach((video) => {
      // 하위 프로그램 영상은 상위 수련회 그룹으로 묶음
      const key = parentByChild.get(video.subCategory) ?? video.subCategory
      let group = groupMap.get(key)
      if (!group) {
        group = { key, label: displayNameByKey.get(key) ?? key, videos: [], programs: [] }
        groupMap.set(key, group)
      }
      group.videos.push(video)
    })

    // 그룹 내 하위 프로그램별 묶음 (영상이 있는 프로그램만, 행사의 children 순서 유지)
    groupMap.forEach((group) => {
      const videosByProgram = new Map<string, EventVideo[]>()
      group.videos.forEach((video) => {
        if (video.subCategory !== group.key) {
          const list = videosByProgram.get(video.subCategory) ?? []
          list.push(video)
          videosByProgram.set(video.subCategory, list)
        }
      })
      group.programs = (childrenByParent.get(group.key) ?? [])
        .filter((child) => videosByProgram.has(child.name))
        .map<EventVideoProgram>((child) => ({
          key: child.name,
          label: child.displayName,
          videos: videosByProgram.get(child.name)!,
        }))
    })

    // 행사 목록 순서(최신 행사 우선)를 따르고, 목록에 없는 그룹은 뒤에 배치
    const orderByKey = new Map(subCategories.map((sub, idx) => [sub.name, idx]))
    return Array.from(groupMap.values()).sort(
      (a, b) => (orderByKey.get(a.key) ?? Infinity) - (orderByKey.get(b.key) ?? Infinity),
    )
  }, [videos, subCategories])

  const filteredGroups = useMemo(() => {
    const base = selectedGroupKey ? groups.filter((g) => g.key === selectedGroupKey) : groups
    // 그룹별로 선택된 하위 프로그램이 있으면 해당 프로그램 영상만 노출
    return base.map((group) => {
      const programKey = selectedProgramByGroup[group.key]
      if (!programKey) return group
      const program = group.programs.find((p) => p.key === programKey)
      if (!program) return group
      return { ...group, videos: program.videos }
    })
  }, [groups, selectedGroupKey, selectedProgramByGroup])

  const selectGroup = useCallback((key: string | null) => {
    setSelectedGroupKey(key)
  }, [])

  const selectProgram = useCallback((groupKey: string, programKey: string | null) => {
    setSelectedProgramByGroup((prev) => ({ ...prev, [groupKey]: programKey }))
  }, [])

  return {
    isLoading,
    error,
    groups,
    filteredGroups,
    selectedGroupKey,
    selectGroup,
    selectedProgramByGroup,
    selectProgram,
  }
}
