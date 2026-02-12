import { renderHook, waitFor } from '@testing-library/react'
import { useAdminUsers } from '../useAdminUsers'

const mockGetAdminUsers = jest.fn()

jest.mock('../../api/adminUserApi', () => ({
  getAdminUsers: (...args: unknown[]) => mockGetAdminUsers(...args),
}))

describe('useAdminUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('초기 상태는 로딩 중이고 빈 배열이며 에러가 없다', () => {
    mockGetAdminUsers.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useAdminUsers())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.users).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('사용자 목록을 성공적으로 가져온다', async () => {
    const mockUsers = [
      { name: '김철수', churchName: '남대문', generation: 23, phoneNumber: '010-****-5678', role: 'MASTER' },
      { name: '이영희', churchName: '강남', generation: 22, phoneNumber: '010-****-5432', role: 'USER' },
    ]
    mockGetAdminUsers.mockResolvedValue(mockUsers)

    const { result } = renderHook(() => useAdminUsers())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.users).toEqual(mockUsers)
    expect(result.current.error).toBeNull()
  })

  it('API 실패 시 빈 배열을 유지하고 에러를 설정한다', async () => {
    mockGetAdminUsers.mockRejectedValue(new Error('Forbidden'))

    const { result } = renderHook(() => useAdminUsers())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.users).toEqual([])
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Forbidden')
  })
})
