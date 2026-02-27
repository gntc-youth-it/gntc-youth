export type GalleryCategory = 'ALL' | 'RETREAT' | 'CHURCH' | 'WORSHIP' | 'GATHERING'

export interface ChurchOption {
  id: string
  name: string
}

export const CHURCH_OPTIONS: ChurchOption[] = [
  { id: 'ANYANG', name: '안양' },
  { id: 'SUWON', name: '수원' },
  { id: 'ANSAN', name: '안산' },
  { id: 'GWACHEON', name: '과천' },
  { id: 'SIHEUNG', name: '시흥' },
  { id: 'GWANGMYEONG', name: '광명' },
  { id: 'BUPYEONG', name: '부평' },
  { id: 'BUGOK', name: '부곡' },
  { id: 'PANGYO', name: '판교' },
  { id: 'YEONGDEUNGPO', name: '영등포' },
  { id: 'INCHEON', name: '인천' },
  { id: 'BUCHEON', name: '부천' },
  { id: 'ILSAN', name: '일산' },
  { id: 'SIHWA', name: '시화' },
  { id: 'YEONGTONG', name: '영통' },
  { id: 'GURI', name: '구리' },
  { id: 'POIL', name: '포일' },
  { id: 'JEONWON', name: '전원' },
  { id: 'GIMPO', name: '김포' },
  { id: 'PYEONGTAEK', name: '평택' },
  { id: 'ANJUNG', name: '안중' },
  { id: 'CHEONAN', name: '천안' },
  { id: 'YANGJU', name: '양주' },
  { id: 'GANGNAM', name: '강남' },
  { id: 'YONGIN', name: '용인' },
  { id: 'DAEJEON', name: '대전' },
  { id: 'GWANGJU', name: '광주' },
  { id: 'SEOSAN', name: '서산' },
  { id: 'YULJEON', name: '율전' },
  { id: 'DONGTAN', name: '동탄' },
  { id: 'DANGJIN', name: '당진' },
  { id: 'SEJONG', name: '세종' },
  { id: 'JEONJU_HYOJA', name: '전주효자' },
]

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
