import { Link } from 'react-router-dom'
import { COURSE_STOP_IDS, ZOO_STOPS } from '../model/course'
import type { CourseId } from '../model/course'
import { ZOO_ERROR_CODE } from '../model/team'
import type { ZooTeamDetail, ZooTeamMember } from '../model/team'
import type { ZooActionError, ZooTeamAction } from '../model/useZooTeam'
import { CourseBadge, TeamStatusPill } from './CourseBadge'
import { CourseMap } from './CourseMap'
import { CourseToggle } from './CourseToggle'
import { ShareTeamButton } from './ShareTeamButton'
import { TeamMemberList } from './TeamMemberList'
import { ZooLayout } from './ZooLayout'
import { PARK_GREEN } from './courseTheme'

interface TeamWaitingRoomProps {
  team: ZooTeamDetail
  currentUserId: number
  isMember: boolean
  isLeader: boolean
  isMaster: boolean
  pendingAction: ZooTeamAction | null
  actionError: ZooActionError | null
  onJoin: () => void
  onLeave: () => void
  onDelete: () => void
  onStart: () => void
  onChangeCourse: (course: CourseId) => void
  onTransferLeader: (member: ZooTeamMember) => void
  onDismissError: () => void
}

export const BackToTeams = () => (
  <Link
    to="/zoo?view=all"
    className="inline-flex items-center gap-1 text-[14px] text-[#6B7684] hover:text-[#333D4B]"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="15 6 9 12 15 18" />
    </svg>
    전체 조
  </Link>
)

export const ActionErrorMessage = ({ error, onDismiss }: { error: ZooActionError; onDismiss: () => void }) => (
  <div role="alert" className="flex items-start gap-2 rounded-xl bg-[#FFF5F5] px-3 py-2.5 text-[13px] text-[#C92A2A]">
    <span className="flex-1 break-keep">{error.message}</span>
    {error.code === ZOO_ERROR_CODE.ALREADY_IN_TEAM && (
      <Link to="/zoo" className="shrink-0 font-semibold underline underline-offset-2">
        내 조로 가기
      </Link>
    )}
    <button type="button" onClick={onDismiss} aria-label="안내 닫기" className="shrink-0 px-1 leading-none">
      ×
    </button>
  </div>
)

