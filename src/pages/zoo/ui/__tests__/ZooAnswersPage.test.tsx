import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ZooAnswersPage } from '../ZooAnswersPage'
import { HttpError } from '../../../../shared/api'
import { fetchZooMissionResults } from '../../api/zooTeamApi'
import { downloadTextFile } from '../../lib/downloadFile'
import type { ZooMissionTeamResult, ZooTeamMission } from '../../model/team'

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/zoo/answers', search: '' }),
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
jest.mock('../../lib/downloadFile')

const mockFetchZooMissionResults = fetchZooMissionResults as jest.MockedFunction<typeof fetchZooMissionResults>
const mockDownloadTextFile = downloadTextFile as jest.MockedFunction<typeof downloadTextFile>

const makeMission = (stopId: ZooTeamMission['stopId'], answers: string[], overrides: Partial<ZooTeamMission> = {}): ZooTeamMission => ({
  stopId,
  answers: answers.map((answer, index) => ({ questionId: `q${index + 1}`, answer })),
  photoFileId: 1,
  photoPath: `uploads/${stopId}.webp`,
  submittedAt: '2026-10-10T10:12:00',
  updatedAt: '2026-10-10T10:12:00',
  ...overrides,
})

const TEAMS: ZooMissionTeamResult[] = [
  {
    id: 4,
    name: '사자팀',
    course: 'A',
    status: 'STARTED',
    leaderName: '박석희',
    members: ['박석희', '김철수'],
    missions: [
      makeMission('AFRICA_1', ['7개', '타조'], { updatedAt: '2026-10-10T10:20:00' }),
      makeMission('AUSTRALIA', ['50km', '화식조'], { submittedAt: '2026-10-10T10:40:00', updatedAt: '2026-10-10T10:40:00' }),
    ],
  },
  {
    id: 5,
    name: '기린조',
    course: 'B',
    status: 'STARTED',
    leaderName: '이영희',
    members: ['이영희'],
    missions: [makeMission('AFRICA_2', ['초식동물', '36개', '냄새'])],
  },
  { id: 6, name: '대기조', course: 'A', status: 'RECRUITING', leaderName: '최민수', members: ['최민수'], missions: [] },
]

const loginAs = (id: number, role: string) =>
  mockUseAuth.mockReturnValue({ user: { id, name: `사용자${id}`, role }, isLoggedIn: true })

beforeEach(() => {
  jest.clearAllMocks()
  loginAs(1, 'MASTER')
  mockFetchZooMissionResults.mockResolvedValue({ teams: TEAMS })
})

