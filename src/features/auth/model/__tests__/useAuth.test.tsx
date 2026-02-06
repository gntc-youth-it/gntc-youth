import { renderHook } from '@testing-library/react'
import { AuthContext } from '../AuthContext'
import { useAuth } from '../useAuth'
import type { AuthContextValue } from '../types'

describe('useAuth', () => {
  it('AuthProvider 없이 사용하면 에러를 던진다', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within AuthProvider')

    consoleSpy.mockRestore()
  })

  it('AuthProvider 내에서 컨텍스트 값을 반환한다', () => {
    const mockValue: AuthContextValue = {
      user: { id: 1, name: 'Test User' },
      isLoggedIn: true,
      login: jest.fn(),
      logout: jest.fn(),
    }

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockValue}>
        {children}
      </AuthContext.Provider>
    )

    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.user).toEqual({ id: 1, name: 'Test User' })
    expect(result.current.isLoggedIn).toBe(true)
    expect(result.current.login).toBeDefined()
    expect(result.current.logout).toBeDefined()
  })
})
