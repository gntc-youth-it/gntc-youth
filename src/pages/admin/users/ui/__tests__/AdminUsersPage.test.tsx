import { render, screen, act, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminUsersPage } from '../AdminUsersPage'
import { useAuth } from '../../../../../features/auth'
import { useAdminUsers } from '../../model/useAdminUsers'
import { getChurchLeader, updateUserRole } from '../../api/adminUserApi'

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

jest.mock('../../api/adminUserApi', () => ({
  getChurchLeader: jest.fn(),
  updateUserRole: jest.fn(),
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseAdminUsers = useAdminUsers as jest.MockedFunction<typeof useAdminUsers>
const mockGetChurchLeader = getChurchLeader as jest.MockedFunction<typeof getChurchLeader>
const mockUpdateUserRole = updateUserRole as jest.MockedFunction<typeof updateUserRole>

const baseAuth = {
  user: null,
  isLoggedIn: false,
  login: jest.fn(),
  logout: jest.fn().mockResolvedValue(undefined),
  refreshUser: jest.fn().mockResolvedValue(undefined),
}

const emptyData = { users: [], totalElements: 0, totalPages: 0, page: 0, size: 10 }

const mockUsers = [
  { userId: 1, name: '김철수', churchId: 'NAMDAEMUN', churchName: '남대문', generation: 23, phoneNumber: '010-****-5678', role: 'MASTER' },
  { userId: 2, name: '이영희', churchId: 'GANGNAM', churchName: '강남', generation: 22, phoneNumber: '010-****-5432', role: 'USER' },
  { userId: 3, name: '최지영', churchId: 'SEOCHO', churchName: '서초', generation: 23, phoneNumber: '010-****-2222', role: 'LEADER' },
]

beforeEach(() => {
  jest.clearAllMocks()
  mockUseAuth.mockReturnValue(baseAuth)
  mockUseAdminUsers.mockReturnValue({ data: emptyData, isLoading: false, error: null, refetch: jest.fn() })
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
    mockUseAdminUsers.mockReturnValue({ data: emptyData, isLoading: true, error: null, refetch: jest.fn() })

    render(<AdminUsersPage />)

    expect(screen.getByText('사용자 관리')).toBeInTheDocument()
    expect(screen.queryByText('전체')).not.toBeInTheDocument()
  })

  it('에러 시 에러 메시지가 표시된다', () => {
    mockUseAdminUsers.mockReturnValue({ data: emptyData, isLoading: false, error: new Error('Forbidden'), refetch: jest.fn() })

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
      refetch: jest.fn(),
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

  it('검색어 입력 300ms 후 디바운스되어 useAdminUsers에 name이 전달된다', async () => {
    jest.useFakeTimers()

    render(<AdminUsersPage />)

    const searchInput = screen.getByPlaceholderText('이름으로 검색...')
    await userEvent.setup({ advanceTimers: jest.advanceTimersByTime }).type(searchInput, '김철수')

    // 디바운스 전에는 name 없이 호출
    expect(mockUseAdminUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: '' })
    )

    // 300ms 경과 후 리렌더링
    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(mockUseAdminUsers).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: '김철수', page: 0 })
    )

    jest.useRealTimers()
  })
})

