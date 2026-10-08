import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { COURSE_STOP_IDS } from '../model/course'
import type { ZooTeamSummary } from '../model/team'
import { useCurrentUser } from '../model/useCurrentUser'
import { useZooLobby } from '../model/useZooLobby'
import { CourseDot, TeamStatusPill } from './CourseBadge'
import { CreateTeamDialog } from './CreateTeamDialog'
import { PhotoVoteEntryCard } from './PhotoVoteEntry'
import { ZooLayout } from './ZooLayout'
import { ZooLoginRequired } from './ZooLoginRequired'
import { PARK_GREEN } from './courseTheme'

const TOTAL_STOPS = COURSE_STOP_IDS.A.length

const ChevronRightIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B0B8C1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 6 15 12 9 18" />
  </svg>
)

// 출발한 조는 그 조의 조원(과 운영자)만 들어갈 수 있어서, 나머지에게는 진행 상황만 보여준다
const TeamRow = ({ team, canOpen }: { team: ZooTeamSummary; canOpen: boolean }) => {
  const summary = (
    <>
      <CourseDot course={team.course} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-sign text-[22px] leading-tight text-[#191F28]">{team.name}</p>
        <p className="mt-1 flex gap-2 text-[13px] text-[#6B7684]">
          <span className="truncate">조장 {team.leaderName}</span>
          <span className="shrink-0">{team.memberCount}명</span>
        </p>
      </div>
      <TeamStatusPill status={team.status} arrivedCount={team.arrivedCount} totalStops={TOTAL_STOPS} />
    </>
  )

  return (
    <li>
      {canOpen ? (
        <Link
          to={`/zoo/teams/${team.id}`}
          className="flex items-center gap-3.5 py-4 transition-colors hover:bg-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1F4D36]"
        >
          {summary}
          <ChevronRightIcon />
        </Link>
      ) : (
        <div className="flex items-center gap-3.5 py-4 pr-[18px] opacity-60">{summary}</div>
      )}
    </li>
  )
}

export const ZooLobbyPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // 조원은 들어오자마자 내 조로 보내되, 전체 조를 보러 온 경우는 목록을 보여준다
  const wantsAllTeams = searchParams.get('view') === 'all'
  const currentUser = useCurrentUser()
  const { teams, myTeam, loadState, reload } = useZooLobby(!!currentUser)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useEffect(() => {
    if (myTeam && !wantsAllTeams) navigate(`/zoo/teams/${myTeam.id}`, { replace: true })
  }, [myTeam, wantsAllTeams, navigate])

  if (!currentUser) {
    return (
      <ZooLayout>
        <ZooLoginRequired
          title="동물원 나들이"
          description="조를 만들거나 조에 들어가려면 로그인이 필요해요. 조장이 마감하면 조원 모두 같은 코스 화면을 함께 봐요."
        />
      </ZooLayout>
    )
  }

  const recruitingCount = teams.filter((team) => team.status === 'RECRUITING').length
  const isMaster = currentUser.role === 'MASTER'

  return (
    <ZooLayout>
      <h1 className="font-sign text-[34px] leading-tight sm:text-[40px]" style={{ color: PARK_GREEN }}>
        동물원 나들이
      </h1>
      <p className="mt-2 break-keep text-[15px] leading-relaxed text-[#4E5968]">
        조를 만들거나 모집 중인 조에 들어가세요. 조장이 마감하면 조원 모두 같은 코스 화면을 함께 봐요.
      </p>

      {myTeam ? (
        <Link
          to={`/zoo/teams/${myTeam.id}`}
          className="mt-6 flex items-center gap-3 rounded-2xl px-4 py-3.5 text-white"
          style={{ backgroundColor: PARK_GREEN }}
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[12px] text-white/70">내 조</span>
            <span className="block truncate font-sign text-[23px] leading-tight">{myTeam.name}</span>
          </span>
          <span className="shrink-0 rounded-full bg-white px-3.5 py-2 text-[14px] font-semibold" style={{ color: PARK_GREEN }}>
            내 조로 가기
          </span>
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          disabled={loadState !== 'ready'}
          className="mt-6 w-full rounded-2xl py-4 font-sign text-[22px] text-white transition-opacity disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2"
          style={{ backgroundColor: PARK_GREEN }}
        >
          조 만들기
        </button>
      )}
      <PhotoVoteEntryCard isMaster={isMaster} />

      <section aria-labelledby="zoo-team-list" className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 id="zoo-team-list" className="font-sign text-[24px] leading-tight" style={{ color: PARK_GREEN }}>
            조 목록
          </h2>
          {loadState === 'ready' && teams.length > 0 && (
            <span className="text-[13px] text-[#6B7684]">모집 중 {recruitingCount}개</span>
          )}
        </div>

        {loadState === 'loading' && <p className="mt-6 text-[14px] text-[#8B95A1]">조 목록을 불러오는 중이에요.</p>}

        {loadState === 'error' && (
          <div className="mt-6">
            <p className="break-keep text-[14px] text-[#4E5968]">조 목록을 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.</p>
            <button
              type="button"
              onClick={() => void reload()}
              className="mt-3 rounded-full border border-[#D1D6DB] px-4 py-2 text-[14px] font-semibold text-[#333D4B]"
            >
              다시 불러오기
            </button>
          </div>
        )}

        {loadState === 'ready' && teams.length === 0 && (
          <p className="mt-6 break-keep text-[14px] text-[#6B7684]">아직 만들어진 조가 없어요. 첫 번째 조를 만들어 보세요.</p>
        )}

        {teams.length > 0 && (
          <ul className="mt-3 divide-y divide-[#F2F4F6] border-y border-[#F2F4F6]">
            {teams.map((team) => (
              <TeamRow
                key={team.id}
                team={team}
                canOpen={team.status === 'RECRUITING' || team.id === myTeam?.id || isMaster}
              />
            ))}
          </ul>
        )}
      </section>

      <CreateTeamDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={(team) => navigate(`/zoo/teams/${team.id}`)}
        onFailed={() => void reload()}
      />
    </ZooLayout>
  )
}
