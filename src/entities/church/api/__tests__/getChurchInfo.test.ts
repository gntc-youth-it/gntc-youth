jest.mock('../../../../shared/api', () => ({
  apiRequest: jest.fn(),
}))

import { getChurchInfo } from '../churchApi'
import { apiRequest } from '../../../../shared/api'

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

describe('getChurchInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('성전 정보를 반환한다', async () => {
    const mockResponse = {
      churchId: 'anyang',
      groupPhotoPath: '/uploads/anyang-2025.mp4',
      prayerTopics: [
        { id: 1, content: '기도제목 1', sortOrder: 1 },
        { id: 2, content: '기도제목 2', sortOrder: 2 },
      ],
    }
    mockApiRequest.mockResolvedValue(mockResponse)

    const result = await getChurchInfo('anyang')

    expect(mockApiRequest).toHaveBeenCalledWith('/churches/anyang/info')
    expect(result).toEqual(mockResponse)
  })

  it('기도제목이 없는 성전 정보를 반환한다', async () => {
    const mockResponse = {
      churchId: 'suwon',
      groupPhotoPath: null,
      prayerTopics: [],
    }
    mockApiRequest.mockResolvedValue(mockResponse)

    const result = await getChurchInfo('suwon')

    expect(mockApiRequest).toHaveBeenCalledWith('/churches/suwon/info')
    expect(result.prayerTopics).toEqual([])
    expect(result.groupPhotoPath).toBeNull()
  })

  it('API 에러 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('Network error'))

    await expect(getChurchInfo('anyang')).rejects.toThrow('Network error')
  })
})
