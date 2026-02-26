import { renderHook, act, waitFor } from '@testing-library/react'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

const mockFetchCategories = jest.fn()
const mockFetchSubCategories = jest.fn()
const mockGetPresignedUrl = jest.fn()
const mockCreatePost = jest.fn()
const mockFetchChurches = jest.fn()

jest.mock('../../api/galleryApi', () => ({
  fetchCategories: (...args: unknown[]) => mockFetchCategories(...args),
  fetchSubCategories: (...args: unknown[]) => mockFetchSubCategories(...args),
  getPresignedUrl: (...args: unknown[]) => mockGetPresignedUrl(...args),
  createPost: (...args: unknown[]) => mockCreatePost(...args),
  fetchChurches: (...args: unknown[]) => mockFetchChurches(...args),
}))

const mockCompressImage = jest.fn()
const mockUploadToS3 = jest.fn()

jest.mock('../../../../shared/lib', () => ({
  compressImage: (...args: unknown[]) => mockCompressImage(...args),
  uploadToS3: (...args: unknown[]) => mockUploadToS3(...args),
}))

// Mock crypto.randomUUID
let uuidCounter = 0
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => `test-uuid-${++uuidCounter}`,
  },
})

// Mock URL.createObjectURL / revokeObjectURL
const mockCreateObjectURL = jest.fn(() => 'blob:mock-url')
const mockRevokeObjectURL = jest.fn()
global.URL.createObjectURL = mockCreateObjectURL
global.URL.revokeObjectURL = mockRevokeObjectURL

import { useGalleryWrite } from '../useGalleryWrite'

const mockCategories = [{ name: 'RETREAT', displayName: '수련회' }]
const mockSubCategories = [{ name: 'RETREAT_2026_WINTER', displayName: '2026 겨울 수련회' }]
const mockChurches = [
  { code: 'ANYANG', name: '안양' },
  { code: 'SUWON', name: '수원' },
]

beforeEach(() => {
  jest.clearAllMocks()
  uuidCounter = 0
  mockFetchCategories.mockResolvedValue(mockCategories)
  mockFetchChurches.mockResolvedValue(mockChurches)
  mockFetchSubCategories.mockResolvedValue(mockSubCategories)
  mockCompressImage.mockResolvedValue({
    blob: new Blob(['compressed'], { type: 'image/webp' }),
    originalSize: 1000,
    compressedSize: 500,
  })
  mockGetPresignedUrl.mockResolvedValue({
    fileId: 1,
    presignedUrl: 'https://s3.amazonaws.com/test',
  })
  mockUploadToS3.mockResolvedValue(undefined)
  mockCreatePost.mockResolvedValue({ id: 1 })
})

describe('useGalleryWrite 초기 상태', () => {
  it('초기 폼 상태가 비어있다', async () => {
    const { result } = renderHook(() => useGalleryWrite())

    expect(result.current.selectedCategory).toBe('')
    expect(result.current.selectedSubCategory).toBe('')
    expect(result.current.content).toBe('')
    expect(result.current.hashtags).toEqual([])
    expect(result.current.selectedChurches).toEqual([])
    expect(result.current.images).toEqual([])
    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.submitError).toBeNull()
  })

  it('마운트 시 카테고리와 성전 목록을 불러온다', async () => {
    const { result } = renderHook(() => useGalleryWrite())

    await waitFor(() => {
      expect(result.current.categories).toEqual(mockCategories)
    })

    expect(result.current.churches).toEqual(mockChurches)
    expect(result.current.churchesLoading).toBe(false)
    expect(mockFetchCategories).toHaveBeenCalledTimes(1)
    expect(mockFetchChurches).toHaveBeenCalledTimes(1)
  })

  it('초기 데이터 로딩 실패 시 빈 배열을 유지한다', async () => {
    mockFetchCategories.mockRejectedValue(new Error('Network error'))
    mockFetchChurches.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useGalleryWrite())

    await waitFor(() => {
      expect(result.current.churchesLoading).toBe(false)
    })

    expect(result.current.categories).toEqual([])
    expect(result.current.churches).toEqual([])
  })
})

