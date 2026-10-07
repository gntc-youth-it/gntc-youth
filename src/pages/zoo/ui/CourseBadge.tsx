import type { CourseId } from '../model/course'
import type { ZooTeamStatus } from '../model/team'
import { COURSE_THEME, PARK_GREEN } from './courseTheme'

export const CourseBadge = ({ course }: { course: CourseId }) => {
  const theme = COURSE_THEME[course]
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 font-sign text-[15px] leading-none"
      style={{ backgroundColor: theme.color, color: theme.onColor }}
    >
      {course}코스
    </span>
  )
}

// 조 목록에서 코스를 한눈에 구분하는 동그란 표시
export const CourseDot = ({ course }: { course: CourseId }) => {
  const theme = COURSE_THEME[course]
  return (
    <span
      role="img"
      aria-label={`${course}코스`}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-sign text-[22px]"
      style={{ backgroundColor: theme.color, color: theme.onColor }}
    >
      {course}
    </span>
  )
}

interface TeamStatusPillProps {
  status: ZooTeamStatus
  arrivedCount?: number
  totalStops?: number
}

export const TeamStatusPill = ({ status, arrivedCount, totalStops }: TeamStatusPillProps) =>
  status === 'RECRUITING' ? (
    <span className="inline-flex shrink-0 items-center rounded-full bg-[#E3F1E8] px-2.5 py-1 text-[12px] font-semibold" style={{ color: PARK_GREEN }}>
      모집 중
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center rounded-full bg-[#F2F4F6] px-2.5 py-1 text-[12px] font-semibold text-[#4E5968]">
      출발{arrivedCount != null && totalStops != null ? ` ${arrivedCount}/${totalStops}` : ''}
    </span>
  )
