import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ZooMissionPage } from '../ZooMissionPage'
import { fetchZooTeam, submitZooMission } from '../../api/zooTeamApi'
import { getFilePresignedUrl } from '../../../../shared/api'
import { compressImage, uploadToS3 } from '../../../../shared/lib'
import type { ZooTeamDetail, ZooTeamMission } from '../../model/team'

const mockNavigate = jest.fn()
let mockParams: Record<string, string> = { teamId: '4', stopId: 'AFRICA_1' }

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
  useLocation: () => ({ pathname: '/zoo/teams/4/stops/AFRICA_1', search: '' }),
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

jest.mock('../../../../shared/api', () => ({
  ...jest.requireActual('../../../../shared/api'),
  getFilePresignedUrl: jest.fn(),
}))

jest.mock('../../../../shared/lib', () => ({
  ...jest.requireActual('../../../../shared/lib'),
  compressImage: jest.fn(),
  uploadToS3: jest.fn(),
}))

const mockFetchZooTeam = fetchZooTeam as jest.MockedFunction<typeof fetchZooTeam>
const mockSubmitZooMission = submitZooMission as jest.MockedFunction<typeof submitZooMission>
const mockGetFilePresignedUrl = getFilePresignedUrl as jest.MockedFunction<typeof getFilePresignedUrl>
const mockCompressImage = compressImage as jest.MockedFunction<typeof compressImage>
const mockUploadToS3 = uploadToS3 as jest.MockedFunction<typeof uploadToS3>

const LEADER = { userId: 1, name: '박석희', profileImagePath: null, isLeader: true, joinedAt: '2026-10-10T09:00:00' }
const MEMBER = { userId: 2, name: '김철수', profileImagePath: null, isLeader: false, joinedAt: '2026-10-10T09:03:00' }

const SUBMITTED: ZooTeamMission = {
  stopId: 'AFRICA_1',
  answers: [
    { questionId: 'q1', answer: '7개' },
    { questionId: 'q2', answer: '타조' },
  ],
  photoFileId: 9,
  photoPath: 'uploads/old.webp',
  submittedAt: '2026-10-10T10:12:00',
  updatedAt: '2026-10-10T10:12:00',
}

const makeTeam = (overrides: Partial<ZooTeamDetail> = {}): ZooTeamDetail => ({
  id: 4,
  name: '사자팀',
  course: 'A',
  status: 'STARTED',
  leaderUserId: 1,
  members: [LEADER, MEMBER],
  arrivals: [],
  missions: [],
  createdAt: '2026-10-10T09:00:00',
  startedAt: '2026-10-10T09:30:00',
  ...overrides,
})

const loginAs = (id: number, role = 'USER') =>
  mockUseAuth.mockReturnValue({ user: { id, name: `사용자${id}`, role }, isLoggedIn: true })

beforeAll(() => {
  // CRA 설정은 테스트마다 jest.fn 구현을 지우므로 일반 함수로 둔다
  URL.createObjectURL = () => 'blob:preview'
  URL.revokeObjectURL = () => undefined
})

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  mockParams = { teamId: '4', stopId: 'AFRICA_1' }
  loginAs(1)
  mockCompressImage.mockResolvedValue({ blob: new Blob(['small'], { type: 'image/webp' }), originalSize: 5, compressedSize: 5 })
  mockGetFilePresignedUrl.mockResolvedValue({ fileId: 31, presignedUrl: 'https://s3.example.com/uploads/new.webp' })
  mockUploadToS3.mockResolvedValue(undefined)
})

