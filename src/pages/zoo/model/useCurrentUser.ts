import { getUserInfoFromToken, useAuth } from '../../../features/auth'
import type { UserInfo } from '../../../features/auth'

// AuthProvider는 첫 렌더가 끝난 뒤에 토큰을 읽는다.
// 그 사이 로그인 화면이 깜빡이거나 조장 여부를 잘못 판단하지 않도록 토큰을 직접 확인한다.
export const useCurrentUser = (): UserInfo | null => {
  const { user } = useAuth()
  return user ?? getUserInfoFromToken()
}
