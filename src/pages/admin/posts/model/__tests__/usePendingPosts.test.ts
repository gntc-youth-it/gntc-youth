import { renderHook, act, waitFor } from '@testing-library/react'
import { usePendingPosts } from '../usePendingPosts'
import { fetchPendingPosts } from '../../api/adminPostApi'
import type { FeedPostsResponse } from '../../../../gallery/model/types'

jest.mock('../../api/adminPostApi')

const mockFetchPendingPosts = fetchPendingPosts as jest.MockedFunction<typeof fetchPendingPosts>

const mockPost = {
  id: 903,
  authorId: 1,
  authorName: '테스트유저',
  authorProfileImageUrl: null,
  isAuthorPublic: false,
  subCategory: 'RETREAT_2026_WINTER',
  category: 'RETREAT',
  status: 'PENDING_REVIEW',
  content: '검수대기 게시글',
  hashtags: [],
  churches: [],
  images: [{ fileId: 5, filePath: 'uploads/abc.jpg', sortOrder: 1 }],
  commentCount: 0,
  createdAt: '2026-02-28T14:00:00',
}

const mockResponse: FeedPostsResponse = {
  posts: [mockPost],
  nextCursor: 900,
  hasNext: true,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockFetchPendingPosts.mockResolvedValue(mockResponse)
})

describe('usePendingPosts', () => {
  it('초기 상태는 빈 배열이고 로딩 중이 아니다', () => {
    const { result } = renderHook(() => usePendingPosts())

    expect(result.current.posts).toHaveLength(0)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isFetchingMore).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.hasNext).toBe(true)
  })

  it('loadFeed 호출 시 API를 호출하고 게시글을 반환한다', async () => {
    const { result } = renderHook(() => usePendingPosts())

    act(() => {
      result.current.loadFeed()
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.posts).toHaveLength(1)
    expect(result.current.posts[0].authorName).toBe('테스트유저')
    expect(result.current.posts[0].status).toBe('PENDING_REVIEW')
    expect(result.current.hasNext).toBe(true)
    expect(result.current.error).toBeNull()
    expect(mockFetchPendingPosts).toHaveBeenCalledWith({ size: 4, cursor: null })
  })

  it('loadMore 호출 시 다음 페이지를 불러온다', async () => {
    const nextPost = { ...mockPost, id: 900, content: '다음 검수대기 게시글' }
    const nextResponse: FeedPostsResponse = {
      posts: [nextPost],
      nextCursor: null,
      hasNext: false,
    }
    mockFetchPendingPosts
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(nextResponse)

    const { result } = renderHook(() => usePendingPosts())

    act(() => {
      result.current.loadFeed()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.loadMore()
    })

    await waitFor(() => {
      expect(result.current.posts).toHaveLength(2)
    })

    expect(result.current.hasNext).toBe(false)
    expect(mockFetchPendingPosts).toHaveBeenCalledWith({ size: 4, cursor: 900 })
  })

  it('API 에러 시 에러 메시지가 설정된다', async () => {
    mockFetchPendingPosts.mockRejectedValue(new Error('Unauthorized'))

    const { result } = renderHook(() => usePendingPosts())

    act(() => {
      result.current.loadFeed()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('검수대기 게시글을 불러오는데 실패했습니다.')
    expect(result.current.posts).toHaveLength(0)
  })

  it('hasNext가 false이면 loadMore가 API를 호출하지 않는다', async () => {
    const lastResponse: FeedPostsResponse = {
      posts: [mockPost],
      nextCursor: null,
      hasNext: false,
    }
    mockFetchPendingPosts.mockResolvedValue(lastResponse)

    const { result } = renderHook(() => usePendingPosts())

    act(() => {
      result.current.loadFeed()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.hasNext).toBe(false)
    const callCountBefore = mockFetchPendingPosts.mock.calls.length

    act(() => {
      result.current.loadMore()
    })

    expect(mockFetchPendingPosts).toHaveBeenCalledTimes(callCountBefore)
  })

  it('removePost 호출 시 해당 게시글이 목록에서 제거된다', async () => {
    const secondPost = { ...mockPost, id: 900, content: '두 번째 게시글' }
    const multiResponse: FeedPostsResponse = {
      posts: [mockPost, secondPost],
      nextCursor: null,
      hasNext: false,
    }
    mockFetchPendingPosts.mockResolvedValue(multiResponse)

    const { result } = renderHook(() => usePendingPosts())

    act(() => {
      result.current.loadFeed()
    })

    await waitFor(() => {
      expect(result.current.posts).toHaveLength(2)
    })

    act(() => {
      result.current.removePost(903)
    })

    expect(result.current.posts).toHaveLength(1)
    expect(result.current.posts[0].id).toBe(900)
  })

  it('removePost로 존재하지 않는 ID를 전달하면 목록이 변경되지 않는다', async () => {
    const { result } = renderHook(() => usePendingPosts())

    act(() => {
      result.current.loadFeed()
    })

    await waitFor(() => {
      expect(result.current.posts).toHaveLength(1)
    })

    act(() => {
      result.current.removePost(999)
    })

    expect(result.current.posts).toHaveLength(1)
  })

  it('isFetchingMore 상태가 로딩 중 true, 완료 후 false로 변한다', async () => {
    const { result } = renderHook(() => usePendingPosts())

    act(() => {
      result.current.loadFeed()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.isFetchingMore).toBe(false)

    let resolveNext: (value: FeedPostsResponse) => void
    const nextPromise = new Promise<FeedPostsResponse>((resolve) => {
      resolveNext = resolve
    })
    mockFetchPendingPosts.mockReturnValueOnce(nextPromise)

    act(() => {
      result.current.loadMore()
    })

    expect(result.current.isFetchingMore).toBe(true)

    await act(async () => {
      resolveNext!({
        posts: [{ ...mockPost, id: 899 }],
        nextCursor: null,
        hasNext: false,
      })
    })

    expect(result.current.isFetchingMore).toBe(false)
  })

  it('loadMore 중복 호출 시 한 번만 API를 호출한다', async () => {
    let resolveSecond: (value: FeedPostsResponse) => void
    const secondPromise = new Promise<FeedPostsResponse>((resolve) => {
      resolveSecond = resolve
    })

    mockFetchPendingPosts
      .mockResolvedValueOnce(mockResponse)
      .mockReturnValueOnce(secondPromise)

    const { result } = renderHook(() => usePendingPosts())

    act(() => {
      result.current.loadFeed()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    act(() => {
      result.current.loadMore()
    })

    act(() => {
      result.current.loadMore()
    })

    // loadFeed 1번 + loadMore 1번 = 총 2번
    expect(mockFetchPendingPosts).toHaveBeenCalledTimes(2)

    await act(async () => {
      resolveSecond!({
        posts: [{ ...mockPost, id: 899 }],
        nextCursor: null,
        hasNext: false,
      })
    })
  })
})
