import { renderHook, waitFor } from '@testing-library/react'
import { useChurches } from '../useChurches'

const mockGetChurches = jest.fn()

jest.mock('../../api', () => ({
  getChurches: (...args: unknown[]) => mockGetChurches(...args),
}))

describe('useChurches', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('초기 상태는 로딩 중이고 빈 배열이다', () => {
    mockGetChurches.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useChurches())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.churches).toEqual([])
  })

  it('교회 목록을 성공적으로 가져온다', async () => {
    const mockChurches = [
      { code: 'anyang', name: '안양' },
      { code: 'suwon', name: '수원' },
      { code: 'incheon', name: '인천' },
    ]
    mockGetChurches.mockResolvedValue(mockChurches)

    const { result } = renderHook(() => useChurches())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.churches).toEqual(mockChurches)
  })

  it('API 실패 시 빈 배열을 유지하고 로딩을 해제한다', async () => {
    mockGetChurches.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useChurches())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.churches).toEqual([])
  })
})
