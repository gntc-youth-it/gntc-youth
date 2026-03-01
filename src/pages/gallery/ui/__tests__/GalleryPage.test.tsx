import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GalleryPage } from '../GalleryPage'
import { useGallery } from '../../model/useGallery'
import { useFeed } from '../../model/useFeed'
import { deletePost } from '../../api/galleryApi'
import { buildCdnUrl } from '../../../../shared/lib'
import type { GalleryPhotoItem, SubCategory, FeedPost } from '../../model/types'

const mockNavigate = jest.fn()
const mockSearchParams = new URLSearchParams()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
}))

const mockUseAuth = jest.fn()
jest.mock('../../../../features/auth', () => ({
  useAuth: () => mockUseAuth(),
}))

jest.mock('../../api/galleryApi', () => ({
  ...jest.requireActual('../../api/galleryApi'),
  deletePost: jest.fn(),
}))

const mockDeletePost = deletePost as jest.MockedFunction<typeof deletePost>

jest.mock('../../../../widgets/header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}))

jest.mock('../../model/useGallery', () => ({
  useGallery: jest.fn(),
}))

jest.mock('../../model/useFeed', () => ({
  useFeed: jest.fn(),
}))

const mockUseGallery = useGallery as jest.MockedFunction<typeof useGallery>
const mockUseFeed = useFeed as jest.MockedFunction<typeof useFeed>

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
    verse: {
      bookName: 'ISAIAH',
      bookDisplayName: '이사야',
      chapter: 40,
      verse: 31,
      content: '오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리가 날개치며 올라감 같을 것이요 달려도 곤비하지 아니하겠고 걸어도 피곤하지 아니하리로다',
    },
  },
  {
    name: 'RETREAT_2025_SUMMER',
    displayName: '2025 여름 수련회',
    imageUrl: 'assets/2025-summer-poster.webp',
    startDate: '2025-07-10',
    endDate: '2025-07-12',
  },
]

