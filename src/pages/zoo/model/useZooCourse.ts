import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCourseLegs, getCourseStops, isStopId, parseCourseId } from './course'
import type { CourseId, StopId } from './course'

export const COURSE_STORAGE_KEY = 'zooCourse:course'
export const VISITED_STORAGE_KEY = 'zooCourse:visited'

// 사파리 개인정보 보호 모드처럼 저장소를 쓸 수 없는 환경에서는 저장 없이 동작
const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // 저장하지 못해도 화면은 그대로 쓸 수 있다
  }
}

const readVisited = (): StopId[] => {
  try {
    const parsed: unknown = JSON.parse(readStorage(VISITED_STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isStopId) : []
  } catch {
    return []
  }
}

export const useZooCourse = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  // 공유 링크(?course=b)가 기기에 저장된 선택보다 우선
  const [course, setCourse] = useState<CourseId | null>(
    () => parseCourseId(searchParams.get('course')) ?? parseCourseId(readStorage(COURSE_STORAGE_KEY))
  )
  const [visited, setVisited] = useState<StopId[]>(readVisited)

  useEffect(() => {
    if (course) writeStorage(COURSE_STORAGE_KEY, course)
  }, [course])

  useEffect(() => {
    writeStorage(VISITED_STORAGE_KEY, JSON.stringify(visited))
  }, [visited])

  const selectCourse = useCallback(
    (next: CourseId) => {
      setCourse(next)
      setSearchParams({ course: next.toLowerCase() }, { replace: true })
    },
    [setSearchParams]
  )

  const stops = useMemo(() => (course ? getCourseStops(course) : []), [course])
  const legs = useMemo(() => (course ? getCourseLegs(course) : []), [course])

  // 코스 순서상 아직 안 간 첫 장소. 모두 돌았으면 null
  const nextStop = stops.find((stop) => !visited.includes(stop.id)) ?? null

  const toggleVisited = useCallback((id: StopId) => {
    setVisited((prev) => (prev.includes(id) ? prev.filter((visitedId) => visitedId !== id) : [...prev, id]))
  }, [])

  const markArrived = useCallback(() => {
    if (!nextStop) return
    setVisited((prev) => (prev.includes(nextStop.id) ? prev : [...prev, nextStop.id]))
  }, [nextStop])

  const resetVisited = useCallback(() => setVisited([]), [])

  return {
    course,
    selectCourse,
    stops,
    legs,
    visited,
    nextStop,
    toggleVisited,
    markArrived,
    resetVisited,
  }
}
