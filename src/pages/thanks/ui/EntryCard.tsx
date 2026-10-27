import type { ReactNode } from 'react'
import { getReactionEmoji } from '../model/reactions'
import { formatKstTime, getSlotInfo } from '../model/slots'
import type { ThanksEntry, ThanksMedia } from '../model/types'
import { Avatar } from './Avatar'
import { EntryMedia } from './EntryMedia'

const TEXT_SHADOW = '[text-shadow:0_1px_6px_rgba(0,0,0,0.45)]'

interface EntryCardFaceProps {
  media: Pick<ThanksMedia, 'url' | 'type'> | null
  slotLabel: string
  time: string
  content: string
  // 기록하기 미리보기에서 아직 아무것도 안 썼을 때 흐리게 보여 줄 안내
  placeholder?: string
  children?: ReactNode
}

// 셋로그 카드 앞면: 사진·영상을 꽉 채우고 가운데에 시각과 감사제목. 목록 카드와 기록하기 미리보기가 같이 쓴다
export const EntryCardFace = ({ media, slotLabel, time, content, placeholder, children }: EntryCardFaceProps) => (
  <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[22px] bg-[#D9D4CC] shadow-[0_12px_28px_-12px_rgba(0,0,0,0.35)] ring-[3px] ring-white">
    {media && <EntryMedia media={media} className="absolute inset-0" />}
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.32),rgba(0,0,0,0.06)_72%)]" />

    <span className={`absolute left-4 top-3 text-[13px] font-bold text-white ${TEXT_SHADOW}`}>{slotLabel}</span>

    <div className={`absolute inset-x-7 top-1/2 -translate-y-1/2 text-center text-white ${TEXT_SHADOW}`}>
      <p className="text-[30px] font-extrabold leading-none tracking-tight tabular-nums">{time}</p>
      <p className={`mt-2 line-clamp-2 break-keep text-[15px] font-semibold leading-snug ${content ? '' : 'opacity-60'}`}>
        {content || placeholder}
      </p>
    </div>

    {children}
  </div>
)

interface EntryCardProps {
  entry: ThanksEntry
  onOpen: (entryId: number) => void
}

// 목록 카드. 오른쪽 위 반응 스티커, 왼쪽 아래 최근 댓글
// 카드가 겹쳐 쌓여서 아래쪽 가장자리는 다음 카드에 가려지므로 스티커는 위에 붙인다
export const EntryCard = ({ entry, onOpen }: EntryCardProps) => {
  const slotLabel = getSlotInfo(entry.slot).label
  const time = formatKstTime(entry.createdAt)
  const stickers = [...entry.reactions].sort((a, b) => b.count - a.count).slice(0, 3)

  return (
    <button
      type="button"
      onClick={() => onOpen(entry.id)}
      aria-label={`${entry.author.name} ${slotLabel} 감사 ${time}: ${entry.content}`}
      className="block w-full rounded-[22px] text-left focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#191F28]"
    >
      <EntryCardFace media={entry.media} slotLabel={slotLabel} time={time} content={entry.content}>
        {stickers.length > 0 && (
          <div className="absolute right-3 top-3 flex flex-col items-end gap-0.5" aria-hidden="true">
            {stickers.map((reaction, index) => (
              <span
                key={reaction.emoji}
                className="flex items-center text-[22px] leading-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]"
                style={{ transform: `rotate(${(((entry.id + index) % 3) - 1) * 10}deg)` }}
              >
                {getReactionEmoji(reaction.emoji)}
                {reaction.count > 1 && (
                  <span className={`ml-0.5 text-[11px] font-extrabold text-white ${TEXT_SHADOW}`}>{reaction.count}</span>
                )}
              </span>
            ))}
          </div>
        )}

        {entry.latestComment && (
          <div className="absolute bottom-[18px] left-3 flex max-w-[64%] items-center gap-1.5" aria-hidden="true">
            <Avatar author={entry.latestComment.author} size={22} className="ring-2 ring-white" />
            <span className="truncate rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-medium text-[#191F28] shadow-sm">
              {entry.latestComment.content}
            </span>
          </div>
        )}
      </EntryCardFace>
    </button>
  )
}