const mockFeedPosts: FeedPost[] = [
  {
    id: 10,
    authorId: 1,
    authorName: '홍길동',
    authorProfileImageUrl: 'uploads/profile1.jpg',
    isAuthorPublic: true,
    subCategory: 'RETREAT_2026_WINTER',
    category: 'RETREAT',
    status: 'APPROVED',
    content: '수련회 후기입니다',
    hashtags: ['#수련회', '#부흥'],
    churches: ['ANYANG'],
    images: [
      { fileId: 5, filePath: 'uploads/abc.jpg', sortOrder: 1 },
      { fileId: 6, filePath: 'uploads/def.jpg', sortOrder: 2 },
    ],
    commentCount: 3,
    createdAt: '2026-02-26T10:30:00',
  },
  {
    id: 8,
    authorId: 2,
    authorName: '김영희',
    authorProfileImageUrl: null,
    isAuthorPublic: false,
    subCategory: 'RETREAT_2026_WINTER',
    category: 'RETREAT',
    status: 'APPROVED',
    content: '은혜로운 시간이었습니다',
    hashtags: ['#감사'],
    churches: ['SUWON'],
    images: [{ fileId: 7, filePath: 'uploads/ghi.jpg', sortOrder: 1 }],
    commentCount: 0,
    createdAt: '2026-02-25T14:00:00',
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
  selectedChurchId: '',
  selectChurch: jest.fn(),
  churchOptions: [] as { id: string; name: string }[],
  isLoadingChurches: false,
}

const defaultFeed = {
  posts: [] as FeedPost[],
  isLoading: false,
  isFetchingMore: false,
  error: null,
  hasNext: true,
  loadFeed: jest.fn(),
  loadMore: jest.fn(),
  reset: jest.fn(),
  removePost: jest.fn(),
  loaded: false,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false })
  mockUseGallery.mockReturnValue(defaultGallery)
  mockUseFeed.mockReturnValue(defaultFeed)
  mockDeletePost.mockResolvedValue(undefined)

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

  it('수련회 탭에서 주제말씀이 표시된다', () => {
    mockUseGallery.mockReturnValue(retreatGallery)

    render(<GalleryPage />)

    expect(
      screen.getByText(
        '오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리가 날개치며 올라감 같을 것이요 달려도 곤비하지 아니하겠고 걸어도 피곤하지 아니하리로다 (이사야 40장 31절)',
      ),
    ).toBeInTheDocument()
  })

  it('verse가 없는 서브카테고리에서는 주제말씀이 표시되지 않는다', () => {
    mockUseGallery.mockReturnValue({
      ...retreatGallery,
      selectedSubCategory: 'RETREAT_2025_SUMMER',
    })

    render(<GalleryPage />)

    expect(screen.queryByText(/이사야 40장 31절/)).not.toBeInTheDocument()
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

  it('모달에서 주제말씀이 있는 행사에는 말씀이 표시된다', async () => {
    mockUseGallery.mockReturnValue(retreatGallery)

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /다른 행사 보기/ }))

    const verseElements = screen.getAllByText(
      /오직 여호와를 앙망하는 자는 새 힘을 얻으리니.*\(이사야 40장 31절\)/,
    )
    // 배너 + 모달 총 2개
    expect(verseElements.length).toBe(2)
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

describe('GalleryPage 피드 뷰', () => {
  it('피드 뷰 전환 시 피드 카드가 표시된다', async () => {
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: mockFeedPosts })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(screen.getByText('홍길동')).toBeInTheDocument()
    expect(screen.getByText('수련회 후기입니다')).toBeInTheDocument()
    // 김영희는 isAuthorPublic: false이므로 GNTC YOUTH로 표시
    expect(screen.queryByText('김영희')).not.toBeInTheDocument()
    expect(screen.getByText('GNTC YOUTH')).toBeInTheDocument()
    expect(screen.getByText('은혜로운 시간이었습니다')).toBeInTheDocument()
  })

  it('피드 카드에 해시태그가 표시된다', async () => {
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: mockFeedPosts })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(screen.getByText('#수련회 #부흥')).toBeInTheDocument()
    expect(screen.getByText('#감사')).toBeInTheDocument()
  })

  it('댓글이 있는 피드 카드에 댓글 수가 표시된다', async () => {
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: mockFeedPosts })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(screen.getByText('댓글 3개')).toBeInTheDocument()
  })

  it('댓글이 없는 피드 카드에는 댓글 수가 표시되지 않는다', async () => {
    const postWithoutComments = [{ ...mockFeedPosts[1] }] // commentCount: 0
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: postWithoutComments })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(screen.queryByText(/댓글 0개/)).not.toBeInTheDocument()
  })

  it('피드 뷰에서 피드가 없으면 빈 상태 메시지가 표시된다', async () => {
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [] })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(screen.getByText('아직 등록된 피드가 없습니다.')).toBeInTheDocument()
  })

  it('피드 뷰에서 에러 시 에러 메시지가 표시된다', async () => {
    mockUseFeed.mockReturnValue({
      ...defaultFeed,
      posts: [],
      error: '피드를 불러오는데 실패했습니다.',
    })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(screen.getByText('피드를 불러오는데 실패했습니다.')).toBeInTheDocument()
  })

  it('피드 뷰에서 모든 피드를 불러왔으면 완료 메시지가 표시된다', async () => {
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: mockFeedPosts, hasNext: false })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(screen.getByText('모든 피드를 불러왔습니다.')).toBeInTheDocument()
  })

  it('피드 뷰에서 다음 페이지가 있으면 완료 메시지가 표시되지 않는다', async () => {
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: mockFeedPosts, hasNext: true })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(screen.queryByText('모든 피드를 불러왔습니다.')).not.toBeInTheDocument()
  })

  it('피드 카드에 작성자 프로필 이미지가 표시된다', async () => {
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [mockFeedPosts[0]] })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    const profileImg = screen.getByAltText('홍길동')
    expect(profileImg).toHaveAttribute('src', buildCdnUrl(mockFeedPosts[0].authorProfileImageUrl!))
  })

  it('그리드 뷰로 전환하면 피드 카드가 사라진다', async () => {
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: mockFeedPosts })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))
    expect(screen.getByText('홍길동')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /갤러리/ }))
    expect(screen.queryByText('홍길동')).not.toBeInTheDocument()
  })
})

