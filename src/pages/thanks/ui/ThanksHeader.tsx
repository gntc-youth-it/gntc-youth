import { Link } from 'react-router-dom'
import { formatMissionDate } from '../model/slots'
import type { ThanksAuthor } from '../model/types'
import { Avatar } from './Avatar'
import { ThanksBrand } from './ThanksBrand'
import { Chevron } from './ThanksIcons'

interface ThanksHeaderProps {
  date: string
  isToday: boolean
  personCount: number
  isLoading: boolean
  me: ThanksAuthor
  onOpenProfile: () => void
  onPrevDate: () => void
  onNextDate: () => void
  onToday: () => void
}

export const ThanksHeader = ({
  date,
  isToday,
  personCount,
  isLoading,
  me,
  onOpenProfile,
  onPrevDate,
  onNextDate,
  onToday,
}: ThanksHeaderProps) => (
  <header className="thanks-header">
    <div className="thanks-nav">
      <Link to="/" aria-label="홈으로" className="thanks-icon-button">
        <Chevron direction="left" />
      </Link>
      <h1>
        <ThanksBrand />
      </h1>
      <button type="button" onClick={onOpenProfile} aria-label="내 프로필" className="thanks-profile-button">
        <Avatar author={me} size={34} />
      </button>
    </div>
    <div className="thanks-date-row">
      <button type="button" onClick={onPrevDate} aria-label="전날 보기" className="thanks-icon-button">
        <Chevron direction="left" />
      </button>
      <h2>{formatMissionDate(date)}</h2>
      <button
        type="button"
        onClick={onNextDate}
        disabled={isToday}
        aria-label="다음 날 보기"
        className="thanks-icon-button"
      >
        <Chevron direction="right" />
      </button>
    </div>
    {!isToday && (
      <button type="button" onClick={onToday} className="thanks-back-today">
        오늘로
      </button>
    )}
    <p className="thanks-person-count" aria-live="polite">
      {isLoading
        ? '오늘의 기록을 불러오고 있어요'
        : personCount > 0
          ? `${isToday ? '오늘' : '이날'} ${personCount}명이 감사했어요`
          : isToday
            ? '아직 아무도 감사를 남기지 않았어요'
            : '이날은 기록이 없어요'}
    </p>
  </header>
)
