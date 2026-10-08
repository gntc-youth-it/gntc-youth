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
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to: string } & Record<string, unknown>) => (
    <a href={to} {...rest}>
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

// 사진 투표가 열렸는지는 테스트마다 정한다
let mockIsVoteOpen = true
jest.mock('../../model/usePhotoVoteOpen', () => ({
  usePhotoVoteOpen: () => mockIsVoteOpen,
}))

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
  mockIsVoteOpen = true
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
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(mockFetchZooTeams).not.toHaveBeenCalled()
  })

  it('조 목록을 모집 중인 조부터 보여주고, 다른 조의 출발한 조는 진행 상황만 보여준다', async () => {
    render(<ZooLobbyPage />)

    const list = await screen.findByRole('list')
    const rows = within(list).getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('기린조')
    expect(rows[0]).toHaveTextContent('모집 중')
    expect(within(rows[0]).getByRole('link')).toHaveAttribute('href', '/zoo/teams/1')
    expect(rows[1]).toHaveTextContent('호랑이팀')
    expect(rows[1]).toHaveTextContent('출발 2/7')
    expect(within(rows[1]).queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '조 만들기' })).toBeEnabled()
  })

  it('사진 투표로 가는 입구가 있다', async () => {
    render(<ZooLobbyPage />)

    expect(await screen.findByRole('link', { name: /사진 투표/ })).toHaveAttribute('href', '/zoo/photos')
  })

  it('사진 투표가 열리기 전에는 참가자에게 입구를 보여주지 않는다', async () => {
    mockIsVoteOpen = false
    render(<ZooLobbyPage />)

    await screen.findByRole('list')
    expect(screen.queryByRole('link', { name: /사진 투표/ })).not.toBeInTheDocument()
  })

  it('운영자는 사진 투표가 열리기 전에도 미리 들어가 볼 수 있다', async () => {
    mockIsVoteOpen = false
    mockUseAuth.mockReturnValue({ user: { id: 9, name: '운영자', role: 'MASTER' }, isLoggedIn: true })
    render(<ZooLobbyPage />)

    const entry = await screen.findByRole('link', { name: /사진 투표/ })
    expect(entry).toHaveAttribute('href', '/zoo/photos')
    expect(entry).toHaveTextContent('운영자만 미리 볼 수 있어요. 참가자에게는 10월 10일(토) 오후 4:30에 열려요.')
  })

  it('운영자에게만 미션 답 보기 입구를 보여준다', async () => {
    const { unmount } = render(<ZooLobbyPage />)
    await screen.findByRole('list')
    expect(screen.queryByRole('link', { name: /미션 답 보기/ })).not.toBeInTheDocument()
    unmount()

    mockUseAuth.mockReturnValue({ user: { id: 9, name: '운영자', role: 'MASTER' }, isLoggedIn: true })
    render(<ZooLobbyPage />)
    expect(await screen.findByRole('link', { name: /미션 답 보기/ })).toHaveAttribute('href', '/zoo/answers')
  })

  it('운영자는 출발한 조도 열어 볼 수 있다', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 9, name: '운영자', role: 'MASTER' }, isLoggedIn: true })
    render(<ZooLobbyPage />)

    const list = await screen.findByRole('list')
    expect(within(list).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual([
      '/zoo/teams/1',
      '/zoo/teams/2',
    ])
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
