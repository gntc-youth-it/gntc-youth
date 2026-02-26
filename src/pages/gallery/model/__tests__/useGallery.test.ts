import { renderHook, act, waitFor } from '@testing-library/react'
import { useGallery } from '../useGallery'
import { fetchGalleryPhotos } from '../../api/galleryApi'
import type { GalleryPhotosResponse } from '../types'

jest.mock('../../api/galleryApi')

const mockFetchGalleryPhotos = fetchGalleryPhotos as jest.MockedFunction<typeof fetchGalleryPhotos>

const mockResponse: GalleryPhotosResponse = {
  images: [
    { id: 42, url: 'uploads/abc123.jpg' },
    { id: 41, url: 'uploads/def456.jpg' },
  ],
  nextCursor: 41,
  hasNext: true,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockFetchGalleryPhotos.mockResolvedValue(mockResponse)
})

describe('useGallery', () => {
  it('초기 로드 시 API를 호출하고 사진 목록을 반환한다', async () => {
    const { result } = renderHook(() => useGallery())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.photos).toHaveLength(2)
    expect(result.current.hasNext).toBe(true)
    expect(result.current.error).toBeNull()
    expect(mockFetchGalleryPhotos).toHaveBeenCalledWith({ size: 20, cursor: null })
  })

  it('loadMore 호출 시 다음 페이지를 불러온다', async () => {
    const nextResponse: GalleryPhotosResponse = {
      images: [{ id: 40, url: 'uploads/ghi789.jpg' }],
      nextCursor: null,
      hasNext: false,
    }
    mockFetchGalleryPhotos
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(nextResponse)

    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.loadMore()
    })

    await waitFor(() => {
      expect(result.current.photos).toHaveLength(3)
    })

    expect(result.current.hasNext).toBe(false)
    expect(mockFetchGalleryPhotos).toHaveBeenCalledWith({ size: 20, cursor: 41 })
  })

  it('API 에러 시 에러 메시지가 설정된다', async () => {
    mockFetchGalleryPhotos.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('사진을 불러오는데 실패했습니다.')
    expect(result.current.photos).toHaveLength(0)
  })

  it('초기 카테고리는 ALL이다', () => {
    const { result } = renderHook(() => useGallery())
    expect(result.current.selectedCategory).toBe('ALL')
  })
})
