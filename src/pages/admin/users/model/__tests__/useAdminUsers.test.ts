import { renderHook, waitFor } from '@testing-library/react'
import { useAdminUsers } from '../useAdminUsers'

const mockGetAdminUsers = jest.fn()

jest.mock('../../api/adminUserApi', () => ({
  getAdminUsers: (...args: unknown[]) => mockGetAdminUsers(...args),
}))

const defaultParams = { page: 0, size: 10 }

describe('useAdminUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('초기 상태는 로딩 중이고 빈 데이터이며 에러가 없다', () => {
    mockGetAdminUsers.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useAdminUsers(defaultParams))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data.users).toEqual([])
    expect(result.current.data.totalElements).toBe(0)
    expect(result.current.error).toBeNull()
  })

  it('사용자 목록을 성공적으로 가져온다', async () => {
    const mockResponse = {
      users: [
        { name: '김철수', churchName: '남대문', generation: 23, phoneNumber: '010-****-5678', role: 'MASTER' },
        { name: '이영희', churchName: '강남', generation: 22, phoneNumber: '010-****-5432', role: 'USER' },
      ],
      totalElements: 2,
      totalPages: 1,
      page: 0,
      size: 10,
    }
    mockGetAdminUsers.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useAdminUsers(defaultParams))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockResponse)
    expect(result.current.error).toBeNull()
  })

  it('API 실패 시 빈 데이터를 유지하고 에러를 설정한다', async () => {
    mockGetAdminUsers.mockRejectedValue(new Error('Forbidden'))

    const { result } = renderHook(() => useAdminUsers(defaultParams))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data.users).toEqual([])
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Forbidden')
  })

  it('파라미터가 변경되면 다시 요청한다', async () => {
    const mockResponse1 = { users: [], totalElements: 0, totalPages: 0, page: 0, size: 10 }
    const mockResponse2 = { users: [], totalElements: 0, totalPages: 0, page: 1, size: 10 }
    mockGetAdminUsers.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2)

    const { result, rerender } = renderHook(
      ({ params }) => useAdminUsers(params),
      { initialProps: { params: { page: 0, size: 10 } } }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockGetAdminUsers).toHaveBeenCalledWith({ page: 0, size: 10, name: undefined })

    rerender({ params: { page: 1, size: 10 } })

    await waitFor(() => {
      expect(mockGetAdminUsers).toHaveBeenCalledTimes(2)
    })

    expect(mockGetAdminUsers).toHaveBeenCalledWith({ page: 1, size: 10, name: undefined })
  })
})
