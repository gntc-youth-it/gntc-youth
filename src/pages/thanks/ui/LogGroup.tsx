import { SLOTS, formatRelativeTime } from '../model/slots'
import type { ThanksLog } from '../model/types'
import { Avatar } from './Avatar'
import { EntryCard } from './EntryCard'

interface LogGroupProps {
  log: ThanksLog
  now: Date
  onOpenEntry: (entryId: number) => void
}

export const LogGroup = ({ log, now, onOpenEntry }: LogGroupProps) => {
  const { author, entries } = log
  const isMine = entries.some((entry) => entry.isMine)
  const postedSlots = new Set(entries.map((entry) => entry.slot))
  return (
    <section aria-label={`${author.name}의 감사로그`} className="thanks-log-group">
      <div className="thanks-author-row">
        <Avatar author={author} size={36} />
        <div className="thanks-author-info">
          <p className="thanks-author-name">
            <span>{author.name}</span>
            {isMine && <span className="thanks-mine">나</span>}
          </p>
          <p className="thanks-posted-at">{formatRelativeTime(log.lastPostedAt, now)}</p>
        </div>
        <ol className="thanks-posted-slots" aria-label="올린 칸">
          {SLOTS.map((slot) => (
            <li key={slot.id} className={postedSlots.has(slot.id) ? 'is-posted' : ''}>
              <span className="thanks-slot-dot" aria-hidden="true" />
              <span className="sr-only">{postedSlots.has(slot.id) ? '올림' : '비어 있음'} </span>
              {slot.label}
            </li>
          ))}
        </ol>
      </div>
      <div className="thanks-entry-list">
        {entries.map((entry) => (
          <EntryCard key={entry.id} entry={entry} onOpen={onOpenEntry} />
        ))}
      </div>
    </section>
  )
}