describe('useGalleryWrite 카테고리 선택', () => {
  it('카테고리 선택 시 세부 카테고리를 불러온다', async () => {
    const { result } = renderHook(() => useGalleryWrite())

    act(() => {
      result.current.setSelectedCategory('RETREAT')
    })

    await waitFor(() => {
      expect(result.current.subCategories).toEqual(mockSubCategories)
    })

    expect(mockFetchSubCategories).toHaveBeenCalledWith('RETREAT')
  })

  it('카테고리 변경 시 세부 카테고리 선택이 초기화된다', async () => {
    const { result } = renderHook(() => useGalleryWrite())

    act(() => {
      result.current.setSelectedCategory('RETREAT')
    })

    await waitFor(() => {
      expect(result.current.subCategories).toEqual(mockSubCategories)
    })

    act(() => {
      result.current.setSelectedSubCategory('RETREAT_2026_WINTER')
    })

    expect(result.current.selectedSubCategory).toBe('RETREAT_2026_WINTER')

    act(() => {
      result.current.setSelectedCategory('')
    })

    expect(result.current.subCategories).toEqual([])
    expect(result.current.selectedSubCategory).toBe('')
  })
})

describe('useGalleryWrite 해시태그', () => {
  it('해시태그를 추가할 수 있다', () => {
    const { result } = renderHook(() => useGalleryWrite())

    act(() => {
      result.current.addHashtag('수련회')
    })

    expect(result.current.hashtags).toEqual(['수련회'])
  })

  it('중복 해시태그는 추가되지 않는다', () => {
    const { result } = renderHook(() => useGalleryWrite())

    act(() => {
      result.current.addHashtag('수련회')
      result.current.addHashtag('수련회')
    })

    expect(result.current.hashtags).toEqual(['수련회'])
  })

  it('빈 해시태그는 추가되지 않는다', () => {
    const { result } = renderHook(() => useGalleryWrite())

    act(() => {
      result.current.addHashtag('  ')
    })

    expect(result.current.hashtags).toEqual([])
  })

  it('해시태그를 삭제할 수 있다', () => {
    const { result } = renderHook(() => useGalleryWrite())

    act(() => {
      result.current.addHashtag('수련회')
      result.current.addHashtag('은혜')
    })

    act(() => {
      result.current.removeHashtag('수련회')
    })

    expect(result.current.hashtags).toEqual(['은혜'])
  })
})

describe('useGalleryWrite 성전 토글', () => {
  it('성전을 선택/해제할 수 있다', () => {
    const { result } = renderHook(() => useGalleryWrite())

    act(() => {
      result.current.toggleChurch('ANYANG')
    })

    expect(result.current.selectedChurches).toEqual(['ANYANG'])

    act(() => {
      result.current.toggleChurch('ANYANG')
    })

    expect(result.current.selectedChurches).toEqual([])
  })

  it('여러 성전을 선택할 수 있다', () => {
    const { result } = renderHook(() => useGalleryWrite())

    act(() => {
      result.current.toggleChurch('ANYANG')
      result.current.toggleChurch('SUWON')
    })

    expect(result.current.selectedChurches).toEqual(['ANYANG', 'SUWON'])
  })
})

describe('useGalleryWrite 이미지 업로드', () => {
  it('이미지를 추가하면 업로드 파이프라인이 시작된다', async () => {
    const { result } = renderHook(() => useGalleryWrite())

    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

    act(() => {
      result.current.addImages([file])
    })

    expect(result.current.images).toHaveLength(1)
    expect(result.current.images[0].file).toBe(file)
    expect(mockCreateObjectURL).toHaveBeenCalledWith(file)

    await waitFor(() => {
      expect(result.current.images[0].status).toBe('done')
    })

    expect(mockCompressImage).toHaveBeenCalledWith(file)
    expect(mockGetPresignedUrl).toHaveBeenCalled()
    expect(mockUploadToS3).toHaveBeenCalled()
    expect(result.current.images[0].fileId).toBe(1)
  })

  it('이미지를 삭제하면 object URL이 해제된다', async () => {
    const { result } = renderHook(() => useGalleryWrite())

    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

    act(() => {
      result.current.addImages([file])
    })

    const imageId = result.current.images[0].id

    act(() => {
      result.current.removeImage(imageId)
    })

    expect(result.current.images).toHaveLength(0)
    expect(mockRevokeObjectURL).toHaveBeenCalled()
  })

  it('압축 실패 시 이미지 상태가 error가 된다', async () => {
    mockCompressImage.mockRejectedValue(new Error('압축 실패'))

    const { result } = renderHook(() => useGalleryWrite())

    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

    act(() => {
      result.current.addImages([file])
    })

    await waitFor(() => {
      expect(result.current.images[0].status).toBe('error')
    })

    expect(result.current.images[0].error).toBe('압축 실패')
  })

  it('S3 업로드 실패 시 이미지 상태가 error가 된다', async () => {
    mockUploadToS3.mockRejectedValue(new Error('업로드에 실패했습니다. (500)'))

    const { result } = renderHook(() => useGalleryWrite())

    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

    act(() => {
      result.current.addImages([file])
    })

    await waitFor(() => {
      expect(result.current.images[0].status).toBe('error')
    })

    expect(result.current.images[0].error).toBe('업로드에 실패했습니다. (500)')
  })
})

