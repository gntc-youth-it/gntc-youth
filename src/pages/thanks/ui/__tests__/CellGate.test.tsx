import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { HttpError } from '../../../../shared/api'
import { chooseCell, fetchCells } from '../../api/thanksApi'
import type { ThanksCellsResponse } from '../../model/types'
import { CellGate } from '../CellGate'

jest.mock('react-router-dom', () => ({
  Link: ({ to, children, ...rest }: { to: string; children: ReactNode }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

jest.mock('../../api/thanksApi', () => ({
  fetchCells: jest.fn(),
  chooseCell: jest.fn(),
}))

const mockFetchCells = fetchCells as jest.MockedFunction<typeof fetchCells>
const mockChooseCell = chooseCell as jest.MockedFunction<typeof chooseCell>

const cells = [
  { id: 1, name: '1구역' },
  { id: 2, name: '2구역' },
]

const renderGate = () =>
  render(
    <CellGate>
      <p>감사로그</p>
    </CellGate>
  )

beforeEach(() => {
  jest.clearAllMocks()
  // jsdom에는 scrollTo가 없다. CRA 설정은 테스트마다 jest.fn 구현을 지우므로 일반 함수로 둔다
  window.scrollTo = () => undefined
  mockFetchCells.mockResolvedValue({ cells, myCellId: null })
})

describe('CellGate', () => {
  it('불러오는 동안에는 감사로그도 구역 목록도 보여 주지 않는다', async () => {
    let respond: (value: ThanksCellsResponse) => void = () => undefined
    mockFetchCells.mockReturnValue(
      new Promise((done) => {
        respond = done
      })
    )
    renderGate()

    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중…')
    expect(screen.queryByText('감사로그')).not.toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()

    await act(async () => {
      respond({ cells, myCellId: 1 })
    })
    expect(screen.getByText('감사로그')).toBeInTheDocument()
  })

  it('이미 고른 사람은 바로 들어간다', async () => {
    mockFetchCells.mockResolvedValue({ cells, myCellId: 1 })
    renderGate()

    expect(await screen.findByText('감사로그')).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })

  it('고른 구역을 버튼에서 보여 주고, 눌러야 들어간다', async () => {
    const user = userEvent.setup()
    const scrollTo = jest.fn()
    window.scrollTo = scrollTo
    mockChooseCell.mockResolvedValue({ cells, myCellId: 2 })
    renderGate()

    expect(await screen.findByRole('radiogroup', { name: '어느 구역이에요?' })).toBeInTheDocument()
    // 서버가 내려준 순서 그대로다
    expect(screen.getAllByRole('radio').map((radio) => radio.closest('label')?.textContent)).toEqual(['1구역', '2구역'])
    expect(screen.getByRole('button', { name: '구역을 골라 주세요' })).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: '2구역' }))

    expect(mockChooseCell).not.toHaveBeenCalled()
    expect(screen.queryByText('감사로그')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '2구역 들어가기' }))

    expect(mockChooseCell).toHaveBeenCalledWith(2)
    expect(await screen.findByText('감사로그')).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    // 목록을 내려서 골랐어도 감사로그는 맨 위부터 보여 준다
    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith(0, 0))
  })

  it('들어가는 동안에는 다시 누를 수 없다', async () => {
    const user = userEvent.setup()
    let respond: (value: ThanksCellsResponse) => void = () => undefined
    mockChooseCell.mockReturnValue(
      new Promise((done) => {
        respond = done
      })
    )
    renderGate()

    await user.click(await screen.findByRole('radio', { name: '1구역' }))
    await user.click(screen.getByRole('button', { name: '1구역 들어가기' }))

    expect(screen.getByRole('button', { name: '들어가는 중…' })).toBeDisabled()

    await act(async () => {
      respond({ cells, myCellId: 1 })
    })
    expect(screen.getByText('감사로그')).toBeInTheDocument()
  })

  it('저장하지 못하면 알리고, 고른 구역을 그대로 두어 다시 누를 수 있다', async () => {
    const user = userEvent.setup()
    mockChooseCell.mockRejectedValue(new Error('offline'))
    renderGate()

    await user.click(await screen.findByRole('radio', { name: '2구역' }))
    await user.click(screen.getByRole('button', { name: '2구역 들어가기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('구역을 저장하지 못했어요. 잠시 후 다시 눌러 주세요.')
    expect(screen.getByRole('radio', { name: '2구역' })).toBeChecked()
    expect(screen.getByRole('button', { name: '2구역 들어가기' })).toBeEnabled()
    expect(screen.queryByText('감사로그')).not.toBeInTheDocument()
  })

  it('고른 구역이 없어졌으면(1201) 새 목록에서 다시 고르게 한다', async () => {
    const user = userEvent.setup()
    mockChooseCell.mockRejectedValue(new HttpError(404, '해당 구역이 존재하지 않습니다.', 1201))
    renderGate()

    await user.click(await screen.findByRole('radio', { name: '2구역' }))
    mockFetchCells.mockResolvedValue({ cells: [cells[0]], myCellId: null })
    await user.click(screen.getByRole('button', { name: '2구역 들어가기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('이 구역은 고를 수 없어요. 다시 골라 주세요.')
    await waitFor(() => expect(screen.queryByRole('radio', { name: '2구역' })).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: '구역을 골라 주세요' })).toBeDisabled()
  })

  it('목록을 불러오지 못하면 다시 불러올 수 있다', async () => {
    const user = userEvent.setup()
    mockFetchCells.mockRejectedValueOnce(new Error('offline'))
    renderGate()

    expect(await screen.findByRole('alert')).toHaveTextContent('구역 목록을 불러오지 못했어요.')
    expect(screen.queryByText('감사로그')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '다시 불러오기' }))

    expect(await screen.findByRole('radio', { name: '1구역' })).toBeInTheDocument()
  })

  it('구역 목록이 비어 있으면 멈춘 것처럼 보이지 않게 알린다', async () => {
    const user = userEvent.setup()
    mockFetchCells.mockResolvedValue({ cells: [], myCellId: null })
    renderGate()

    expect(await screen.findByRole('alert')).toHaveTextContent('구역 목록을 준비하고 있어요.')

    mockFetchCells.mockResolvedValue({ cells, myCellId: null })
    await user.click(screen.getByRole('button', { name: '다시 불러오기' }))

    expect(await screen.findByRole('radio', { name: '1구역' })).toBeInTheDocument()
  })
})
