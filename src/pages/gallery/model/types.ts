export type GalleryCategory = 'ALL' | 'RETREAT' | 'CHURCH' | 'WORSHIP' | 'GATHERING'

export interface ChurchOption {
  id: string
  name: string
}

export type ViewMode = 'grid' | 'feed'

export interface GalleryPhoto {
  id: string
  url: string
}

export interface GalleryAlbum {
  id: string
  title: string
  date: string
  dateFormatted: string
  category: GalleryCategory
  photoCount: number
  photos: GalleryPhoto[]
  caption: string
  tags: string[]
  likeCount: number
}

export interface GalleryResponse {
  albums: GalleryAlbum[]
}

// --- Gallery Photo Pagination Types ---

export interface GalleryPhotoItem {
  id: number
  url: string
}

export interface GalleryPhotosResponse {
  images: GalleryPhotoItem[]
  nextCursor: number | null
  hasNext: boolean
}

// --- Post Creation Types ---

export interface Category {
  name: string
  displayName: string
}

export interface SubCategory {
  name: string
  displayName: string
  imageUrl: string
  startDate: string
  endDate: string
}

export interface CreatePostRequest {
  subCategory: string
  content?: string
  hashtags?: string[]
  churches?: string[]
  imageIds?: number[]
  isAuthorPublic?: boolean
}

export interface PostImage {
  fileId: number
  filePath: string
  sortOrder: number
}

export interface CreatePostResponse {
  id: number
  authorId: number
  authorName: string
  isAuthorPublic: boolean
  subCategory: string
  category: string
  status: string
  content: string
  hashtags: string[]
  churches: string[]
  images: PostImage[]
  createdAt: string
}

export interface PresignedUrlRequest {
  filename: string
  contentType: string
  fileSize: number
}

export interface PresignedUrlResponse {
  fileId: number
  presignedUrl: string
}

export interface Church {
  code: string
  name: string
}

// --- Feed Types ---

export interface FeedPostImage {
  fileId: number
  filePath: string
  sortOrder: number
}

export interface FeedPost {
  id: number
  authorId: number
  authorName: string
  isAuthorPublic: boolean
  subCategory: string
  category: string
  status: string
  content: string
  hashtags: string[]
  churches: string[]
  images: FeedPostImage[]
  commentCount: number
  createdAt: string
}

export interface FeedPostsResponse {
  posts: FeedPost[]
  nextCursor: number | null
  hasNext: boolean
}

export type UploadStatus = 'pending' | 'compressing' | 'uploading' | 'done' | 'error'

export interface UploadingImage {
  id: string
  file: File
  preview: string
  progress: number
  status: UploadStatus
  fileId?: number
  error?: string
  mediaType: 'image' | 'video'
}
