import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { redirectToKakaoLogin, isLoggedIn, testLogin } from '../../../features/auth'
import { isLocalDevelopment } from '../../../shared/config'

export const LoginPage = () => {
  const navigate = useNavigate()
  const [isLocal, setIsLocal] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [isTestLoginLoading, setIsTestLoginLoading] = useState(false)
  const [testLoginError, setTestLoginError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoggedIn()) {
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/'
      sessionStorage.removeItem('redirectAfterLogin')
      navigate(redirectUrl)
    }

    setIsLocal(isLocalDevelopment())
  }, [navigate])

  const handleKakaoLogin = () => {
    redirectToKakaoLogin()
  }

  const handleTestLogin = async () => {
    if (!testEmail) {
      setTestLoginError('이메일을 입력해주세요.')
      return
    }

    setIsTestLoginLoading(true)
    setTestLoginError(null)

    try {
      await testLogin(testEmail)
      const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/'
      sessionStorage.removeItem('redirectAfterLogin')
      navigate(redirectUrl)
    } catch (error) {
      if (error instanceof Error) {
        setTestLoginError(error.message)
      } else {
        setTestLoginError('테스트 로그인에 실패했습니다.')
      }
    } finally {
      setIsTestLoginLoading(false)
    }
  }

  const handleGoBack = () => {
    sessionStorage.removeItem('redirectAfterLogin')
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          className="mb-6 text-gray-600 hover:text-gray-900 font-medium transition-colors flex items-center gap-2"
          onClick={handleGoBack}
        >
          <span>←</span> 돌아가기
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <img
              src="https://cdn.gntc-youth.com/assets/gntc-youth-logo-black.webp"
              alt="GNTC Youth 로고"
              className="w-16 h-16 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">GNTC YOUTH</h1>
            <p className="text-gray-500 text-sm">
              함께 성장하고, 함께 섬기며, 함께 예배하는 청년들의 공동체
            </p>
          </div>

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">소셜 계정으로 간편하게 시작하기</span>
            </div>
          </div>

          {/* Login Buttons */}
          <div className="space-y-3">
            {/* Test Login (Dev only) */}
            {isLocal && (
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-0.5 text-xs font-medium bg-amber-200 text-amber-800 rounded">
                    개발 모드
                  </span>
                  <span className="text-sm text-amber-700">테스트 로그인</span>
                </div>
                <div className="space-y-3">
                  <input
                    type="email"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    value={testEmail}
                    onChange={(e) => {
                      setTestEmail(e.target.value)
                      setTestLoginError(null)
                    }}
                    placeholder="DB에 존재하는 이메일 입력"
                    disabled={isTestLoginLoading}
                  />
                  {testLoginError && <p className="text-sm text-red-500">{testLoginError}</p>}
                  <button
                    className="w-full py-3 bg-amber-100 text-amber-800 font-medium rounded-lg hover:bg-amber-200 transition-colors disabled:opacity-50"
                    onClick={handleTestLogin}
                    disabled={isTestLoginLoading}
                  >
                    {isTestLoginLoading ? '로그인 중...' : '🧪 테스트 로그인'}
                  </button>
                </div>
              </div>
            )}

            {/* Kakao */}
            <button
              className="w-full py-3 bg-[#FEE500] text-[#191919] font-medium rounded-lg hover:bg-[#FDD800] transition-colors flex items-center justify-center gap-3"
              onClick={handleKakaoLogin}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.89 1.86 5.44 4.67 7.03-.2.73-.74 2.75-.85 3.19-.13.52.19.51.4.37.16-.11 2.53-1.71 3.53-2.39.75.1 1.52.15 2.25.15 5.52 0 10-3.58 10-8S17.52 3 12 3z" />
              </svg>
              카카오로 시작하기
            </button>

            {/* Naver (disabled) */}
            <button
              className="w-full py-3 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-3"
              disabled
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z" />
              </svg>
              네이버로 시작하기
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded">준비중</span>
            </button>

            {/* Google (disabled) */}
            <button
              className="w-full py-3 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-3"
              disabled
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#9ca3af"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#9ca3af"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#9ca3af"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#9ca3af"
                />
              </svg>
              Google로 시작하기
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-200 rounded">준비중</span>
            </button>
          </div>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-gray-500">
            로그인 시 GNTC Youth의{' '}
            <a href="#terms" className="text-blue-600 hover:underline">
              이용약관
            </a>
            과{' '}
            <a href="#privacy" className="text-blue-600 hover:underline">
              개인정보처리방침
            </a>
            에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
