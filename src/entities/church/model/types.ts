export interface Church {
  id: string
  name: string
  media: string
  mediaType: 'video' | 'image'
  prayers: readonly string[]
}
