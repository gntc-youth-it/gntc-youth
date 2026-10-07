import { Link, useLocation, useNavigate } from 'react-router-dom'
import { PARK_GREEN } from './courseTheme'

interface ZooLoginRequiredProps {
  title: string
  description: string
}

export const ZooLoginRequired = ({ title, description }: ZooLoginRequiredProps) => {
  const navigate = useNavigate()
  const location = useLocation()

  // 로그인하고 나면 보던 화면(초대받은 조 등)으로 돌아온다
  const handleLogin = () => {
    sessionStorage.setItem('redirectAfterLogin', `${location.pathname}${location.search}`)
    navigate('/login')
  }

  return (
    <section>
      <h1 className="font-sign text-[34px] leading-tight sm:text-[40px]" style={{ color: PARK_GREEN }}>
        {title}
      </h1>
      <p className="mt-2 break-keep text-[15px] leading-relaxed text-[#4E5968]">{description}</p>
      <button
        type="button"
        onClick={handleLogin}
        className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#FEE500] py-4 text-[16px] font-semibold text-[#191919] transition-colors hover:bg-[#FDD800] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F4D36] focus-visible:ring-offset-2"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 3C6.48 3 2 6.58 2 11c0 2.89 1.86 5.44 4.67 7.03-.2.73-.74 2.75-.85 3.19-.13.52.19.51.4.37.16-.11 2.53-1.71 3.53-2.39.75.1 1.52.15 2.25.15 5.52 0 10-3.58 10-8S17.52 3 12 3z" />
        </svg>
        카카오로 로그인하기
      </button>
      <Link
        to="/zoo/course"
        className="mt-5 inline-block text-[13px] text-[#6B7684] underline underline-offset-4 hover:text-[#333D4B]"
      >
        로그인 없이 코스만 보기
      </Link>
    </section>
  )
}
