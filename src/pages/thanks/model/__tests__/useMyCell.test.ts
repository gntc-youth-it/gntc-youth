import { act, renderHook, waitFor } from '@testing-library/react'
import { HttpError } from '../../../../shared/api'
import { chooseCell, fetchCells } from '../../api/thanksApi'
import type { ThanksCellsResponse } from '../types'
import { useMyCell } from '../useMyCell'

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

const deferred = () => {
  let resolve: (value: ThanksCellsResponse) => void = () => undefined
  const promise = new Promise<ThanksCellsResponse>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockFetchCells.mockResolvedValue({ cells, myCellId: null })
})

describe('useMyCell', () => {
  it('구역 목록과 내 구역을 불러온다', async () => {
    mockFetchCells.mockResolvedValue({ cells, myCellId: 2 })
    const { result } = renderHook(() => useMyCell())

    expect(result.current.cells).toBeNull()
    await waitFor(() => expect(result.current.cells).toEqual(cells))
    expect(result.current.myCellId).toBe(2)
  })

  it('불러오지 못하면 안내하고, 다시 불러올 수 있다', async () => {
    mockFetchCells.mockRejectedValueOnce(new Error('offline'))
    const { result } = renderHook(() => useMyCell())

    await waitFor(() => expect(result.current.loadError).toBe('구역 목록을 불러오지 못했어요.'))
    await act(async () => {
      await result.current.reload()
    })

    expect(result.current.loadError).toBeNull()
    expect(result.current.cells).toEqual(cells)
  })

  it('구역을 고르면 서버가 돌려준 내 구역으로 바꾼다', async () => {
    mockChooseCell.mockResolvedValue({ cells, myCellId: 2 })
    const { result } = renderHook(() => useMyCell())
    await waitFor(() => expect(result.current.cells).not.toBeNull())

    let saved = false
    await act(async () => {
      saved = await result.current.choose(2)
    })

    expect(saved).toBe(true)
    expect(mockChooseCell).toHaveBeenCalledWith(2)
    expect(result.current.myCellId).toBe(2)
    expect(result.current.isSaving).toBe(false)
  })

  it('저장하는 동안 다시 고르면 무시한다', async () => {
    const server = deferred()
    mockChooseCell.mockReturnValue(server.promise)
    const { result } = renderHook(() => useMyCell())
    await waitFor(() => expect(result.current.cells).not.toBeNull())

    let saving: Promise<boolean> = Promise.resolve(false)
    act(() => {
      saving = result.current.choose(2)
    })
    expect(result.current.isSaving).toBe(true)

    let second = true
    await act(async () => {
      second = await result.current.choose(1)
    })
    expect(second).toBe(false)
    expect(mockChooseCell).toHaveBeenCalledTimes(1)

    await act(async () => {
      server.resolve({ cells, myCellId: 2 })
      await saving
    })
    expect(result.current.isSaving).toBe(false)
  })

  it('없어진 구역(1201)을 골랐으면 알리고 목록을 새로 받는다', async () => {
    mockChooseCell.mockRejectedValue(new HttpError(404, '해당 구역이 존재하지 않습니다.', 1201))
    const { result } = renderHook(() => useMyCell())
    await waitFor(() => expect(result.current.cells).not.toBeNull())
    mockFetchCells.mockResolvedValue({ cells: [cells[0]], myCellId: null })

    let saved = true
    await act(async () => {
      saved = await result.current.choose(2)
    })

    expect(saved).toBe(false)
    expect(result.current.saveError).toBe('이 구역은 고를 수 없어요. 다시 골라 주세요.')
    await waitFor(() => expect(result.current.cells).toEqual([cells[0]]))
    expect(result.current.myCellId).toBeNull()
  })

  it('목록을 새로 받는 사이 구역을 저장하면, 늦게 온 목록이 저장한 구역을 덮지 않는다', async () => {
    const { result } = renderHook(() => useMyCell())
    await waitFor(() => expect(result.current.cells).not.toBeNull())

    const stale = deferred()
    mockFetchCells.mockReturnValueOnce(stale.promise)
    let reloading: Promise<void> = Promise.resolve()
    act(() => {
      reloading = result.current.reload()
    })
    mockChooseCell.mockResolvedValue({ cells, myCellId: 2 })
    await act(async () => {
      await result.current.choose(2)
    })
    await act(async () => {
      stale.resolve({ cells, myCellId: null })
      await reloading
    })

    expect(result.current.myCellId).toBe(2)
  })

  it('저장하지 못하면 알리고, 다시 고르면 안내를 지운다', async () => {
    mockChooseCell.mockRejectedValueOnce(new Error('offline'))
    const { result } = renderHook(() => useMyCell())
    await waitFor(() => expect(result.current.cells).not.toBeNull())

    await act(async () => {
      await result.current.choose(2)
    })
    expect(result.current.saveError).toBe('구역을 저장하지 못했어요. 잠시 후 다시 눌러 주세요.')
    expect(result.current.myCellId).toBeNull()

    mockChooseCell.mockResolvedValue({ cells, myCellId: 2 })
    await act(async () => {
      await result.current.choose(2)
    })
    expect(result.current.saveError).toBeNull()
    expect(result.current.myCellId).toBe(2)
  })
})
