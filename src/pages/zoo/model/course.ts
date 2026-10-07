export type CourseId = 'A' | 'B'

export type StopId =
  | 'AFRICA_1'
  | 'AUSTRALIA'
  | 'BIG_ANIMAL'
  | 'BEAR'
  | 'PREDATOR'
  | 'AFRICA_3'
  | 'AFRICA_2'

export type RoutePlaceId = StopId | 'gate'

// 좌표는 서울대공원 공식 안내지도(2110×3623) 원본 픽셀 기준
export interface MapPoint {
  x: number
  y: number
}

export interface MapLabel {
  dx: number
  dy: number
  anchor: 'start' | 'middle' | 'end'
}

export interface ZooStop {
  id: StopId
  name: string
  animals: string[]
  point: MapPoint
  label: MapLabel
}

export interface CourseLeg {
  from: RoutePlaceId
  to: RoutePlaceId
  points: MapPoint[]
  directions: string[]
}

export interface MapLandmark {
  name: string
  point: MapPoint
  anchor: 'start' | 'middle' | 'end'
}

export const COURSE_IDS: readonly CourseId[] = ['A', 'B']

export const GATE_POINT: MapPoint = { x: 1530, y: 2160 }

export const ZOO_STOPS: Record<StopId, ZooStop> = {
  AFRICA_1: {
    id: 'AFRICA_1',
    name: '제1아프리카관',
    animals: ['기린', '미어캣', '사막여우'],
    point: { x: 1375, y: 1935 },
    label: { dx: -40, dy: -105, anchor: 'middle' },
  },
  AUSTRALIA: {
    id: 'AUSTRALIA',
    name: '호주관',
    animals: ['붉은캥거루', '왈라루', '화식조'],
    point: { x: 1960, y: 1735 },
    label: { dx: 0, dy: 112, anchor: 'middle' },
  },
  BIG_ANIMAL: {
    id: 'BIG_ANIMAL',
    name: '대동물관',
    animals: ['아시아코끼리', '흰코뿔소', '아메리카들소'],
    point: { x: 1440, y: 1420 },
    label: { dx: 0, dy: 108, anchor: 'middle' },
  },
  BEAR: {
    id: 'BEAR',
    name: '곰사',
    animals: ['반달가슴곰', '불곰', '말레이곰'],
    point: { x: 830, y: 575 },
    label: { dx: 0, dy: -108, anchor: 'middle' },
  },
  PREDATOR: {
    id: 'PREDATOR',
    name: '맹수사',
    animals: ['시베리아호랑이', '표범', '스라소니'],
    point: { x: 625, y: 672 },
    label: { dx: -72, dy: -62, anchor: 'end' },
  },
  AFRICA_3: {
    id: 'AFRICA_3',
    name: '제3아프리카관',
    animals: ['사자', '치타', '점박이하이에나'],
    point: { x: 690, y: 1400 },
    label: { dx: 92, dy: 0, anchor: 'start' },
  },
  AFRICA_2: {
    id: 'AFRICA_2',
    name: '제2아프리카관',
    animals: ['하마', '흰오릭스', '바바리양'],
    point: { x: 1040, y: 1800 },
    label: { dx: -70, dy: 100, anchor: 'end' },
  },
}

// B코스는 A코스의 역순
const COURSE_A_STOPS: StopId[] = ['AFRICA_1', 'AUSTRALIA', 'BIG_ANIMAL', 'BEAR', 'PREDATOR', 'AFRICA_3', 'AFRICA_2']

export const COURSE_STOP_IDS: Record<CourseId, readonly StopId[]> = {
  A: COURSE_A_STOPS,
  B: [...COURSE_A_STOPS].reverse(),
}

// A코스 방향으로 걷는 길의 경유점: [정문→①, ①→②, …, ⑥→⑦, ⑦→정문]
const A_LEG_WAYPOINTS: MapPoint[][] = [
  [{ x: 1515, y: 2085 }, { x: 1460, y: 2010 }],
  [
    { x: 1470, y: 1895 },
    { x: 1575, y: 1850 },
    { x: 1595, y: 1790 },
    { x: 1690, y: 1772 },
    { x: 1820, y: 1758 },
  ],
  [
    { x: 1995, y: 1650 },
    { x: 1940, y: 1605 },
    { x: 1760, y: 1600 },
    { x: 1640, y: 1585 },
    { x: 1630, y: 1480 },
    { x: 1590, y: 1435 },
    { x: 1530, y: 1430 },
  ],
  [
    { x: 1520, y: 1340 },
    { x: 1505, y: 1255 },
    { x: 1360, y: 1225 },
    { x: 1215, y: 1205 },
    { x: 1195, y: 1150 },
    { x: 1110, y: 1100 },
    { x: 1030, y: 1065 },
    { x: 1000, y: 990 },
    { x: 985, y: 905 },
    { x: 925, y: 860 },
    { x: 860, y: 815 },
    { x: 845, y: 760 },
    { x: 885, y: 695 },
    { x: 950, y: 620 },
    { x: 985, y: 555 },
    { x: 975, y: 515 },
    { x: 905, y: 545 },
  ],
  [{ x: 725, y: 625 }],
  [
    { x: 520, y: 725 },
    { x: 420, y: 780 },
    { x: 370, y: 815 },
    { x: 440, y: 890 },
    { x: 535, y: 985 },
    { x: 590, y: 1090 },
    { x: 622, y: 1195 },
    { x: 645, y: 1300 },
  ],
  [
    { x: 665, y: 1500 },
    { x: 705, y: 1600 },
    { x: 800, y: 1690 },
    { x: 930, y: 1760 },
  ],
  [
    { x: 1120, y: 1880 },
    { x: 1150, y: 1960 },
    { x: 1205, y: 2045 },
    { x: 1305, y: 2098 },
    { x: 1440, y: 2125 },
  ],
]

