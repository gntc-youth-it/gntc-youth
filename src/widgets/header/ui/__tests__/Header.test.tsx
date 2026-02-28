import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from '../Header'
import { useAuth } from '../../../../features/auth'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to, onClick, className }: { children: React.ReactNode; to: string; onClick?: () => void; className?: string }) => (
    <a href={to} onClick={(e) => { e.preventDefault(); onClick?.(); mockNavigate(to) }} className={className}>{children}</a>
  ),
}))

jest.mock('../../../../features/auth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../../../../features/edit-profile', () => ({
  EditProfileModal: () => null,
  ProfileCompletionModal: () => null,
  PROFILE_COMPLETION_DISMISSED_KEY: 'profile_completion_dismissed',
}))

jest.mock('../../../../shared/lib', () => ({
  buildCdnUrl: (path: string) => `https://cdn.gntc-youth.com/${path}`,
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

    expect(screen.getByTestId('admin-menu-button')).toBeInTheDocument()
  })

  it('관리자 버튼 클릭 시 사용자 관리 드롭다운이 표시된다', async () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '관리자', role: 'MASTER' },
    })

    render(<Header />)

    await userEvent.click(screen.getByTestId('admin-menu-button'))

    expect(screen.getByTestId('admin-dropdown-menu')).toBeInTheDocument()
    expect(screen.getByTestId('admin-users-button')).toBeInTheDocument()
    expect(screen.getByTestId('admin-posts-button')).toBeInTheDocument()
  })

  it('사용자 관리 클릭 시 /admin/users로 이동한다', async () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '관리자', role: 'MASTER' },
    })

    render(<Header />)

    await userEvent.click(screen.getByTestId('admin-menu-button'))
    await userEvent.click(screen.getByTestId('admin-users-button'))

    expect(mockNavigate).toHaveBeenCalledWith('/admin/users')
  })

  it('게시물 관리 클릭 시 /admin/posts로 이동한다', async () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '관리자', role: 'MASTER' },
    })

    render(<Header />)

    await userEvent.click(screen.getByTestId('admin-menu-button'))
    await userEvent.click(screen.getByTestId('admin-posts-button'))

    expect(mockNavigate).toHaveBeenCalledWith('/admin/posts')
  })
})

describe('Header 프로필 이미지', () => {
  it('프로필 이미지가 있으면 이미지를 표시한다', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '홍길동', profileImagePath: 'uploads/profile.jpg' },
    })

    render(<Header />)

    const img = screen.getAllByAltText('프로필')[0]
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://cdn.gntc-youth.com/uploads/profile.jpg')
  })

  it('프로필 이미지가 없으면 fallback 아이콘을 표시한다', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '홍길동' },
    })

    render(<Header />)

    expect(screen.getByTestId('profile-fallback')).toBeInTheDocument()
  })
})
