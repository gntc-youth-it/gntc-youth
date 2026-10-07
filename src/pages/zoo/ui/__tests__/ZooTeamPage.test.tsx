import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ZooTeamPage } from '../ZooTeamPage'
import { HttpError } from '../../../../shared/api'
import {
  fetchZooTeam,
  joinZooTeam,
  leaveZooTeam,
  startZooTeam,
} from '../../api/zooTeamApi'
import { COURSE_STOP_IDS } from '../../model/course'
import type { ZooTeamDetail } from '../../model/team'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ teamId: '4' }),
  useLocation: () => ({ pathname: '/zoo/teams/4', search: '' }),
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

const mockFetchZooTeam = fetchZooTeam as jest.MockedFunction<typeof fetchZooTeam>
const mockJoinZooTeam = joinZooTeam as jest.MockedFunction<typeof joinZooTeam>
const mockLeaveZooTeam = leaveZooTeam as jest.MockedFunction<typeof leaveZooTeam>
const mockStartZooTeam = startZooTeam as jest.MockedFunction<typeof startZooTeam>

const LEADER = { userId: 1, name: '박석희', profileImagePath: null, isLeader: true, joinedAt: '2026-10-10T09:00:00' }
const MEMBER = { userId: 2, name: '김철수', profileImagePath: null, isLeader: false, joinedAt: '2026-10-10T09:03:00' }

const makeTeam = (overrides: Partial<ZooTeamDetail> = {}): ZooTeamDetail => ({
  id: 4,
  name: '사자팀',
  course: 'A',
  status: 'RECRUITING',
  leaderUserId: 1,
  members: [LEADER, MEMBER],
  arrivals: [],
  createdAt: '2026-10-10T09:00:00',
  startedAt: null,
  ...overrides,
})

const loginAs = (id: number, role = 'USER') =>
  mockUseAuth.mockReturnValue({ user: { id, name: `사용자${id}`, role }, isLoggedIn: true })

const getNextStopBar = () => screen.getByRole('complementary', { name: '다음 목적지 안내' })

let confirmSpy: jest.SpyInstance

beforeEach(() => {
  jest.clearAllMocks()
  confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
  loginAs(1)
})

afterEach(() => {
  confirmSpy.mockRestore()
})

