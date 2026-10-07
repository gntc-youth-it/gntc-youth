import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ZooLobbyPage } from '../ZooLobbyPage'
import { createZooTeam, fetchMyZooTeam, fetchZooTeams } from '../../api/zooTeamApi'
import type { ZooTeamDetail, ZooTeamSummary } from '../../model/team'

const mockNavigate = jest.fn()
let mockSearchParams = new URLSearchParams()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams, jest.fn()],
  useLocation: () => ({ pathname: '/zoo', search: '' }),
  Link: ({ children, to, className }: { children: React.ReactNode; to: string; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

const mockUseAuth = jest.fn()
jest.mock('../../../../features/auth', () => ({
  useAuth: () => mockUseAuth(),
  getUserInfoFromToken: () => null,
}))

jest.mock('../../../../widgets/header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}))

jest.mock('../../api/zooTeamApi')

const mockFetchMyZooTeam = fetchMyZooTeam as jest.MockedFunction<typeof fetchMyZooTeam>
const mockFetchZooTeams = fetchZooTeams as jest.MockedFunction<typeof fetchZooTeams>
const mockCreateZooTeam = createZooTeam as jest.MockedFunction<typeof createZooTeam>

const loggedIn = { user: { id: 1, name: '박석희', role: 'USER' }, isLoggedIn: true }

const teams: ZooTeamSummary[] = [
  {
    id: 1,
    name: '기린조',
    course: 'B',
    status: 'RECRUITING',
    leaderName: '김철수',
    memberCount: 3,
    arrivedCount: 0,
    createdAt: '2026-10-10T09:05:00',
  },
  {
    id: 2,
    name: '호랑이팀',
    course: 'A',
    status: 'STARTED',
    leaderName: '이영희',
    memberCount: 5,
    arrivedCount: 2,
    createdAt: '2026-10-10T09:01:00',
  },
]

const myTeam: ZooTeamDetail = {
  id: 7,
  name: '사자팀',
  course: 'A',
  status: 'RECRUITING',
  leaderUserId: 1,
  members: [{ userId: 1, name: '박석희', profileImagePath: null, isLeader: true, joinedAt: '2026-10-10T09:00:00' }],
  arrivals: [],
  createdAt: '2026-10-10T09:00:00',
  startedAt: null,
}

beforeEach(() => {
  jest.clearAllMocks()
  sessionStorage.clear()
  mockSearchParams = new URLSearchParams()
  mockUseAuth.mockReturnValue(loggedIn)
  mockFetchMyZooTeam.mockResolvedValue({ team: null })
  mockFetchZooTeams.mockResolvedValue({ teams })
})

describe('ZooLobbyPage', () => {
  it('로그인 전에는 카카오 로그인을 안내하고 돌아올 곳을 기억한다', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false })
    render(<ZooLobbyPage />)

    await user.click(screen.getByRole('button', { name: '카카오로 로그인하기' }))

    expect(sessionStorage.getItem('redirectAfterLogin')).toBe('/zoo')
    expect(mockNavigate).toHaveBeenCalledWith('/login')
    expect(screen.getByRole('link', { name: '로그인 없이 코스만 보기' })).toHaveAttribute('href', '/zoo/course')
    expect(mockFetchZooTeams).not.toHaveBeenCalled()
  })

  it('조 목록을 모집 중인 조부터 보여준다', async () => {
    render(<ZooLobbyPage />)

    const list = await screen.findByRole('list')
    const rows = within(list).getAllByRole('link')
    expect(rows[0]).toHaveTextContent('기린조')
    expect(rows[0]).toHaveTextContent('모집 중')
    expect(rows[0]).toHaveAttribute('href', '/zoo/teams/1')
    expect(rows[1]).toHaveTextContent('호랑이팀')
    expect(rows[1]).toHaveTextContent('출발 2/7')
    expect(screen.getByRole('button', { name: '조 만들기' })).toBeEnabled()
  })

  it('이미 조에 들어가 있으면 내 조 화면으로 보낸다', async () => {
    mockFetchMyZooTeam.mockResolvedValue({ team: myTeam })
    render(<ZooLobbyPage />)

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/zoo/teams/7', { replace: true }))
  })

  it('전체 조를 보러 왔으면 목록과 함께 내 조로 가는 길을 보여준다', async () => {
    mockSearchParams = new URLSearchParams('view=all')
    mockFetchMyZooTeam.mockResolvedValue({ team: myTeam })
    render(<ZooLobbyPage />)

    expect(await screen.findByRole('link', { name: /내 조로 가기/ })).toHaveAttribute('href', '/zoo/teams/7')
    expect(screen.queryByRole('button', { name: '조 만들기' })).not.toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('조 이름과 코스를 정해 조를 만들면 그 조 화면으로 이동한다', async () => {
    const user = userEvent.setup()
    mockCreateZooTeam.mockResolvedValue({ ...myTeam, id: 9 })
    render(<ZooLobbyPage />)

    await screen.findByRole('list')
    await user.click(screen.getByRole('button', { name: '조 만들기' }))

    const dialog = screen.getByRole('dialog', { name: '조 만들기' })
    const submit = within(dialog).getByRole('button', { name: '조 만들기' })
    expect(submit).toBeDisabled()

    await user.type(within(dialog).getByLabelText('조 이름'), '  사자팀 ')
    await user.click(within(dialog).getByRole('button', { name: /A코스/ }))
    await user.click(submit)

    expect(mockCreateZooTeam).toHaveBeenCalledWith({ name: '사자팀', course: 'A' })
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/zoo/teams/9'))
  })
})
