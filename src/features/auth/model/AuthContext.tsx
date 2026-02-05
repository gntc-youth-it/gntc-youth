import { createContext, useState, useEffect, useCallback, PropsWithChildren } from 'react'
import type { UserInfo, AuthContextValue } from './types'
import { getUserInfoFromToken, setAccessToken, removeAccessToken } from '../lib'
import { logoutApi } from '../api'

export const AuthContext = createContext<AuthContextValue | null>(null)

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const userInfo = getUserInfoFromToken()
    if (userInfo) {
      setUser(userInfo)
      setIsLoggedIn(true)
    }
  }, [])

  const login = useCallback((token: string) => {
    setAccessToken(token)
    const userInfo = getUserInfoFromToken()
    setUser(userInfo)
    setIsLoggedIn(true)
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutApi()
    } catch {
      console.error('Logout API error')
    } finally {
      removeAccessToken()
      setUser(null)
      setIsLoggedIn(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