export const TeamWaitingRoom = ({
  team,
  currentUserId,
  isMember,
  isLeader,
  isMaster,
  pendingAction,
  actionError,
  onJoin,
  onLeave,
  onDelete,
  onStart,
  onChangeCourse,
  onTransferLeader,
  onDismissError,
}: TeamWaitingRoomProps) => {
  const canManage = isLeader || isMaster
  const isBusy = pendingAction !== null
  const leader = team.members.find((member) => member.isLeader)
  const courseStops = COURSE_STOP_IDS[team.course]
  const firstStop = ZOO_STOPS[courseStops[0]]
  const lastStop = ZOO_STOPS[courseStops[courseStops.length - 1]]

  return (
    <>
      <ZooLayout hasBottomBar>
        <BackToTeams />

        <div className="mt-5 flex items-center gap-2">
          <CourseBadge course={team.course} />
          <TeamStatusPill status={team.status} />
        </div>
        <h1 className="mt-3 break-all font-sign text-[38px] leading-tight" style={{ color: PARK_GREEN }}>
          {team.name}
        </h1>
        <p className="mt-1 break-keep text-[15px] text-[#4E5968]">
          {leader ? `${leader.name} 조장이 조원을 모으고 있어요.` : '조원을 모으고 있어요.'}
        </p>

        {isMember && (
          <div className="mt-5">
            <ShareTeamButton teamId={team.id} teamName={team.name} />
          </div>
        )}

        <section aria-labelledby="zoo-team-members" className="mt-9">
          <h2 id="zoo-team-members" className="font-sign text-[24px] leading-tight" style={{ color: PARK_GREEN }}>
            조원 {team.members.length}명
          </h2>
          <TeamMemberList
            members={team.members}
            currentUserId={currentUserId}
            canTransfer={canManage}
            isSaving={isBusy}
            onTransfer={onTransferLeader}
          />
        </section>

        <section aria-labelledby="zoo-team-course" className="mt-9">
          <h2 id="zoo-team-course" className="font-sign text-[24px] leading-tight" style={{ color: PARK_GREEN }}>
            코스
          </h2>
          {canManage ? (
            <>
              <p className="mt-1 text-[13px] text-[#6B7684]">출발하기 전까지 바꿀 수 있어요.</p>
              <div className="mt-3">
                <CourseToggle
                  course={team.course}
                  onSelect={(course) => {
                    if (course !== team.course && !isBusy) onChangeCourse(course)
                  }}
                />
              </div>
            </>
          ) : (
            <p className="mt-1 break-keep text-[14px] text-[#4E5968]">
              {firstStop.name}에서 출발해 {lastStop.name}까지 7곳을 돌아요.
            </p>
          )}
          <figure className="mt-4">
            <CourseMap course={team.course} visited={[]} nextStopId={courseStops[0]} />
            <figcaption className="mt-2.5 break-keep text-[12px] leading-relaxed text-[#6B7684]">
              조장이 마감하면 이 순서대로 출발해요.
            </figcaption>
          </figure>
        </section>

        {isMaster && !isLeader && (
          <section aria-labelledby="zoo-team-admin" className="mt-9 rounded-2xl bg-[#F2F4F6] p-4">
            <h2 id="zoo-team-admin" className="text-[14px] font-semibold text-[#333D4B]">
              운영자 메뉴
            </h2>
            <p className="mt-1 break-keep text-[13px] text-[#6B7684]">조장이 연락되지 않을 때 대신 마감하거나 조를 지울 수 있어요.</p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={onStart}
                disabled={isBusy}
                className="rounded-xl bg-white px-4 py-2.5 text-[14px] font-semibold text-[#191F28] disabled:opacity-50"
              >
                대신 마감하기
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={isBusy}
                className="rounded-xl bg-white px-4 py-2.5 text-[14px] font-semibold text-[#E03131] disabled:opacity-50"
              >
                조 삭제
              </button>
            </div>
          </section>
        )}
      </ZooLayout>

      <aside
        aria-label="조 참여"
        className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(12px,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto max-w-xl space-y-2.5 rounded-2xl bg-white p-3 shadow-[0_8px_28px_rgba(25,31,40,0.16)] ring-1 ring-black/5">
          {actionError && <ActionErrorMessage error={actionError} onDismiss={onDismissError} />}

          {isLeader ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onDelete}
                disabled={isBusy}
                className="shrink-0 rounded-xl px-4 text-[14px] font-semibold text-[#E03131] disabled:opacity-50"
              >
                조 삭제
              </button>
              <button
                type="button"
                onClick={onStart}
                disabled={isBusy}
                className="flex-1 rounded-xl py-3.5 font-sign text-[21px] text-white transition-opacity disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2"
                style={{ backgroundColor: PARK_GREEN }}
              >
                {pendingAction === 'start' ? '출발하는 중...' : '마감하고 출발하기'}
              </button>
            </div>
          ) : isMember ? (
            <div className="flex items-center gap-3">
              <p className="flex-1 break-keep pl-1 text-[14px] leading-snug text-[#4E5968]">조장이 마감하면 다 같이 출발해요.</p>
              <button
                type="button"
                onClick={onLeave}
                disabled={isBusy}
                className="shrink-0 rounded-xl border border-[#D1D6DB] px-4 py-3 text-[14px] font-semibold text-[#4E5968] disabled:opacity-50"
              >
                나가기
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onJoin}
              disabled={isBusy}
              className="w-full rounded-xl py-3.5 font-sign text-[21px] text-white transition-opacity disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2"
              style={{ backgroundColor: PARK_GREEN }}
            >
              {pendingAction === 'join' ? '들어가는 중...' : '이 조에 참여하기'}
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
