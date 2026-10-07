import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { COURSE_IDS, getCourseLegs, getCourseStops, isStopId, parseCourseId } from './course'
import type { CourseId, StopId } from './course'

export const COURSE_STORAGE_KEY = 'zooCourse:course'

// 도착 기록은 코스마다 따로 둔다. 다른 코스를 잠깐 열어 봐도 원래 코스의 기록은 그대로 남는다
export const getVisitedStorageKey = (course: CourseId) => `zooCourse:visited:${course}`

type VisitedByCourse = Record<CourseId, StopId[]>

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

const readVisited = (course: CourseId): StopId[] => {
  try {
    const parsed: unknown = JSON.parse(readStorage(getVisitedStorageKey(course)) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isStopId) : []
  } catch {
    return []
  }
}

const readAllVisited = (): VisitedByCourse => ({ A: readVisited('A'), B: readVisited('B') })

const NO_VISITS: StopId[] = []

export const useZooCourse = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  // 공유 링크(?course=b)가 기기에 저장된 선택보다 우선
  const [course, setCourse] = useState<CourseId | null>(
    () => parseCourseId(searchParams.get('course')) ?? parseCourseId(readStorage(COURSE_STORAGE_KEY))
  )
  const [visitedByCourse, setVisitedByCourse] = useState<VisitedByCourse>(readAllVisited)

  useEffect(() => {
    if (course) writeStorage(COURSE_STORAGE_KEY, course)
  }, [course])

  useEffect(() => {
    COURSE_IDS.forEach((id) => writeStorage(getVisitedStorageKey(id), JSON.stringify(visitedByCourse[id])))
  }, [visitedByCourse])

  const selectCourse = useCallback(
    (next: CourseId) => {
      setCourse(next)
      setSearchParams({ course: next.toLowerCase() }, { replace: true })
    },
    [setSearchParams]
  )

  const stops = useMemo(() => (course ? getCourseStops(course) : []), [course])
  const legs = useMemo(() => (course ? getCourseLegs(course) : []), [course])
  const visited = course ? visitedByCourse[course] : NO_VISITS

  // 코스 순서상 아직 안 간 첫 장소. 모두 돌았으면 null
  const nextStop = stops.find((stop) => !visited.includes(stop.id)) ?? null

  const updateVisited = useCallback(
    (update: (prev: StopId[]) => StopId[]) => {
      if (!course) return
      setVisitedByCourse((prev) => ({ ...prev, [course]: update(prev[course]) }))
    },
    [course]
  )

  const toggleVisited = useCallback(
    (id: StopId) =>
      updateVisited((prev) => (prev.includes(id) ? prev.filter((visitedId) => visitedId !== id) : [...prev, id])),
    [updateVisited]
  )

  const markArrived = useCallback(() => {
    if (!nextStop) return
    updateVisited((prev) => (prev.includes(nextStop.id) ? prev : [...prev, nextStop.id]))
  }, [nextStop, updateVisited])

  const resetVisited = useCallback(() => updateVisited(() => []), [updateVisited])

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
