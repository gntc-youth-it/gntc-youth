import type { CourseId } from '../model/course'

export interface CourseTheme {
  // 코스 선과 번호 배경
  color: string
  // color 위에 올라가는 글자색 (명도 대비 4.5:1 이상)
  onColor: string
  // 선택된 코스 버튼처럼 옅게 칠하는 배경
  tint: string
}

export const COURSE_THEME: Record<CourseId, CourseTheme> = {
  A: { color: '#E8590C', onColor: '#191F28', tint: '#FFF1E7' },
  B: { color: '#1971C2', onColor: '#FFFFFF', tint: '#E8F2FC' },
}

// 공원 안내판의 짙은 초록
export const PARK_GREEN = '#1F4D36'

export const MAP_GRASS = '#E4EED9'
