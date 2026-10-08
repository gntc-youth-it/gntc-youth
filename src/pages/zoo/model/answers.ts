import { buildCdnUrl } from '../../../shared/lib'
import { COURSE_STOP_IDS, ZOO_STOPS } from './course'
import type { StopId } from './course'
import { ZOO_MISSIONS } from './missions'
import type { ZooMissionTeamResult, ZooTeamMission } from './team'

// 미션은 출발한 조만 낼 수 있어서 답을 모아 볼 때는 출발한 조만 이름 순서로 보여준다
export const getStartedTeams = (teams: ZooMissionTeamResult[]): ZooMissionTeamResult[] =>
  teams.filter((team) => team.status === 'STARTED').sort((a, b) => a.name.localeCompare(b.name, 'ko'))

export const findMission = (team: ZooMissionTeamResult, stopId: StopId): ZooTeamMission | null =>
  team.missions.find((mission) => mission.stopId === stopId) ?? null

export const findAnswer = (mission: ZooTeamMission | null, questionId: string): string | null =>
  mission?.answers.find((answer) => answer.questionId === questionId)?.answer ?? null

// 처음 낸 뒤 고친 적이 있는지. 서버 시각에는 초 아래 자릿수가 붙을 수 있어 초 단위까지만 비교한다
export const isEdited = (mission: ZooTeamMission): boolean =>
  mission.updatedAt.slice(0, 19) !== mission.submittedAt.slice(0, 19)

// 서버가 보내는 한국 시각(예: 2026-10-10T10:12:00)에서 '10:12'만 꺼낸다
export const formatClock = (dateTime: string): string => dateTime.slice(11, 16)

const formatDateTime = (dateTime: string): string => dateTime.slice(0, 16).replace('T', ' ')

const CSV_HEADER = ['조', '코스', '조장', '조원', '장소', '문제 번호', '문제', '답', '제출 시각', '수정 시각']

// 엑셀은 =, +, -, @로 시작하는 칸을 수식으로 실행하므로, 참가자가 적은 답이 수식이 되지 않게 앞에 '를 붙인다
const toCsvCell = (value: string): string => {
  const text = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// 채점용 엑셀(CSV) 파일 내용.
// 출발한 조마다 모든 문제를 한 줄씩 담고(안 낸 문제는 답을 비워 둔다), 장소마다 사진 링크를 한 줄 더 넣는다.
// 엑셀에서 한글이 깨지지 않도록 맨 앞에 BOM을 붙인다
export const buildAnswersCsv = (teams: ZooMissionTeamResult[]): string => {
  const rows: string[][] = [CSV_HEADER]

  getStartedTeams(teams).forEach((team) => {
    const teamColumns = [team.name, `${team.course}코스`, team.leaderName, team.members.join(', ')]

    COURSE_STOP_IDS.A.forEach((stopId) => {
      const mission = findMission(team, stopId)
      const stopName = ZOO_STOPS[stopId].name
      const timeColumns = mission
        ? [formatDateTime(mission.submittedAt), isEdited(mission) ? formatDateTime(mission.updatedAt) : '']
        : ['', '']

      ZOO_MISSIONS[stopId].questions.forEach((question, index) => {
        rows.push([...teamColumns, stopName, String(index + 1), question.text, findAnswer(mission, question.id) ?? '', ...timeColumns])
      })
      rows.push([
        ...teamColumns,
        stopName,
        '사진',
        ZOO_MISSIONS[stopId].photoMission,
        mission ? buildCdnUrl(mission.photoPath) : '',
        ...timeColumns,
      ])
    })
  })

  return `﻿${rows.map((row) => row.map(toCsvCell).join(',')).join('\r\n')}`
}
