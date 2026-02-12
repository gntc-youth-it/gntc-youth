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

  it('사용자 목록을 반환한다', async () => {
    const mockUsers = [
      { name: '김철수', churchName: '남대문', generation: 23, phoneNumber: '010-****-5678', role: 'MASTER' },
      { name: '이영희', churchName: '강남', generation: 22, phoneNumber: '010-****-5432', role: 'USER' },
    ]
    mockApiRequest.mockResolvedValue({ users: mockUsers })

    const result = await getAdminUsers()

    expect(mockApiRequest).toHaveBeenCalledWith('/admin/users')
    expect(result).toEqual(mockUsers)
  })

  it('API 에러 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('Network error'))

    await expect(getAdminUsers()).rejects.toThrow('Network error')
  })
})
