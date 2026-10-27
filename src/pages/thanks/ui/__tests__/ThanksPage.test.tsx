import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { fetchThanksEntries } from '../../api/thanksApi'
import type { ThanksEntry } from '../../model/types'
import { ThanksPage } from '../ThanksPage'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/thanks', search: '', state: null }),
  useSearchParams: () => [new URLSearchParams(''), jest.fn()],
  Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

let mockUser: { id: number; name: string } | null = null

jest.mock('../../../../features/auth', () => ({
  useAuth: () => ({ user: mockUser }),
  getUserInfoFromToken: () => null,
}))

jest.mock('../../api/thanksApi', () => ({
  fetchThanksEntries: jest.fn(),
  createThanksEntry: jest.fn(),
  deleteThanksEntry: jest.fn(),
  uploadEntryPhoto: jest.fn(),
}))

const mockFetchThanksEntries = fetchThanksEntries as jest.MockedFunction<typeof fetchThanksEntries>

const entry = (id: number, userId: number, name: string, createdAt: string, isMine = false): ThanksEntry => ({
  id,
  missionDate: '2026-11-09',
  slot: 'MORNING',
  content: `${name}의 감사`,
  media: { fileId: id, url: `uploads/${id}.webp`, type: 'IMAGE' },
  author: { userId, name, profileImageUrl: null },
  reactions: [],
  commentCount: 0,
  latestComment: null,
  isMine,
  createdAt,
})

beforeEach(() => {
  jest.clearAllMocks()
  sessionStorage.clear()
  mockUser = null
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2026-11-09T13:20:00+09:00'))
})

afterEach(() => {
  jest.useRealTimers()
})

describe('ThanksPage', () => {
  it('로그인하지 않았으면 로그인 안내를 보여 주고, 로그인 뒤 이 화면으로 돌아오게 한다', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<ThanksPage />)

    await user.click(screen.getByRole('button', { name: '카카오로 로그인하기' }))

    expect(sessionStorage.getItem('redirectAfterLogin')).toBe('/thanks')
    expect(mockNavigate).toHaveBeenCalledWith('/login')
    expect(mockFetchThanksEntries).not.toHaveBeenCalled()
  })

  it('오늘 기록을 불러와 마지막으로 올린 사람부터 보여 준다', async () => {
    mockUser = { id: 1, name: '정은혜' }
    mockFetchThanksEntries.mockResolvedValue({
      date: '2026-11-09',
      entries: [
        entry(1, 2, '김하늘', '2026-11-08T22:15:00'),
        entry(2, 3, '이서준', '2026-11-09T01:30:00'),
      ],
    })

    render(<ThanksPage />)

    expect(await screen.findByText('오늘 2명이 감사했어요')).toBeInTheDocument()
    expect(mockFetchThanksEntries).toHaveBeenCalledWith('2026-11-09')
    const names = screen.getAllByRole('region').map((section) => section.getAttribute('aria-label'))
    expect(names).toEqual(['이서준의 감사로그', '김하늘의 감사로그'])
  })

  it('지금 칸에 아직 안 올렸으면 기록 버튼을 보여 준다', async () => {
    mockUser = { id: 1, name: '정은혜' }
    mockFetchThanksEntries.mockResolvedValue({ date: '2026-11-09', entries: [] })

    render(<ThanksPage />)

    expect(await screen.findByRole('button', { name: /오후 감사 남기기/ })).toBeInTheDocument()
    expect(screen.getByText('아직 아무도 감사를 남기지 않았어요')).toBeInTheDocument()
  })

  it('지금 칸에 올렸으면 다음 칸을 안내한다', async () => {
    mockUser = { id: 1, name: '정은혜' }
    mockFetchThanksEntries.mockResolvedValue({
      date: '2026-11-09',
      entries: [{ ...entry(3, 1, '정은혜', '2026-11-09T04:00:00', true), slot: 'AFTERNOON' }],
    })

    render(<ThanksPage />)

    expect(await screen.findByText(/오후 감사 완료/)).toBeInTheDocument()
    expect(screen.getByText(/저녁 감사는 18:00부터/)).toBeInTheDocument()
  })
})
