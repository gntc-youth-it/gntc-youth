import { useMemo } from 'react'
import { GATE_POINT, MAP_LANDMARKS, ZOO_STOPS, getCourseLegs, getCourseStops } from '../model/course'
import type { CourseId, StopId } from '../model/course'
import { buildSegments, getMidpointWithAngle, segmentsToPath } from '../lib/routePath'
import { COURSE_THEME, MAP_GRASS, PARK_GREEN } from './courseTheme'

// 안내지도에서 코스가 지나는 부분만 잘라 보여준다
const VIEW_BOX = '250 400 1830 1860'

const NEUTRAL_ROUTE = '#9DB2A3'
const NEUTRAL_STOP = '#5F7A69'
const LABEL_INK = '#191F28'
const LANDMARK_INK = '#5B7B63'
// 이보다 짧은 구간은 화살표가 번호 표시와 겹쳐서 생략
const MIN_ARROW_LEG_LENGTH = 320

type LegState = 'neutral' | 'done' | 'current' | 'upcoming'

interface CourseMapProps {
  course: CourseId | null
  visited: StopId[]
  nextStopId: StopId | null
}

export const CourseMap = ({ course, visited, nextStopId }: CourseMapProps) => {
  const theme = course ? COURSE_THEME[course] : null
  // 코스를 고르기 전에는 순서 없이 길만 보여준다
  const stops = useMemo(() => (course ? getCourseStops(course) : Object.values(ZOO_STOPS)), [course])

  const legPaths = useMemo(() => {
    const legs = getCourseLegs(course ?? 'A')
    return legs.map((leg, index) => {
      const prevLeg = legs[index - 1]
      const nextLeg = legs[index + 1]
      const segments = buildSegments(
        leg.points,
        prevLeg ? prevLeg.points[prevLeg.points.length - 2] : undefined,
        nextLeg ? nextLeg.points[1] : undefined
      )
      return { to: leg.to, d: segmentsToPath(segments), arrow: getMidpointWithAngle(segments) }
    })
  }, [course])

  // 지금 걷는 구간: 다음 장소로 가는 길, 모두 돌았으면 정문으로 가는 마지막 길
  const currentLegIndex = nextStopId ? stops.findIndex((stop) => stop.id === nextStopId) : legPaths.length - 1

  const getLegState = (to: StopId | 'gate', index: number): LegState => {
    if (!course) return 'neutral'
    if (index === currentLegIndex) return 'current'
    return to !== 'gate' && visited.includes(to) ? 'done' : 'upcoming'
  }

  const label = course
    ? `${course}코스 지도. 정문에서 출발해 ${stops.map((stop, index) => `${index + 1}번 ${stop.name}`).join(', ')}을 지나 정문으로 돌아와요.`
    : '동물원 나들이 코스 지도'

  return (
    <div className="overflow-hidden rounded-3xl" style={{ backgroundColor: MAP_GRASS }}>
      <svg viewBox={VIEW_BOX} role="img" aria-label={label} className="block h-auto w-full">
        {MAP_LANDMARKS.map((landmark) => (
          <text
            key={landmark.name}
            x={landmark.point.x}
            y={landmark.point.y}
            textAnchor={landmark.anchor}
            dominantBaseline="central"
            fontSize={48}
            fill={LANDMARK_INK}
            stroke={MAP_GRASS}
            strokeWidth={12}
            paintOrder="stroke"
          >
            {landmark.name}
          </text>
        ))}

        {legPaths.map((leg, index) => (
          <path
            key={`casing-${index}`}
            d={leg.d}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={60}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {legPaths.map((leg, index) => {
          const state = getLegState(leg.to, index)
          return (
            <path
              key={`line-${index}`}
              d={leg.d}
              fill="none"
              stroke={theme ? theme.color : NEUTRAL_ROUTE}
              strokeOpacity={state === 'done' ? 0.3 : 1}
              strokeWidth={state === 'current' ? 36 : 28}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )
        })}

        {theme && legPaths[currentLegIndex] && (
          <path
            d={legPaths[currentLegIndex].d}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray="2 70"
            className="motion-safe:animate-route-flow"
          />
        )}

        {theme &&
          legPaths.map((leg, index) =>
            leg.arrow && leg.arrow.length >= MIN_ARROW_LEG_LENGTH && getLegState(leg.to, index) !== 'done' ? (
              <g
                key={`arrow-${index}`}
                transform={`translate(${leg.arrow.point.x} ${leg.arrow.point.y}) rotate(${leg.arrow.angle})`}
              >
                <circle r={38} fill={theme.color} stroke="#FFFFFF" strokeWidth={8} />
                <polyline
                  points="-9,-16 11,0 -9,16"
                  fill="none"
                  stroke={theme.onColor}
                  strokeWidth={10}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ) : null
          )}

        {theme && (
          <g transform="translate(2040 470)">
            <rect x={-250} y={-56} width={250} height={112} rx={56} fill={theme.color} />
            <text
              x={-125}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={66}
              fill={theme.onColor}
              className="font-sign"
            >
              {course}코스
            </text>
          </g>
        )}

        <g transform={`translate(${GATE_POINT.x} ${GATE_POINT.y})`}>
          <rect x={-92} y={-46} width={184} height={92} rx={46} fill={PARK_GREEN} stroke="#FFFFFF" strokeWidth={10} />
          <text textAnchor="middle" dominantBaseline="central" fontSize={56} fill="#FFFFFF" className="font-sign">
            정문
          </text>
        </g>

        {stops.map((stop, index) => {
          const isVisited = visited.includes(stop.id)
          const isNext = stop.id === nextStopId

          return (
            <g key={stop.id} transform={`translate(${stop.point.x} ${stop.point.y})`}>
              {theme && isNext && (
                <circle
                  r={60}
                  fill={theme.color}
                  className="origin-center [transform-box:fill-box] motion-safe:animate-stop-pulse"
                />
              )}
              {theme ? (
                <>
                  <circle
                    r={60}
                    fill={isVisited ? '#FFFFFF' : theme.color}
                    stroke={isVisited ? theme.color : '#FFFFFF'}
                    strokeWidth={isVisited ? 16 : 14}
                  />
                  {isVisited ? (
                    <path
                      d="M-25 2 L-7 20 L26 -17"
                      fill="none"
                      stroke={theme.color}
                      strokeWidth={14}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ) : (
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={76}
                      fill={theme.onColor}
                      className="font-sign"
                    >
                      {index + 1}
                    </text>
                  )}
                </>
              ) : (
                <circle r={34} fill={NEUTRAL_STOP} stroke="#FFFFFF" strokeWidth={10} />
              )}
              <text
                x={stop.label.dx}
                y={stop.label.dy}
                textAnchor={stop.label.anchor}
                dominantBaseline="central"
                fontSize={66}
                fill={LABEL_INK}
                fillOpacity={isVisited ? 0.45 : 1}
                stroke="#FFFFFF"
                strokeWidth={16}
                strokeLinejoin="round"
                paintOrder="stroke"
                className="font-sign"
              >
                {stop.name}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
