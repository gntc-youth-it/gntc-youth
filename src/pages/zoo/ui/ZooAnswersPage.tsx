import { useState } from 'react'
import { downloadTextFile } from '../lib/downloadFile'
import { buildAnswersCsv, getStartedTeams } from '../model/answers'
import { COURSE_STOP_IDS } from '../model/course'
import type { ZooMissionTeamResult } from '../model/team'
import { useCurrentUser } from '../model/useCurrentUser'
import { useMissionAnswers } from '../model/useMissionAnswers'
import { AnswersByQuestion } from './AnswersByQuestion'
import { AnswersByTeam } from './AnswersByTeam'
import { BackToZoo } from './BackToZoo'
import { SegmentedControl } from './SegmentedControl'
import { ZooLayout } from './ZooLayout'
import { ZooLoginRequired } from './ZooLoginRequired'
import { COURSE_THEME, PARK_GREEN } from './courseTheme'

const TOTAL_STOPS = COURSE_STOP_IDS.A.length

type AnswersView = 'question' | 'team'

const VIEW_OPTIONS = [
  { value: 'question', label: '문제별' },
  { value: 'team', label: '조별' },
] as const

const pad = (value: number) => String(value).padStart(2, '0')

const formatLoadedAt = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`

const csvFileName = (date: Date) =>
  `동물원-미션-답-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.csv`

const PageTitle = () => (
  <h1 className="mt-5 font-sign text-[34px] leading-tight sm:text-[40px]" style={{ color: PARK_GREEN }}>
    미션 답 보기
  </h1>
)

const AdminOnly = () => (
  <ZooLayout>
    <BackToZoo />
    <PageTitle />
    <p className="mt-2 break-keep text-[15px] leading-relaxed text-[#4E5968]">운영자만 볼 수 있어요.</p>
  </ZooLayout>
)

// 조마다 몇 곳을 냈는지. 아직 출발하지 않은 조는 아래에 따로 보여준다
const ProgressList = ({ startedTeams, recruitingTeams }: { startedTeams: ZooMissionTeamResult[]; recruitingTeams: ZooMissionTeamResult[] }) => (
  <section aria-labelledby="zoo-answers-progress" className="mt-8">
    <h2 id="zoo-answers-progress" className="font-sign text-[24px] leading-tight" style={{ color: PARK_GREEN }}>
      진행 현황
    </h2>
    <ul className="mt-3 divide-y divide-[#F2F4F6] border-y border-[#F2F4F6]">
      {startedTeams.map((team) => {
        const submittedCount = team.missions.length
        return (
          <li key={team.id} className="flex items-center gap-3 py-3">
            <span className="w-28 shrink-0">
              <span className="block truncate text-[15px] font-semibold text-[#191F28]">{team.name}</span>
              <span className="block text-[12px] text-[#8B95A1]">{team.course}코스</span>
            </span>
            <span
              role="progressbar"
              aria-label={`${team.name} ${TOTAL_STOPS}곳 중 ${submittedCount}곳 제출`}
              aria-valuemin={0}
              aria-valuemax={TOTAL_STOPS}
              aria-valuenow={submittedCount}
              className="h-2 flex-1 overflow-hidden rounded-full bg-[#F2F4F6]"
            >
              <span
                className="block h-full rounded-full"
                style={{ width: `${(submittedCount / TOTAL_STOPS) * 100}%`, backgroundColor: COURSE_THEME[team.course].color }}
              />
            </span>
            <span className="w-10 shrink-0 text-right text-[14px] font-semibold text-[#333D4B]">
              {submittedCount}/{TOTAL_STOPS}
            </span>
          </li>
        )
      })}
      {recruitingTeams.map((team) => (
        <li key={team.id} className="flex items-center gap-3 py-3">
          <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[#8B95A1]">{team.name}</span>
          <span className="shrink-0 text-[13px] text-[#8B95A1]">출발 전</span>
        </li>
      ))}
    </ul>
  </section>
)

const AnswersContent = () => {
  const { teams, loadState, loadedAt, reload } = useMissionAnswers()
  const [view, setView] = useState<AnswersView>('question')

  if (loadState === 'forbidden') return <AdminOnly />

  const startedTeams = getStartedTeams(teams)
  const recruitingTeams = teams.filter((team) => team.status === 'RECRUITING')

  const handleDownload = () => {
    downloadTextFile(buildAnswersCsv(teams), csvFileName(new Date()), 'text/csv;charset=utf-8')
  }

  return (
    <ZooLayout>
      <BackToZoo />
      <PageTitle />
      <p className="mt-2 break-keep text-[15px] leading-relaxed text-[#4E5968]">
        조별로 낸 답과 사진을 모아 봐요. 운영진만 볼 수 있고, 30초마다 새로 불러와요.
      </p>

      {loadState === 'loading' && <p className="mt-8 text-[14px] text-[#8B95A1]">답을 불러오는 중이에요.</p>}

      {loadState === 'error' && (
        <div className="mt-8">
          <p className="break-keep text-[14px] text-[#4E5968]">답을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.</p>
          <button
            type="button"
            onClick={() => void reload()}
            className="mt-3 rounded-full border border-[#D1D6DB] px-4 py-2 text-[14px] font-semibold text-[#333D4B]"
          >
            다시 불러오기
          </button>
        </div>
      )}

      {loadState === 'ready' && (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={startedTeams.length === 0}
              className="rounded-full px-4 py-2.5 text-[14px] font-semibold text-white transition-opacity disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2"
              style={{ backgroundColor: PARK_GREEN }}
            >
              엑셀로 내려받기
            </button>
            <button
              type="button"
              onClick={() => void reload()}
              className="rounded-full border border-[#D1D6DB] px-4 py-2.5 text-[14px] font-semibold text-[#333D4B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2"
            >
              새로고침
            </button>
            {loadedAt && <span className="text-[13px] text-[#8B95A1]">{formatLoadedAt(loadedAt)}에 불러왔어요</span>}
          </div>

          {teams.length === 0 ? (
            <p className="mt-8 break-keep text-[14px] text-[#6B7684]">아직 만들어진 조가 없어요.</p>
          ) : (
            <ProgressList startedTeams={startedTeams} recruitingTeams={recruitingTeams} />
          )}

          {startedTeams.length > 0 && (
            <>
              <SegmentedControl value={view} options={VIEW_OPTIONS} onChange={setView} />
              {view === 'question' ? <AnswersByQuestion teams={startedTeams} /> : <AnswersByTeam teams={startedTeams} />}
            </>
          )}
        </>
      )}
    </ZooLayout>
  )
}

export const ZooAnswersPage = () => {
  const currentUser = useCurrentUser()

  if (!currentUser) {
    return (
      <ZooLayout>
        <ZooLoginRequired title="미션 답 보기" description="운영진 계정으로 로그인해 주세요. 로그인하면 이 화면으로 바로 돌아와요." />
      </ZooLayout>
    )
  }

  if (currentUser.role !== 'MASTER') return <AdminOnly />

  return <AnswersContent />
}
