import { apiRequest } from '../../../shared/api'
import type {
  GalleryResponse,
  GalleryPhotosResponse,
  FeedPostsResponse,
  Category,
  SubCategory,
  PresignedUrlRequest,
  PresignedUrlResponse,
  CreatePostRequest,
  CreatePostResponse,
  Church,
} from '../model/types'

export const fetchGalleryAlbums = async (): Promise<GalleryResponse> => {
  return apiRequest<GalleryResponse>('/gallery/albums')
}

export const fetchGalleryPhotos = async (params: {
  subCategory?: string
  cursor?: number | null
  size?: number
}): Promise<GalleryPhotosResponse> => {
  const searchParams = new URLSearchParams()
  if (params.size != null) {
    searchParams.set('size', String(params.size))
  }
  if (params.cursor != null) {
    searchParams.set('cursor', String(params.cursor))
  }
  if (params.subCategory) {
    searchParams.set('subCategory', params.subCategory)
  }
  const query = searchParams.toString()
  return apiRequest<GalleryPhotosResponse>(`/posts/gallery${query ? `?${query}` : ''}`)
}

export const fetchCategories = async (): Promise<Category[]> => {
  return apiRequest<Category[]>('/posts/categories')
}

export const fetchSubCategories = async (category: string): Promise<SubCategory[]> => {
  return apiRequest<SubCategory[]>(`/posts/categories/${category}/sub-categories`)
}

export const getPresignedUrl = async (data: PresignedUrlRequest): Promise<PresignedUrlResponse> => {
  return apiRequest<PresignedUrlResponse>('/files/presigned-url', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const createPost = async (data: CreatePostRequest): Promise<CreatePostResponse> => {
  return apiRequest<CreatePostResponse>('/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const fetchFeedPosts = async (params: {
  subCategory?: string
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
  if (params.subCategory) {
    searchParams.set('subCategory', params.subCategory)
  }
  const query = searchParams.toString()
  return apiRequest<FeedPostsResponse>(`/posts/feed${query ? `?${query}` : ''}`)
}

export const fetchChurches = async (): Promise<Church[]> => {
  const response = await apiRequest<{ churches: Church[] }>('/churches')
  return response.churches
}

export const deletePost = async (postId: number): Promise<void> => {
  await apiRequest<void>(`/posts/${postId}`, {
    method: 'DELETE',
  })
}