describe('ZooMissionPage', () => {
  it('문제를 먼저 보여주고 사진 미션은 그 뒤에 보여준다', async () => {
    mockFetchZooTeam.mockResolvedValue(makeTeam())
    render(<ZooMissionPage />)

    const questions = await screen.findByRole('heading', { name: '문제' })
    const photo = screen.getByRole('heading', { name: '사진 미션' })

    expect(questions.compareDocumentPosition(photo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole('heading', { name: '제1아프리카관' })).toBeInTheDocument()
    expect(screen.getByText('기린이 보이게 조원 전원이 키 순서로 서서 기린 목 만들어 찍기')).toBeInTheDocument()
  })

  it('사진 찍을 곳을 찾기 쉽도록 안내판 사진을 사진 미션 아래에 보여준다', async () => {
    mockParams = { teamId: '4', stopId: 'BIG_ANIMAL' }
    mockFetchZooTeam.mockResolvedValue(makeTeam())
    render(<ZooMissionPage />)

    const spot = await screen.findByRole('img', { name: '사진 찍을 곳' })
    const photoHeading = screen.getByRole('heading', { name: '사진 미션' })

    expect(spot).toHaveAttribute('src', expect.stringContaining('elephant-foot-care-sign'))
    expect(screen.getByText("이 '코끼리의 발관리' 안내판을 찾아 그 앞에서 찍어요.")).toBeInTheDocument()
    expect(photoHeading.compareDocumentPosition(spot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getAllByRole('textbox')).toHaveLength(3)
  })

  it('조장이 답을 모두 쓰고 사진까지 올려야 낼 수 있고, 내면 조 화면으로 돌아간다', async () => {
    const user = userEvent.setup()
    mockFetchZooTeam.mockResolvedValue(makeTeam())
    mockSubmitZooMission.mockResolvedValue(makeTeam({ missions: [SUBMITTED] }))
    render(<ZooMissionPage />)

    const submit = await screen.findByRole('button', { name: '제출하고 도착 처리하기' })
    expect(submit).toBeDisabled()
    expect(screen.getByText('아직 답하지 않은 문제가 2개 있어요.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('키가 6M나 되는 기린의 목뼈는 몇 개일까요?'), ' 7개 ')
    await user.type(screen.getByLabelText('세상에서 가장 빨리 달리는 새는?'), '타조')
    expect(screen.getByText('사진 미션까지 하면 낼 수 있어요.')).toBeInTheDocument()
    expect(submit).toBeDisabled()

    await user.upload(screen.getByLabelText('미션 사진 고르기'), new File(['photo'], 'giraffe.jpg', { type: 'image/jpeg' }))
    await waitFor(() => expect(submit).toBeEnabled())

    await user.click(submit)

    expect(mockSubmitZooMission).toHaveBeenCalledWith(4, 'AFRICA_1', {
      answers: [
        { questionId: 'q1', answer: '7개' },
        { questionId: 'q2', answer: '타조' },
      ],
      photoFileId: 31,
    })
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/zoo/teams/4', { replace: true }))
  })

  it('O/X 문제는 버튼으로 고르고, 고른 값이 답으로 나간다', async () => {
    const user = userEvent.setup()
    mockParams = { teamId: '4', stopId: 'BEAR' }
    mockFetchZooTeam.mockResolvedValue(makeTeam())
    mockSubmitZooMission.mockResolvedValue(makeTeam())
    render(<ZooMissionPage />)

    const oButton = await screen.findByRole('button', { name: 'O' })
    const xButton = screen.getByRole('button', { name: 'X' })
    expect(screen.getAllByRole('textbox')).toHaveLength(1)

    await user.type(screen.getByLabelText('곰탱이의 뜻은 무엇인가요?'), '미련한 사람')
    await user.click(oButton)
    await user.click(xButton)
    expect(xButton).toHaveAttribute('aria-pressed', 'true')
    expect(oButton).toHaveAttribute('aria-pressed', 'false')

    await user.upload(screen.getByLabelText('미션 사진 고르기'), new File(['photo'], 'bear.jpg', { type: 'image/jpeg' }))
    const submit = screen.getByRole('button', { name: '제출하고 도착 처리하기' })
    await waitFor(() => expect(submit).toBeEnabled())
    await user.click(submit)

    expect(mockSubmitZooMission).toHaveBeenCalledWith(4, 'BEAR', {
      answers: [
        { questionId: 'q1', answer: '미련한 사람' },
        { questionId: 'q2', answer: 'X' },
      ],
      photoFileId: 31,
    })
  })

  it('이미 낸 미션은 낸 답과 사진으로 열리고, 사진을 다시 올리지 않고 답만 고칠 수 있다', async () => {
    const user = userEvent.setup()
    mockFetchZooTeam.mockResolvedValue(makeTeam({ missions: [SUBMITTED], arrivals: [{ stopId: 'AFRICA_1', arrivedAt: '2026-10-10T10:12:00' }] }))
    mockSubmitZooMission.mockResolvedValue(makeTeam({ missions: [SUBMITTED] }))
    render(<ZooMissionPage />)

    const firstAnswer = await screen.findByLabelText('키가 6M나 되는 기린의 목뼈는 몇 개일까요?')
    expect(firstAnswer).toHaveValue('7개')
    expect(screen.getByRole('img', { name: '미션 사진' })).toHaveAttribute('src', expect.stringContaining('uploads/old.webp'))

    await user.clear(firstAnswer)
    await user.type(firstAnswer, '7개예요')
    await user.click(screen.getByRole('button', { name: '고친 내용 저장하기' }))

    expect(mockSubmitZooMission).toHaveBeenCalledWith(4, 'AFRICA_1', {
      answers: [
        { questionId: 'q1', answer: '7개예요' },
        { questionId: 'q2', answer: '타조' },
      ],
      photoFileId: 9,
    })
  })

  it('조원은 문제와 조장이 낸 답·사진을 보기만 한다', async () => {
    loginAs(2)
    mockFetchZooTeam.mockResolvedValue(makeTeam({ missions: [SUBMITTED] }))
    render(<ZooMissionPage />)

    expect(await screen.findByText('조장이 낸 답과 사진이에요.')).toBeInTheDocument()
    expect(screen.getByText('7개')).toBeInTheDocument()
    expect(screen.getByText('타조')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '조장이 올린 미션 사진' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /제출/ })).not.toBeInTheDocument()
  })

  it('조원은 조장이 내기 전에도 문제를 미리 볼 수 있다', async () => {
    loginAs(2)
    mockFetchZooTeam.mockResolvedValue(makeTeam())
    render(<ZooMissionPage />)

    expect(await screen.findByText('조장이 답과 사진을 내면 여기에 보여요. 문제를 같이 풀어 보세요.')).toBeInTheDocument()
    expect(screen.getByText('세상에서 가장 빨리 달리는 새는?')).toBeInTheDocument()
    expect(screen.getByText('조장이 사진을 올리면 여기에 보여요.')).toBeInTheDocument()
  })

  it('조원이 아니면 미션을 볼 수 없다', async () => {
    loginAs(3)
    mockFetchZooTeam.mockResolvedValue(makeTeam())
    render(<ZooMissionPage />)

    expect(await screen.findByText('미션은 이 조의 조원만 볼 수 있어요.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '문제' })).not.toBeInTheDocument()
  })

  it('출발 전에는 미션을 할 수 없다', async () => {
    mockFetchZooTeam.mockResolvedValue(makeTeam({ status: 'RECRUITING', startedAt: null }))
    render(<ZooMissionPage />)

    expect(await screen.findByText('조장이 마감하고 출발하면 미션을 할 수 있어요.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '조 화면으로' })).toHaveAttribute('href', '/zoo/teams/4')
  })

  it('없는 장소 주소면 조 목록으로 안내한다', () => {
    mockParams = { teamId: '4', stopId: 'PENGUIN' }
    render(<ZooMissionPage />)

    expect(screen.getByRole('heading', { name: '조를 찾을 수 없어요' })).toBeInTheDocument()
    expect(mockFetchZooTeam).not.toHaveBeenCalled()
  })
})
