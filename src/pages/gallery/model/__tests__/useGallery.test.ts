import { renderHook, waitFor, act } from '@testing-library/react'
import { useGallery } from '../useGallery'
import type { GalleryAlbum } from '../types'

const mockFetchGalleryAlbums = jest.fn()

jest.mock('../../api/galleryApi', () => ({
  fetchGalleryAlbums: (...args: unknown[]) => mockFetchGalleryAlbums(...args),
}))

const mockAlbums: GalleryAlbum[] = [
  {
    id: '1',
    title: '겨울수련회 · 새 힘을 얻으라',
    date: '2026.01.29 - 01.31',
    dateFormatted: '2026년 1월 31일',
    category: 'RETREAT',
    photoCount: 48,
    photos: [{ id: 'p1', url: '/gallery/photo1.jpg' }],
    caption: '겨울수련회 둘째 날',
    tags: ['겨울수련회', 'GNTC청년'],
    likeCount: 24,
  },
  {
    id: '2',
    title: '성탄축하 예배',
    date: '2025.12.25',
    dateFormatted: '2025년 12월 25일',
    category: 'ALL',
    photoCount: 32,
    photos: [{ id: 'p2', url: '/gallery/photo2.jpg' }],
    caption: '성탄절 예배',
    tags: ['성탄절'],
    likeCount: 18,
  },
]

describe('useGallery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('초기 상태는 로딩 중이고 빈 앨범 목록이다', () => {
    mockFetchGalleryAlbums.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useGallery())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.albums).toEqual([])
    expect(result.current.error).toBeNull()
    expect(result.current.selectedCategory).toBe('ALL')
  })

  it('앨범 목록을 성공적으로 가져온다', async () => {
    mockFetchGalleryAlbums.mockResolvedValue({ albums: mockAlbums })

    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.albums).toEqual(mockAlbums)
    expect(result.current.error).toBeNull()
  })

  it('API 실패 시 에러 메시지를 설정한다', async () => {
    mockFetchGalleryAlbums.mockRejectedValue(new Error('Server error'))

    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.albums).toEqual([])
    expect(result.current.error).toBe('갤러리를 불러오는데 실패했습니다.')
  })

  it('카테고리 ALL 선택 시 모든 앨범이 반환된다', async () => {
    mockFetchGalleryAlbums.mockResolvedValue({ albums: mockAlbums })

    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.albums).toHaveLength(2)
  })

  it('카테고리 RETREAT 선택 시 수련회 앨범만 반환된다', async () => {
    mockFetchGalleryAlbums.mockResolvedValue({ albums: mockAlbums })

    const { result } = renderHook(() => useGallery())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.setSelectedCategory('RETREAT')
    })

    expect(result.current.albums).toHaveLength(1)
    expect(result.current.albums[0].title).toBe('겨울수련회 · 새 힘을 얻으라')
  })
})
