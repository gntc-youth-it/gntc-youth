import { SLOTS, formatKstTime, formatSlotDeadline, getSlotInfo, getSlotRange } from '../model/slots'
import type { Slot } from '../model/types'

interface WriteBarProps {
  today: string
  // 자정~아침 6시처럼 열린 칸이 없으면 null
  currentSlot: Slot | null
  hasPostedCurrentSlot: boolean
  onWrite: () => void
}

const INFO_PILL =
  'rounded-full bg-white px-5 py-3.5 text-center text-[14px] font-semibold text-[#4E5968] shadow-[0_2px_10px_rgba(0,0,0,0.08)]'

// 다음 칸 안내. 저녁 다음은 내일 아침
const nextSlotNotice = (today: string, slot: Slot | null): string => {
  const next = slot ? SLOTS[SLOTS.findIndex((info) => info.id === slot) + 1] : undefined
  if (!next) return '아침 감사는 06:00부터'
  return `${next.label} 감사는 ${formatKstTime(getSlotRange(today, next.id).start)}부터`
}

// 오늘 화면 아래에 고정. 지금 칸에 아직 안 올렸으면 기록 버튼, 아니면 다음 칸 안내
// position: sticky는 html·body의 overflow-x: hidden 때문에 안 먹어서 fixed를 쓴다
export const WriteBar = ({ today, currentSlot, hasPostedCurrentSlot, onWrite }: WriteBarProps) => (
  <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-[#F2EFEA] via-[#F2EFEA]/95 to-[#F2EFEA]/0 px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-8">
    <div className="mx-auto max-w-md">
      {currentSlot === null ? (
        <p className={INFO_PILL}>
          오늘 감사는 끝났어요 🙏 <span className="font-medium text-[#8B95A1]">· {nextSlotNotice(today, null)}</span>
        </p>
      ) : hasPostedCurrentSlot ? (
        <p className={INFO_PILL}>
          {getSlotInfo(currentSlot).label} 감사 완료 🙏{' '}
          <span className="font-medium text-[#8B95A1]">· {nextSlotNotice(today, currentSlot)}</span>
        </p>
      ) : (
        <button
          type="button"
          onClick={onWrite}
          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-[#191F28] py-4 text-[16px] font-bold text-white shadow-[0_10px_24px_-8px_rgba(25,31,40,0.6)] transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191F28] focus-visible:ring-offset-2"
        >
          {getSlotInfo(currentSlot).label} 감사 남기기
          <span className="font-medium text-white/60">· {formatSlotDeadline(today, currentSlot)}까지</span>
        </button>
      )}
    </div>
  </div>
)
