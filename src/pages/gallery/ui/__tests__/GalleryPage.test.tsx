import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GalleryPage } from '../GalleryPage'
import { useGallery } from '../../model/useGallery'
import type { GalleryAlbum } from '../../model/types'

jest.mock('../../../../widgets/header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}))

jest.mock('../../model/useGallery', () => ({
  useGallery: jest.fn(),
}))

const mockUseGallery = useGallery as jest.MockedFunction<typeof useGallery>

const mockAlbums: GalleryAlbum[] = [
  {
    id: '1',
    title: '겨울수련회 · 새 힘을 얻으라',
    date: '2026.01.29 - 01.31',
    dateFormatted: '2026년 1월 31일',
    category: 'RETREAT',
    photoCount: 48,
    photos: [
      { id: 'p1', url: '/gallery/photo1.jpg' },
      { id: 'p2', url: '/gallery/photo2.jpg' },
    ],
    caption: '겨울수련회 둘째 날 함께한 예배의 순간들',
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
    photos: [{ id: 'p3', url: '/gallery/photo3.jpg' }],
    caption: '성탄절 예배의 은혜',
    tags: ['성탄절'],
    likeCount: 18,
  },
]

const defaultGallery = {
  albums: mockAlbums,
  isLoading: false,
  error: null,
  selectedCategory: 'ALL' as const,
  setSelectedCategory: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseGallery.mockReturnValue(defaultGallery)
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

    // 그리드 뷰에서는 앨범 제목과 사진 수가 표시된다
    expect(screen.getByText('48장의 사진')).toBeInTheDocument()
    expect(screen.getByText('겨울수련회 · 새 힘을 얻으라')).toBeInTheDocument()
  })

  it('피드 뷰로 전환하면 피드 카드가 표시된다', async () => {
    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    // 피드 뷰에서는 GNTC-YOUTH 아바타와 캡션이 표시된다
    expect(screen.getAllByText('GNTC-YOUTH')).toHaveLength(2)
    expect(screen.getByText('겨울수련회 둘째 날 함께한 예배의 순간들')).toBeInTheDocument()
    expect(screen.getByText('#겨울수련회 #GNTC청년')).toBeInTheDocument()
  })

  it('피드 뷰에서 다시 갤러리 뷰로 전환된다', async () => {
    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))
    await userEvent.click(screen.getByRole('button', { name: /갤러리/ }))

    expect(screen.getByText('48장의 사진')).toBeInTheDocument()
  })
})

describe('GalleryPage 로딩/에러 상태', () => {
  it('로딩 중에는 스피너가 표시된다', () => {
    mockUseGallery.mockReturnValue({ ...defaultGallery, albums: [], isLoading: true })

    render(<GalleryPage />)

    expect(screen.queryByText('48장의 사진')).not.toBeInTheDocument()
  })

  it('에러 시 에러 메시지가 표시된다', () => {
    mockUseGallery.mockReturnValue({
      ...defaultGallery,
      albums: [],
      error: '갤러리를 불러오는데 실패했습니다.',
    })

    render(<GalleryPage />)

    expect(screen.getByText('갤러리를 불러오는데 실패했습니다.')).toBeInTheDocument()
  })

  it('앨범이 없으면 빈 상태 메시지가 표시된다', () => {
    mockUseGallery.mockReturnValue({ ...defaultGallery, albums: [] })

    render(<GalleryPage />)

    expect(screen.getByText('아직 등록된 갤러리가 없습니다.')).toBeInTheDocument()
  })
})

describe('GalleryPage 피드 뷰 상세', () => {
  it('좋아요 수가 표시된다', async () => {
    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(screen.getByText(/24명이 좋아합니다/)).toBeInTheDocument()
    expect(screen.getByText(/18명이 좋아합니다/)).toBeInTheDocument()
  })

  it('액션 버튼들이 표시된다', async () => {
    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(screen.getAllByLabelText('좋아요')).toHaveLength(2)
    expect(screen.getAllByLabelText('댓글')).toHaveLength(2)
    expect(screen.getAllByLabelText('공유')).toHaveLength(2)
    expect(screen.getAllByLabelText('저장')).toHaveLength(2)
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
