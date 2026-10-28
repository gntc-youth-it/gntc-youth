import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ThanksBrand, ThanksMark } from './ThanksBrand'
import { Chevron, SlotIcon } from './ThanksIcons'
import { SLOTS } from '../model/slots'

export const ThanksLoginRequired = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const handleLogin = () => {
    sessionStorage.setItem('redirectAfterLogin', `${location.pathname}${location.search}`)
    navigate('/login')
  }
  return (
    <div className="thanks-app">
      <main className="thanks-shell thanks-welcome">
        <div className="thanks-nav">
          <Link to="/" aria-label="홈으로" className="thanks-icon-button">
            <Chevron direction="left" />
          </Link>
          <h1>
            <ThanksBrand />
          </h1>
          <span className="thanks-nav-spacer" />
        </div>
        <div className="thanks-welcome-content">
          <div className="thanks-welcome-mark">
            <ThanksMark size={64} />
          </div>
          <h2>
            지금 이 순간,
            <br />
            함께 감사해요
          </h2>
          <p className="thanks-welcome-description">
            사진 한 장, 짧은 영상 하나.
            <br />
            오늘의 감사를 가볍게 나눠요.
          </p>
          <ol className="thanks-welcome-slots">
            {SLOTS.map((slot) => (
              <li key={slot.id}>
                <SlotIcon slot={slot.id} />
                <span>{slot.label}</span>
                <span>
                  {String(slot.startHour).padStart(2, '0')}:00–{slot.endHour}:00
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="thanks-welcome-footer">
          <p>로그인한 청년들끼리만 볼 수 있어요</p>
          <button type="button" onClick={handleLogin} className="thanks-login-button">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.89 1.86 5.44 4.67 7.03-.2.73-.74 2.75-.85 3.19-.13.52.19.51.4.37.16-.11 2.53-1.71 3.53-2.39.75.1 1.52.15 2.25.15 5.52 0 10-3.58 10-8S17.52 3 12 3z" />
            </svg>
            카카오로 로그인하기
          </button>
        </div>
      </main>
    </div>
  )
}
