import { buildCdnUrl } from '../../../shared/lib'
import { ProfileImage } from '../../../shared/ui'
import type { ZooTeamMember } from '../model/team'
import { PARK_GREEN } from './courseTheme'

interface TeamMemberListProps {
  members: ZooTeamMember[]
  currentUserId: number
  canTransfer: boolean
  isSaving: boolean
  onTransfer: (member: ZooTeamMember) => void
}

// 조장을 맨 위에, 나머지는 들어온 순서대로
const sortMembers = (members: ZooTeamMember[]) =>
  [...members].sort((a, b) => {
    if (a.isLeader !== b.isLeader) return a.isLeader ? -1 : 1
    return a.joinedAt.localeCompare(b.joinedAt)
  })

export const TeamMemberList = ({ members, currentUserId, canTransfer, isSaving, onTransfer }: TeamMemberListProps) => (
  <ul className="mt-3 divide-y divide-[#F2F4F6]">
    {sortMembers(members).map((member) => (
      <li key={member.userId} className="flex items-center gap-3 py-3">
        <ProfileImage src={member.profileImagePath ? buildCdnUrl(member.profileImagePath) : null} alt="" size={36} />
        <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-[#191F28]">
          {member.name}
          {member.userId === currentUserId && <span className="ml-1.5 text-[13px] font-normal text-[#8B95A1]">나</span>}
        </span>
        {member.isLeader ? (
          <span className="shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold text-white" style={{ backgroundColor: PARK_GREEN }}>
            조장
          </span>
        ) : (
          canTransfer && (
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onTransfer(member)}
              aria-label={`${member.name}에게 조장 넘기기`}
              className="shrink-0 rounded-full border border-[#D1D6DB] px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition-colors hover:bg-[#F9FAFB] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2"
            >
              조장 넘기기
            </button>
          )
        )}
      </li>
    ))}
  </ul>
)
