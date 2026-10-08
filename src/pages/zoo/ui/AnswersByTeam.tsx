import { findAnswer, findMission, formatClock, isEdited } from '../model/answers'
import { COURSE_STOP_IDS, ZOO_STOPS } from '../model/course'
import { ZOO_MISSIONS } from '../model/missions'
import type { ZooMissionTeamResult, ZooTeamMission } from '../model/team'
import { CourseDot } from './CourseBadge'
import { MissionPhotoLink } from './MissionPhotoLink'

const TOTAL_STOPS = COURSE_STOP_IDS.A.length

const submittedLabel = (mission: ZooTeamMission | null) => {
  if (!mission) return '아직 안 냈어요'
  const submitted = `${formatClock(mission.submittedAt)} 제출`
  return isEdited(mission) ? `${submitted} · ${formatClock(mission.updatedAt)} 수정` : submitted
}

// 한 조가 지나온 순서대로 장소마다 낸 답과 사진을 모아 본다. 조 이름을 누르면 펼쳐진다
const TeamAnswers = ({ team }: { team: ZooMissionTeamResult }) => (
  <li>
    <details className="group rounded-2xl border border-[#E5E8EB]">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-2xl px-4 py-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] [&::-webkit-details-marker]:hidden">
        <CourseDot course={team.course} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-sign text-[22px] leading-tight text-[#191F28]">{team.name}</span>
          <span className="mt-0.5 block truncate text-[13px] text-[#6B7684]">
            조장 {team.leaderName} · {team.members.length}명
          </span>
        </span>
        <span className="shrink-0 text-[14px] font-semibold text-[#333D4B]">
          {team.missions.length}/{TOTAL_STOPS}곳
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#8B95A1"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0 transition-transform group-open:rotate-180"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </summary>

      <div className="border-t border-[#F2F4F6] px-4 pb-5">
        <p className="mt-3 break-keep text-[13px] leading-relaxed text-[#6B7684]">조원 {team.members.join(', ')}</p>
        <ol className="mt-4 space-y-6">
          {COURSE_STOP_IDS[team.course].map((stopId, index) => {
            const mission = findMission(team, stopId)
            const stopName = ZOO_STOPS[stopId].name
            return (
              <li key={stopId}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[16px] font-semibold text-[#191F28]">
                    {index + 1}. {stopName}
                  </h3>
                  <span className={`shrink-0 text-[12px] ${mission ? 'text-[#8B95A1]' : 'text-[#B0B8C1]'}`}>{submittedLabel(mission)}</span>
                </div>
                {mission && (
                  <div className="mt-2 flex gap-3">
                    <dl className="min-w-0 flex-1 space-y-2 text-[14px]">
                      {ZOO_MISSIONS[stopId].questions.map((question, questionIndex) => (
                        <div key={question.id}>
                          <dt className="break-keep leading-snug text-[#6B7684]">
                            {questionIndex + 1}. {question.text}
                          </dt>
                          <dd className="mt-0.5 break-keep break-words font-semibold text-[#191F28]">{findAnswer(mission, question.id) ?? '-'}</dd>
                        </div>
                      ))}
                    </dl>
                    <MissionPhotoLink photoPath={mission.photoPath} label={`${team.name} ${stopName} 사진 원본 보기`} className="h-20 w-20 shrink-0" />
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </details>
  </li>
)

export const AnswersByTeam = ({ teams }: { teams: ZooMissionTeamResult[] }) => (
  <ul className="mt-6 space-y-3">
    {teams.map((team) => (
      <TeamAnswers key={team.id} team={team} />
    ))}
  </ul>
)
