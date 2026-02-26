import { renderHook, act, waitFor } from '@testing-library/react'
import { useFeed } from '../useFeed'
import { fetchFeedPosts } from '../../api/galleryApi'
import type { FeedPostsResponse } from '../types'

jest.mock('../../api/galleryApi')

const mockFetchFeedPosts = fetchFeedPosts as jest.MockedFunction<typeof fetchFeedPosts>

const mockPost = {
  id: 10,
  authorId: 1,
  authorName: '홍길동',
  subCategory: 'RETREAT_2026_WINTER',
  category: 'RETREAT',
  status: 'APPROVED',
  content: '수련회 후기입니다',
  hashtags: ['#수련회', '#부흥'],
  churches: ['ANYANG'],
  images: [{ fileId: 5, filePath: 'uploads/abc.jpg', sortOrder: 1 }],
  commentCount: 3,
  createdAt: '2026-02-26T10:30:00',
}

const mockResponse: FeedPostsResponse = {
  posts: [mockPost],
  nextCursor: 7,
  hasNext: true,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockFetchFeedPosts.mockResolvedValue(mockResponse)
})

describe('useFeed', () => {
  it('초기 상태는 빈 배열이고 로딩 중이 아니다', () => {
    const { result } = renderHook(() => useFeed())

    expect(result.current.posts).toHaveLength(0)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isFetchingMore).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.hasNext).toBe(true)
  })

  it('loadFeed 호출 시 API를 호출하고 피드를 반환한다', async () => {
    const { result } = renderHook(() => useFeed())

    act(() => {
      result.current.loadFeed()
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.posts).toHaveLength(1)
    expect(result.current.posts[0].authorName).toBe('홍길동')
    expect(result.current.hasNext).toBe(true)
    expect(result.current.error).toBeNull()
    expect(mockFetchFeedPosts).toHaveBeenCalledWith({ size: 4, cursor: null })
  })

  it('loadFeed에 subCategory를 전달할 수 있다', async () => {
    const { result } = renderHook(() => useFeed())

    act(() => {
      result.current.loadFeed('RETREAT_2026_WINTER')
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockFetchFeedPosts).toHaveBeenCalledWith({
      size: 4,
      cursor: null,
      subCategory: 'RETREAT_2026_WINTER',
    })
  })

  it('loadMore 호출 시 다음 페이지를 불러온다', async () => {
    const nextPost = { ...mockPost, id: 7, content: '다음 피드' }
    const nextResponse: FeedPostsResponse = {
      posts: [nextPost],
      nextCursor: null,
      hasNext: false,
    }
    mockFetchFeedPosts
      .mockResolvedValueOnce(mockResponse)
      .mockResolvedValueOnce(nextResponse)

    const { result } = renderHook(() => useFeed())

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
    expect(mockFetchFeedPosts).toHaveBeenCalledWith({ size: 4, cursor: 7 })
  })

  it('API 에러 시 에러 메시지가 설정된다', async () => {
    mockFetchFeedPosts.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useFeed())

    act(() => {
      result.current.loadFeed()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('피드를 불러오는데 실패했습니다.')
    expect(result.current.posts).toHaveLength(0)
  })

  it('hasNext가 false이면 loadMore가 API를 호출하지 않는다', async () => {
    const lastResponse: FeedPostsResponse = {
      posts: [mockPost],
      nextCursor: null,
      hasNext: false,
    }
    mockFetchFeedPosts.mockResolvedValue(lastResponse)

    const { result } = renderHook(() => useFeed())

    act(() => {
      result.current.loadFeed()
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.hasNext).toBe(false)
    const callCountBefore = mockFetchFeedPosts.mock.calls.length

    act(() => {
      result.current.loadMore()
    })

    expect(mockFetchFeedPosts).toHaveBeenCalledTimes(callCountBefore)
  })

  it('isFetchingMore 상태가 로딩 중 true, 완료 후 false로 변한다', async () => {
    const { result } = renderHook(() => useFeed())

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
    mockFetchFeedPosts.mockReturnValueOnce(nextPromise)

    act(() => {
      result.current.loadMore()
    })

    expect(result.current.isFetchingMore).toBe(true)

    await act(async () => {
      resolveNext!({
        posts: [{ ...mockPost, id: 5 }],
        nextCursor: null,
        hasNext: false,
      })
    })

    expect(result.current.isFetchingMore).toBe(false)
  })

  it('reset 호출 시 상태가 초기화된다', async () => {
    const { result } = renderHook(() => useFeed())

    act(() => {
      result.current.loadFeed()
    })

    await waitFor(() => {
      expect(result.current.posts).toHaveLength(1)
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.posts).toHaveLength(0)
    expect(result.current.hasNext).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('loadMore 중복 호출 시 한 번만 API를 호출한다', async () => {
    let resolveSecond: (value: FeedPostsResponse) => void
    const secondPromise = new Promise<FeedPostsResponse>((resolve) => {
      resolveSecond = resolve
    })

    mockFetchFeedPosts
      .mockResolvedValueOnce(mockResponse)
      .mockReturnValueOnce(secondPromise)

    const { result } = renderHook(() => useFeed())

    act(() => {
      result.current.loadFeed()
    })

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

    // loadFeed 1번 + loadMore 1번 = 총 2번
    expect(mockFetchFeedPosts).toHaveBeenCalledTimes(2)

    await act(async () => {
      resolveSecond!({
        posts: [{ ...mockPost, id: 5 }],
        nextCursor: null,
        hasNext: false,
      })
    })
  })
})
