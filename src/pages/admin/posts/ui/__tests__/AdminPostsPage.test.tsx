import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminPostsPage } from '../AdminPostsPage'
import { useAuth } from '../../../../../features/auth'
import { usePendingPosts } from '../../model/usePendingPosts'
import { approvePost } from '../../api/adminPostApi'
import { deletePost } from '../../../../gallery/api/galleryApi'

const mockNavigate = jest.fn()

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

jest.mock('../../../../../features/auth', () => ({
  useAuth: jest.fn(),
}))

jest.mock('../../../../../widgets/header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}))

jest.mock('../../../../../widgets/footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}))

jest.mock('../../model/usePendingPosts', () => ({
  usePendingPosts: jest.fn(),
}))

jest.mock('../../api/adminPostApi', () => ({
  approvePost: jest.fn(),
}))

jest.mock('../../../../gallery/api/galleryApi', () => ({
  deletePost: jest.fn(),
}))

jest.mock('../../../../../shared/lib', () => ({
  buildCdnUrl: (path: string) => `https://cdn.gntc-youth.com/${path}`,
  isVideoUrl: () => false,
  useInfiniteScroll: () => ({ current: null }),
}))

jest.mock('../../../../../shared/config', () => ({
  FALLBACK_IMAGE_URL: 'https://cdn.gntc-youth.com/fallback.jpg',
}))

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUsePendingPosts = usePendingPosts as jest.MockedFunction<typeof usePendingPosts>
const mockApprovePost = approvePost as jest.MockedFunction<typeof approvePost>
const mockDeletePost = deletePost as jest.MockedFunction<typeof deletePost>

const baseAuth = {
  user: null,
  isLoggedIn: false,
  login: jest.fn(),
  logout: jest.fn().mockResolvedValue(undefined),
  refreshUser: jest.fn().mockResolvedValue(undefined),
}

const mockRemovePost = jest.fn()
const mockLoadFeed = jest.fn()
const mockLoadMore = jest.fn()

const emptyPendingPosts = {
  posts: [],
  isLoading: false,
  isFetchingMore: false,
  error: null,
  hasNext: false,
  loadFeed: mockLoadFeed,
  loadMore: mockLoadMore,
  removePost: mockRemovePost,
}

const mockPosts = [
  {
    id: 903,
    authorId: 1,
    authorName: '테스트유저',
    authorProfileImageUrl: null,
    isAuthorPublic: false,
    subCategory: 'RETREAT_2026_WINTER',
    category: 'RETREAT',
    status: 'PENDING_REVIEW',
    content: '검수대기 게시글 내용',
    hashtags: ['수련회'],
    churches: [],
    images: [{ fileId: 5, filePath: 'uploads/abc.jpg', sortOrder: 1 }],
    commentCount: 0,
    createdAt: '2026-02-28T14:00:00',
  },
  {
    id: 904,
    authorId: 2,
    authorName: '공개유저',
    authorProfileImageUrl: 'profiles/user2.jpg',
    isAuthorPublic: true,
    subCategory: 'RETREAT_2026_WINTER',
    category: 'RETREAT',
    status: 'PENDING_REVIEW',
    content: '두 번째 검수대기 게시글',
    hashtags: [],
    churches: [],
    images: [],
    commentCount: 0,
    createdAt: '2026-02-28T15:00:00',
  },
]

beforeEach(() => {
  jest.clearAllMocks()
  mockUseAuth.mockReturnValue(baseAuth)
  mockUsePendingPosts.mockReturnValue(emptyPendingPosts)
})

describe('AdminPostsPage 접근 권한', () => {
  it('비로그인 상태에서는 홈으로 리다이렉트된다', () => {
    render(<AdminPostsPage />)

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('일반 사용자는 홈으로 리다이렉트된다', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '홍길동', role: 'USER' },
    })

    render(<AdminPostsPage />)

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('LEADER 사용자는 홈으로 리다이렉트된다', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '홍길동', role: 'LEADER' },
    })

    render(<AdminPostsPage />)

    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
  })

  it('MASTER 사용자는 게시물 관리 페이지가 표시된다', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '관리자', role: 'MASTER' },
    })

    render(<AdminPostsPage />)

    expect(screen.getByText('게시물 관리')).toBeInTheDocument()
    expect(screen.getByText('검수대기 중인 게시글을 확인하고 승인 또는 삭제할 수 있습니다.')).toBeInTheDocument()
  })

  it('MASTER 사용자는 초기 로드 시 loadFeed가 호출된다', () => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '관리자', role: 'MASTER' },
    })

    render(<AdminPostsPage />)

    expect(mockLoadFeed).toHaveBeenCalled()
  })
})