describe('ZooTeamPage', () => {
  it('로그인 전에는 로그인을 안내한다', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false })
    render(<ZooTeamPage />)

    expect(screen.getByRole('button', { name: '카카오로 로그인하기' })).toBeInTheDocument()
    expect(mockFetchZooTeam).not.toHaveBeenCalled()
  })

  it('없는 조면 조 목록으로 안내한다', async () => {
    mockFetchZooTeam.mockRejectedValue(new HttpError(404, '조를 찾을 수 없어요.', 5001))
    render(<ZooTeamPage />)

    expect(await screen.findByRole('heading', { name: '조를 찾을 수 없어요' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '조 목록으로' })).toHaveAttribute('href', '/zoo')
  })

  describe('모집 중', () => {
    it('조장은 마감하고 출발할 수 있고, 출발하면 코스 화면으로 바뀐다', async () => {
      const user = userEvent.setup()
      mockFetchZooTeam.mockResolvedValue(makeTeam())
      mockStartZooTeam.mockResolvedValue(makeTeam({ status: 'STARTED', startedAt: '2026-10-10T10:00:00' }))
      render(<ZooTeamPage />)

      await user.click(await screen.findByRole('button', { name: '마감하고 출발하기' }))

      expect(confirmSpy).toHaveBeenCalled()
      expect(mockStartZooTeam).toHaveBeenCalledWith(4)
      expect(within(getNextStopBar()).getByText('제1아프리카관')).toBeInTheDocument()
      expect(within(getNextStopBar()).getByRole('link', { name: '미션 하기' })).toHaveAttribute('href', '/zoo/teams/4/stops/AFRICA_1')
    })

    it('조장은 다른 조원에게 조장을 넘길 수 있다', async () => {
      mockFetchZooTeam.mockResolvedValue(makeTeam())
      render(<ZooTeamPage />)

      expect(await screen.findByRole('button', { name: '김철수에게 조장 넘기기' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /B코스/ })).toBeInTheDocument()
    })

    it('조원은 나갈 수 있고 나가면 조 목록으로 돌아간다', async () => {
      const user = userEvent.setup()
      loginAs(2)
      mockFetchZooTeam.mockResolvedValue(makeTeam())
      mockLeaveZooTeam.mockResolvedValue(undefined)
      render(<ZooTeamPage />)

      expect(await screen.findByText('조장이 마감하면 다 같이 출발해요.')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: '마감하고 출발하기' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /조장 넘기기/ })).not.toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: '나가기' }))

      expect(mockLeaveZooTeam).toHaveBeenCalledWith(4)
      expect(mockNavigate).toHaveBeenCalledWith('/zoo', { replace: true })
    })

    it('조원이 아니면 참여할 수 있다', async () => {
      const user = userEvent.setup()
      loginAs(3)
      mockFetchZooTeam.mockResolvedValue(makeTeam())
      mockJoinZooTeam.mockResolvedValue(
        makeTeam({
          members: [LEADER, MEMBER, { userId: 3, name: '이영희', profileImagePath: null, isLeader: false, joinedAt: '2026-10-10T09:10:00' }],
        })
      )
      render(<ZooTeamPage />)

      await user.click(await screen.findByRole('button', { name: '이 조에 참여하기' }))

      expect(mockJoinZooTeam).toHaveBeenCalledWith(4)
      expect(screen.getByRole('heading', { name: '조원 3명' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '나가기' })).toBeInTheDocument()
    })

    it('이미 다른 조에 있으면 이유와 함께 내 조로 가는 길을 알려준다', async () => {
      const user = userEvent.setup()
      loginAs(3)
      mockFetchZooTeam.mockResolvedValue(makeTeam())
      mockJoinZooTeam.mockRejectedValue(new HttpError(409, '이미 다른 조에 참여 중이에요.', 5002))
      render(<ZooTeamPage />)

      await user.click(await screen.findByRole('button', { name: '이 조에 참여하기' }))

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('이미 다른 조에 참여 중이에요.')
      expect(within(alert).getByRole('link', { name: '내 조로 가기' })).toHaveAttribute('href', '/zoo')
    })
  })

  describe('출발 후', () => {
    const startedTeam = makeTeam({
      status: 'STARTED',
      startedAt: '2026-10-10T10:00:00',
      arrivals: [{ stopId: 'AFRICA_1', arrivedAt: '2026-10-10T10:12:00' }],
    })

    it('조장은 다음 장소의 미션을 하러 갈 수 있고, 낸 장소는 다시 열어 고칠 수 있다', async () => {
      mockFetchZooTeam.mockResolvedValue(startedTeam)
      render(<ZooTeamPage />)

      const bar = await screen.findByRole('complementary', { name: '다음 목적지 안내' })
      expect(within(bar).getByText('호주관')).toBeInTheDocument()
      expect(within(bar).getByRole('link', { name: '미션 하기' })).toHaveAttribute('href', '/zoo/teams/4/stops/AUSTRALIA')
      expect(screen.getByRole('link', { name: '제1아프리카관 제출 내용 고치기' })).toHaveAttribute(
        'href',
        '/zoo/teams/4/stops/AFRICA_1'
      )
      expect(screen.getByRole('link', { name: '호주관 미션 하기' })).toHaveAttribute('href', '/zoo/teams/4/stops/AUSTRALIA')
    })

    it('7곳을 다 돌면 오후 4:30까지 정문으로 모이라고 안내한다', async () => {
      loginAs(2)
      mockFetchZooTeam.mockResolvedValue({
        ...startedTeam,
        arrivals: COURSE_STOP_IDS.A.map((stopId) => ({ stopId, arrivedAt: '2026-10-10T15:00:00' })),
      })
      render(<ZooTeamPage />)

      const bar = await screen.findByRole('complementary', { name: '다음 목적지 안내' })
      expect(within(bar).getByText('7곳 모두 돌았어요')).toBeInTheDocument()
      expect(within(bar).getByText('정문으로 모여주세요')).toBeInTheDocument()
      expect(within(bar).getByText('오후 4:30까지 동물원 정문으로 모여주세요. 단체사진을 찍어요.')).toBeInTheDocument()
      expect(screen.getByText('정문에 모여요')).toBeInTheDocument()
    })

    it('조원은 문제와 낸 내용을 보기만 한다', async () => {
      loginAs(2)
      mockFetchZooTeam.mockResolvedValue(startedTeam)
      render(<ZooTeamPage />)

      const bar = await screen.findByRole('complementary', { name: '다음 목적지 안내' })
      expect(within(bar).getByText('호주관')).toBeInTheDocument()
      expect(within(bar).getByText('조장이 답과 사진을 내면 모두의 화면이 함께 바뀌어요.')).toBeInTheDocument()
      expect(within(bar).getByRole('link', { name: '문제 보기' })).toHaveAttribute('href', '/zoo/teams/4/stops/AUSTRALIA')
      expect(screen.queryByRole('link', { name: /미션 하기/ })).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: '제1아프리카관 제출 내용 보기' })).toBeInTheDocument()
    })

    it('조원이 아니면 출발한 조의 코스 화면을 볼 수 없다', async () => {
      loginAs(3)
      mockFetchZooTeam.mockResolvedValue(startedTeam)
      render(<ZooTeamPage />)

      expect(await screen.findByText('이미 출발한 조라 새로 들어갈 수 없어요. 코스 화면은 이 조의 조원만 볼 수 있어요.')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: '조 목록으로' })).toHaveAttribute('href', '/zoo')
      expect(screen.queryByRole('complementary', { name: '다음 목적지 안내' })).not.toBeInTheDocument()
      expect(screen.queryByRole('img', { name: /코스 지도/ })).not.toBeInTheDocument()
    })

    it('운영자는 조장이 아니어도 대신 미션을 낼 수 있다', async () => {
      loginAs(9, 'MASTER')
      mockFetchZooTeam.mockResolvedValue(startedTeam)
      render(<ZooTeamPage />)

      const bar = await screen.findByRole('complementary', { name: '다음 목적지 안내' })
      expect(within(bar).getByRole('link', { name: '미션 하기' })).toBeInTheDocument()
      expect(screen.getByText(/운영자 권한으로 조장 대신/)).toBeInTheDocument()
    })
  })
})
