import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ZooCoursePage } from '../ZooCoursePage'
import { VISITED_STORAGE_KEY } from '../../model/useZooCourse'

let mockSearchParams = new URLSearchParams()
const mockSetSearchParams = jest.fn()

jest.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  Link: ({ children, to, className }: { children: React.ReactNode; to: string; className?: string }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

jest.mock('../../../../widgets/header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}))

const getNextStopBar = () => screen.getByRole('complementary', { name: '다음 목적지 안내' })

beforeEach(() => {
  localStorage.clear()
  mockSearchParams = new URLSearchParams()
  jest.clearAllMocks()
})

describe('ZooCoursePage', () => {
  it('코스를 고르기 전에는 코스부터 고르라고 안내한다', () => {
    render(<ZooCoursePage />)

    expect(screen.getByText(/내 코스를 먼저 골라주세요/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /A코스/ })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /B코스/ })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('img', { name: '동물원 나들이 코스 지도' })).toBeInTheDocument()
    expect(screen.queryByRole('complementary', { name: '다음 목적지 안내' })).not.toBeInTheDocument()
  })

  it('B코스를 고르면 제2아프리카관부터 순서대로 안내한다', async () => {
    const user = userEvent.setup()
    render(<ZooCoursePage />)

    await user.click(screen.getByRole('button', { name: /B코스/ }))

    expect(screen.getByRole('button', { name: /B코스/ })).toHaveAttribute('aria-pressed', 'true')
    expect(within(getNextStopBar()).getByText('제2아프리카관')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'B코스 순서' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
      '제2아프리카관',
      '제3아프리카관',
      '맹수사',
      '곰사',
      '대동물관',
      '호주관',
      '제1아프리카관',
    ])
    expect(screen.getByRole('img', { name: /B코스 지도\. 정문에서 출발해 1번 제2아프리카관/ })).toBeInTheDocument()
  })

  it('도착했어요를 누르면 다음 장소와 가는 길을 보여준다', async () => {
    const user = userEvent.setup()
    mockSearchParams = new URLSearchParams('course=a')
    render(<ZooCoursePage />)

    const bar = getNextStopBar()
    expect(within(bar).getByText('제1아프리카관')).toBeInTheDocument()

    await user.click(within(bar).getByRole('button', { name: '도착했어요' }))

    expect(within(bar).getByText('호주관')).toBeInTheDocument()
    expect(within(bar).getByText('기린 전망대 쪽 큰길로 나와 위로 올라가요.')).toBeInTheDocument()
    expect(within(bar).getByRole('progressbar', { name: '7곳 중 1곳 도착' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '제1아프리카관 도착' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('목록에서 도착 표시를 취소하면 그 장소를 다시 안내한다', async () => {
    const user = userEvent.setup()
    localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify(['AFRICA_1']))
    mockSearchParams = new URLSearchParams('course=a')
    render(<ZooCoursePage />)

    expect(within(getNextStopBar()).getByText('호주관')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '제1아프리카관 도착' }))

    expect(within(getNextStopBar()).getByText('제1아프리카관')).toBeInTheDocument()
  })

  it('모두 돌면 정문으로 돌아가는 길을 안내한다', () => {
    localStorage.setItem(
      VISITED_STORAGE_KEY,
      JSON.stringify(['AFRICA_1', 'AUSTRALIA', 'BIG_ANIMAL', 'BEAR', 'PREDATOR', 'AFRICA_3', 'AFRICA_2'])
    )
    mockSearchParams = new URLSearchParams('course=a')
    render(<ZooCoursePage />)

    const bar = getNextStopBar()
    expect(within(bar).getByText('7곳 모두 돌았어요')).toBeInTheDocument()
    expect(within(bar).getByText('정문으로 돌아가요')).toBeInTheDocument()
    expect(within(bar).getByText('100주년 광장을 지나 정문으로 나가요.')).toBeInTheDocument()
    expect(within(bar).queryByRole('button', { name: '도착했어요' })).not.toBeInTheDocument()
  })

  it('도착 기록 지우기를 확인하면 첫 장소부터 다시 안내한다', async () => {
    const user = userEvent.setup()
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
    localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify(['AFRICA_2', 'AFRICA_3']))
    mockSearchParams = new URLSearchParams('course=b')
    render(<ZooCoursePage />)

    expect(within(getNextStopBar()).getByText('맹수사')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '도착 기록 지우기' }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(within(getNextStopBar()).getByText('제2아프리카관')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '도착 기록 지우기' })).not.toBeInTheDocument()
    confirmSpy.mockRestore()
  })
})
