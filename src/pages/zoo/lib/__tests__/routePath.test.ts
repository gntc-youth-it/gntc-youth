import { buildSegments, getMidpointWithAngle, segmentsToPath } from '../routePath'

describe('buildSegments', () => {
  it('경유점마다 구간을 이어 붙인다', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 200, y: 100 },
    ]

    const segments = buildSegments(points)

    expect(segments).toHaveLength(2)
    expect(segments[0].start).toEqual(points[0])
    expect(segments[0].end).toEqual(points[1])
    expect(segments[1].start).toEqual(points[1])
    expect(segments[1].end).toEqual(points[2])
  })

  it('급하게 되돌아가는 갈림길에서도 제어점이 구간 길이의 40%를 넘지 않는다', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 1000, y: 0 },
      { x: 990, y: 40 },
      { x: 0, y: 60 },
    ]

    buildSegments(points).forEach(({ start, control1, control2, end }) => {
      const length = Math.hypot(end.x - start.x, end.y - start.y)
      expect(Math.hypot(control1.x - start.x, control1.y - start.y)).toBeLessThanOrEqual(length * 0.4 + 1e-9)
      expect(Math.hypot(end.x - control2.x, end.y - control2.y)).toBeLessThanOrEqual(length * 0.4 + 1e-9)
    })
  })

  it('앞뒤 구간의 이웃 점으로 이음매의 접선을 맞춘다', () => {
    const points = [
      { x: 100, y: 0 },
      { x: 200, y: 0 },
    ]

    const [segment] = buildSegments(points, { x: 100, y: -100 }, { x: 200, y: 100 })

    expect(segment.control1.y).toBeGreaterThan(0)
    expect(segment.control2.y).toBeLessThan(0)
  })
})

describe('segmentsToPath', () => {
  it('SVG path 문자열로 바꾼다', () => {
    const path = segmentsToPath(
      buildSegments([
        { x: 0, y: 0 },
        { x: 60, y: 0 },
      ])
    )

    expect(path).toBe('M0 0 C10 0 50 0 60 0')
  })

  it('구간이 없으면 빈 문자열', () => {
    expect(segmentsToPath([])).toBe('')
  })
})

describe('getMidpointWithAngle', () => {
  it('곡선 길이의 절반 지점과 진행 방향을 구한다', () => {
    const result = getMidpointWithAngle(
      buildSegments([
        { x: 0, y: 0 },
        { x: 200, y: 0 },
      ])
    )

    expect(result?.point.x).toBeCloseTo(100, 0)
    expect(result?.point.y).toBeCloseTo(0)
    expect(result?.angle).toBeCloseTo(0)
    expect(result?.length).toBeCloseTo(200, 0)
  })

  it('아래로 내려가는 길은 90도', () => {
    const result = getMidpointWithAngle(
      buildSegments([
        { x: 50, y: 0 },
        { x: 50, y: 300 },
      ])
    )

    expect(result?.angle).toBeCloseTo(90)
  })

  it('구간이 없으면 null', () => {
    expect(getMidpointWithAngle([])).toBeNull()
  })
})
