import { decodeJWT } from './jwt'
import type { UserInfo } from '../model/types'

const ACCESS_TOKEN_KEY = 'accessToken'

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export const setAccessToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export const removeAccessToken = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export const isLoggedIn = (): boolean => {
  return !!getAccessToken()
}

export const getUserInfoFromToken = (): UserInfo | null => {
  const token = getAccessToken()
  if (!token) {
    return null
  }

  const payload = decodeJWT(token)
  if (!payload) {
    return null
  }

  return {
    id: parseInt(String(payload.sub) || '0'),
    name: String(payload.name || '사용자'),
    email: payload.email as string | undefined,
    role: payload.role as string | undefined,
    provider: payload.provider as string | undefined,
  }
}