describe('AdminPostsPage 로딩/에러/빈 상태', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '관리자', role: 'MASTER' },
    })
  })

  it('로딩 중에는 스피너가 표시된다', () => {
    mockUsePendingPosts.mockReturnValue({
      ...emptyPendingPosts,
      isLoading: true,
    })

    render(<AdminPostsPage />)

    expect(screen.getByText('게시물 관리')).toBeInTheDocument()
    expect(screen.queryByText('검수대기 중인 게시글이 없습니다.')).not.toBeInTheDocument()
  })

  it('에러 시 에러 메시지와 다시 시도 버튼이 표시된다', () => {
    mockUsePendingPosts.mockReturnValue({
      ...emptyPendingPosts,
      error: '검수대기 게시글을 불러오는데 실패했습니다.',
    })

    render(<AdminPostsPage />)

    expect(screen.getByText('검수대기 게시글을 불러오는데 실패했습니다.')).toBeInTheDocument()
    expect(screen.getByText('다시 시도')).toBeInTheDocument()
  })

  it('다시 시도 버튼 클릭 시 loadFeed가 호출된다', async () => {
    mockUsePendingPosts.mockReturnValue({
      ...emptyPendingPosts,
      error: '검수대기 게시글을 불러오는데 실패했습니다.',
    })

    render(<AdminPostsPage />)

    await userEvent.click(screen.getByText('다시 시도'))

    // 초기 로드 1번 + 다시 시도 1번
    expect(mockLoadFeed).toHaveBeenCalledTimes(2)
  })

  it('게시글이 없으면 빈 상태 메시지가 표시된다', () => {
    render(<AdminPostsPage />)

    expect(screen.getByText('검수대기 중인 게시글이 없습니다.')).toBeInTheDocument()
  })
})

describe('AdminPostsPage 게시글 목록', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '관리자', role: 'MASTER' },
    })
    mockUsePendingPosts.mockReturnValue({
      ...emptyPendingPosts,
      posts: mockPosts,
      hasNext: false,
    })
  })

  it('검수대기 게시글이 표시된다', () => {
    render(<AdminPostsPage />)

    expect(screen.getByText('검수대기 게시글 내용')).toBeInTheDocument()
    expect(screen.getByText('두 번째 검수대기 게시글')).toBeInTheDocument()
  })

  it('검수대기 뱃지가 표시된다', () => {
    render(<AdminPostsPage />)

    const badges = screen.getAllByText('검수대기')
    expect(badges).toHaveLength(2)
  })

  it('비공개 작성자는 GNTC YOUTH로 표시된다', () => {
    render(<AdminPostsPage />)

    expect(screen.getByText('GNTC YOUTH')).toBeInTheDocument()
  })

  it('공개 작성자는 실제 이름으로 표시된다', () => {
    render(<AdminPostsPage />)

    expect(screen.getByText('공개유저')).toBeInTheDocument()
  })

  it('해시태그가 표시된다', () => {
    render(<AdminPostsPage />)

    expect(screen.getByText('#수련회')).toBeInTheDocument()
  })

  it('각 게시글에 승인/삭제 버튼이 있다', () => {
    render(<AdminPostsPage />)

    const approveButtons = screen.getAllByText('승인')
    const deleteButtons = screen.getAllByText('삭제')

    expect(approveButtons).toHaveLength(2)
    expect(deleteButtons).toHaveLength(2)
  })

  it('모든 게시글을 불러왔을 때 완료 메시지가 표시된다', () => {
    render(<AdminPostsPage />)

    expect(screen.getByText('모든 검수대기 게시글을 불러왔습니다.')).toBeInTheDocument()
  })
})

