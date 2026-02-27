import { renderHook, act, waitFor } from '@testing-library/react'
import { useGallery } from '../useGallery'
import { fetchChurches, fetchGalleryPhotos, fetchSubCategories } from '../../api/galleryApi'
import type { GalleryPhotosResponse, SubCategory } from '../types'

jest.mock('../../api/galleryApi')

const mockFetchGalleryPhotos = fetchGalleryPhotos as jest.MockedFunction<typeof fetchGalleryPhotos>
const mockFetchSubCategories = fetchSubCategories as jest.MockedFunction<typeof fetchSubCategories>
const mockFetchChurches = fetchChurches as jest.MockedFunction<typeof fetchChurches>

const mockResponse: GalleryPhotosResponse = {
  images: [
    { id: 42, url: 'uploads/abc123.jpg' },
    { id: 41, url: 'uploads/def456.jpg' },
  ],
  nextCursor: 41,
  hasNext: true,
}

const mockSubCategories: SubCategory[] = [
  {
    name: 'RETREAT_2026_WINTER',
    displayName: '2026 겨울 수련회',
    imageUrl: 'assets/2026-winter-poster.webp',
    startDate: '2026-01-29',
    endDate: '2026-01-31',
  },
  {
    name: 'RETREAT_2025_SUMMER',
    displayName: '2025 여름 수련회',
    imageUrl: 'assets/2025-summer-poster.webp',
    startDate: '2025-07-10',
    endDate: '2025-07-12',
  },
]

const mockChurches = [
  { code: 'ANYANG', name: '안양' },
  { code: 'SUWON', name: '수원' },
  { code: 'INCHEON', name: '인천' },
]

