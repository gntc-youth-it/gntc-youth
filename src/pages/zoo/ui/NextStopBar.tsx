import { Link } from 'react-router-dom'
import type { CourseId, ZooStop } from '../model/course'
import { COURSE_THEME, PARK_GREEN } from './courseTheme'

interface NextStopAction {
  label: string
  href: string
  // 조장은 미션을 하러 가는 주 버튼, 조원은 문제만 보는 보조 버튼
  emphasis: 'primary' | 'secondary'
}

interface NextStopBarProps {
  course: CourseId
  nextStop: ZooStop | null
  nextNumber: number
  directions: string[]
  visitedCount: number
  totalStops: number
  action?: NextStopAction
  readOnlyHint?: string
  errorMessage?: string
}

// 화면 아래에 늘 떠 있는 안내판: 지금 어디로 가야 하는지만 보여준다
export const NextStopBar = ({
  course,
  nextStop,
  nextNumber,
  directions,
  visitedCount,
  totalStops,
  action,
  readOnlyHint,
  errorMessage,
}: NextStopBarProps) => {
  const theme = COURSE_THEME[course]
  const progress = Math.round((visitedCount / totalStops) * 100)

  return (
    <aside aria-label="다음 목적지 안내" className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <div
        className="relative mx-auto max-w-xl overflow-hidden rounded-2xl text-white shadow-[0_10px_30px_rgba(31,77,54,0.35)]"
        style={{ backgroundColor: PARK_GREEN }}
      >
        <div
          role="progressbar"
          aria-label={`${totalStops}곳 중 ${visitedCount}곳 도착`}
          aria-valuemin={0}
          aria-valuemax={totalStops}
          aria-valuenow={visitedCount}
          className="h-1 bg-white/15"
        >
          <div className="h-full transition-[width] duration-500" style={{ width: `${progress}%`, backgroundColor: theme.color }} />
        </div>

        {errorMessage && (
          <p role="alert" className="break-keep bg-[#FFE3E3] px-4 py-2 text-[13px] text-[#C92A2A]">
            {errorMessage}
          </p>
        )}

        <div className="flex items-center gap-3 px-4 py-3.5" aria-live="polite">
          {nextStop ? (
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-sign text-[23px]"
              style={{ backgroundColor: theme.color, color: theme.onColor }}
            >
              {nextNumber}
            </span>
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white font-sign text-[15px]" style={{ color: PARK_GREEN }}>
              정문
            </span>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-white/70">{nextStop ? '다음 목적지' : `${totalStops}곳 모두 돌았어요`}</p>
            <p className="truncate font-sign text-[23px] leading-tight">{nextStop ? nextStop.name : '정문으로 모여주세요'}</p>
            {directions[0] && <p className="mt-0.5 line-clamp-2 break-keep text-[13px] leading-snug text-white/85">{directions[0]}</p>}
            {nextStop && readOnlyHint && <p className="mt-1.5 break-keep text-[12px] text-white/60">{readOnlyHint}</p>}
          </div>

          {nextStop && action && (
            <Link
              to={action.href}
              className={`shrink-0 rounded-full px-4 py-2.5 text-[14px] font-semibold transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1F4D36] ${
                action.emphasis === 'primary' ? 'bg-white' : 'border border-white/50 text-white'
              }`}
              style={action.emphasis === 'primary' ? { color: PARK_GREEN } : undefined}
            >
              {action.label}
            </Link>
          )}
        </div>
      </div>
    </aside>
  )
}
