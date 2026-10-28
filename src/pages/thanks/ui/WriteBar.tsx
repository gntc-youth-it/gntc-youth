import { SLOTS, formatKstTime, formatSlotDeadline, getSlotInfo, getSlotRange } from '../model/slots'
import type { Slot } from '../model/types'
import { CheckIcon, PlusIcon, SlotIcon } from './ThanksIcons'

interface WriteBarProps {
  today: string
  currentSlot: Slot | null
  hasPostedCurrentSlot: boolean
  onWrite: () => void
}

const nextSlotNotice = (today: string, slot: Slot | null): string => {
  const next = slot ? SLOTS[SLOTS.findIndex((info) => info.id === slot) + 1] : undefined
  if (!next) return '아침 감사는 06:00부터'
  return `${next.label} 감사는 ${formatKstTime(getSlotRange(today, next.id).start)}부터`
}

export const WriteBar = ({ today, currentSlot, hasPostedCurrentSlot, onWrite }: WriteBarProps) => (
  <div className="thanks-write-bar">
    {currentSlot === null || hasPostedCurrentSlot ? (
      <div className="thanks-write-complete" role="status">
        <span className={currentSlot === null ? 'thanks-closed-icon' : 'thanks-complete-icon'}>
          {currentSlot === null ? <SlotIcon slot="EVENING" /> : <CheckIcon />}
        </span>
        <div>
          <p>{currentSlot ? `${getSlotInfo(currentSlot).label} 감사 완료` : '지금은 기록 시간이 아니에요'}</p>
          <span>{nextSlotNotice(today, currentSlot)}</span>
        </div>
      </div>
    ) : (
      <button type="button" onClick={onWrite} className="thanks-write-button">
        <span>
          <PlusIcon />
          {getSlotInfo(currentSlot).label} 감사 남기기
        </span>
        <span className="thanks-write-deadline">{formatSlotDeadline(today, currentSlot)}까지</span>
      </button>
    )}
  </div>
)
