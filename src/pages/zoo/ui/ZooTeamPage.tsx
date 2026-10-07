import { Link, useNavigate, useParams } from 'react-router-dom'
import type { UserInfo } from '../../../features/auth'
import { COURSE_STOP_IDS } from '../model/course'
import type { CourseId } from '../model/course'
import type { ZooTeamDetail, ZooTeamMember } from '../model/team'
import { useCurrentUser } from '../model/useCurrentUser'
import { useZooTeam } from '../model/useZooTeam'
import { CourseBadge, TeamStatusPill } from './CourseBadge'
import { TeamCourseView } from './TeamCourseView'
import { TeamWaitingRoom } from './TeamWaitingRoom'
import { ZooLayout } from './ZooLayout'
import { ZooLoginRequired } from './ZooLoginRequired'
import { PARK_GREEN } from './courseTheme'

const TeamMissing = () => (
  <ZooLayout>
    <h1 className="font-sign text-[32px] leading-tight" style={{ color: PARK_GREEN }}>
      조를 찾을 수 없어요
    </h1>
    <p className="mt-2 break-keep text-[15px] leading-relaxed text-[#4E5968]">
      조장이 조를 삭제했거나 잘못된 링크예요. 조 목록에서 다시 찾아보세요.
    </p>
    <Link
      to="/zoo"
      className="mt-6 inline-flex rounded-2xl px-5 py-3.5 text-[15px] font-semibold text-white"
      style={{ backgroundColor: PARK_GREEN }}
    >
      조 목록으로
    </Link>
  </ZooLayout>
)

// 코스 화면은 조원만 본다. 출발한 조를 조원이 아닌 사람이 열면 들어갈 수 없다고만 알려준다
const TeamStartedWithoutMe = ({ team }: { team: ZooTeamDetail }) => (
  <ZooLayout>
    <div className="flex items-center gap-2">
      <CourseBadge course={team.course} />
      <TeamStatusPill status={team.status} arrivedCount={team.arrivals.length} totalStops={COURSE_STOP_IDS[team.course].length} />
    </div>
    <h1 className="mt-3 break-all font-sign text-[38px] leading-tight" style={{ color: PARK_GREEN }}>
      {team.name}
    </h1>
    <p className="mt-2 break-keep text-[15px] leading-relaxed text-[#4E5968]">
      이미 출발한 조라 새로 들어갈 수 없어요. 코스 화면은 이 조의 조원만 볼 수 있어요.
    </p>
    <Link
      to="/zoo"
      className="mt-6 inline-flex rounded-2xl px-5 py-3.5 text-[15px] font-semibold text-white"
      style={{ backgroundColor: PARK_GREEN }}
    >
      조 목록으로
    </Link>
  </ZooLayout>
)

const TeamContent = ({ teamId, currentUser }: { teamId: number; currentUser: UserInfo }) => {
  const navigate = useNavigate()
  const {
    team,
    loadState,
    reload,
    pendingAction,
    actionError,
    clearActionError,
    join,
    leave,
    remove,
    changeCourse,
    start,
    markArrival,
    cancelArrival,
    transferLeader,
  } = useZooTeam(teamId)

  if (loadState === 'notFound') return <TeamMissing />

  if (!team) {
    return (
      <ZooLayout>
        {loadState === 'error' ? (
          <>
            <p className="break-keep text-[15px] text-[#4E5968]">조 정보를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.</p>
            <button
              type="button"
              onClick={() => void reload()}
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
  }

  const isMember = team.members.some((member) => member.userId === currentUser.id)
  const isLeader = team.leaderUserId === currentUser.id
  const isMaster = currentUser.role === 'MASTER'

  if (team.status === 'STARTED' && !isMember && !isMaster) return <TeamStartedWithoutMe team={team} />

  const handleStart = async () => {
    if (!window.confirm('마감하면 더 이상 조원이 들어올 수 없어요. 지금 출발할까요?')) return
    await start()
  }

  const handleLeave = async () => {
    if (!window.confirm('이 조에서 나갈까요?')) return
    if (await leave()) navigate('/zoo', { replace: true })
  }

  const handleDelete = async () => {
    if (!window.confirm('조를 삭제할까요? 조원 모두 이 조에서 나가게 돼요.')) return
    if (await remove()) navigate('/zoo', { replace: true })
  }

  const handleTransferLeader = async (member: ZooTeamMember) => {
    if (!window.confirm(`${member.name}님에게 조장을 넘길까요?`)) return
    await transferLeader(member.userId)
  }

  const handleChangeCourse = (course: CourseId) => {
    void changeCourse(course)
  }

  if (team.status === 'RECRUITING') {
    return (
      <TeamWaitingRoom
        team={team}
        currentUserId={currentUser.id}
        isMember={isMember}
        isLeader={isLeader}
        isMaster={isMaster}
        pendingAction={pendingAction}
        actionError={actionError}
        onJoin={() => void join()}
        onLeave={() => void handleLeave()}
        onDelete={() => void handleDelete()}
        onStart={() => void handleStart()}
        onChangeCourse={handleChangeCourse}
        onTransferLeader={(member) => void handleTransferLeader(member)}
        onDismissError={clearActionError}
      />
    )
  }

  return (
    <TeamCourseView
      team={team}
      currentUserId={currentUser.id}
      isLeader={isLeader}
      isMaster={isMaster}
      pendingAction={pendingAction}
      actionError={actionError}
      onMarkArrival={(stopId) => void markArrival(stopId)}
      onCancelArrival={(stopId) => void cancelArrival(stopId)}
      onTransferLeader={(member) => void handleTransferLeader(member)}
    />
  )
}

export const ZooTeamPage = () => {
  const { teamId: teamIdParam } = useParams()
  const currentUser = useCurrentUser()
  const teamId = Number(teamIdParam)

  if (!currentUser) {
    return (
      <ZooLayout>
        <ZooLoginRequired
          title="조 초대"
          description="조에 들어가려면 로그인이 필요해요. 로그인하면 이 화면으로 바로 돌아와요."
        />
      </ZooLayout>
    )
  }

  if (!Number.isInteger(teamId) || teamId <= 0) return <TeamMissing />

  return <TeamContent key={teamId} teamId={teamId} currentUser={currentUser} />
}
