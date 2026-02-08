import { API_BASE_URL, apiRequest } from '../../../shared/api'
import { isLocalDevelopment } from '../../../shared/config'
import { setAccessToken } from '../lib'
import { normalizeTestLoginResponse, type TestLoginResponse } from '../model/types'

export const refreshTokenApi = (() => {
  let isRefreshing = false
  let refreshPromise: Promise<string> | null = null

  return async (): Promise<string> => {
    if (isRefreshing && refreshPromise) {
      return refreshPromise
    }

    isRefreshing = true
    refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Token refresh failed')
        }

        const data = await response.json()
        const newAccessToken = data.access_token || data.accessToken

        if (!newAccessToken) {
          throw new Error('No access token in refresh response')
        }

        setAccessToken(newAccessToken)
        return newAccessToken
      } finally {
        isRefreshing = false
        refreshPromise = null
      }
    })()

    return refreshPromise
  }
})()

export const logoutApi = async (): Promise<void> => {
  await apiRequest('/api/auth/logout', {
    method: 'POST',
  })
}

export const redirectToKakaoLogin = (): void => {
  window.location.href = `${API_BASE_URL}/oauth2/authorization/kakao`
}

export const testLogin = async (email: string): Promise<TestLoginResponse> => {
  if (!isLocalDevelopment()) {
    throw new Error('테스트 로그인은 로컬 환경에서만 사용 가능합니다.')
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/test/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || '테스트 로그인에 실패했습니다.')
  }

  const rawData = await response.json()
  const data = normalizeTestLoginResponse(rawData)
  setAccessToken(data.accessToken)

  return data
}
