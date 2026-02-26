jest.mock('../../../../shared/api', () => ({
  apiRequest: jest.fn(),
}))

import {
  fetchGalleryAlbums,
  fetchGalleryPhotos,
  fetchCategories,
  fetchSubCategories,
  getPresignedUrl,
  createPost,
  fetchChurches,
} from '../galleryApi'
import { apiRequest } from '../../../../shared/api'

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

beforeEach(() => {
  jest.clearAllMocks()
})

describe('fetchGalleryAlbums', () => {
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

    expect(mockApiRequest).toHaveBeenCalledWith('/gallery/albums')
    expect(result).toEqual(mockResponse)
  })

  it('API 에러 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('Network error'))

    await expect(fetchGalleryAlbums()).rejects.toThrow('Network error')
  })
})

describe('fetchGalleryPhotos', () => {
  it('파라미터 없이 호출하면 /posts/gallery로 요청한다', async () => {
    const mockResponse = { images: [], nextCursor: null, hasNext: false }
    mockApiRequest.mockResolvedValue(mockResponse)

    const result = await fetchGalleryPhotos({})

    expect(mockApiRequest).toHaveBeenCalledWith('/posts/gallery')
    expect(result).toEqual(mockResponse)
  })

  it('cursor와 size를 쿼리 파라미터로 전달한다', async () => {
    const mockResponse = {
      images: [{ id: 42, url: 'uploads/abc123.jpg' }],
      nextCursor: 42,
      hasNext: true,
    }
    mockApiRequest.mockResolvedValue(mockResponse)

    await fetchGalleryPhotos({ cursor: 50, size: 10 })

    expect(mockApiRequest).toHaveBeenCalledWith('/posts/gallery?size=10&cursor=50')
  })

  it('subCategory를 쿼리 파라미터로 전달한다', async () => {
    mockApiRequest.mockResolvedValue({ images: [], nextCursor: null, hasNext: false })

    await fetchGalleryPhotos({ subCategory: 'RETREAT_2026_WINTER' })

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/posts/gallery?subCategory=RETREAT_2026_WINTER'
    )
  })

  it('모든 파라미터를 동시에 전달한다', async () => {
    mockApiRequest.mockResolvedValue({ images: [], nextCursor: null, hasNext: false })

    await fetchGalleryPhotos({ cursor: 100, size: 15, subCategory: 'RETREAT_2026_WINTER' })

    expect(mockApiRequest).toHaveBeenCalledWith(
      '/posts/gallery?size=15&cursor=100&subCategory=RETREAT_2026_WINTER'
    )
  })

  it('API 에러 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('Network error'))

    await expect(fetchGalleryPhotos({})).rejects.toThrow('Network error')
  })
})

describe('fetchCategories', () => {
  it('카테고리 목록을 반환한다', async () => {
    const mockResponse = [{ name: 'RETREAT', displayName: '수련회' }]
    mockApiRequest.mockResolvedValue(mockResponse)

    const result = await fetchCategories()

    expect(mockApiRequest).toHaveBeenCalledWith('/posts/categories')
    expect(result).toEqual(mockResponse)
  })

  it('API 에러 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('Network error'))

    await expect(fetchCategories()).rejects.toThrow('Network error')
  })
})

describe('fetchSubCategories', () => {
  it('세부 카테고리 목록을 반환한다', async () => {
    const mockResponse = [{ name: 'RETREAT_2026_WINTER', displayName: '2026 겨울 수련회' }]
    mockApiRequest.mockResolvedValue(mockResponse)

    const result = await fetchSubCategories('RETREAT')

    expect(mockApiRequest).toHaveBeenCalledWith('/posts/categories/RETREAT/sub-categories')
    expect(result).toEqual(mockResponse)
  })

  it('API 에러 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('Network error'))

    await expect(fetchSubCategories('RETREAT')).rejects.toThrow('Network error')
  })
})

describe('getPresignedUrl', () => {
  it('presigned URL과 fileId를 반환한다', async () => {
    const mockResponse = { fileId: 1, presignedUrl: 'https://s3.amazonaws.com/test' }
    mockApiRequest.mockResolvedValue(mockResponse)

    const result = await getPresignedUrl({
      filename: 'photo.jpg',
      contentType: 'image/jpeg',
      fileSize: 102400,
    })

    expect(mockApiRequest).toHaveBeenCalledWith('/files/presigned-url', {
      method: 'POST',
      body: JSON.stringify({ filename: 'photo.jpg', contentType: 'image/jpeg', fileSize: 102400 }),
    })
    expect(result).toEqual(mockResponse)
  })

  it('API 에러 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('Forbidden'))

    await expect(
      getPresignedUrl({ filename: 'photo.jpg', contentType: 'image/jpeg', fileSize: 100 })
    ).rejects.toThrow('Forbidden')
  })
})

describe('createPost', () => {
  it('게시글을 생성하고 응답을 반환한다', async () => {
    const mockResponse = {
      id: 1,
      authorId: 10,
      authorName: '홍길동',
      subCategory: 'RETREAT_2026_WINTER',
      category: 'RETREAT',
      status: 'PENDING_REVIEW',
      content: '수련회 후기입니다',
      hashtags: ['수련회'],
      churches: ['ANYANG'],
      images: [],
      createdAt: '2026-02-26T10:00:00',
    }
    mockApiRequest.mockResolvedValue(mockResponse)

    const result = await createPost({
      subCategory: 'RETREAT_2026_WINTER',
      content: '수련회 후기입니다',
      hashtags: ['수련회'],
      churches: ['ANYANG'],
    })

    expect(mockApiRequest).toHaveBeenCalledWith('/posts', {
      method: 'POST',
      body: JSON.stringify({
        subCategory: 'RETREAT_2026_WINTER',
        content: '수련회 후기입니다',
        hashtags: ['수련회'],
        churches: ['ANYANG'],
      }),
    })
    expect(result).toEqual(mockResponse)
  })

  it('API 에러 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('카테고리는 필수입니다'))

    await expect(createPost({ subCategory: '' })).rejects.toThrow('카테고리는 필수입니다')
  })
})

describe('fetchChurches', () => {
  it('성전 목록을 반환한다', async () => {
    const mockChurches = [
      { code: 'ANYANG', name: '안양' },
      { code: 'SUWON', name: '수원' },
    ]
    mockApiRequest.mockResolvedValue({ churches: mockChurches })

    const result = await fetchChurches()

    expect(mockApiRequest).toHaveBeenCalledWith('/churches')
    expect(result).toEqual(mockChurches)
  })

  it('API 에러 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('Network error'))

    await expect(fetchChurches()).rejects.toThrow('Network error')
  })
})
