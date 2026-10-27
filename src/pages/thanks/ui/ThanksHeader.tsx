import { Link } from 'react-router-dom'
import { formatMissionDate } from '../model/slots'

interface ThanksHeaderProps {
  date: string
  isToday: boolean
  personCount: number
  isLoading: boolean
  onPrevDate: () => void
  onNextDate: () => void
}

const CIRCLE_BUTTON =
  'grid h-10 w-10 place-items-center rounded-full bg-white text-[#191F28] shadow-[0_2px_10px_rgba(0,0,0,0.08)] transition-colors hover:bg-[#F9FAFB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191F28]'

const Chevron = ({ direction }: { direction: 'left' | 'right' }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={direction === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
  </svg>
)

// 셋로그 방 화면처럼 왼쪽 뒤로가기, 가운데 이름 알약. 그 아래에서 날짜를 넘긴다
export const ThanksHeader = ({ date, isToday, personCount, isLoading, onPrevDate, onNextDate }: ThanksHeaderProps) => (
  <header className="pt-3">
    <div className="flex items-center justify-between">
      <Link to="/" aria-label="홈으로" className={CIRCLE_BUTTON}>
        <Chevron direction="left" />
      </Link>
      <h1 className="rounded-full bg-white px-5 py-2.5 text-[15px] font-bold text-[#191F28] shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
        범사에 감사로그
      </h1>
      {/* 프로필 사진·이름 설정 버튼 자리. 프로필 모달을 만들 때 채운다 */}
      <div className="h-10 w-10" aria-hidden="true" />
    </div>

    <div className="mt-5 flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={onPrevDate}
        aria-label="전날 보기"
        className="grid h-9 w-9 place-items-center rounded-full text-[#4E5968] transition-colors hover:bg-black/5"
      >
        <Chevron direction="left" />
      </button>
      <p className="min-w-[132px] text-center text-[18px] font-extrabold text-[#191F28]">{formatMissionDate(date)}</p>
      <button
        type="button"
        onClick={onNextDate}
        disabled={isToday}
        aria-label="다음 날 보기"
        className="grid h-9 w-9 place-items-center rounded-full text-[#4E5968] transition-colors hover:bg-black/5 disabled:invisible"
      >
        <Chevron direction="right" />
      </button>
    </div>
    <p className="mt-0.5 min-h-[20px] text-center text-[13px] text-[#6B7684]">
      {isLoading
        ? ''
        : personCount > 0
          ? `${isToday ? '오늘' : '이날'} ${personCount}명이 감사했어요`
          : isToday
            ? '아직 아무도 감사를 남기지 않았어요'
            : '이날은 기록이 없어요'}
    </p>
  </header>
)
