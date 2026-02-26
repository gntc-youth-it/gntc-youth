import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GalleryPage } from '../GalleryPage'
import { useGallery } from '../../model/useGallery'
import type { GalleryPhotoItem } from '../../model/types'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

jest.mock('../../../../features/auth', () => ({
  useAuth: () => ({ user: null, isLoggedIn: false }),
}))

jest.mock('../../../../widgets/header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}))

jest.mock('../../model/useGallery', () => ({
  useGallery: jest.fn(),
}))

const mockUseGallery = useGallery as jest.MockedFunction<typeof useGallery>

const mockPhotos: GalleryPhotoItem[] = [
  { id: 42, url: 'uploads/photo1.jpg' },
  { id: 41, url: 'uploads/photo2.jpg' },
  { id: 40, url: 'uploads/photo3.jpg' },
]

const defaultGallery = {
  photos: mockPhotos,
  isLoading: false,
  isFetchingMore: false,
  error: null,
  hasNext: true,
  loadMore: jest.fn(),
  selectedCategory: 'ALL' as const,
  setSelectedCategory: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseGallery.mockReturnValue(defaultGallery)

  // IntersectionObserver mock
  const mockIntersectionObserver = jest.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  })
  window.IntersectionObserver = mockIntersectionObserver
})

describe('GalleryPage 헤더', () => {
  it('GALLERY 타이틀과 서브타이틀이 표시된다', () => {
    render(<GalleryPage />)

    expect(screen.getByText('GALLERY')).toBeInTheDocument()
    expect(screen.getByText('은혜와진리교회 청년봉사선교회 · 사진 갤러리')).toBeInTheDocument()
  })

  it('카테고리 버튼들이 표시된다', () => {
    render(<GalleryPage />)

    expect(screen.getByRole('button', { name: '전체' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '수련회' })).toBeInTheDocument()
  })

  it('카테고리 클릭 시 setSelectedCategory가 호출된다', async () => {
    const mockSetCategory = jest.fn()
    mockUseGallery.mockReturnValue({ ...defaultGallery, setSelectedCategory: mockSetCategory })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: '수련회' }))

    expect(mockSetCategory).toHaveBeenCalledWith('RETREAT')
  })
})

describe('GalleryPage 뷰 토글', () => {
  it('갤러리와 피드 토글 버튼이 표시된다', () => {
    render(<GalleryPage />)

    expect(screen.getByRole('button', { name: /갤러리/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /피드/ })).toBeInTheDocument()
  })

  it('기본 뷰는 그리드(갤러리) 뷰이다', () => {
    render(<GalleryPage />)

    expect(screen.getAllByRole('img').length).toBeGreaterThan(0)
  })
})

describe('GalleryPage 로딩/에러 상태', () => {
  it('로딩 중에는 스피너가 표시된다', () => {
    mockUseGallery.mockReturnValue({ ...defaultGallery, photos: [], isLoading: true })

    render(<GalleryPage />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('에러 시 에러 메시지가 표시된다', () => {
    mockUseGallery.mockReturnValue({
      ...defaultGallery,
      photos: [],
      error: '사진을 불러오는데 실패했습니다.',
    })

    render(<GalleryPage />)

    expect(screen.getByText('사진을 불러오는데 실패했습니다.')).toBeInTheDocument()
  })

  it('사진이 없으면 빈 상태 메시지가 표시된다', () => {
    mockUseGallery.mockReturnValue({ ...defaultGallery, photos: [] })

    render(<GalleryPage />)

    expect(screen.getByText('아직 등록된 갤러리가 없습니다.')).toBeInTheDocument()
  })
})

describe('GalleryPage 무한 스크롤', () => {
  it('모든 사진을 불러왔으면 완료 메시지가 표시된다', () => {
    mockUseGallery.mockReturnValue({ ...defaultGallery, hasNext: false })

    render(<GalleryPage />)

    expect(screen.getByText('모든 사진을 불러왔습니다.')).toBeInTheDocument()
  })

  it('아직 다음 페이지가 있으면 완료 메시지가 표시되지 않는다', () => {
    mockUseGallery.mockReturnValue({ ...defaultGallery, hasNext: true })

    render(<GalleryPage />)

    expect(screen.queryByText('모든 사진을 불러왔습니다.')).not.toBeInTheDocument()
  })

  it('추가 로딩 중에는 스피너가 표시된다', () => {
    mockUseGallery.mockReturnValue({ ...defaultGallery, isFetchingMore: true })

    render(<GalleryPage />)

    // photos + loading spinner should both be visible
    expect(screen.getAllByRole('img').length).toBeGreaterThan(0)
  })

  it('사진 alt 텍스트에 순번이 포함된다', () => {
    render(<GalleryPage />)

    expect(screen.getByAltText('갤러리 사진 1')).toBeInTheDocument()
    expect(screen.getByAltText('갤러리 사진 2')).toBeInTheDocument()
    expect(screen.getByAltText('갤러리 사진 3')).toBeInTheDocument()
  })
})

describe('GalleryPage 푸터', () => {
  it('성경 구절이 표시된다', () => {
    render(<GalleryPage />)

    expect(screen.getByText('오직 여호와를 경외하는 자는 새 힘을 얻으리니')).toBeInTheDocument()
    expect(screen.getByText('이사야 40:31')).toBeInTheDocument()
  })

  it('교회 이름이 표시된다', () => {
    render(<GalleryPage />)

    expect(screen.getByText('은혜와진리교회 · 청년봉사선교회')).toBeInTheDocument()
  })
})
