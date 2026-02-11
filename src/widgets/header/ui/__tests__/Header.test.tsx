import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from '../Header'
import { useAuth } from '../../../../features/auth'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

jest.mock('../../../../features/auth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../../../../features/edit-profile', () => ({
  EditProfileModal: () => null,
  ProfileCompletionModal: () => null,
  PROFILE_COMPLETION_DISMISSED_KEY: 'profile_completion_dismissed',
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const baseAuth = {
  user: null,
  isLoggedIn: false,
  login: jest.fn(),
  logout: jest.fn().mockResolvedValue(undefined),
  refreshUser: jest.fn().mockResolvedValue(undefined),
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseAuth.mockReturnValue(baseAuth)
})

describe('Header 네비게이션 메뉴', () => {
  it('홈, 일정, 갤러리 메뉴가 표시된다', () => {
    render(<Header />)

    expect(screen.getAllByText('홈').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('일정').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('갤러리').length).toBeGreaterThanOrEqual(1)
  })

  it('소개, 연락처 메뉴는 표시되지 않는다', () => {
    render(<Header />)

    expect(screen.queryByText('소개')).not.toBeInTheDocument()
    expect(screen.queryByText('연락처')).not.toBeInTheDocument()
  })

  it('홈 링크는 #home이 아닌 /를 사용한다', () => {
    render(<Header />)

    const homeLinks = screen.getAllByText('홈')
    homeLinks.forEach((link) => {
      const anchor = link.closest('a')
      if (anchor) {
        expect(anchor).toHaveAttribute('href', '/')
        expect(anchor).not.toHaveAttribute('href', '#home')
      }
    })
  })

  it('로고 링크는 /를 사용한다', () => {
    render(<Header />)

    const logo = screen.getByAltText('GNTC Youth 로고')
    const anchor = logo.closest('a')
    expect(anchor).toHaveAttribute('href', '/')
  })
})

describe('Header 관리자 메뉴', () => {
  it('비로그인 상태에서는 관리자 메뉴가 표시되지 않는다', () => {
    render(<Header />)

    expect(screen.queryByText('관리자')).not.toBeInTheDocument()
  })

  it('MEMBER 권한에서는 관리자 메뉴가 표시되지 않는다', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '홍길동', role: 'MEMBER', churchId: 'ANYANG' },
    })

    render(<Header />)

    expect(screen.queryByText('관리자')).not.toBeInTheDocument()
  })

  it('LEADER 권한에서는 관리자 메뉴가 표시되지 않는다', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '홍길동', role: 'LEADER', churchId: 'ANYANG' },
    })

    render(<Header />)

    expect(screen.queryByText('관리자')).not.toBeInTheDocument()
  })

  it('MASTER 권한에서는 관리자 메뉴가 표시된다', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '관리자', role: 'MASTER' },
    })

    render(<Header />)

    expect(screen.getAllByText('관리자').length).toBeGreaterThanOrEqual(1)
  })

  it('관리자 버튼 클릭 시 사용자 관리 드롭다운이 표시된다', async () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '관리자', role: 'MASTER' },
    })

    render(<Header />)

    const adminButtons = screen.getAllByText('관리자')
    const desktopAdminButton = adminButtons.find((el) => el.closest('button'))
    expect(desktopAdminButton).toBeDefined()

    await userEvent.click(desktopAdminButton!)

    expect(screen.getAllByText('사용자 관리').length).toBeGreaterThanOrEqual(1)
  })

  it('사용자 관리 클릭 시 /admin/users로 이동한다', async () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '관리자', role: 'MASTER' },
    })

    render(<Header />)

    const adminButtons = screen.getAllByText('관리자')
    const desktopAdminButton = adminButtons.find((el) => el.closest('button'))
    await userEvent.click(desktopAdminButton!)

    const userManagementButtons = screen.getAllByText('사용자 관리')
    const dropdownButton = userManagementButtons.find((el) => el.closest('button'))
    await userEvent.click(dropdownButton!)

    expect(mockNavigate).toHaveBeenCalledWith('/admin/users')
  })
})