describe('GalleryPage 작성자 공개 여부', () => {
  it('isAuthorPublic: true인 게시글은 실제 작성자 이름을 표시한다', async () => {
    const publicPost: FeedPost = {
      ...mockFeedPosts[0],
      isAuthorPublic: true,
      authorName: '홍길동',
      authorProfileImageUrl: 'uploads/profile1.jpg',
    }
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [publicPost] })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(screen.getByText('홍길동')).toBeInTheDocument()
    expect(screen.getByAltText('홍길동')).toBeInTheDocument() // 프로필 이미지
    expect(screen.queryByText('GNTC YOUTH')).not.toBeInTheDocument()
  })

  it('isAuthorPublic: false인 게시글은 GNTC YOUTH로 표시한다', async () => {
    const privatePost: FeedPost = {
      ...mockFeedPosts[0],
      isAuthorPublic: false,
      authorName: '홍길동',
    }
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [privatePost] })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(screen.getByText('GNTC YOUTH')).toBeInTheDocument()
    expect(screen.queryByText('홍길동')).not.toBeInTheDocument()
    // GNTC YOUTH 로고 이미지가 있는지 확인
    expect(screen.getByAltText('GNTC Youth')).toBeInTheDocument()
  })

  it('isAuthorPublic: false인 게시글에 프로필 이미지 대신 로고가 표시된다', async () => {
    const privatePost: FeedPost = {
      ...mockFeedPosts[0],
      isAuthorPublic: false,
      authorName: '홍길동',
    }
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [privatePost] })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    // 프로필 이미지가 표시되지 않아야 함
    expect(screen.queryByAltText('홍길동')).not.toBeInTheDocument()
    // 로고 이미지가 표시되어야 함
    const logo = screen.getByAltText('GNTC Youth')
    expect(logo).toHaveAttribute('src', 'https://cdn.gntc-youth.com/assets/gntc-youth-logo-black.webp')
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

describe('GalleryPage 이미지 라이트박스', () => {
  it('그리드 뷰에서 사진 클릭 시 라이트박스가 열린다', async () => {
    render(<GalleryPage />)

    await userEvent.click(screen.getByAltText('갤러리 사진 1'))

    expect(screen.getByAltText('확대 사진')).toBeInTheDocument()
  })

  it('라이트박스에 클릭한 이미지가 원본 크기로 표시된다', async () => {
    render(<GalleryPage />)

    await userEvent.click(screen.getByAltText('갤러리 사진 1'))

    const lightboxImg = screen.getByAltText('확대 사진')
    expect(lightboxImg).toHaveAttribute('src', 'https://cdn.gntc-youth.com/uploads/photo1.jpg')
    expect(lightboxImg).toHaveClass('object-contain')
  })

  it('라이트박스 닫기 버튼 클릭 시 닫힌다', async () => {
    render(<GalleryPage />)

    await userEvent.click(screen.getByAltText('갤러리 사진 1'))
    expect(screen.getByAltText('확대 사진')).toBeInTheDocument()

    await userEvent.click(screen.getByLabelText('닫기'))

    expect(screen.queryByAltText('확대 사진')).not.toBeInTheDocument()
  })

  it('ESC 키로 라이트박스가 닫힌다', async () => {
    render(<GalleryPage />)

    await userEvent.click(screen.getByAltText('갤러리 사진 1'))
    expect(screen.getByAltText('확대 사진')).toBeInTheDocument()

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByAltText('확대 사진')).not.toBeInTheDocument()
  })

  it('피드 뷰에서 사진 클릭 시 라이트박스가 열린다', async () => {
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: mockFeedPosts })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))
    await userEvent.click(screen.getAllByAltText('사진 1')[0])

    expect(screen.getByAltText('확대 사진')).toBeInTheDocument()
  })

  it('배경 클릭 시 라이트박스가 닫힌다', async () => {
    render(<GalleryPage />)

    await userEvent.click(screen.getByAltText('갤러리 사진 1'))
    expect(screen.getByAltText('확대 사진')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('lightbox-overlay'))

    expect(screen.queryByAltText('확대 사진')).not.toBeInTheDocument()
  })

  it('라이트박스가 열리면 배경 스크롤이 비활성화된다', async () => {
    render(<GalleryPage />)

    await userEvent.click(screen.getByAltText('갤러리 사진 1'))

    expect(document.body.style.overflow).toBe('hidden')
  })

  it('라이트박스가 닫히면 배경 스크롤이 복원된다', async () => {
    render(<GalleryPage />)

    await userEvent.click(screen.getByAltText('갤러리 사진 1'))
    expect(document.body.style.overflow).toBe('hidden')

    await userEvent.keyboard('{Escape}')

    expect(document.body.style.overflow).toBe('')
  })
})