beforeEach(() => {
  jest.clearAllMocks()
  mockFetchGalleryPhotos.mockResolvedValue(mockResponse)
  mockFetchSubCategories.mockResolvedValue(mockSubCategories)
  mockFetchChurches.mockResolvedValue(mockChurches)
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

describe('useGallery 수련회 서브카테고리', () => {
  it('RETREAT 카테고리 선택 시 서브카테고리를 조회한다', async () => {
    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.setSelectedCategory('RETREAT')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockFetchSubCategories).toHaveBeenCalledWith('RETREAT')
    expect(result.current.subCategories).toHaveLength(2)
    expect(result.current.subCategories[0].name).toBe('RETREAT_2026_WINTER')
  })

  it('RETREAT 선택 시 첫 번째 서브카테고리가 자동 선택된다', async () => {
    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.setSelectedCategory('RETREAT')
    })

    await waitFor(() => {
      expect(result.current.selectedSubCategory).toBe('RETREAT_2026_WINTER')
    })
  })

  it('RETREAT 선택 시 첫 번째 서브카테고리로 사진을 조회한다', async () => {
    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockFetchGalleryPhotos.mockClear()

    act(() => {
      result.current.setSelectedCategory('RETREAT')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockFetchGalleryPhotos).toHaveBeenCalledWith({
      size: 20,
      cursor: null,
      subCategory: 'RETREAT_2026_WINTER',
    })
  })

  it('selectSubCategory로 다른 서브카테고리를 선택하면 사진을 다시 조회한다', async () => {
    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.setSelectedCategory('RETREAT')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockFetchGalleryPhotos.mockClear()

    act(() => {
      result.current.selectSubCategory('RETREAT_2025_SUMMER')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.selectedSubCategory).toBe('RETREAT_2025_SUMMER')
    expect(mockFetchGalleryPhotos).toHaveBeenCalledWith({
      size: 20,
      cursor: null,
      subCategory: 'RETREAT_2025_SUMMER',
    })
  })

  it('RETREAT에서 loadMore 호출 시 선택된 서브카테고리가 전달된다', async () => {
    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.setSelectedCategory('RETREAT')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockFetchGalleryPhotos.mockClear()
    mockFetchGalleryPhotos.mockResolvedValueOnce({
      images: [{ id: 39, url: 'uploads/more.jpg' }],
      nextCursor: null,
      hasNext: false,
    })

    act(() => {
      result.current.loadMore()
    })

    await waitFor(() => {
      expect(mockFetchGalleryPhotos).toHaveBeenCalledWith({
        size: 20,
        cursor: 41,
        subCategory: 'RETREAT_2026_WINTER',
      })
    })
  })

  it('ALL로 돌아가면 서브카테고리가 초기화된다', async () => {
    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.setSelectedCategory('RETREAT')
    })

    await waitFor(() => {
      expect(result.current.subCategories).toHaveLength(2)
    })

    act(() => {
      result.current.setSelectedCategory('ALL')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.subCategories).toHaveLength(0)
    expect(result.current.selectedSubCategory).toBeNull()
  })

  it('서브카테고리 조회 실패 시 에러 메시지가 설정된다', async () => {
    mockFetchSubCategories.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.setSelectedCategory('RETREAT')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('카테고리를 불러오는데 실패했습니다.')
  })

  it('서브카테고리가 빈 배열이면 사진 조회를 하지 않는다', async () => {
    mockFetchSubCategories.mockResolvedValueOnce([])

    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockFetchGalleryPhotos.mockClear()

    act(() => {
      result.current.setSelectedCategory('RETREAT')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockFetchGalleryPhotos).not.toHaveBeenCalled()
    expect(result.current.photos).toHaveLength(0)
  })
})

describe('useGallery 성전별', () => {
  it('userChurchId가 없으면 기본값 ANYANG이 선택된다', async () => {
    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.selectedChurchId).toBe('ANYANG')
  })

  it('userChurchId가 전달되면 해당 성전이 기본 선택된다', async () => {
    const { result } = renderHook(() => useGallery('SUWON'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.selectedChurchId).toBe('SUWON')
  })

  it('CHURCH 카테고리 선택 시 churchId로 사진을 조회한다', async () => {
    const { result } = renderHook(() => useGallery('BUCHEON'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockFetchGalleryPhotos.mockClear()

    act(() => {
      result.current.setSelectedCategory('CHURCH')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockFetchGalleryPhotos).toHaveBeenCalledWith({
      size: 20,
      cursor: null,
      churchId: 'BUCHEON',
    })
  })

  it('CHURCH 카테고리에서 서브카테고리는 초기화된다', async () => {
    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // 먼저 RETREAT 선택
    act(() => {
      result.current.setSelectedCategory('RETREAT')
    })

    await waitFor(() => {
      expect(result.current.subCategories).toHaveLength(2)
    })

    // CHURCH로 전환
    act(() => {
      result.current.setSelectedCategory('CHURCH')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.subCategories).toHaveLength(0)
    expect(result.current.selectedSubCategory).toBeNull()
  })

  it('selectChurch로 다른 성전을 선택하면 사진을 다시 조회한다', async () => {
    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.setSelectedCategory('CHURCH')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockFetchGalleryPhotos.mockClear()

    act(() => {
      result.current.selectChurch('INCHEON')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.selectedChurchId).toBe('INCHEON')
    expect(mockFetchGalleryPhotos).toHaveBeenCalledWith({
      size: 20,
      cursor: null,
      churchId: 'INCHEON',
    })
  })

  it('CHURCH에서 loadMore 호출 시 선택된 churchId가 전달된다', async () => {
    const { result } = renderHook(() => useGallery('DAEJEON'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.setSelectedCategory('CHURCH')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockFetchGalleryPhotos.mockClear()
    mockFetchGalleryPhotos.mockResolvedValueOnce({
      images: [{ id: 39, url: 'uploads/more.jpg' }],
      nextCursor: null,
      hasNext: false,
    })

    act(() => {
      result.current.loadMore()
    })

    await waitFor(() => {
      expect(mockFetchGalleryPhotos).toHaveBeenCalledWith({
        size: 20,
        cursor: 41,
        churchId: 'DAEJEON',
      })
    })
  })

  it('CHURCH에서 ALL로 돌아가면 churchId 없이 전체 사진을 조회한다', async () => {
    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.setSelectedCategory('CHURCH')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockFetchGalleryPhotos.mockClear()

    act(() => {
      result.current.setSelectedCategory('ALL')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockFetchGalleryPhotos).toHaveBeenCalledWith({
      size: 20,
      cursor: null,
    })
  })

  it('CHURCH 카테고리 선택 시 fetchChurches API로 성전 목록을 가져온다', async () => {
    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.churchOptions).toHaveLength(0)

    act(() => {
      result.current.setSelectedCategory('CHURCH')
    })

    await waitFor(() => {
      expect(result.current.churchOptions).toHaveLength(3)
    })

    expect(mockFetchChurches).toHaveBeenCalled()
    expect(result.current.churchOptions[0]).toEqual({ id: 'ANYANG', name: '안양' })
  })

  it('selectChurch 후 비동기 userChurchId가 수동 선택을 덮어쓰지 않는다', async () => {
    const { result, rerender } = renderHook(
      ({ churchId }: { churchId?: string }) => useGallery(churchId),
      { initialProps: { churchId: undefined } },
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // CHURCH 카테고리로 전환
    act(() => {
      result.current.setSelectedCategory('CHURCH')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // 수동으로 INCHEON 선택
    act(() => {
      result.current.selectChurch('INCHEON')
    })

    expect(result.current.selectedChurchId).toBe('INCHEON')

    // 비동기로 userChurchId가 SUWON으로 로드됨
    rerender({ churchId: 'SUWON' })

    // 수동 선택(INCHEON)이 유지되어야 함
    expect(result.current.selectedChurchId).toBe('INCHEON')
  })
})
