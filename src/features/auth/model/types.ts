export interface UserInfo {
  id: number
  name: string
  email?: string
  role?: string
  provider?: string
}

export interface TestLoginResponse {
  accessToken: string
  refreshToken: string
  userId: number
  email: string
  name: string
  role: string
}

export interface AuthContextValue {
  user: UserInfo | null
  isLoggedIn: boolean
  login: (token: string) => void
  logout: () => Promise<void>
}
