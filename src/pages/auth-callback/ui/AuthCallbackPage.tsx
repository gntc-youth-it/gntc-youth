import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth'

export const AuthCallbackPage = () => {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    const processCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const accessToken = urlParams.get('access_token') || urlParams.get('accessToken')
      const errorParam = urlParams.get('error')

      if (errorParam) {
        setError('로그인에 실패했습니다. 다시 시도해주세요.')
        setTimeout(() => {
          navigate('/')
        }, 3000)
        return
      }

      if (accessToken) {
        login(accessToken)
        setIsSuccess(true)

        setTimeout(() => {
          const redirectUrl = sessionStorage.getItem('redirectAfterLogin') || '/'
          sessionStorage.removeItem('redirectAfterLogin')
          navigate(redirectUrl)
        }, 1500)
      } else {
        setError('토큰을 받지 못했습니다. 다시 시도해주세요.')
        setTimeout(() => {
          navigate('/')
        }, 3000)
      }
    }

    processCallback()
  }, [navigate, login])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-4xl text-red-500">✕</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{error}</h2>
            <p className="text-gray-500">잠시 후 홈으로 돌아갑니다...</p>
          </>
        ) : isSuccess ? (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-4xl text-green-500">✓</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">로그인 성공!</h2>
            <p className="text-gray-500">환영합니다. 홈으로 이동합니다...</p>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">로그인 처리 중...</h2>
            <p className="text-gray-500">잠시만 기다려주세요.</p>
          </>
        )}
      </div>
    </div>
  )
}