describe('GalleryPage 피드 영상 재생', () => {
  const mockFeedPostWithVideo: FeedPost = {
    id: 12,
    authorId: 1,
    authorName: '홍길동',
    authorProfileImageUrl: 'uploads/profile1.jpg',
    isAuthorPublic: true,
    subCategory: 'RETREAT_2026_WINTER',
    category: 'RETREAT',
    status: 'APPROVED',
    content: '수련회 영상입니다',
    hashtags: ['#수련회'],
    churches: ['ANYANG'],
    images: [
      { fileId: 10, filePath: 'uploads/video1.mp4', sortOrder: 1 },
      { fileId: 11, filePath: 'uploads/photo1.jpg', sortOrder: 2 },
    ],
    commentCount: 1,
    createdAt: '2026-02-26T12:00:00',
  }

  it('영상 URL이 포함된 피드에서 video 태그가 렌더링된다', async () => {
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [mockFeedPostWithVideo] })

    const { container } = render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(container.querySelector('video')).toBeInTheDocument()
  })

  it('이미지 URL은 img 태그로 렌더링된다', async () => {
    const imageOnlyPost: FeedPost = {
      ...mockFeedPostWithVideo,
      images: [{ fileId: 11, filePath: 'uploads/photo1.jpg', sortOrder: 1 }],
    }
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [imageOnlyPost] })

    const { container } = render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(container.querySelector('video')).not.toBeInTheDocument()
    expect(screen.getByAltText('사진 1')).toBeInTheDocument()
  })

  it('영상에 음소거 토글 버튼이 표시된다', async () => {
    const videoOnlyPost: FeedPost = {
      ...mockFeedPostWithVideo,
      images: [{ fileId: 10, filePath: 'uploads/video1.mp4', sortOrder: 1 }],
    }
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [videoOnlyPost] })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(screen.getByLabelText('소리 켜기')).toBeInTheDocument()
  })

  it('영상이 loop과 muted 속성을 가진다', async () => {
    const videoOnlyPost: FeedPost = {
      ...mockFeedPostWithVideo,
      images: [{ fileId: 10, filePath: 'uploads/video1.mp4', sortOrder: 1 }],
    }
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [videoOnlyPost] })

    const { container } = render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    const video = container.querySelector('video')
    expect(video).toHaveAttribute('loop')
  })

  it('이미지와 영상이 혼합된 캐러셀에서 dot indicator가 정상 표시된다', async () => {
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [mockFeedPostWithVideo] })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    // 2개 미디어 아이템 → dot 2개
    const dots = screen.getAllByLabelText(/사진 \d/)
    expect(dots).toHaveLength(2)
  })
})

