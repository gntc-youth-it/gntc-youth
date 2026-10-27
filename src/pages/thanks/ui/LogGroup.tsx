import { SLOTS, formatRelativeTime } from '../model/slots'
import type { ThanksLog } from '../model/types'
import { Avatar } from './Avatar'
import { EntryCard } from './EntryCard'

interface LogGroupProps {
  log: ThanksLog
  now: Date
  onOpenEntry: (entryId: number) => void
}

// 카드를 조금씩 기울이고 어긋나게 겹쳐 셋로그처럼 쌓는다. 같은 카드는 늘 같은 모양이 되도록 id로 정한다
const tiltOf = (id: number) => ((id * 37) % 5) - 2
const shiftOf = (id: number) => (((id * 53) % 5) - 2) * 4

export const LogGroup = ({ log, now, onOpenEntry }: LogGroupProps) => {
  const { author, entries } = log
  const isMine = entries.some((entry) => entry.isMine)
  const postedSlots = new Set(entries.map((entry) => entry.slot))

  return (
    <section aria-label={`${author.name}의 감사로그`} className="mt-9 first:mt-6">
      <div className="flex items-center gap-2.5 px-1">
        <Avatar author={author} size={38} className="ring-2 ring-white" />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-[15px] font-bold text-[#191F28]">
            <span className="truncate">{author.name}</span>
            {isMine && (
              <span className="rounded-full bg-[#191F28] px-1.5 py-[1px] text-[10px] font-semibold text-white">나</span>
            )}
          </p>
          <p className="text-[12px] text-[#8B95A1]">{formatRelativeTime(log.lastPostedAt, now)}</p>
        </div>
        <ol className="flex gap-1" aria-label="올린 칸">
          {SLOTS.map((slot) => {
            const posted = postedSlots.has(slot.id)
            return (
              <li
                key={slot.id}
                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  posted ? 'bg-[#191F28] text-white' : 'bg-white/70 text-[#B0B8C1]'
                }`}
              >
                <span className="sr-only">{posted ? '올림' : '비어 있음'} </span>
                {slot.label}
              </li>
            )
          })}
        </ol>
      </div>

      <div className="mt-3">
        {entries.map((entry, index) => (
          <div
            key={entry.id}
            className="relative mx-auto w-[94%]"
            style={{
              marginTop: index === 0 ? 0 : -10,
              zIndex: index,
              transform: `translateX(${shiftOf(entry.id)}px) rotate(${tiltOf(entry.id) * 0.6}deg)`,
            }}
          >
            <EntryCard entry={entry} onOpen={onOpenEntry} />
          </div>
        ))}
      </div>
    </section>
  )
}
