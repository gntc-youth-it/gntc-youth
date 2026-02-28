jest.mock('../../../../../shared/api', () => ({
  apiRequest: jest.fn(),
}))

import { fetchPendingPosts, approvePost } from '../adminPostApi'
import { apiRequest } from '../../../../../shared/api'

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>

beforeEach(() => {
  jest.clearAllMocks()
})

describe('fetchPendingPosts', () => {
  it('파라미터 없이 호출하면 /posts/feed/pending로 요청한다', async () => {
    const mockResponse = { posts: [], nextCursor: null, hasNext: false }
    mockApiRequest.mockResolvedValue(mockResponse)

    const result = await fetchPendingPosts({})

    expect(mockApiRequest).toHaveBeenCalledWith('/posts/feed/pending')
    expect(result).toEqual(mockResponse)
  })

  it('cursor와 size를 쿼리 파라미터로 전달한다', async () => {
    const mockResponse = {
      posts: [{ id: 903, authorName: '테스트유저', status: 'PENDING_REVIEW' }],
      nextCursor: 900,
      hasNext: true,
    }
    mockApiRequest.mockResolvedValue(mockResponse)

    await fetchPendingPosts({ cursor: 903, size: 4 })

    expect(mockApiRequest).toHaveBeenCalledWith('/posts/feed/pending?size=4&cursor=903')
  })

  it('size만 전달한다', async () => {
    mockApiRequest.mockResolvedValue({ posts: [], nextCursor: null, hasNext: false })

    await fetchPendingPosts({ size: 10 })

    expect(mockApiRequest).toHaveBeenCalledWith('/posts/feed/pending?size=10')
  })

  it('cursor만 전달한다', async () => {
    mockApiRequest.mockResolvedValue({ posts: [], nextCursor: null, hasNext: false })

    await fetchPendingPosts({ cursor: 50 })

    expect(mockApiRequest).toHaveBeenCalledWith('/posts/feed/pending?cursor=50')
  })

  it('API 에러 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('Unauthorized'))

    await expect(fetchPendingPosts({})).rejects.toThrow('Unauthorized')
  })
})

describe('approvePost', () => {
  it('PATCH /posts/{postId}/approve로 요청한다', async () => {
    mockApiRequest.mockResolvedValue(undefined)

    await approvePost(903)

    expect(mockApiRequest).toHaveBeenCalledWith('/posts/903/approve', {
      method: 'PATCH',
    })
  })

  it('API 에러 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('Bad Request'))

    await expect(approvePost(903)).rejects.toThrow('Bad Request')
  })

  it('존재하지 않는 게시글 승인 시 에러를 전파한다', async () => {
    mockApiRequest.mockRejectedValue(new Error('Not Found'))

    await expect(approvePost(999)).rejects.toThrow('Not Found')
  })
})
