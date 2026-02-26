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

  it('hasNext가 false이면 loadMore가 API를 호출하지 않는다', async () => {
    const lastPageResponse: GalleryPhotosResponse = {
      images: [{ id: 40, url: 'uploads/last.jpg' }],
      nextCursor: null,
      hasNext: false,
    }
    mockFetchGalleryPhotos.mockResolvedValue(lastPageResponse)

    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.hasNext).toBe(false)
    const callCountBefore = mockFetchGalleryPhotos.mock.calls.length

    act(() => {
      result.current.loadMore()
    })

    expect(mockFetchGalleryPhotos).toHaveBeenCalledTimes(callCountBefore)
  })

  it('loadMore 중복 호출 시 한 번만 API를 호출한다', async () => {
    let resolveSecond: (value: GalleryPhotosResponse) => void
    const secondPromise = new Promise<GalleryPhotosResponse>((resolve) => {
      resolveSecond = resolve
    })

    mockFetchGalleryPhotos
      .mockResolvedValueOnce(mockResponse)
      .mockReturnValueOnce(secondPromise)

    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.loadMore()
    })

    // isFetchingMore가 true인 상태에서 다시 loadMore 호출
    act(() => {
      result.current.loadMore()
    })

    // 초기 로드 1번 + loadMore 1번 = 총 2번
    expect(mockFetchGalleryPhotos).toHaveBeenCalledTimes(2)

    // 두 번째 응답 resolve
    await act(async () => {
      resolveSecond!({
        images: [{ id: 39, url: 'uploads/extra.jpg' }],
        nextCursor: null,
        hasNext: false,
      })
    })
  })

  it('isFetchingMore 상태가 로딩 중 true, 완료 후 false로 변한다', async () => {
    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isFetchingMore).toBe(false)

    let resolveNext: (value: GalleryPhotosResponse) => void
    const nextPromise = new Promise<GalleryPhotosResponse>((resolve) => {
      resolveNext = resolve
    })
    mockFetchGalleryPhotos.mockReturnValueOnce(nextPromise)

    act(() => {
      result.current.loadMore()
    })

    expect(result.current.isFetchingMore).toBe(true)

    await act(async () => {
      resolveNext!({
        images: [{ id: 39, url: 'uploads/next.jpg' }],
        nextCursor: null,
        hasNext: false,
      })
    })

    expect(result.current.isFetchingMore).toBe(false)
  })

  it('초기 카테고리는 ALL이다', () => {
    const { result } = renderHook(() => useGallery())
    expect(result.current.selectedCategory).toBe('ALL')
  })
})
