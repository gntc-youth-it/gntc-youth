import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { fetchCellStats, fetchCells } from '../../api/thanksApi'
import type { ThanksCellMemberStats } from '../../model/types'
import { CellStatusPage } from '../CellStatusPage'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/thanks/cell', search: '', state: null }),
  Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

let mockUser: { id: number; name: string; role?: string } | null = null

jest.mock('../../../../features/auth', () => ({
  useAuth: () => ({ user: mockUser }),
  getUserInfoFromToken: () => null,
}))

jest.mock('../../api/thanksApi', () => ({
  fetchCells: jest.fn(),
  chooseCell: jest.fn(),
  fetchCellStats: jest.fn(),
}))

const mockFetchCells = fetchCells as jest.MockedFunction<typeof fetchCells>
const mockFetchCellStats = fetchCellStats as jest.MockedFunction<typeof fetchCellStats>

const cells = [
  { id: 1, name: '할렐루야구역' },
  { id: 9, name: '샬롬구역' },
]

const member = (
  userId: number,
  name: string,
  lastPostedAt: string | null,
  dailyCounts: ThanksCellMemberStats['dailyCounts'] = []
): ThanksCellMemberStats => ({ user: { userId, name, profileImageUrl: null }, lastPostedAt, dailyCounts })

// 지금은 2026-11-09 13:20(KST), 04:20(UTC)이다
const noRecord = member(3, '이서준', null)
const me = member(1, '정은혜', '2026-11-08T03:00:00', [{ date: '2026-11-08', count: 3 }])
const recent = member(2, '김하늘', '2026-11-09T04:10:00', [
  // 최근 14일 밖의 기록도 센다
  { date: '2026-10-01', count: 15 },
  { date: '2026-11-09', count: 2 },
])
const members = [noRecord, me, recent]

const rowOf = (name: string) => screen.getByText(name).closest('li') as HTMLElement

beforeEach(() => {
  jest.clearAllMocks()
  mockUser = { id: 1, name: '정은혜', role: 'USER' }
  mockFetchCells.mockResolvedValue({ cells, myCellId: 1 })
  mockFetchCellStats.mockResolvedValue({ cellId: 1, members })
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2026-11-09T13:20:00+09:00'))
})

afterEach(() => {
  jest.useRealTimers()
})