describe('useGalleryWrite 게시글 등록', () => {
  it('카테고리 미선택 시 에러 메시지를 표시한다', async () => {
    const { result } = renderHook(() => useGalleryWrite())

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(result.current.submitError).toBe('카테고리를 선택해주세요.')
    expect(mockCreatePost).not.toHaveBeenCalled()
  })

  it('업로드 진행 중이면 제출을 막는다', async () => {
    // Make upload never resolve
    mockCompressImage.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useGalleryWrite())

    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

    act(() => {
      result.current.setSelectedCategory('RETREAT')
    })

    await waitFor(() => {
      expect(result.current.subCategories).toEqual(mockSubCategories)
    })

    act(() => {
      result.current.setSelectedSubCategory('RETREAT_2026_WINTER')
      result.current.addImages([file])
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(result.current.submitError).toBe('이미지 업로드가 진행 중입니다. 잠시 후 다시 시도해주세요.')
    expect(mockCreatePost).not.toHaveBeenCalled()
  })

  it('게시글을 성공적으로 등록하면 갤러리로 이동한다', async () => {
    const { result } = renderHook(() => useGalleryWrite())

    act(() => {
      result.current.setSelectedCategory('RETREAT')
    })

    await waitFor(() => {
      expect(result.current.subCategories).toEqual(mockSubCategories)
    })

    act(() => {
      result.current.setSelectedSubCategory('RETREAT_2026_WINTER')
      result.current.setContent('수련회 후기입니다')
      result.current.addHashtag('수련회')
      result.current.toggleChurch('ANYANG')
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockCreatePost).toHaveBeenCalledWith({
      subCategory: 'RETREAT_2026_WINTER',
      content: '수련회 후기입니다',
      hashtags: ['수련회'],
      churches: ['ANYANG'],
      imageIds: undefined,
    })
    expect(mockNavigate).toHaveBeenCalledWith('/gallery')
    expect(result.current.isSubmitting).toBe(false)
  })

  it('게시글 등록 실패 시 에러 메시지를 표시한다', async () => {
    mockCreatePost.mockRejectedValue(new Error('서버 오류'))

    const { result } = renderHook(() => useGalleryWrite())

    act(() => {
      result.current.setSelectedCategory('RETREAT')
    })

    await waitFor(() => {
      expect(result.current.subCategories).toEqual(mockSubCategories)
    })

    act(() => {
      result.current.setSelectedSubCategory('RETREAT_2026_WINTER')
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(result.current.submitError).toBe('서버 오류')
    expect(result.current.isSubmitting).toBe(false)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('이미지가 업로드 완료된 경우 imageIds를 포함하여 등록한다', async () => {
    const { result } = renderHook(() => useGalleryWrite())

    const file = new File(['test'], 'photo.jpg', { type: 'image/jpeg' })

    act(() => {
      result.current.setSelectedCategory('RETREAT')
    })

    await waitFor(() => {
      expect(result.current.subCategories).toEqual(mockSubCategories)
    })

    act(() => {
      result.current.setSelectedSubCategory('RETREAT_2026_WINTER')
      result.current.addImages([file])
    })

    await waitFor(() => {
      expect(result.current.images[0]?.status).toBe('done')
    })

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(mockCreatePost).toHaveBeenCalledWith(
      expect.objectContaining({
        subCategory: 'RETREAT_2026_WINTER',
        imageIds: [1],
      })
    )
    expect(mockNavigate).toHaveBeenCalledWith('/gallery')
  })
})
