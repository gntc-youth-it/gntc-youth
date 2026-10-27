import { Link, useLocation, useNavigate } from 'react-router-dom'

// 로그인한 청년만 볼 수 있다. 로그인하고 나면 보던 주소로 돌아온다
export const ThanksLoginRequired = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogin = () => {
    sessionStorage.setItem('redirectAfterLogin', `${location.pathname}${location.search}`)
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#F2EFEA]">
      <main className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-10 pt-3">
        <Link
          to="/"
          aria-label="홈으로"
          className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#191F28] shadow-[0_2px_10px_rgba(0,0,0,0.08)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-[52px]" aria-hidden="true">
            🙏
          </p>
          <h1 className="mt-4 rounded-full bg-white px-5 py-2.5 text-[17px] font-bold text-[#191F28] shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
            범사에 감사로그
          </h1>
          <p className="mt-5 break-keep text-[16px] font-semibold leading-relaxed text-[#333D4B]">
            아침, 오후, 저녁 하루 세 번
            <br />
            감사한 순간을 사진과 함께 나눠요
          </p>
          <p className="mt-2 text-[14px] text-[#6B7684]">로그인한 청년만 볼 수 있어요</p>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#FEE500] py-4 text-[16px] font-semibold text-[#191919] transition-colors hover:bg-[#FDD800] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191F28] focus-visible:ring-offset-2"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 3C6.48 3 2 6.58 2 11c0 2.89 1.86 5.44 4.67 7.03-.2.73-.74 2.75-.85 3.19-.13.52.19.51.4.37.16-.11 2.53-1.71 3.53-2.39.75.1 1.52.15 2.25.15 5.52 0 10-3.58 10-8S17.52 3 12 3z" />
          </svg>
          카카오로 로그인하기
        </button>
      </main>
    </div>
  )
}
