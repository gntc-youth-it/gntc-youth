import { act, renderHook, waitFor } from '@testing-library/react'
import { HttpError } from '../../../../shared/api'
import { fetchCellStats } from '../../api/thanksApi'
import type { ThanksCellStatsResponse } from '../types'
import { useCellStats } from '../useCellStats'

jest.mock('../../api/thanksApi', () => ({
  fetchCellStats: jest.fn(),
}))

const mockFetchCellStats = fetchCellStats as jest.MockedFunction<typeof fetchCellStats>

const statsOf = (cellId: number): ThanksCellStatsResponse => ({
  cellId,
  members: [{ user: { userId: 1, name: '정은혜', profileImageUrl: null }, lastPostedAt: null, dailyCounts: [] }],
})

const deferred = () => {
  let resolve: (value: ThanksCellStatsResponse) => void = () => undefined
  const promise = new Promise<ThanksCellStatsResponse>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockFetchCellStats.mockImplementation((cellId) => Promise.resolve(statsOf(cellId)))
})

describe('useCellStats', () => {
  it('구역 현황을 불러온다', async () => {
    const { result } = renderHook(() => useCellStats(3))

    expect(result.current.stats).toBeNull()
    await waitFor(() => expect(result.current.stats).toEqual(statsOf(3)))
    expect(mockFetchCellStats).toHaveBeenCalledWith(3)
  })

  it('처음에 불러오지 못하면 안내하고, 다시 불러올 수 있다', async () => {
    mockFetchCellStats.mockRejectedValueOnce(new Error('offline'))
    const { result } = renderHook(() => useCellStats(3))

    await waitFor(() => expect(result.current.error).toBe('구역 현황을 불러오지 못했어요.'))
    expect(result.current.stats).toBeNull()

    await act(async () => {
      await result.current.reload()
    })
    expect(result.current.error).toBeNull()
    expect(result.current.stats).toEqual(statsOf(3))
  })

  it('다시 불러오지 못해도 보던 현황은 그대로 둔다', async () => {
    const { result } = renderHook(() => useCellStats(3))
    await waitFor(() => expect(result.current.stats).not.toBeNull())

    mockFetchCellStats.mockRejectedValueOnce(new Error('offline'))
    await act(async () => {
      await result.current.reload()
    })

    expect(result.current.stats).toEqual(statsOf(3))
    expect(result.current.error).toBe('구역 현황을 불러오지 못했어요.')
  })

  it('볼 권한이 없으면(6008) 그렇게 알린다', async () => {
    mockFetchCellStats.mockRejectedValue(new HttpError(403, '권한이 없어요.', 6008))
    const { result } = renderHook(() => useCellStats(3))

    await waitFor(() => expect(result.current.error).toBe('내 구역 현황만 볼 수 있어요.'))
  })

  it('다른 구역으로 바꾸면 비우고 새로 불러오며, 앞 구역 응답이 늦게 와도 버린다', async () => {
    const first = deferred()
    mockFetchCellStats.mockReturnValueOnce(first.promise)
    const { result, rerender } = renderHook(({ cellId }) => useCellStats(cellId), { initialProps: { cellId: 3 } })

    rerender({ cellId: 9 })
    await waitFor(() => expect(result.current.stats).toEqual(statsOf(9)))

    await act(async () => {
      first.resolve(statsOf(3))
    })

    expect(result.current.stats).toEqual(statsOf(9))
  })
})
