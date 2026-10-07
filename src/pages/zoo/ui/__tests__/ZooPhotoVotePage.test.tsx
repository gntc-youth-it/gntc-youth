import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ZooPhotoVotePage } from '../ZooPhotoVotePage'
import { HttpError } from '../../../../shared/api'
import { fetchZooPhotoResults, fetchZooPhotos, voteZooPhoto } from '../../api/zooPhotoApi'
import { groupByStop, orderForViewer } from '../../model/photo'
import type { ZooPhoto } from '../../model/photo'

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/zoo/photos', search: '' }),
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

jest.mock('../../api/zooPhotoApi')

const mockFetchZooPhotos = fetchZooPhotos as jest.MockedFunction<typeof fetchZooPhotos>
const mockFetchZooPhotoResults = fetchZooPhotoResults as jest.MockedFunction<typeof fetchZooPhotoResults>
const mockVoteZooPhoto = voteZooPhoto as jest.MockedFunction<typeof voteZooPhoto>

const VIEWER_ID = 2

const makePhoto = (overrides: Partial<ZooPhoto>): ZooPhoto => ({
  id: 12,
  stopId: 'AFRICA_1',
  teamId: 4,
  teamName: '사자팀',
  photoPath: 'uploads/lion.webp',
  submittedAt: '2026-10-10T10:12:00',
  updatedAt: '2026-10-10T10:12:00',
  isMyTeam: false,
  isVoted: false,
  ...overrides,
})

const PHOTOS: ZooPhoto[] = [
  makePhoto({ id: 12 }),
  makePhoto({ id: 13, teamId: 5, teamName: '기린조', photoPath: 'uploads/giraffe.webp', isMyTeam: true }),
  makePhoto({ id: 14, stopId: 'AUSTRALIA', photoPath: 'uploads/jump.webp', isVoted: true }),
]

// 화면은 장소 순서로 묶은 뒤 사람마다 섞은 순서로 보여준다
const DISPLAY_ORDER = groupByStop(orderForViewer(PHOTOS, VIEWER_ID)).flatMap((group) => group.items)

const loginAs = (id: number, role = 'USER') =>
  mockUseAuth.mockReturnValue({ user: { id, name: `사용자${id}`, role }, isLoggedIn: true })

const getMyVoteBar = () => screen.getByRole('complementary', { name: '내 투표' })

beforeEach(() => {
  jest.clearAllMocks()
  loginAs(VIEWER_ID)
  mockFetchZooPhotos.mockResolvedValue({ photos: PHOTOS })
  mockVoteZooPhoto.mockResolvedValue(undefined)
})

