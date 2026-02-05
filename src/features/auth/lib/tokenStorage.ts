import { decodeJWT } from './jwt'
import type { UserInfo } from '../model/types'
import { getAccessToken } from '../../../shared/lib'

// Re-export from shared for convenience
export { getAccessToken, setAccessToken, removeAccessToken } from '../../../shared/lib'

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
