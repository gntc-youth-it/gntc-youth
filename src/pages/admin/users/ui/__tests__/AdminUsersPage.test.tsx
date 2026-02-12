import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminUsersPage } from '../AdminUsersPage'
import { useAuth } from '../../../../../features/auth'
import { useAdminUsers } from '../../model/useAdminUsers'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

jest.mock('../../../../../features/auth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../../../../../widgets/header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}))

jest.mock('../../../../../widgets/footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}))

jest.mock('../../model/useAdminUsers', () => ({
  useAdminUsers: jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseAdminUsers = useAdminUsers as jest.MockedFunction<typeof useAdminUsers>

const baseAuth = {
  user: null,
  isLoggedIn: false,
  login: jest.fn(),
  logout: jest.fn().mockResolvedValue(undefined),
  refreshUser: jest.fn().mockResolvedValue(undefined),
}

const emptyData = { users: [], totalElements: 0, totalPages: 0, page: 0, size: 10 }

const mockUsers = [
  { name: '김철수', churchName: '남대문', generation: 23, phoneNumber: '010-****-5678', role: 'MASTER' },
  { name: '이영희', churchName: '강남', generation: 22, phoneNumber: '010-****-5432', role: 'USER' },
  { name: '최지영', churchName: '서초', generation: 23, phoneNumber: '010-****-2222', role: 'LEADER' },
]

beforeEach(() => {
  jest.clearAllMocks()
  mockUseAuth.mockReturnValue(baseAuth)
  mockUseAdminUsers.mockReturnValue({ data: emptyData, isLoading: false, error: null })
})

describe('AdminUsersPage 접근 권한', () => {
  it('비로그인 상태에서는 권한 없음 메시지가 표시된다', () => {
    render(<AdminUsersPage />)

    expect(screen.getByText('접근 권한이 없습니다.')).toBeInTheDocument()
  })

  it('일반 사용자는 권한 없음 메시지가 표시된다', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '홍길동', role: 'USER' },
    })

    render(<AdminUsersPage />)

    expect(screen.getByText('접근 권한이 없습니다.')).toBeInTheDocument()
  })

  it('LEADER 사용자는 권한 없음 메시지가 표시된다', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '홍길동', role: 'LEADER' },
    })

    render(<AdminUsersPage />)

    expect(screen.getByText('접근 권한이 없습니다.')).toBeInTheDocument()
  })

  it('홈으로 돌아가기 버튼 클릭 시 /로 이동한다', async () => {
    render(<AdminUsersPage />)

    await userEvent.click(screen.getByText('홈으로 돌아가기'))

    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  it('MASTER 사용자는 사용자 관리 페이지가 표시된다', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '관리자', role: 'MASTER' },
    })

    render(<AdminUsersPage />)

    expect(screen.getByText('사용자 관리')).toBeInTheDocument()
    expect(screen.getByText('GNTC-YOUTH 회원 목록을 관리하고 권한을 설정합니다')).toBeInTheDocument()
  })
})

describe('AdminUsersPage 로딩/에러 상태', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '관리자', role: 'MASTER' },
    })
  })

  it('로딩 중에는 스피너가 표시된다', () => {
    mockUseAdminUsers.mockReturnValue({ data: emptyData, isLoading: true, error: null })

    render(<AdminUsersPage />)

    expect(screen.getByText('사용자 관리')).toBeInTheDocument()
    expect(screen.queryByText('전체')).not.toBeInTheDocument()
  })

  it('에러 시 에러 메시지가 표시된다', () => {
    mockUseAdminUsers.mockReturnValue({ data: emptyData, isLoading: false, error: new Error('Forbidden') })

    render(<AdminUsersPage />)

    expect(screen.getByText('사용자 목록을 불러오는데 실패했습니다.')).toBeInTheDocument()
  })

  it('사용자가 없으면 빈 상태 메시지가 표시된다', () => {
    render(<AdminUsersPage />)

    expect(screen.getAllByText('등록된 사용자가 없습니다.').length).toBeGreaterThanOrEqual(1)
  })
})

describe('AdminUsersPage 사용자 목록', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '관리자', role: 'MASTER' },
    })
    mockUseAdminUsers.mockReturnValue({
      data: { users: mockUsers, totalElements: 3, totalPages: 1, page: 0, size: 10 },
      isLoading: false,
      error: null,
    })
  })

  it('사용자 목록이 테이블에 표시된다', () => {
    render(<AdminUsersPage />)

    expect(screen.getAllByText('김철수').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('이영희').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('최지영').length).toBeGreaterThanOrEqual(1)
  })

  it('권한 뱃지가 올바르게 표시된다', () => {
    render(<AdminUsersPage />)

    expect(screen.getAllByText('관리자').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('일반').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('회장').length).toBeGreaterThanOrEqual(1)
  })

  it('전체 인원수가 표시된다', () => {
    render(<AdminUsersPage />)

    expect(screen.getByText('전체 3명')).toBeInTheDocument()
  })

  it('검색 입력이 동작한다', async () => {
    render(<AdminUsersPage />)

    const searchInput = screen.getByPlaceholderText('이름으로 검색...')
    await userEvent.type(searchInput, '김철수')

    expect(searchInput).toHaveValue('김철수')
  })
})