// 코스 진행 순서대로 [정문→①, ①→②, …, ⑥→⑦, ⑦→정문] 구간의 길 안내
const COURSE_DIRECTIONS: Record<CourseId, string[][]> = {
  A: [
    ['정문으로 들어가 홍학사를 지나면 바로 보여요.'],
    ['기린 전망대 쪽 큰길로 나와 위로 올라가요.', '기린음식점 앞 다리를 건너면 호주관이에요.'],
    ['곤충관 앞길을 따라가다 작은 다리를 건너요.', '큰길로 나오면 바로 대동물관이에요.'],
    [
      '큰길로 조금 올라가 코뿔소음식점 옆길로 들어가요.',
      '가운데 길을 따라 낙타사와 해양관을 지나 쭉 올라가요.',
      '여우가 있는 갈림길에서 왼쪽으로 꺾어요.',
    ],
    ['같은 길을 따라 조금만 내려가면 호랑이가 보여요.'],
    ['스카이리프트 승강장까지 내려가 왼쪽 길로 꺾어요.', '동양관과 레서판다사를 지나면 사자가 보여요.'],
    ['같은 길로 계속 내려가 유인원관 입구를 지나요.', '하마가 보이면 제2아프리카관이에요.'],
    ['100주년 광장을 지나 정문으로 나가요.'],
  ],
  B: [
    ['정문으로 들어가 왼쪽 100주년 광장 쪽으로 가요.', '하마가 보이면 제2아프리카관이에요.'],
    ['큰길을 따라 유인원관 입구를 지나 올라가요.', '사자가 보이면 제3아프리카관이에요.'],
    ['레서판다사와 동양관을 지나 스카이리프트 승강장까지 가요.', '승강장에서 오른쪽 오르막길로 올라가면 호랑이가 보여요.'],
    ['같은 길로 조금만 더 올라가요.'],
    [
      '여우가 있는 갈림길에서 오른쪽 가운데 길로 내려가요.',
      '해양관과 낙타사를 지나 황새마을 끝에서 왼쪽 길로 나가요.',
      '코뿔소음식점 앞 큰길에서 조금 내려가면 대동물관이에요.',
    ],
    ['대동물관 앞 큰길을 건너 작은 다리를 지나요.', '곤충관 앞길을 따라가면 호주관이에요.'],
    ['기린음식점 앞 다리를 건너 큰길로 내려가요.', '기린 전망대를 지나면 제1아프리카관이에요.'],
    ['홍학사를 지나 정문으로 나가요.'],
  ],
}

// 길 안내에 나오는 장소 중 지도에서 위치를 잡는 데 도움 되는 곳
export const MAP_LANDMARKS: MapLandmark[] = [
  { name: '해양관', point: { x: 1165, y: 715 }, anchor: 'middle' },
  { name: '낙타사', point: { x: 860, y: 1130 }, anchor: 'middle' },
  { name: '스카이리프트', point: { x: 470, y: 850 }, anchor: 'start' },
  { name: '코뿔소음식점', point: { x: 1255, y: 1125 }, anchor: 'start' },
  { name: '곤충관', point: { x: 1850, y: 1530 }, anchor: 'middle' },
]

const pointOf = (place: RoutePlaceId): MapPoint => (place === 'gate' ? GATE_POINT : ZOO_STOPS[place].point)

const A_PLACES: RoutePlaceId[] = ['gate', ...COURSE_A_STOPS, 'gate']

const A_LEGS = A_LEG_WAYPOINTS.map((waypoints, index) => {
  const from = A_PLACES[index]
  const to = A_PLACES[index + 1]
  return { from, to, points: [pointOf(from), ...waypoints, pointOf(to)] }
})

// 코스 진행 순서대로 정렬된 구간 목록 (마지막 구간은 정문으로 돌아가는 길)
export const getCourseLegs = (course: CourseId): CourseLeg[] => {
  const legs =
    course === 'A'
      ? A_LEGS
      : [...A_LEGS].reverse().map((leg) => ({ from: leg.to, to: leg.from, points: [...leg.points].reverse() }))

  return legs.map((leg, index) => ({ ...leg, directions: COURSE_DIRECTIONS[course][index] }))
}

export const getCourseStops = (course: CourseId): ZooStop[] => COURSE_STOP_IDS[course].map((id) => ZOO_STOPS[id])

// 코스 순서상 아직 도착하지 않은 첫 장소. 모두 돌았으면 null
export const findNextStop = (course: CourseId, visited: readonly StopId[]): ZooStop | null =>
  getCourseStops(course).find((stop) => !visited.includes(stop.id)) ?? null

export const parseCourseId = (value: string | null | undefined): CourseId | null => {
  const upper = value?.trim().toUpperCase()
  return upper === 'A' || upper === 'B' ? upper : null
}

export const isStopId = (value: unknown): value is StopId =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(ZOO_STOPS, value)
