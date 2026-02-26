import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GalleryPage } from '../GalleryPage'
import { useGallery } from '../../model/useGallery'
import type { GalleryPhotoItem, SubCategory } from '../../model/types'

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

const mockSubCategories: SubCategory[] = [
  {
    name: 'RETREAT_2026_WINTER',
    displayName: '2026 겨울 수련회 (새 힘을 바라보라)',
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

const defaultGallery = {
  photos: mockPhotos,
  isLoading: false,
  isFetchingMore: false,
  error: null,
  hasNext: true,
  loadMore: jest.fn(),
  selectedCategory: 'ALL' as const,
  setSelectedCategory: jest.fn(),
  subCategories: [] as SubCategory[],
  selectedSubCategory: null as string | null,
  selectSubCategory: jest.fn(),
  isLoadingSubCategories: false,
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

describe('GalleryPage 사진 수 표시', () => {
  it('사진 목록 상단에 총 사진 수가 표시된다', () => {
    mockUseGallery.mockReturnValue({ ...defaultGallery, hasNext: false })

    render(<GalleryPage />)

    expect(screen.getByText('총 3장의 사진')).toBeInTheDocument()
  })

  it('더 불러올 사진이 있으면 +가 붙는다', () => {
    mockUseGallery.mockReturnValue({ ...defaultGallery, hasNext: true })

    render(<GalleryPage />)

    expect(screen.getByText('총 3장+의 사진')).toBeInTheDocument()
  })

  it('사진이 추가 로드되면 수가 업데이트된다', () => {
    const morePhotos: GalleryPhotoItem[] = [
      ...mockPhotos,
      { id: 39, url: 'uploads/photo4.jpg' },
      { id: 38, url: 'uploads/photo5.jpg' },
    ]
    mockUseGallery.mockReturnValue({ ...defaultGallery, photos: morePhotos, hasNext: false })

    render(<GalleryPage />)

    expect(screen.getByText('총 5장의 사진')).toBeInTheDocument()
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

describe('GalleryPage 수련회 히어로 배너', () => {
  const retreatGallery = {
    ...defaultGallery,
    selectedCategory: 'RETREAT' as const,
    subCategories: mockSubCategories,
    selectedSubCategory: 'RETREAT_2026_WINTER',
  }

  it('수련회 탭에서 선택된 서브카테고리의 행사명이 표시된다', () => {
    mockUseGallery.mockReturnValue(retreatGallery)

    render(<GalleryPage />)

    expect(screen.getByText('2026 겨울 수련회 (새 힘을 바라보라)')).toBeInTheDocument()
  })

  it('수련회 탭에서 선택된 서브카테고리의 기간이 표시된다', () => {
    mockUseGallery.mockReturnValue(retreatGallery)

    render(<GalleryPage />)

    expect(screen.getByText('2026.01.29 - 2026.01.31')).toBeInTheDocument()
  })

  it('수련회 탭에서 RETREAT 라벨이 표시된다', () => {
    mockUseGallery.mockReturnValue(retreatGallery)

    render(<GalleryPage />)

    expect(screen.getByText('RETREAT')).toBeInTheDocument()
  })

  it('서브카테고리가 2개 이상이면 "다른 행사 보기" 버튼이 표시된다', () => {
    mockUseGallery.mockReturnValue(retreatGallery)

    render(<GalleryPage />)

    expect(screen.getByRole('button', { name: /다른 행사 보기/ })).toBeInTheDocument()
  })

  it('서브카테고리가 1개면 "다른 행사 보기" 버튼이 표시되지 않는다', () => {
    mockUseGallery.mockReturnValue({
      ...retreatGallery,
      subCategories: [mockSubCategories[0]],
    })

    render(<GalleryPage />)

    expect(screen.queryByRole('button', { name: /다른 행사 보기/ })).not.toBeInTheDocument()
  })

  it('ALL 탭에서는 히어로 배너가 표시되지 않는다', () => {
    mockUseGallery.mockReturnValue(defaultGallery)

    render(<GalleryPage />)

    expect(screen.queryByText('RETREAT')).not.toBeInTheDocument()
  })
})

describe('GalleryPage 수련회 행사 선택 모달', () => {
  const retreatGallery = {
    ...defaultGallery,
    selectedCategory: 'RETREAT' as const,
    subCategories: mockSubCategories,
    selectedSubCategory: 'RETREAT_2026_WINTER',
  }

  it('"다른 행사 보기" 클릭 시 모달이 열린다', async () => {
    mockUseGallery.mockReturnValue(retreatGallery)

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /다른 행사 보기/ }))

    expect(screen.getByText('수련회 행사 목록')).toBeInTheDocument()
  })

  it('모달에 모든 서브카테고리가 표시된다', async () => {
    mockUseGallery.mockReturnValue(retreatGallery)

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /다른 행사 보기/ }))

    expect(screen.getByText('2025 여름 수련회')).toBeInTheDocument()
    expect(screen.getByText('2025.07.10 - 2025.07.12')).toBeInTheDocument()
  })

  it('현재 선택된 행사에 "현재 보고 있는 행사" 라벨이 표시된다', async () => {
    mockUseGallery.mockReturnValue(retreatGallery)

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /다른 행사 보기/ }))

    expect(screen.getByText('현재 보고 있는 행사')).toBeInTheDocument()
  })

  it('다른 행사를 클릭하면 selectSubCategory가 호출되고 모달이 닫힌다', async () => {
    const mockSelectSubCategory = jest.fn()
    mockUseGallery.mockReturnValue({
      ...retreatGallery,
      selectSubCategory: mockSelectSubCategory,
    })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /다른 행사 보기/ }))
    await userEvent.click(screen.getByText('2025 여름 수련회'))

    expect(mockSelectSubCategory).toHaveBeenCalledWith('RETREAT_2025_SUMMER')
    expect(screen.queryByText('수련회 행사 목록')).not.toBeInTheDocument()
  })

  it('X 버튼 클릭 시 모달이 닫힌다', async () => {
    mockUseGallery.mockReturnValue(retreatGallery)

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /다른 행사 보기/ }))
    expect(screen.getByText('수련회 행사 목록')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '닫기' }))

    expect(screen.queryByText('수련회 행사 목록')).not.toBeInTheDocument()
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
