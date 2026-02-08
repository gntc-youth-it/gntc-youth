export interface UserInfo {
  id: number
  name: string
  email?: string
  role?: string
  provider?: string
  churchId?: string
}

// API 원본 응답 (snake_case)
interface TestLoginApiResponse {
  access_token: string
  refresh_token: string
  user_id: number
  email: string
  name: string
  role: string
}

// 내부에서 사용하는 정규화된 타입 (camelCase)
export interface TestLoginResponse {
  accessToken: string
  refreshToken: string
  userId: number
  email: string
  name: string
  role: string
}

// API 응답을 camelCase로 변환하는 함수
export const normalizeTestLoginResponse = (
  raw: TestLoginApiResponse
): TestLoginResponse => ({
  accessToken: raw.access_token,
  refreshToken: raw.refresh_token,
  userId: raw.user_id,
  email: raw.email,
  name: raw.name,
  role: raw.role,
})

export interface AuthContextValue {
  user: UserInfo | null
  isLoggedIn: boolean
  login: (token: string) => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}
