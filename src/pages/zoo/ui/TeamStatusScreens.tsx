import { Link } from 'react-router-dom'
import { COURSE_STOP_IDS } from '../model/course'
import type { ZooTeamDetail } from '../model/team'
import type { ZooTeamLoadState } from '../model/useZooTeam'
import { CourseBadge, TeamStatusPill } from './CourseBadge'
import { ZooLayout } from './ZooLayout'
import { PARK_GREEN } from './courseTheme'

const PrimaryLink = ({ to, children }: { to: string; children: string }) => (
  <Link
    to={to}
    className="mt-6 inline-flex rounded-2xl px-5 py-3.5 text-[15px] font-semibold text-white"
    style={{ backgroundColor: PARK_GREEN }}
  >
    {children}
  </Link>
)

export const TeamMissing = () => (
  <ZooLayout>
    <h1 className="font-sign text-[32px] leading-tight" style={{ color: PARK_GREEN }}>
      조를 찾을 수 없어요
    </h1>
    <p className="mt-2 break-keep text-[15px] leading-relaxed text-[#4E5968]">
      조장이 조를 삭제했거나 잘못된 링크예요. 조 목록에서 다시 찾아보세요.
    </p>
    <PrimaryLink to="/zoo">조 목록으로</PrimaryLink>
  </ZooLayout>
)

// 코스와 미션 화면은 조원만 본다. 조원이 아닌 사람에게는 들어갈 수 없는 이유만 알려준다
export const TeamMembersOnly = ({ team, message }: { team: ZooTeamDetail; message: string }) => (
  <ZooLayout>
    <div className="flex items-center gap-2">
      <CourseBadge course={team.course} />
      <TeamStatusPill
        status={team.status}
        arrivedCount={team.arrivals.length}
        totalStops={COURSE_STOP_IDS[team.course].length}
      />
    </div>
    <h1 className="mt-3 break-all font-sign text-[38px] leading-tight" style={{ color: PARK_GREEN }}>
      {team.name}
    </h1>
    <p className="mt-2 break-keep text-[15px] leading-relaxed text-[#4E5968]">{message}</p>
    <PrimaryLink to="/zoo">조 목록으로</PrimaryLink>
  </ZooLayout>
)

export const TeamLoading = ({ loadState, onRetry }: { loadState: ZooTeamLoadState; onRetry: () => void }) => (
  <ZooLayout>
    {loadState === 'error' ? (
      <>
        <p className="break-keep text-[15px] text-[#4E5968]">
          조 정보를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-full border border-[#D1D6DB] px-4 py-2 text-[14px] font-semibold text-[#333D4B]"
        >
          다시 불러오기
        </button>
      </>
    ) : (
      <p className="text-[14px] text-[#8B95A1]">조 정보를 불러오는 중이에요.</p>
    )}
  </ZooLayout>
)
