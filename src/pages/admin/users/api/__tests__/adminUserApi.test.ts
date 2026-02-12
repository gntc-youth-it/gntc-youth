jest.mock('../../../../../shared/api', () => ({
  apiRequest: jest.fn(),
}))

import { getAdminUsers } from '../adminUserApi'
import { apiRequest } from '../../../../../shared/api'

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

describe('getAdminUsers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('페이지네이션 파라미터로 사용자 목록을 반환한다', async () => {
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
    mockApiRequest.mockResolvedValue(mockResponse)

    const result = await getAdminUsers({ page: 0, size: 10 })

    expect(mockApiRequest).toHaveBeenCalledWith('/admin/users?page=0&size=10')
    expect(result).toEqual(mockResponse)
  })

  it('이름 검색 파라미터를 전달한다', async () => {
    const mockResponse = {
      users: [{ name: '김철수', churchName: '남대문', generation: 23, phoneNumber: '010-****-5678', role: 'MASTER' }],
      totalElements: 1,
      totalPages: 1,
      page: 0,
      size: 10,
    }
    mockApiRequest.mockResolvedValue(mockResponse)

    const result = await getAdminUsers({ page: 0, size: 10, name: '김철수' })

    expect(mockApiRequest).toHaveBeenCalledWith('/admin/users?page=0&size=10&name=%EA%B9%80%EC%B2%A0%EC%88%98')
    expect(result).toEqual(mockResponse)
  })

  it('이름이 빈 문자열이면 name 파라미터를 보내지 않는다', async () => {
    const mockResponse = { users: [], totalElements: 0, totalPages: 0, page: 0, size: 10 }
    mockApiRequest.mockResolvedValue(mockResponse)

    await getAdminUsers({ page: 0, size: 10 })

    expect(mockApiRequest).toHaveBeenCalledWith('/admin/users?page=0&size=10')
  })

  it('API 에러 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('Network error'))

    await expect(getAdminUsers({ page: 0, size: 10 })).rejects.toThrow('Network error')
  })
})
