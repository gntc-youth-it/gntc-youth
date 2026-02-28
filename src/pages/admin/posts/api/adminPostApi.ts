import { apiRequest } from '../../../../shared/api'
import type { FeedPostsResponse } from '../../../gallery/model/types'

export const fetchPendingPosts = async (params: {
  cursor?: number | null
  size?: number
}): Promise<FeedPostsResponse> => {
  const searchParams = new URLSearchParams()
  if (params.size != null) {
    searchParams.set('size', String(params.size))
  }
  if (params.cursor != null) {
    searchParams.set('cursor', String(params.cursor))
  }
  const query = searchParams.toString()
  return apiRequest<FeedPostsResponse>(`/posts/feed/pending${query ? `?${query}` : ''}`)
}

export const approvePost = async (postId: number): Promise<void> => {
  await apiRequest<void>(`/posts/${postId}/approve`, {
    method: 'PATCH',
  })
}