describe('AdminUsersPage 권한 변경', () => {
  const mockRefetch = jest.fn()

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
      refetch: mockRefetch,
    })
  })

  it('MASTER 사용자는 뱃지로, 성전이 있는 일반/회장은 셀렉트로 표시된다', () => {
    render(<AdminUsersPage />)

    // 이영희(USER) + 최지영(LEADER) × desktop/mobile = 4개
    const selects = screen.getAllByRole('combobox')
    expect(selects).toHaveLength(4)

    // MASTER는 정적 뱃지
    expect(screen.getAllByText('관리자').length).toBeGreaterThanOrEqual(1)
  })

  it('성전 정보가 없는 사용자는 셀렉트가 아닌 뱃지가 표시된다', () => {
    const usersWithNoChurch = [
      ...mockUsers,
      { userId: 4, name: '박민수', churchId: null, churchName: null, generation: null, phoneNumber: '010-****-3333', role: 'USER' },
    ]
    mockUseAdminUsers.mockReturnValue({
      data: { users: usersWithNoChurch, totalElements: 4, totalPages: 1, page: 0, size: 10 },
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    })

    render(<AdminUsersPage />)

    // 박민수는 성전 없으므로 셀렉트 아닌 뱃지 → 여전히 4개
    const selects = screen.getAllByRole('combobox')
    expect(selects).toHaveLength(4)
  })

  it('일반 → 회장 변경 시 기존 회장이 있으면 기존 회장 정보가 모달에 표시된다', async () => {
    mockGetChurchLeader.mockResolvedValue({
      churchId: 'GANGNAM',
      churchName: '강남',
      leader: { id: 10, name: '기존회장', email: 'test@test.com' },
    })

    render(<AdminUsersPage />)

    const selects = screen.getAllByRole('combobox')
    await userEvent.selectOptions(selects[0], 'LEADER')

    expect(await screen.findByTestId('role-change-modal')).toBeInTheDocument()
    const modal = within(screen.getByTestId('role-change-modal'))
    expect(modal.getByText('기존회장')).toBeInTheDocument()
    expect(modal.getByText(/회장을/)).toBeInTheDocument()
    expect(modal.getByText('이영희')).toBeInTheDocument()
  })

  it('일반 → 회장 변경 시 기존 회장이 없으면 단순 확인 모달이 표시된다', async () => {
    mockGetChurchLeader.mockResolvedValue({
      churchId: 'GANGNAM',
      churchName: '강남',
      leader: null,
    })

    render(<AdminUsersPage />)

    const selects = screen.getAllByRole('combobox')
    await userEvent.selectOptions(selects[0], 'LEADER')

    expect(await screen.findByTestId('role-change-modal')).toBeInTheDocument()
    const modal = within(screen.getByTestId('role-change-modal'))
    expect(modal.getByText('이영희')).toBeInTheDocument()
    expect(modal.getByText(/회장으로/)).toBeInTheDocument()
    expect(modal.queryByText('기존회장')).not.toBeInTheDocument()
  })

  it('회장 → 일반 변경 시 확인 모달이 표시된다', async () => {
    render(<AdminUsersPage />)

    // selects[1]은 최지영(LEADER)의 데스크톱 셀렉트
    const selects = screen.getAllByRole('combobox')
    await userEvent.selectOptions(selects[1], 'USER')

    expect(await screen.findByTestId('role-change-modal')).toBeInTheDocument()
    const modal = within(screen.getByTestId('role-change-modal'))
    expect(modal.getByText('최지영')).toBeInTheDocument()
    expect(modal.getByText(/일반 사용자로/)).toBeInTheDocument()
  })

  it('취소 버튼 클릭 시 모달이 닫힌다', async () => {
    mockGetChurchLeader.mockResolvedValue({
      churchId: 'GANGNAM',
      churchName: '강남',
      leader: null,
    })

    render(<AdminUsersPage />)

    const selects = screen.getAllByRole('combobox')
    await userEvent.selectOptions(selects[0], 'LEADER')

    expect(await screen.findByText('권한 변경')).toBeInTheDocument()

    await userEvent.click(screen.getByText('취소'))

    expect(screen.queryByText('권한 변경')).not.toBeInTheDocument()
    expect(mockUpdateUserRole).not.toHaveBeenCalled()
  })

  it('변경 확인 시 API가 호출되고 목록이 갱신된다', async () => {
    mockGetChurchLeader.mockResolvedValue({
      churchId: 'GANGNAM',
      churchName: '강남',
      leader: null,
    })
    mockUpdateUserRole.mockResolvedValue({
      userId: 2,
      name: '이영희',
      role: 'LEADER',
      churchName: '강남',
      previousLeader: null,
    })

    render(<AdminUsersPage />)

    const selects = screen.getAllByRole('combobox')
    await userEvent.selectOptions(selects[0], 'LEADER')

    expect(await screen.findByText('권한 변경')).toBeInTheDocument()

    await userEvent.click(screen.getByText('변경'))

    await waitFor(() => {
      expect(mockUpdateUserRole).toHaveBeenCalledWith(2, 'LEADER')
    })
    expect(mockRefetch).toHaveBeenCalled()
    expect(screen.queryByText('권한 변경')).not.toBeInTheDocument()
  })

  it('권한 변경 API 실패 시 에러 알림이 표시된다', async () => {
    mockGetChurchLeader.mockResolvedValue({
      churchId: 'GANGNAM',
      churchName: '강남',
      leader: null,
    })
    mockUpdateUserRole.mockRejectedValue(new Error('Forbidden'))

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

    render(<AdminUsersPage />)

    const selects = screen.getAllByRole('combobox')
    await userEvent.selectOptions(selects[0], 'LEADER')

    expect(await screen.findByText('권한 변경')).toBeInTheDocument()

    await userEvent.click(screen.getByText('변경'))

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('권한 변경에 실패했습니다.')
    })
    expect(mockRefetch).not.toHaveBeenCalled()

    alertSpy.mockRestore()
  })
})