describe('GalleryPage 라이트박스 영상 소리 겹침 방지', () => {
  const videoOnlyPost: FeedPost = {
    id: 12,
    authorId: 1,
    authorName: '홍길동',
    authorProfileImageUrl: 'uploads/profile1.jpg',
    isAuthorPublic: true,
    subCategory: 'RETREAT_2026_WINTER',
    category: 'RETREAT',
    status: 'APPROVED',
    content: '수련회 영상입니다',
    hashtags: ['#수련회'],
    churches: ['ANYANG'],
    images: [{ fileId: 10, filePath: 'uploads/video1.mp4', sortOrder: 1 }],
    commentCount: 0,
    createdAt: '2026-02-26T12:00:00',
  }

  it('라이트박스가 열리면 재생 중인 배경 영상이 일시정지된다', async () => {
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [videoOnlyPost] })

    const { container } = render(<GalleryPage />)
    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    const feedVideo = container.querySelector('video')!
    Object.defineProperty(feedVideo, 'paused', { value: false, configurable: true })
    const pauseSpy = jest.fn()
    feedVideo.pause = pauseSpy

    // 영상 클릭하여 라이트박스 열기
    await userEvent.click(feedVideo)

    expect(pauseSpy).toHaveBeenCalled()
  })

  it('이미 일시정지된 배경 영상은 라이트박스가 열려도 pause를 호출하지 않는다', async () => {
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [videoOnlyPost] })

    const { container } = render(<GalleryPage />)
    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    const feedVideo = container.querySelector('video')!
    // JSDOM 기본값: paused = true (이미 일시정지 상태)
    const pauseSpy = jest.fn()
    feedVideo.pause = pauseSpy

    await userEvent.click(feedVideo)

    expect(pauseSpy).not.toHaveBeenCalled()
  })

  it('라이트박스가 닫히면 화면에 보이는 배경 영상이 재개된다', async () => {
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [videoOnlyPost] })

    const { container } = render(<GalleryPage />)
    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    const feedVideo = container.querySelector('video')!
    Object.defineProperty(feedVideo, 'paused', { value: false, configurable: true })
    feedVideo.pause = jest.fn()
    const playSpy = jest.fn().mockResolvedValue(undefined)
    feedVideo.play = playSpy
    feedVideo.getBoundingClientRect = jest.fn().mockReturnValue({
      top: 100, bottom: 500, height: 400, left: 0, right: 400, width: 400, x: 0, y: 100,
    })

    // 라이트박스 열기
    await userEvent.click(feedVideo)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // 라이트박스 닫기
    await userEvent.keyboard('{Escape}')

    expect(playSpy).toHaveBeenCalled()
  })

  it('화면에 보이지 않는 배경 영상은 라이트박스 닫힐 때 재개하지 않는다', async () => {
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [videoOnlyPost] })

    const { container } = render(<GalleryPage />)
    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    const feedVideo = container.querySelector('video')!
    Object.defineProperty(feedVideo, 'paused', { value: false, configurable: true })
    feedVideo.pause = jest.fn()
    const playSpy = jest.fn().mockResolvedValue(undefined)
    feedVideo.play = playSpy
    // 영상이 뷰포트 밖으로 스크롤된 상태
    feedVideo.getBoundingClientRect = jest.fn().mockReturnValue({
      top: -500, bottom: -100, height: 400, left: 0, right: 400, width: 400, x: 0, y: -500,
    })

    // 라이트박스 열기
    await userEvent.click(feedVideo)

    // 라이트박스 닫기
    await userEvent.keyboard('{Escape}')

    expect(playSpy).not.toHaveBeenCalled()
  })
})

