import { useState } from 'react'
import { findAnswer, findMission } from '../model/answers'
import { COURSE_STOP_IDS, ZOO_STOPS } from '../model/course'
import type { StopId } from '../model/course'
import { ZOO_MISSIONS } from '../model/missions'
import type { ZooMissionTeamResult } from '../model/team'
import { MissionPhotoLink } from './MissionPhotoLink'
import { StopFilter } from './StopFilter'
import type { StopFilterValue } from './StopFilter'
import { PARK_GREEN } from './courseTheme'

interface AnswersByQuestionProps {
  // 출발한 조만, 늘 같은 순서로
  teams: ZooMissionTeamResult[]
}

// 한 장소의 문제마다 모든 조의 답을 한 목록에 모아, 같은 문제의 답을 나란히 비교하며 채점한다
const StopAnswers = ({ stopId, teams }: { stopId: StopId; teams: ZooMissionTeamResult[] }) => {
  const stopName = ZOO_STOPS[stopId].name
  const mission = ZOO_MISSIONS[stopId]
  const submittedTeams = teams.filter((team) => findMission(team, stopId))

  return (
    <section aria-labelledby={`zoo-answers-${stopId}`} className="mt-8">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id={`zoo-answers-${stopId}`} className="font-sign text-[25px] leading-tight" style={{ color: PARK_GREEN }}>
          {stopName}
        </h2>
        <span className="shrink-0 text-[13px] text-[#6B7684]">
          {teams.length}개 조 중 {submittedTeams.length}개 조 제출
        </span>
      </div>

      <ol className="mt-3 space-y-5">
        {mission.questions.map((question, index) => (
          <li key={question.id}>
            <p className="flex gap-1.5 text-[15px] font-semibold leading-snug text-[#191F28]">
              <span className="shrink-0">{index + 1}.</span>
              <span className="break-keep">{question.text}</span>
            </p>
            <ul aria-label={`${index + 1}번 문제 조별 답`} className="mt-2 divide-y divide-[#EEF0F2] rounded-xl bg-[#F9FAFB] px-3.5">
              {teams.map((team) => {
                const answer = findAnswer(findMission(team, stopId), question.id)
                return (
                  <li key={team.id} className="flex gap-3 py-2.5 text-[14px]">
                    <span className="w-28 shrink-0 truncate font-semibold text-[#4E5968]">{team.name}</span>
                    {answer ? (
                      <span className="min-w-0 flex-1 break-keep break-words text-[#191F28]">{answer}</span>
                    ) : (
                      <span className="text-[#B0B8C1]">아직 안 냈어요</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ol>

      <div className="mt-5">
        <p className="break-keep text-[15px] leading-snug text-[#191F28]">
          <span className="font-semibold">사진</span> · {mission.photoMission}
        </p>
        {submittedTeams.length > 0 ? (
          <ul className="mt-2 grid grid-cols-3 gap-2">
            {submittedTeams.map((team) => (
              <li key={team.id}>
                <MissionPhotoLink
                  photoPath={findMission(team, stopId)!.photoPath}
                  label={`${team.name} ${stopName} 사진 원본 보기`}
                  className="aspect-square"
                />
                <p className="mt-1 truncate text-[12px] text-[#4E5968]">{team.name}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[14px] text-[#B0B8C1]">아직 올라온 사진이 없어요.</p>
        )}
      </div>
    </section>
  )
}

export const AnswersByQuestion = ({ teams }: AnswersByQuestionProps) => {
  const [stopFilter, setStopFilter] = useState<StopFilterValue>('ALL')
  const counts = Object.fromEntries(
    COURSE_STOP_IDS.A.map((stopId) => [stopId, teams.filter((team) => findMission(team, stopId)).length])
  ) as Partial<Record<StopId, number>>
  const total = teams.reduce((sum, team) => sum + team.missions.length, 0)
  const stopIds = stopFilter === 'ALL' ? COURSE_STOP_IDS.A : [stopFilter]

  return (
    <>
      <StopFilter value={stopFilter} counts={counts} total={total} onChange={setStopFilter} />
      {stopIds.map((stopId) => (
        <StopAnswers key={stopId} stopId={stopId} teams={teams} />
      ))}
    </>
  )
}
