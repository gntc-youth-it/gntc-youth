import { Link } from 'react-router-dom'
import type { CourseId, CourseLeg, StopId, ZooStop } from '../model/course'
import { COURSE_THEME, PARK_GREEN } from './courseTheme'

interface StopTimelineProps {
  course: CourseId
  stops: ZooStop[]
  legs: CourseLeg[]
  visited: StopId[]
  nextStopId: StopId | null
  getMissionHref: (id: StopId) => string
  // 조장(또는 운영자)은 미션을 내고 고칠 수 있고, 조원은 문제와 낸 내용을 볼 수만 있다
  canSubmit: boolean
}

const CheckIcon = ({ color, size = 16 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="5 12.5 10 17.5 19 7" />
  </svg>
)

const Directions = ({ steps, muted }: { steps: string[]; muted?: boolean }) => (
  <ul className={`mt-2.5 space-y-1 break-keep text-[14px] leading-relaxed ${muted ? 'text-[#8B95A1]' : 'text-[#333D4B]'}`}>
    {steps.map((step) => (
      <li key={step} className="flex gap-2">
        <span aria-hidden="true" className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-current opacity-60" />
        <span>{step}</span>
      </li>
    ))}
  </ul>
)

const GateNode = () => (
  <span
    className="relative z-10 flex h-7 w-11 items-center justify-center rounded-full font-sign text-[15px] text-white"
    style={{ backgroundColor: PARK_GREEN }}
  >
    정문
  </span>
)

export const StopTimeline = ({
  course,
  stops,
  legs,
  visited,
  nextStopId,
  getMissionHref,
  canSubmit,
}: StopTimelineProps) => {
  const theme = COURSE_THEME[course]
  const exitLeg = legs[legs.length - 1]

  // 노드 아래로 이어지는 선은 다음 장소로 가는 길. 이미 도착한 곳으로 가는 길은 흐리게
  const connector = (dimmed: boolean) => (
    <span
      aria-hidden="true"
      className="absolute bottom-0 left-[22px] top-8 w-1 -translate-x-1/2 rounded-full"
      style={{ backgroundColor: theme.color, opacity: dimmed ? 0.3 : 1 }}
    />
  )

  return (
    <section aria-labelledby="zoo-course-order" className="mt-10">
      <h2 id="zoo-course-order" className="font-sign text-[26px] leading-tight" style={{ color: PARK_GREEN }}>
        {course}코스 순서
      </h2>

      <ol className="mt-5">
        <li className="relative flex gap-4 pb-6">
          <div className="flex w-11 shrink-0 justify-center">
            <GateNode />
            {connector(visited.includes(stops[0].id))}
          </div>
          <p className="pt-0.5 text-[15px] font-semibold text-[#191F28]">정문에서 출발</p>
        </li>

        {stops.map((stop, index) => {
          const isVisited = visited.includes(stop.id)
          const isNext = stop.id === nextStopId
          const followingStop = stops[index + 1]
          const actionLabel = isVisited
            ? canSubmit
              ? '제출 내용 고치기'
              : '제출 내용 보기'
            : canSubmit
              ? '미션 하기'
              : '문제 보기'

          return (
            <li key={stop.id} className="relative flex gap-4 pb-7">
              <div className="flex w-11 shrink-0 justify-center">
                <span
                  className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full font-sign text-[21px]"
                  style={
                    isVisited
                      ? { backgroundColor: '#FFFFFF', border: `3px solid ${theme.color}` }
                      : {
                          backgroundColor: theme.color,
                          color: theme.onColor,
                          boxShadow: isNext ? `0 0 0 5px ${theme.tint}, 0 0 0 7px ${theme.color}` : undefined,
                        }
                  }
                >
                  {isVisited ? <CheckIcon color={theme.color} size={20} /> : index + 1}
                </span>
                {connector(followingStop ? visited.includes(followingStop.id) : false)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className={`font-sign text-[23px] leading-tight ${isVisited ? 'text-[#8B95A1]' : 'text-[#191F28]'}`}>
                        {stop.name}
                      </h3>
                      {isNext && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[12px] font-semibold"
                          style={{ backgroundColor: theme.tint, color: '#191F28' }}
                        >
                          지금 갈 곳
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[13px] text-[#6B7684]">{stop.animals.join(', ')}</p>
                  </div>
                  <Link
                    to={getMissionHref(stop.id)}
                    aria-label={`${stop.name} ${actionLabel}`}
                    className="flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2"
                    style={
                      isVisited
                        ? { backgroundColor: theme.tint, borderColor: theme.tint, color: '#191F28' }
                        : { backgroundColor: '#FFFFFF', borderColor: '#D1D6DB', color: '#4E5968' }
                    }
                  >
                    {isVisited && <CheckIcon color={theme.color} size={14} />}
                    {isVisited ? '제출 완료' : actionLabel}
                  </Link>
                </div>
                <Directions steps={legs[index].directions} muted={isVisited} />
              </div>
            </li>
          )
        })}

        <li className="relative flex gap-4">
          <div className="flex w-11 shrink-0 justify-center">
            <GateNode />
          </div>
          <div className="min-w-0 flex-1">
            <p className="pt-0.5 text-[15px] font-semibold text-[#191F28]">정문에 모여요</p>
            <Directions steps={exitLeg.directions} />
          </div>
        </li>
      </ol>
    </section>
  )
}
