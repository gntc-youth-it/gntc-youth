import type { MapPoint } from '../model/course'

export interface CubicSegment {
  start: MapPoint
  control1: MapPoint
  control2: MapPoint
  end: MapPoint
}

export interface PointWithAngle {
  point: MapPoint
  angle: number
  // 곡선 전체 길이
  length: number
}

// 급하게 꺾이는 갈림길에서 곡선이 고리처럼 튀어나가지 않도록 제어점 길이를 구간 길이에 비례해 제한
const MAX_HANDLE_RATIO = 0.4

const limitHandle = (vector: MapPoint, maxLength: number): MapPoint => {
  const length = Math.hypot(vector.x, vector.y)
  if (length === 0 || length <= maxLength) return vector
  const scale = maxLength / length
  return { x: vector.x * scale, y: vector.y * scale }
}

// 경유점을 모두 지나는 Catmull-Rom 곡선을 3차 베지어 구간으로 변환한다.
// before/after는 앞뒤 구간의 이웃 점으로, 구간을 나눠 그려도 이음매가 매끄럽도록 접선 계산에만 쓴다.
export const buildSegments = (points: MapPoint[], before?: MapPoint, after?: MapPoint): CubicSegment[] => {
  const segments: CubicSegment[] = []

  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i]
    const end = points[i + 1]
    const prev = i === 0 ? before ?? start : points[i - 1]
    const next = i + 2 < points.length ? points[i + 2] : after ?? end
    const maxLength = Math.hypot(end.x - start.x, end.y - start.y) * MAX_HANDLE_RATIO

    const handle1 = limitHandle({ x: (end.x - prev.x) / 6, y: (end.y - prev.y) / 6 }, maxLength)
    const handle2 = limitHandle({ x: (next.x - start.x) / 6, y: (next.y - start.y) / 6 }, maxLength)

    segments.push({
      start,
      control1: { x: start.x + handle1.x, y: start.y + handle1.y },
      control2: { x: end.x - handle2.x, y: end.y - handle2.y },
      end,
    })
  }

  return segments
}

const round = (value: number) => Math.round(value * 10) / 10

export const segmentsToPath = (segments: CubicSegment[]): string => {
  if (segments.length === 0) return ''

  return segments.reduce(
    (path, { control1, control2, end }) =>
      `${path} C${round(control1.x)} ${round(control1.y)} ${round(control2.x)} ${round(control2.y)} ${round(end.x)} ${round(end.y)}`,
    `M${round(segments[0].start.x)} ${round(segments[0].start.y)}`
  )
}

const pointOnSegment = ({ start, control1, control2, end }: CubicSegment, t: number): MapPoint => {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return {
    x: a * start.x + b * control1.x + c * control2.x + d * end.x,
    y: a * start.y + b * control1.y + c * control2.y + d * end.y,
  }
}

// 곡선 길이의 절반 지점과 그 지점의 진행 방향(도). 방향 화살표를 놓는 데 쓴다.
export const getMidpointWithAngle = (segments: CubicSegment[], samplesPerSegment = 24): PointWithAngle | null => {
  if (segments.length === 0) return null

  const samples: MapPoint[] = [segments[0].start]
  segments.forEach((segment) => {
    for (let step = 1; step <= samplesPerSegment; step++) {
      samples.push(pointOnSegment(segment, step / samplesPerSegment))
    }
  })

  const distances = [0]
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1]
    const current = samples[i]
    distances.push(distances[i - 1] + Math.hypot(current.x - prev.x, current.y - prev.y))
  }

  const length = distances[distances.length - 1]
  const half = length / 2
  const index = Math.max(1, distances.findIndex((distance) => distance >= half))
  const from = samples[index - 1]
  const to = samples[index]
  const span = distances[index] - distances[index - 1]
  const ratio = span === 0 ? 0 : (half - distances[index - 1]) / span

  return {
    point: { x: from.x + (to.x - from.x) * ratio, y: from.y + (to.y - from.y) * ratio },
    angle: (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI,
    length,
  }
}