describe('ZooAnswersPage', () => {
  it('로그인 전에는 로그인을 안내한다', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false })
    render(<ZooAnswersPage />)

    expect(screen.getByRole('button', { name: '카카오로 로그인하기' })).toBeInTheDocument()
    expect(mockFetchZooMissionResults).not.toHaveBeenCalled()
  })

  it('운영자가 아니면 볼 수 없고 답을 불러오지도 않는다', () => {
    loginAs(2, 'USER')
    render(<ZooAnswersPage />)

    expect(screen.getByText('운영자만 볼 수 있어요.')).toBeInTheDocument()
    expect(mockFetchZooMissionResults).not.toHaveBeenCalled()
  })

  it('서버가 운영자 권한이 없다고 하면 볼 수 없다고 알려준다', async () => {
    mockFetchZooMissionResults.mockRejectedValue(new HttpError(403, '운영자만 볼 수 있어요.', 5008))
    render(<ZooAnswersPage />)

    expect(await screen.findByText('운영자만 볼 수 있어요.')).toBeInTheDocument()
  })

  it('조마다 몇 곳을 냈는지 보여주고, 출발 전인 조는 따로 표시한다', async () => {
    render(<ZooAnswersPage />)

    expect(await screen.findByRole('progressbar', { name: '사자팀 7곳 중 2곳 제출' })).toHaveAttribute('aria-valuenow', '2')
    expect(screen.getByRole('progressbar', { name: '기린조 7곳 중 1곳 제출' })).toHaveAttribute('aria-valuenow', '1')
    expect(screen.getByText('출발 전')).toBeInTheDocument()
  })

  it('문제별로 모든 조의 답을 나란히 보여주고, 안 낸 조는 따로 표시한다', async () => {
    render(<ZooAnswersPage />)

    const africa = await screen.findByRole('region', { name: '제1아프리카관' })
    expect(within(africa).getByText('2개 조 중 1개 조 제출')).toBeInTheDocument()

    const firstQuestion = within(africa).getByRole('list', { name: '1번 문제 조별 답' })
    const rows = within(firstQuestion).getAllByRole('listitem')
    expect(rows.map((row) => row.textContent)).toEqual(['기린조아직 안 냈어요', '사자팀7개'])
    expect(within(africa).getByRole('link', { name: '사자팀 제1아프리카관 사진 원본 보기' })).toHaveAttribute(
      'href',
      expect.stringContaining('uploads/AFRICA_1.webp')
    )
  })

  it('장소를 고르면 그 장소의 문제만 보여준다', async () => {
    const user = userEvent.setup()
    render(<ZooAnswersPage />)

    await user.click(await screen.findByRole('button', { name: /^제2아프리카관/ }))

    const africa2 = screen.getByRole('region', { name: '제2아프리카관' })
    expect(within(africa2).getByText('36개')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '제1아프리카관' })).not.toBeInTheDocument()
  })

  it('조별로 보면 그 조가 지나온 순서대로 장소마다 낸 답과 시각을 보여준다', async () => {
    const user = userEvent.setup()
    render(<ZooAnswersPage />)

    await user.click(await screen.findByRole('button', { name: '조별' }))
    const lionTeam = screen.getByText('조장 박석희 · 2명').closest('details') as HTMLElement
    await user.click(within(lionTeam).getByText('조장 박석희 · 2명'))

    expect(within(lionTeam).getByText('2/7곳')).toBeInTheDocument()
    expect(within(lionTeam).getByText('1. 제1아프리카관')).toBeInTheDocument()
    expect(within(lionTeam).getByText('10:12 제출 · 10:20 수정')).toBeInTheDocument()
    expect(within(lionTeam).getByText('10:40 제출')).toBeInTheDocument()
    expect(within(lionTeam).getByText('화식조')).toBeInTheDocument()
    expect(within(lionTeam).getAllByText('아직 안 냈어요')).toHaveLength(5)
  })

  it('새로고침이 실패하면 보던 답은 그대로 두고 언제 불러온 내용인지 알려준다', async () => {
    const user = userEvent.setup()
    render(<ZooAnswersPage />)
    await screen.findByRole('region', { name: '제1아프리카관' })

    mockFetchZooMissionResults.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await user.click(screen.getByRole('button', { name: '새로고침' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/새로 불러오지 못했어요\. \d{2}:\d{2}:\d{2}에 불러온 내용이에요\./)
    expect(screen.getByRole('region', { name: '제1아프리카관' })).toBeInTheDocument()
  })

  it('엑셀로 내려받으면 모든 조의 답을 담은 CSV 파일을 만든다', async () => {
    const user = userEvent.setup()
    render(<ZooAnswersPage />)

    await user.click(await screen.findByRole('button', { name: '엑셀로 내려받기' }))

    expect(mockDownloadTextFile).toHaveBeenCalledTimes(1)
    const [content, fileName, type] = mockDownloadTextFile.mock.calls[0]
    expect(content).toContain('사자팀,A코스,박석희')
    expect(content).toContain('7개')
    expect(fileName).toMatch(/^동물원-미션-답-\d{8}-\d{4}\.csv$/)
    expect(type).toBe('text/csv;charset=utf-8')
  })
})
