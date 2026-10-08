import { buildCdnUrl } from '../../../../shared/lib'
import { buildAnswersCsv, findAnswer, formatClock, getStartedTeams, isEdited } from '../answers'
import type { ZooMissionTeamResult, ZooTeamMission } from '../team'

const makeMission = (stopId: ZooTeamMission['stopId'], answers: string[], overrides: Partial<ZooTeamMission> = {}): ZooTeamMission => ({
  stopId,
  answers: answers.map((answer, index) => ({ questionId: `q${index + 1}`, answer })),
  photoFileId: 1,
  photoPath: `uploads/${stopId}.webp`,
  submittedAt: '2026-10-10T10:12:00',
  updatedAt: '2026-10-10T10:12:00',
  ...overrides,
})

const makeTeam = (overrides: Partial<ZooMissionTeamResult>): ZooMissionTeamResult => ({
  id: 4,
  name: '사자팀',
  course: 'A',
  status: 'STARTED',
  leaderName: '박석희',
  members: ['박석희', '김철수'],
  missions: [],
  ...overrides,
})

// BOM을 떼고 줄 단위로 나눈다
const csvLines = (csv: string) => csv.replace(/^﻿/, '').split('\r\n')

describe('getStartedTeams', () => {
  it('출발한 조만 이름 순서로 고른다', () => {
    const teams = [
      makeTeam({ id: 1, name: '사자팀' }),
      makeTeam({ id: 2, name: '대기조', status: 'RECRUITING' }),
      makeTeam({ id: 3, name: '기린조' }),
    ]

    expect(getStartedTeams(teams).map((team) => team.name)).toEqual(['기린조', '사자팀'])
  })
})

describe('미션 정보 읽기', () => {
  it('문제 번호로 답을 찾고, 안 낸 미션이면 null', () => {
    const mission = makeMission('AFRICA_1', ['7개', '타조'])

    expect(findAnswer(mission, 'q2')).toBe('타조')
    expect(findAnswer(null, 'q1')).toBeNull()
  })

  it('처음 낸 시각과 초 단위까지 같으면 고친 적이 없는 것으로 본다', () => {
    expect(isEdited(makeMission('AFRICA_1', [], { submittedAt: '2026-10-10T10:12:00.123', updatedAt: '2026-10-10T10:12:00.456' }))).toBe(false)
    expect(isEdited(makeMission('AFRICA_1', [], { updatedAt: '2026-10-10T10:20:05' }))).toBe(true)
  })

  it('시각은 시:분만 보여준다', () => {
    expect(formatClock('2026-10-10T09:05:31.123')).toBe('09:05')
  })
})

describe('buildAnswersCsv', () => {
  const teams = [
    makeTeam({
      missions: [makeMission('AFRICA_1', ['7개', '타조'], { updatedAt: '2026-10-10T10:20:00' })],
    }),
    makeTeam({ id: 5, name: '대기조', status: 'RECRUITING' }),
  ]

  it('엑셀에서 한글이 깨지지 않게 BOM을 붙이고, 머리글로 시작한다', () => {
    const csv = buildAnswersCsv(teams)

    expect(csv.startsWith('﻿')).toBe(true)
    expect(csvLines(csv)[0]).toBe('조,코스,조장,조원,장소,문제 번호,문제,답,제출 시각,수정 시각')
  })

  it('출발한 조마다 모든 문제를 한 줄씩 담고, 장소마다 사진 링크를 한 줄 더 넣는다', () => {
    const lines = csvLines(buildAnswersCsv(teams))

    // 문제 18개 + 사진 7장
    expect(lines).toHaveLength(1 + 18 + 7)
    expect(lines[1]).toBe(
      '사자팀,A코스,박석희,"박석희, 김철수",제1아프리카관,1,키가 6M나 되는 기린의 목뼈는 몇 개일까요?,7개,2026-10-10 10:12,2026-10-10 10:20'
    )
    expect(lines[3]).toBe(
      `사자팀,A코스,박석희,"박석희, 김철수",제1아프리카관,사진,기린이 보이게 조원 전원이 키 순서로 서서 기린 목 만들어 찍기,${buildCdnUrl('uploads/AFRICA_1.webp')},2026-10-10 10:12,2026-10-10 10:20`
    )
    // 아직 안 낸 장소는 답과 시각을 비워 둔다
    expect(lines[4]).toBe('사자팀,A코스,박석희,"박석희, 김철수",호주관,1,타조 다음으로 큰 새의 평균 달리기 속도는?,,,')
    expect(lines.some((line) => line.startsWith('대기조'))).toBe(false)
  })

  it('쉼표·따옴표·줄바꿈이 든 답은 따옴표로 감싸고, 수식으로 시작하는 답은 수식이 되지 않게 막는다', () => {
    const lines = csvLines(
      buildAnswersCsv([makeTeam({ members: ['박석희'], missions: [makeMission('AFRICA_1', ['=HYPERLINK("x")', '타조, "타조"'])] })])
    )

    expect(lines[1]).toContain(`,"'=HYPERLINK(""x"")",`)
    expect(lines[2]).toContain(',"타조, ""타조""",')
  })
})