describe('ZooPhotoVotePage', () => {
  it('로그인 전에는 로그인을 안내한다', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false })
    render(<ZooPhotoVotePage />)

    expect(screen.getByRole('heading', { name: '사진 투표' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '카카오로 로그인하기' })).toBeInTheDocument()
    expect(mockFetchZooPhotos).not.toHaveBeenCalled()
  })

  it('장소별로 사진 미션과 사진을 보여주고, 우리 조 사진에는 하트 대신 우리 조라고 표시한다', async () => {
    render(<ZooPhotoVotePage />)

    expect(await screen.findByRole('heading', { name: '제1아프리카관' })).toBeInTheDocument()
    expect(screen.getByText('기린이 보이게 조원 전원이 키 순서로 서서 기린 목 만들어 찍기')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '호주관' })).toBeInTheDocument()

    expect(screen.getByRole('button', { name: '사자팀 제1아프리카관 사진에 투표' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: '사자팀 호주관 사진에 투표' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('button', { name: '기린조 제1아프리카관 사진에 투표' })).not.toBeInTheDocument()
    expect(screen.getByText('우리 조')).toBeInTheDocument()
    expect(within(getMyVoteBar()).getByText('내가 고른 사진 1장')).toBeInTheDocument()
  })

  it('참가자에게는 득표 수와 결과 보기가 보이지 않는다', async () => {
    render(<ZooPhotoVotePage />)

    await screen.findByRole('heading', { name: '제1아프리카관' })
    expect(screen.queryByRole('button', { name: '결과 보기' })).not.toBeInTheDocument()
    expect(screen.queryByText(/\d+표/)).not.toBeInTheDocument()
    expect(mockFetchZooPhotoResults).not.toHaveBeenCalled()
  })

  it('하트를 누르면 투표하고 내가 고른 사진 수가 늘어난다', async () => {
    const user = userEvent.setup()
    render(<ZooPhotoVotePage />)

    await user.click(await screen.findByRole('button', { name: '사자팀 제1아프리카관 사진에 투표' }))

    expect(mockVoteZooPhoto).toHaveBeenCalledWith(12)
    expect(screen.getByRole('button', { name: '사자팀 제1아프리카관 사진에 투표' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(getMyVoteBar()).getByText('내가 고른 사진 2장')).toBeInTheDocument()
  })

  it('투표에 실패하면 하트를 되돌리고 이유를 알려준다', async () => {
    mockVoteZooPhoto.mockRejectedValue(new HttpError(403, '우리 조 사진에는 투표할 수 없어요.', 5010))
    const user = userEvent.setup()
    render(<ZooPhotoVotePage />)

    await user.click(await screen.findByRole('button', { name: '사자팀 제1아프리카관 사진에 투표' }))

    expect(await within(getMyVoteBar()).findByRole('alert')).toHaveTextContent('우리 조 사진에는 투표할 수 없어요.')
    expect(screen.getByRole('button', { name: '사자팀 제1아프리카관 사진에 투표' })).toHaveAttribute('aria-pressed', 'false')
    await waitFor(() => expect(mockFetchZooPhotos).toHaveBeenCalledTimes(2))
  })

  it('장소를 고르면 그 장소 사진만 보여준다', async () => {
    const user = userEvent.setup()
    render(<ZooPhotoVotePage />)

    await user.click(await screen.findByRole('button', { name: /^호주관/ }))

    expect(screen.getByRole('heading', { name: '호주관' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '제1아프리카관' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^제2아프리카관/ })).toBeDisabled()
  })

  it('사진을 누르면 크게 보고, 그 자리에서 투표하고, 옆 사진으로 넘겨 본다', async () => {
    const user = userEvent.setup()
    render(<ZooPhotoVotePage />)
    const [first, second] = DISPLAY_ORDER
    const stopName = (photo: ZooPhoto) => (photo.stopId === 'AFRICA_1' ? '제1아프리카관' : '호주관')

    await user.click(await screen.findByRole('button', { name: `${first.teamName} ${stopName(first)} 사진 크게 보기` }))

    const viewer = screen.getByRole('dialog')
    expect(within(viewer).getByRole('heading', { name: first.teamName })).toBeInTheDocument()
    expect(within(viewer).getByText('1 / 3')).toBeInTheDocument()

    await user.click(within(viewer).getByRole('button', { name: '다음 사진' }))
    expect(within(viewer).getByText('2 / 3')).toBeInTheDocument()
    expect(within(viewer).getByRole('img')).toHaveAttribute('alt', `${second.teamName} ${stopName(second)} 미션 사진`)

    // 오른쪽으로 밀면 앞 사진으로 돌아간다
    const stage = within(viewer).getByRole('img').parentElement as HTMLElement
    fireEvent.touchStart(stage, { touches: [{ clientX: 100 }], changedTouches: [{ clientX: 100 }] })
    fireEvent.touchEnd(stage, { touches: [], changedTouches: [{ clientX: 220 }] })
    expect(within(viewer).getByText('1 / 3')).toBeInTheDocument()
  })

  it('크게 본 사진에서 바로 투표할 수 있고, 우리 조 사진은 투표할 수 없다고 알려준다', async () => {
    const user = userEvent.setup()
    render(<ZooPhotoVotePage />)

    await user.click(await screen.findByRole('button', { name: '사자팀 제1아프리카관 사진 크게 보기' }))
    const viewer = screen.getByRole('dialog')
    await user.click(within(viewer).getByRole('button', { name: '투표하기' }))

    expect(mockVoteZooPhoto).toHaveBeenCalledWith(12)
    expect(within(viewer).getByRole('button', { name: '투표했어요' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(within(viewer).getByRole('button', { name: '닫기' }))
    await user.click(screen.getByRole('button', { name: '기린조 제1아프리카관 사진 크게 보기' }))
    expect(within(screen.getByRole('dialog')).getByText('우리 조 사진에는 투표할 수 없어요')).toBeInTheDocument()
  })

  it('운영자는 결과 보기에서 장소별 득표 순위를 본다', async () => {
    loginAs(1, 'MASTER')
    mockFetchZooPhotoResults.mockResolvedValue({
      voterCount: 37,
      photos: [
        { id: 13, stopId: 'AFRICA_1', teamId: 5, teamName: '기린조', photoPath: 'uploads/giraffe.webp', voteCount: 3 },
        { id: 12, stopId: 'AFRICA_1', teamId: 4, teamName: '사자팀', photoPath: 'uploads/lion.webp', voteCount: 9 },
        { id: 14, stopId: 'AUSTRALIA', teamId: 4, teamName: '사자팀', photoPath: 'uploads/jump.webp', voteCount: 0 },
      ],
    })
    const user = userEvent.setup()
    render(<ZooPhotoVotePage />)

    await user.click(screen.getByRole('button', { name: '결과 보기' }))

    expect(await screen.findByText('37명')).toBeInTheDocument()
    const africa = screen.getByRole('region', { name: '제1아프리카관' })
    const rows = within(africa).getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('1사자팀9표')
    expect(rows[1]).toHaveTextContent('2기린조3표')
    expect(within(screen.getByRole('region', { name: '호주관' })).getByText('0표')).toBeInTheDocument()
    expect(mockFetchZooPhotoResults).toHaveBeenCalledTimes(1)
  })

  it('아직 사진이 없으면 안내한다', async () => {
    mockFetchZooPhotos.mockResolvedValue({ photos: [] })
    render(<ZooPhotoVotePage />)

    expect(await screen.findByText(/아직 올라온 사진이 없어요/)).toBeInTheDocument()
    expect(screen.queryByRole('complementary', { name: '내 투표' })).not.toBeInTheDocument()
  })

  it('불러오지 못하면 다시 불러올 수 있다', async () => {
    mockFetchZooPhotos.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const user = userEvent.setup()
    render(<ZooPhotoVotePage />)

    await user.click(await screen.findByRole('button', { name: '다시 불러오기' }))

    expect(await screen.findByRole('heading', { name: '제1아프리카관' })).toBeInTheDocument()
  })
})
