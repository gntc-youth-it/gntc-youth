import { render, screen, act } from '@testing-library/react'
import { AuthProvider } from '../AuthContext'
import { useAuth } from '../useAuth'

jest.mock('../../lib', () => ({
  getUserInfoFromToken: jest.fn(),
  setAccessToken: jest.fn(),
  removeAccessToken: jest.fn(),
}))

jest.mock('../../api', () => ({
  logoutApi: jest.fn(),
}))

import { getUserInfoFromToken, setAccessToken, removeAccessToken } from '../../lib'
import { logoutApi } from '../../api'

const mockGetUserInfo = getUserInfoFromToken as jest.MockedFunction<typeof getUserInfoFromToken>
const mockLogoutApi = logoutApi as jest.MockedFunction<typeof logoutApi>

// AuthProvider 내부 상태를 확인하기 위한 테스트 컴포넌트
const TestComponent = () => {
  const { user, isLoggedIn, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="logged-in">{String(isLoggedIn)}</span>
      <span data-testid="user-name">{user?.name ?? 'none'}</span>
      <button data-testid="login-btn" onClick={() => login('test-token')}>
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetUserInfo.mockReturnValue(null)
    mockLogoutApi.mockResolvedValue(undefined)
  })

  it('초기 상태는 로그아웃 상태이다', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('logged-in')).toHaveTextContent('false')
    expect(screen.getByTestId('user-name')).toHaveTextContent('none')
  })

  it('기존 토큰이 있으면 로그인 상태로 시작한다', () => {
    mockGetUserInfo.mockReturnValue({ id: 1, name: '홍길동' })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('logged-in')).toHaveTextContent('true')
    expect(screen.getByTestId('user-name')).toHaveTextContent('홍길동')
  })

  it('login 호출 시 토큰을 저장하고 사용자 상태를 업데이트한다', async () => {
    mockGetUserInfo
      .mockReturnValueOnce(null) // 초기 로드
      .mockReturnValueOnce({ id: 1, name: 'New User' }) // login 호출 후

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('logged-in')).toHaveTextContent('false')

    await act(async () => {
      screen.getByTestId('login-btn').click()
    })

    expect(setAccessToken).toHaveBeenCalledWith('test-token')
    expect(screen.getByTestId('logged-in')).toHaveTextContent('true')
    expect(screen.getByTestId('user-name')).toHaveTextContent('New User')
  })

  it('logout 호출 시 API를 호출하고 상태를 초기화한다', async () => {
    mockGetUserInfo.mockReturnValue({ id: 1, name: 'Test User' })

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    expect(screen.getByTestId('logged-in')).toHaveTextContent('true')

    await act(async () => {
      screen.getByTestId('logout-btn').click()
    })

    expect(mockLogoutApi).toHaveBeenCalled()
    expect(removeAccessToken).toHaveBeenCalled()
    expect(screen.getByTestId('logged-in')).toHaveTextContent('false')
    expect(screen.getByTestId('user-name')).toHaveTextContent('none')
  })

  it('로그아웃 API가 실패해도 로컬 상태는 초기화된다', async () => {
    mockGetUserInfo.mockReturnValue({ id: 1, name: 'Test User' })
    mockLogoutApi.mockRejectedValue(new Error('Network error'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await act(async () => {
      screen.getByTestId('logout-btn').click()
    })

    expect(removeAccessToken).toHaveBeenCalled()
    expect(screen.getByTestId('logged-in')).toHaveTextContent('false')
    expect(screen.getByTestId('user-name')).toHaveTextContent('none')

    consoleSpy.mockRestore()
  })
})
