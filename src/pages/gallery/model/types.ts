export type GalleryCategory = 'ALL' | 'RETREAT' | 'WORSHIP' | 'GATHERING'

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
