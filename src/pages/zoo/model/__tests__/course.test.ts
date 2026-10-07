import {
  COURSE_STOP_IDS,
  GATE_POINT,
  getCourseLegs,
  getCourseStops,
} from '../course'

describe('코스 순서', () => {
  it('A코스는 제1아프리카관에서 출발해 제2아프리카관까지 돈다', () => {
    expect(getCourseStops('A').map((stop) => stop.name)).toEqual([
      '제1아프리카관',
      '호주관',
      '대동물관',
      '곰사',
      '맹수사',
      '제3아프리카관',
      '제2아프리카관',
    ])
  })

  it('B코스는 A코스의 역순이다', () => {
    expect(COURSE_STOP_IDS.B).toEqual([...COURSE_STOP_IDS.A].reverse())
    expect(getCourseStops('B')[0].name).toBe('제2아프리카관')
  })
})

describe('getCourseLegs', () => {
  it.each(['A', 'B'] as const)('%s코스는 정문에서 출발해 모든 장소를 순서대로 지나 정문으로 돌아온다', (course) => {
    const legs = getCourseLegs(course)
    const stops = getCourseStops(course)

    expect(legs).toHaveLength(stops.length + 1)
    expect(legs[0].from).toBe('gate')
    expect(legs[0].points[0]).toEqual(GATE_POINT)
    expect(legs.map((leg) => leg.to)).toEqual([...stops.map((stop) => stop.id), 'gate'])

    legs.forEach((leg, index) => {
      const lastPoint = leg.points[leg.points.length - 1]
      expect(lastPoint).toEqual(index < stops.length ? stops[index].point : GATE_POINT)
      expect(leg.directions.length).toBeGreaterThan(0)

      if (index > 0) {
        const prevPoints = legs[index - 1].points
        expect(leg.points[0]).toEqual(prevPoints[prevPoints.length - 1])
      }
    })
  })

  it('B코스는 A코스와 같은 길을 거꾸로 걷는다', () => {
    const aPoints = getCourseLegs('A').flatMap((leg) => leg.points)
    const bPoints = getCourseLegs('B').flatMap((leg) => leg.points)

    expect(bPoints).toEqual([...aPoints].reverse())
  })

  it('코스마다 그 방향에 맞는 길 안내를 준다', () => {
    expect(getCourseLegs('A')[0].directions[0]).toContain('홍학사')
    expect(getCourseLegs('B')[0].directions[0]).toContain('100주년 광장')
  })
})
