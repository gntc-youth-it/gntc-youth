import { Link } from 'react-router-dom'
import { useZooCourse } from '../model/useZooCourse'
import { CourseMap } from './CourseMap'
import { CourseToggle } from './CourseToggle'
import { NextStopBar } from './NextStopBar'
import { StopTimeline } from './StopTimeline'
import { ZooLayout } from './ZooLayout'
import { PARK_GREEN } from './courseTheme'

// 로그인 없이 혼자 코스를 확인하는 화면. 기록은 이 기기에만 남는다
export const ZooCoursePage = () => {
  const { course, selectCourse, stops, legs, visited, nextStop, toggleVisited, markArrived, resetVisited } =
    useZooCourse()

  const nextIndex = nextStop ? stops.indexOf(nextStop) : stops.length
  const visitedCount = stops.filter((stop) => visited.includes(stop.id)).length

  return (
    <>
      <ZooLayout hasBottomBar={!!course}>
        <h1 className="font-sign text-[34px] leading-tight sm:text-[40px]" style={{ color: PARK_GREEN }}>
          동물원 나들이 코스
        </h1>
        <p className="mt-2 break-keep text-[15px] leading-relaxed text-[#4E5968]">
          서울대공원 동물원 7곳을 코스 순서대로 돌아요.
          {!course && ' 내 코스를 먼저 골라주세요.'}
        </p>
        <Link
          to="/zoo"
          className="mt-3 inline-block text-[13px] text-[#6B7684] underline underline-offset-4 hover:text-[#333D4B]"
        >
          조를 만들고 함께 보기
        </Link>

        <div className="mt-6">
          <CourseToggle course={course} onSelect={selectCourse} />
        </div>

        <figure className="mt-5">
          <CourseMap course={course} visited={visited} nextStopId={nextStop?.id ?? null} />
          <figcaption className="mt-2.5 break-keep text-[12px] leading-relaxed text-[#6B7684]">
            공식 안내지도를 간단하게 옮긴 그림이에요. 갈림길에서는 현장 안내판도 함께 확인하세요.
          </figcaption>
        </figure>

        {course && (
          <StopTimeline
            course={course}
            stops={stops}
            legs={legs}
            visited={visited}
            nextStopId={nextStop?.id ?? null}
            onToggleVisited={toggleVisited}
            onReset={resetVisited}
          />
        )}
      </ZooLayout>

      {course && (
        <NextStopBar
          course={course}
          nextStop={nextStop}
          nextNumber={nextIndex + 1}
          directions={legs[nextIndex]?.directions ?? []}
          visitedCount={visitedCount}
          totalStops={stops.length}
          onArrive={markArrived}
        />
      )}
    </>
  )
}