describe('GalleryPage 게시글 삭제', () => {
  const masterAuth = { user: { id: 1, name: '관리자', role: 'MASTER' }, isLoggedIn: true }
  const userAuth = { user: { id: 2, name: '일반유저', role: 'USER' }, isLoggedIn: true }
  const leaderAuth = { user: { id: 3, name: '리더', role: 'LEADER' }, isLoggedIn: true }

  it('MASTER 권한이면 피드 카드에 더보기 버튼이 표시된다', async () => {
    mockUseAuth.mockReturnValue(masterAuth)
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: mockFeedPosts })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(screen.getAllByLabelText('더보기').length).toBeGreaterThan(0)
  })

  it('USER 권한이면 더보기 버튼이 표시되지 않는다', async () => {
    mockUseAuth.mockReturnValue(userAuth)
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: mockFeedPosts })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(screen.queryByLabelText('더보기')).not.toBeInTheDocument()
  })

  it('LEADER 권한이면 더보기 버튼이 표시되지 않는다', async () => {
    mockUseAuth.mockReturnValue(leaderAuth)
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: mockFeedPosts })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(screen.queryByLabelText('더보기')).not.toBeInTheDocument()
  })

  it('비로그인 상태에서는 더보기 버튼이 표시되지 않는다', async () => {
    mockUseAuth.mockReturnValue({ user: null, isLoggedIn: false })
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: mockFeedPosts })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))

    expect(screen.queryByLabelText('더보기')).not.toBeInTheDocument()
  })

  it('더보기 버튼 클릭 시 삭제 메뉴가 표시된다', async () => {
    mockUseAuth.mockReturnValue(masterAuth)
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [mockFeedPosts[0]] })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))
    await userEvent.click(screen.getByLabelText('더보기'))

    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()
  })

  it('삭제 버튼 클릭 시 확인 모달이 표시된다', async () => {
    mockUseAuth.mockReturnValue(masterAuth)
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [mockFeedPosts[0]] })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))
    await userEvent.click(screen.getByLabelText('더보기'))
    await userEvent.click(screen.getByRole('button', { name: '삭제' }))

    expect(screen.getByText('게시글 삭제')).toBeInTheDocument()
    expect(screen.getByText(/삭제하면 되돌릴 수 없습니다/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument()
  })

  it('확인 모달에서 취소 클릭 시 모달이 닫힌다', async () => {
    mockUseAuth.mockReturnValue(masterAuth)
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [mockFeedPosts[0]] })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))
    await userEvent.click(screen.getByLabelText('더보기'))
    await userEvent.click(screen.getByRole('button', { name: '삭제' }))

    expect(screen.getByText('게시글 삭제')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: '취소' }))

    expect(screen.queryByText('게시글 삭제')).not.toBeInTheDocument()
  })

  it('확인 모달에서 삭제 확인 시 deletePost API가 호출된다', async () => {
    mockUseAuth.mockReturnValue(masterAuth)
    const mockRemovePost = jest.fn()
    mockUseFeed.mockReturnValue({
      ...defaultFeed,
      posts: [mockFeedPosts[0]],
      removePost: mockRemovePost,
    })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))
    await userEvent.click(screen.getByLabelText('더보기'))
    await userEvent.click(screen.getByRole('button', { name: '삭제' }))

    // 모달의 삭제 버튼 (두 번째 '삭제' 텍스트가 있는 버튼)
    const confirmButtons = screen.getAllByRole('button')
    const confirmDeleteBtn = confirmButtons.find(
      (btn) => btn.textContent === '삭제' && btn.closest('.fixed')
    )!

    await userEvent.click(confirmDeleteBtn)

    await waitFor(() => {
      expect(mockDeletePost).toHaveBeenCalledWith(10)
    })
  })

  it('삭제 성공 시 피드에서 게시글이 제거된다', async () => {
    mockUseAuth.mockReturnValue(masterAuth)
    const mockRemovePost = jest.fn()
    mockUseFeed.mockReturnValue({
      ...defaultFeed,
      posts: [mockFeedPosts[0]],
      removePost: mockRemovePost,
    })
    mockDeletePost.mockResolvedValue(undefined)

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))
    await userEvent.click(screen.getByLabelText('더보기'))
    await userEvent.click(screen.getByRole('button', { name: '삭제' }))

    const confirmButtons = screen.getAllByRole('button')
    const confirmDeleteBtn = confirmButtons.find(
      (btn) => btn.textContent === '삭제' && btn.closest('.fixed')
    )!

    await userEvent.click(confirmDeleteBtn)

    await waitFor(() => {
      expect(mockRemovePost).toHaveBeenCalledWith(10)
    })

    // 모달이 닫힌다
    await waitFor(() => {
      expect(screen.queryByText('게시글 삭제')).not.toBeInTheDocument()
    })
  })

  it('삭제 실패 시 alert이 표시된다', async () => {
    mockUseAuth.mockReturnValue(masterAuth)
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [mockFeedPosts[0]] })
    mockDeletePost.mockRejectedValue(new Error('Unauthorized'))

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))
    await userEvent.click(screen.getByLabelText('더보기'))
    await userEvent.click(screen.getByRole('button', { name: '삭제' }))

    const confirmButtons = screen.getAllByRole('button')
    const confirmDeleteBtn = confirmButtons.find(
      (btn) => btn.textContent === '삭제' && btn.closest('.fixed')
    )!

    await userEvent.click(confirmDeleteBtn)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('게시글 삭제에 실패했습니다.')
    })

    alertSpy.mockRestore()
    consoleSpy.mockRestore()
  })

  it('메뉴 외부 클릭 시 메뉴가 닫힌다', async () => {
    mockUseAuth.mockReturnValue(masterAuth)
    mockUseFeed.mockReturnValue({ ...defaultFeed, posts: [mockFeedPosts[0]] })

    render(<GalleryPage />)

    await userEvent.click(screen.getByRole('button', { name: /피드/ }))
    await userEvent.click(screen.getByLabelText('더보기'))

    expect(screen.getByRole('button', { name: '삭제' })).toBeInTheDocument()

    // 외부 클릭
    await userEvent.click(screen.getByText('수련회 후기입니다'))

    expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument()
  })
})
