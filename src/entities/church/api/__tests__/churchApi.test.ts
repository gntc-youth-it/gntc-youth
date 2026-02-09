jest.mock('../../../../shared/api', () => ({
  apiRequest: jest.fn(),
}))

import { getChurches } from '../churchApi'
import { apiRequest } from '../../../../shared/api'

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

describe('getChurches', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('교회 목록을 반환한다', async () => {
    const mockChurches = [
      { code: 'anyang', name: '안양' },
      { code: 'suwon', name: '수원' },
    ]
    mockApiRequest.mockResolvedValue({ churches: mockChurches })

    const result = await getChurches()

    expect(mockApiRequest).toHaveBeenCalledWith('/churches')
    expect(result).toEqual(mockChurches)
  })

  it('API 에러 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('Network error'))

    await expect(getChurches()).rejects.toThrow('Network error')
  })
})