describe('AdminPostsPage 승인 처리', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '관리자', role: 'MASTER' },
    })
    mockUsePendingPosts.mockReturnValue({
      ...emptyPendingPosts,
      posts: [mockPosts[0]],
    })
  })

  it('승인 버튼 클릭 시 확인 모달이 표시된다', async () => {
    render(<AdminPostsPage />)

    await userEvent.click(screen.getByText('승인'))

    expect(screen.getByText('게시글 승인')).toBeInTheDocument()
  })

  it('승인 모달에서 취소 버튼 클릭 시 모달이 닫힌다', async () => {
    render(<AdminPostsPage />)

    await userEvent.click(screen.getByText('승인'))
    expect(screen.getByText('게시글 승인')).toBeInTheDocument()

    await userEvent.click(screen.getByText('취소'))
    expect(screen.queryByText('게시글 승인')).not.toBeInTheDocument()
  })

  it('승인 확인 시 approvePost API가 호출되고 게시글이 제거된다', async () => {
    mockApprovePost.mockResolvedValue(undefined)

    render(<AdminPostsPage />)

    await userEvent.click(screen.getByText('승인'))

    // 모달 내 승인 버튼 클릭 (모달 안에 있는 승인 버튼)
    const modal = screen.getByRole('dialog')
    const confirmButton = modal.querySelector('button:last-child')!
    await userEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockApprovePost).toHaveBeenCalledWith(903)
    })
    expect(mockRemovePost).toHaveBeenCalledWith(903)
  })

  it('승인 API 실패 시 에러 알림이 표시된다', async () => {
    mockApprovePost.mockRejectedValue(new Error('Bad Request'))
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

    render(<AdminPostsPage />)

    await userEvent.click(screen.getByText('승인'))

    const modal = screen.getByRole('dialog')
    const confirmButton = modal.querySelector('button:last-child')!
    await userEvent.click(confirmButton)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('게시글 승인에 실패했습니다.')
    })

    alertSpy.mockRestore()
  })
})

describe('AdminPostsPage 삭제 처리', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      ...baseAuth,
      isLoggedIn: true,
      user: { id: 1, name: '관리자', role: 'MASTER' },
    })
    mockUsePendingPosts.mockReturnValue({
      ...emptyPendingPosts,
      posts: [mockPosts[0]],
    })
  })

  it('삭제 버튼 클릭 시 확인 모달이 표시된다', async () => {
    render(<AdminPostsPage />)

    await userEvent.click(screen.getByText('삭제'))

    expect(screen.getByText('게시글 삭제')).toBeInTheDocument()
  })

  it('삭제 모달에서 취소 버튼 클릭 시 모달이 닫힌다', async () => {
    render(<AdminPostsPage />)

    await userEvent.click(screen.getByText('삭제'))
    expect(screen.getByText('게시글 삭제')).toBeInTheDocument()

    await userEvent.click(screen.getByText('취소'))
    expect(screen.queryByText('게시글 삭제')).not.toBeInTheDocument()
  })

  it('삭제 확인 시 deletePost API가 호출되고 게시글이 제거된다', async () => {
    mockDeletePost.mockResolvedValue(undefined)

    render(<AdminPostsPage />)

    await userEvent.click(screen.getByText('삭제'))

    const modal = screen.getByRole('dialog')
    const confirmButton = modal.querySelector('button:last-child')!
    await userEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockDeletePost).toHaveBeenCalledWith(903)
    })
    expect(mockRemovePost).toHaveBeenCalledWith(903)
  })

  it('삭제 API 실패 시 에러 알림이 표시된다', async () => {
    mockDeletePost.mockRejectedValue(new Error('Unauthorized'))
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})

    render(<AdminPostsPage />)

    await userEvent.click(screen.getByText('삭제'))

    const modal = screen.getByRole('dialog')
    const confirmButton = modal.querySelector('button:last-child')!
    await userEvent.click(confirmButton)

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('게시글 삭제에 실패했습니다.')
    })

    alertSpy.mockRestore()
  })
})
