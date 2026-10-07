import { useNavigate, useParams } from 'react-router-dom'
import type { UserInfo } from '../../../features/auth'
import type { CourseId } from '../model/course'
import type { ZooTeamMember } from '../model/team'
import { useCurrentUser } from '../model/useCurrentUser'
import { useZooTeam } from '../model/useZooTeam'
import { TeamCourseView } from './TeamCourseView'
import { TeamLoading, TeamMembersOnly, TeamMissing } from './TeamStatusScreens'
import { TeamWaitingRoom } from './TeamWaitingRoom'
import { ZooLayout } from './ZooLayout'
import { ZooLoginRequired } from './ZooLoginRequired'

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
    transferLeader,
  } = useZooTeam(teamId)

  if (loadState === 'notFound') return <TeamMissing />
  if (!team) return <TeamLoading loadState={loadState} onRetry={() => void reload()} />

  const isMember = team.members.some((member) => member.userId === currentUser.id)
  const isLeader = team.leaderUserId === currentUser.id
  const isMaster = currentUser.role === 'MASTER'

  if (team.status === 'STARTED' && !isMember && !isMaster) {
    return (
      <TeamMembersOnly
        team={team}
        message="이미 출발한 조라 새로 들어갈 수 없어요. 코스 화면은 이 조의 조원만 볼 수 있어요."
      />
    )
  }

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