describe('CellStatusPage', () => {
  it('구역 이름과 구역 전체 숫자를 보여 준다', async () => {
    render(<CellStatusPage />)

    expect(await screen.findByRole('heading', { name: '할렐루야구역' })).toBeInTheDocument()
    expect(await screen.findByText('참여')).toBeInTheDocument()
    expect(screen.getByText('참여').parentElement).toHaveTextContent('참여3명')
    expect(screen.getByText('감사 기록').parentElement).toHaveTextContent('감사 기록20개')
    expect(mockFetchCellStats).toHaveBeenCalledWith(1)
  })

  it('사람마다 전체 개수와 최근 14일 칸을 보여 주고, 오늘 칸은 그날 개수만큼 진하다', async () => {
    render(<CellStatusPage />)
    await screen.findByText('김하늘')

    const row = rowOf('김하늘')
    expect(row).toHaveTextContent('10분 전')
    expect(row).toHaveTextContent('17개')
    const strip = within(row).getByRole('img', { name: '최근 14일: 11월 9일 (월) 2개' })
    expect(within(strip).getAllByTitle(/개$/)).toHaveLength(14)
    expect(within(strip).getByTitle('11월 9일 (월) 2개')).toHaveClass('thanks-heat-2')
    expect(within(strip).getByTitle('11월 8일 (일) 0개')).toHaveClass('thanks-heat-0')
  })

  it('구역은 골랐지만 안 올린 사람도 0개로 보여 준다', async () => {
    render(<CellStatusPage />)
    await screen.findByText('이서준')

    const row = rowOf('이서준')
    expect(row).toHaveTextContent('아직 올리기 전')
    expect(row).toHaveTextContent('0개')
    expect(within(row).getByRole('img', { name: '최근 14일 기록 없음' })).toBeInTheDocument()
  })

  it('명단은 최근에 올린 사람부터 보여 주고, 지난 기록은 며칠 전인지 보여 주며, 나를 표시한다', async () => {
    render(<CellStatusPage />)
    await screen.findByText('김하늘')

    const rows = screen.getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('김하늘')
    expect(rows[1]).toHaveTextContent('정은혜')
    expect(rows[2]).toHaveTextContent('이서준')
    expect(rows[1]).toHaveTextContent('나')
    expect(rows[1]).toHaveTextContent('1일 전')
  })

  it('일반 사용자에게는 다른 구역을 고르는 칸이 없다', async () => {
    render(<CellStatusPage />)
    await screen.findByText('김하늘')

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('MASTER는 다른 구역을 골라 볼 수 있다', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    mockUser = { id: 1, name: '정은혜', role: 'MASTER' }
    render(<CellStatusPage />)
    await screen.findByText('김하늘')
    expect(screen.getByText('우리 구역 현황')).toBeInTheDocument()

    mockFetchCellStats.mockResolvedValue({ cellId: 9, members: [member(7, '윤서아', null)] })
    await user.selectOptions(screen.getByRole('combobox', { name: '볼 구역' }), '샬롬구역')

    expect(mockFetchCellStats).toHaveBeenLastCalledWith(9)
    expect(await screen.findByText('윤서아')).toBeInTheDocument()
    expect(screen.queryByText('김하늘')).not.toBeInTheDocument()
    expect(screen.getByText('구역 현황')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '샬롬구역' })).toBeInTheDocument()
  })

  it('아무도 고르지 않은 구역이면 그렇게 알린다', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    mockUser = { id: 1, name: '정은혜', role: 'MASTER' }
    render(<CellStatusPage />)
    await screen.findByText('김하늘')

    mockFetchCellStats.mockResolvedValue({ cellId: 9, members: [] })
    await user.selectOptions(screen.getByRole('combobox', { name: '볼 구역' }), '샬롬구역')

    expect(await screen.findByText('아직 이 구역을 고른 사람이 없어요.')).toBeInTheDocument()
    expect(screen.getByText('참여').parentElement).toHaveTextContent('참여0명')
  })

  it('보고 있는 동안 30초마다 새로 불러와 숫자를 바꾼다', async () => {
    render(<CellStatusPage />)
    await screen.findByText('김하늘')
    expect(rowOf('이서준')).toHaveTextContent('0개')

    const posted = member(3, '이서준', '2026-11-09T04:19:00', [{ date: '2026-11-09', count: 1 }])
    mockFetchCellStats.mockResolvedValue({ cellId: 1, members: [posted, me, recent] })
    await act(async () => {
      jest.advanceTimersByTime(30 * 1000)
    })

    await waitFor(() => expect(rowOf('이서준')).toHaveTextContent('1개'))
    expect(screen.getByText('감사 기록').parentElement).toHaveTextContent('감사 기록21개')
  })

  it('구역을 아직 안 고른 사람은 구역부터 고른다', async () => {
    mockFetchCells.mockResolvedValue({ cells, myCellId: null })
    render(<CellStatusPage />)

    expect(await screen.findByRole('radiogroup', { name: '어느 구역이에요?' })).toBeInTheDocument()
    expect(mockFetchCellStats).not.toHaveBeenCalled()
  })

  it('로그인하지 않았으면 로그인 안내를 보여 주고 아무것도 불러오지 않는다', () => {
    mockUser = null
    render(<CellStatusPage />)

    expect(screen.getByRole('button', { name: '카카오로 로그인하기' })).toBeInTheDocument()
    expect(mockFetchCells).not.toHaveBeenCalled()
    expect(mockFetchCellStats).not.toHaveBeenCalled()
  })

  it('새로 불러오지 못하면 보던 내용을 두고 다시 불러올 수 있다', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<CellStatusPage />)
    await screen.findByText('김하늘')

    mockFetchCellStats.mockRejectedValueOnce(new Error('offline'))
    await act(async () => {
      jest.advanceTimersByTime(30 * 1000)
    })

    expect(await screen.findByRole('alert')).toHaveTextContent('구역 현황을 불러오지 못했어요.')
    expect(screen.getByText('김하늘')).toBeInTheDocument()
    expect(screen.getByText('감사 기록').parentElement).toHaveTextContent('감사 기록20개')

    await user.click(screen.getByRole('button', { name: '다시 불러오기' }))

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(screen.getByText('김하늘')).toBeInTheDocument()
  })

  it('처음부터 불러오지 못하면 안내와 다시 불러오기만 보여 준다', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    mockFetchCellStats.mockRejectedValueOnce(new Error('offline'))
    render(<CellStatusPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('구역 현황을 불러오지 못했어요.')
    expect(screen.queryByText('참여')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '다시 불러오기' }))

    expect(await screen.findByText('김하늘')).toBeInTheDocument()
  })

  it('불러오는 동안에는 뼈대를 보여 준다', async () => {
    let respond: (value: { cellId: number; members: ThanksCellMemberStats[] }) => void = () => undefined
    mockFetchCellStats.mockReturnValue(
      new Promise((done) => {
        respond = done
      })
    )
    render(<CellStatusPage />)

    await waitFor(() => expect(mockFetchCellStats).toHaveBeenCalled())
    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중…')

    await act(async () => {
      respond({ cellId: 1, members })
    })
    expect(screen.getByText('김하늘')).toBeInTheDocument()
  })
})
