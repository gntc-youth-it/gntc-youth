import { API_BASE_URL } from './config'
import { getAccessToken, setAccessToken, removeAccessToken } from '../lib'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string | number
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

let isRefreshing = false
let refreshPromise: Promise<string> | null = null

const refreshAccessToken = async (): Promise<string> => {
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

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getAccessToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (response.status === 401) {
    try {
      const newAccessToken = await refreshAccessToken()

      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${newAccessToken}`,
      }

      const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: retryHeaders,
        credentials: 'include',
      })

      if (!retryResponse.ok) {
        const errorData = await retryResponse.json().catch(() => ({}))
        const message = errorData.message || `API Error: ${retryResponse.status}`
        throw new HttpError(retryResponse.status, message, errorData.code)
      }

      return retryResponse.json()
    } catch {
      removeAccessToken()

      const currentPath = window.location.pathname
      if (currentPath !== '/login' && currentPath !== '/') {
        sessionStorage.setItem('redirectAfterLogin', currentPath)
      }

      window.location.href = '/login'
      throw new HttpError(401, 'Session expired. Please login again.')
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const message = errorData.message || `API Error: ${response.status}`
    throw new HttpError(response.status, message, errorData.code)
  }

  return response.json()
}
