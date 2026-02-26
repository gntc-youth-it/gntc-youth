import { apiRequest } from '../../../shared/api'
import type {
  GalleryResponse,
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

export const fetchChurches = async (): Promise<Church[]> => {
  return apiRequest<Church[]>('/churches')
}
