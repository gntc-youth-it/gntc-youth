import { SLOTS } from '../model/slots'
import type { Slot } from '../model/types'
import { CheckIcon, SlotIcon } from './ThanksIcons'

interface DailyProgressProps {
  currentSlot: Slot | null
  postedSlots: Slot[]
  onWrite: () => void
}

export const DailyProgress = ({ currentSlot, postedSlots, onWrite }: DailyProgressProps) => (
  <div className="thanks-progress" aria-label="나의 오늘 기록">
    <div className="thanks-progress-heading">
      <span>나의 오늘</span>
      <span>
        <b>{new Set(postedSlots).size}</b> / 3
      </span>
    </div>
    <ol className="thanks-progress-slots">
      {SLOTS.map((slot) => {
        const posted = postedSlots.includes(slot.id)
        const active = slot.id === currentSlot && !posted
        const passed = currentSlot === null || SLOTS.findIndex((item) => item.id === currentSlot) > SLOTS.indexOf(slot)
        const status = posted
          ? '기록 완료'
          : active
            ? '지금 남기기'
            : passed
              ? '지난 시간'
              : `${String(slot.startHour).padStart(2, '0')}:00부터`
        const content = (
          <>
            <span className="thanks-slot-top">
              <SlotIcon slot={slot.id} />
              <span>{slot.label}</span>
              {posted && <CheckIcon />}
            </span>
            <span className="thanks-slot-status">{status}</span>
          </>
        )
        return (
          <li key={slot.id} className={active ? 'is-current' : posted ? 'is-complete' : ''}>
            {active ? (
              <button type="button" onClick={onWrite} aria-label={`${slot.label} 감사 기록하기`}>
                {content}
              </button>
            ) : (
              <div>{content}</div>
            )}
          </li>
        )
      })}
    </ol>
  </div>
)
