import { useState } from 'react'
import { findNextStop, getCourseLegs, getCourseStops } from '../model/course'
import type { StopId } from '../model/course'
import type { ZooTeamDetail, ZooTeamMember } from '../model/team'
import type { ZooActionError, ZooTeamAction } from '../model/useZooTeam'
import { CourseBadge, TeamStatusPill } from './CourseBadge'
import { CourseMap } from './CourseMap'
import { NextStopBar } from './NextStopBar'
import { StopTimeline } from './StopTimeline'
import { TeamMemberList } from './TeamMemberList'
import { BackToTeams } from './TeamWaitingRoom'
import { ZooLayout } from './ZooLayout'
import { PARK_GREEN } from './courseTheme'

interface TeamCourseViewProps {
  team: ZooTeamDetail
  currentUserId: number
  isLeader: boolean
  isMaster: boolean
  pendingAction: ZooTeamAction | null
  actionError: ZooActionError | null
  onMarkArrival: (stopId: StopId) => void
  onCancelArrival: (stopId: StopId) => void
  onTransferLeader: (member: ZooTeamMember) => void
}

// 출발한 조의 화면. 모두 같은 화면을 보고, 도착 처리는 조장(또는 운영자)만 한다
export const TeamCourseView = ({
  team,
  currentUserId,
  isLeader,
  isMaster,
  pendingAction,
  actionError,
  onMarkArrival,
  onCancelArrival,
  onTransferLeader,
}: TeamCourseViewProps) => {
  const [isMemberListOpen, setIsMemberListOpen] = useState(false)
  const canManage = isLeader || isMaster
  const isSaving = pendingAction === 'arrival'

  const stops = getCourseStops(team.course)
  const legs = getCourseLegs(team.course)
  const visited = team.arrivals.map((arrival) => arrival.stopId)
  const nextStop = findNextStop(team.course, visited)
  const nextIndex = nextStop ? stops.indexOf(nextStop) : stops.length
  const visitedCount = stops.filter((stop) => visited.includes(stop.id)).length

  const handleToggle = (stopId: StopId) => {
    if (visited.includes(stopId)) onCancelArrival(stopId)
    else onMarkArrival(stopId)
  }

  return (
    <>
      <ZooLayout hasBottomBar>
        <BackToTeams />

        <div className="mt-5 flex items-center gap-2">
          <CourseBadge course={team.course} />
          <TeamStatusPill status={team.status} arrivedCount={visitedCount} totalStops={stops.length} />
        </div>
        <h1 className="mt-3 break-all font-sign text-[38px] leading-tight" style={{ color: PARK_GREEN }}>
          {team.name}
        </h1>

        <button
          type="button"
          aria-expanded={isMemberListOpen}
          aria-controls="zoo-team-member-list"
          onClick={() => setIsMemberListOpen((open) => !open)}
          className="mt-1.5 inline-flex items-center gap-1 text-[15px] text-[#4E5968] hover:text-[#191F28]"
        >
          조원 {team.members.length}명
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`transition-transform ${isMemberListOpen ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {isMemberListOpen && (
          <div id="zoo-team-member-list">
            <TeamMemberList
              members={team.members}
              currentUserId={currentUserId}
              canTransfer={canManage}
              isSaving={pendingAction !== null}
              onTransfer={onTransferLeader}
            />
          </div>
        )}

        {isMaster && !isLeader && (
          <p className="mt-4 break-keep rounded-xl bg-[#F2F4F6] px-3.5 py-2.5 text-[13px] text-[#4E5968]">
            운영자 권한으로 조장 대신 도착을 처리하거나 조장을 바꿀 수 있어요.
          </p>
        )}

        <figure className="mt-6">
          <CourseMap course={team.course} visited={visited} nextStopId={nextStop?.id ?? null} />
          <figcaption className="mt-2.5 break-keep text-[12px] leading-relaxed text-[#6B7684]">
            공식 안내지도를 간단하게 옮긴 그림이에요. 갈림길에서는 현장 안내판도 함께 확인하세요.
          </figcaption>
        </figure>

        <StopTimeline
          course={team.course}
          stops={stops}
          legs={legs}
          visited={visited}
          nextStopId={nextStop?.id ?? null}
          onToggleVisited={handleToggle}
          canCheck={canManage}
          isSaving={isSaving}
        />
      </ZooLayout>

      <NextStopBar
        course={team.course}
        nextStop={nextStop}
        nextNumber={nextIndex + 1}
        directions={legs[nextIndex]?.directions ?? []}
        visitedCount={visitedCount}
        totalStops={stops.length}
        onArrive={() => nextStop && onMarkArrival(nextStop.id)}
        canArrive={canManage}
        isSaving={isSaving}
        readOnlyHint="조장이 도착을 누르면 모두의 화면이 함께 바뀌어요."
        errorMessage={actionError?.message}
      />
    </>
  )
}
