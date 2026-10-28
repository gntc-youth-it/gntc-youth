import type { ReactNode } from 'react'
import { getReactionEmoji, REACTIONS } from '../model/reactions'
import { formatKstTime, getSlotInfo } from '../model/slots'
import type { ThanksEntry, ThanksMedia } from '../model/types'
import { Avatar } from './Avatar'
import { EntryMedia } from './EntryMedia'

interface EntryCardFaceProps {
  media: Pick<ThanksMedia, 'url' | 'type'> | null
  muted?: boolean
  slotLabel: string
  time: string
  content: string
  placeholder?: string
  children?: ReactNode
}

// 재생되는 장면 위에 시간과 감사를 띄운다. 작성 미리보기에서도 같은 카드 구성을 유지한다.
export const EntryCardFace = ({
  media,
  muted = true,
  slotLabel,
  time,
  content,
  placeholder,
  children,
}: EntryCardFaceProps) => (
  <div className="thanks-card-face">
    {media && <EntryMedia media={media} muted={muted} className="absolute inset-0" />}
    <div className="thanks-card-shade" />
    <span className="thanks-card-slot">{slotLabel}</span>
    <div className="thanks-card-overlay">
      <p className="thanks-card-time">{time}</p>
      <p className={`thanks-card-content ${content ? '' : 'thanks-card-placeholder'}`}>{content || placeholder}</p>
    </div>
    {children}
  </div>
)

interface EntryCardProps {
  entry: ThanksEntry
  onOpen: (entryId: number) => void
}

export const EntryCard = ({ entry, onOpen }: EntryCardProps) => {
  const slotLabel = getSlotInfo(entry.slot).label
  const time = formatKstTime(entry.createdAt)
  const reactions = [...entry.reactions]
    .filter((reaction) => reaction.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
  // 버튼의 aria-label은 자식 내용을 대신하므로, 카드에 표시하는 정보도 함께 읽어 준다.
  const reactionSummary = reactions
    .map((reaction) => {
      const label = REACTIONS.find((option) => option.id === reaction.emoji)?.label ?? '반응'
      return `${label} ${reaction.count}개${reaction.reactedByMe ? ' (내 반응)' : ''}`
    })
    .join(', ')
  const accessibleName = [
    `${entry.author.name} ${slotLabel} 감사 ${time}: ${entry.content}`,
    reactionSummary && `반응: ${reactionSummary}`,
    `댓글 ${entry.commentCount}개`,
    entry.latestComment && `최근 댓글, ${entry.latestComment.author.name}: ${entry.latestComment.content}`,
    entry.media.type === 'VIDEO' && '소리 없이 재생되는 영상',
  ]
    .filter(Boolean)
    .join('. ')
  return (
    <button type="button" onClick={() => onOpen(entry.id)} aria-label={accessibleName} className="thanks-entry-card">
      <EntryCardFace media={entry.media} slotLabel={slotLabel} time={time} content={entry.content}>
        {reactions.length > 0 && (
          <div className="thanks-card-reactions" aria-hidden="true">
            {reactions.map((reaction) => (
              <span key={reaction.emoji} className={reaction.reactedByMe ? 'is-reacted' : ''}>
                {getReactionEmoji(reaction.emoji)} <span>{reaction.count}</span>
              </span>
            ))}
          </div>
        )}
        {entry.latestComment && (
          <div className="thanks-card-comment">
            <Avatar author={entry.latestComment.author} size={22} />
            <span>{entry.latestComment.content}</span>
          </div>
        )}
        {entry.media.type === 'VIDEO' && (
          <span className="thanks-video-label" aria-hidden="true">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m11 5-5 4H2v6h4l5 4V5ZM17 9l5 6m0-6-5 6" />
            </svg>
          </span>
        )}
      </EntryCardFace>
    </button>
  )
}
