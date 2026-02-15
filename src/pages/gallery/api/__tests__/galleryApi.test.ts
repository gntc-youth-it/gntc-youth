jest.mock('../../../../shared/api', () => ({
  apiRequest: jest.fn(),
}))

import { fetchGalleryAlbums } from '../galleryApi'
import { apiRequest } from '../../../../shared/api'

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

describe('fetchGalleryAlbums', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('갤러리 앨범 목록을 반환한다', async () => {
    const mockResponse = {
      albums: [
        {
          id: '1',
          title: '겨울수련회',
          date: '2026.01.29 - 01.31',
          dateFormatted: '2026년 1월 31일',
          category: 'RETREAT',
          photoCount: 48,
          photos: [{ id: 'p1', url: '/gallery/photo1.jpg' }],
          caption: '수련회 사진',
          tags: ['겨울수련회'],
          likeCount: 24,
        },
      ],
    }
    mockApiRequest.mockResolvedValue(mockResponse)

    const result = await fetchGalleryAlbums()

    expect(mockApiRequest).toHaveBeenCalledWith('/api/gallery/albums')
    expect(result).toEqual(mockResponse)
  })

  it('API 에러 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('Network error'))

    await expect(fetchGalleryAlbums()).rejects.toThrow('Network error')
  })
})
