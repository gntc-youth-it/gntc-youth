import { apiRequest } from '../../../shared/api'
import type { GalleryResponse } from '../model/types'

export const fetchGalleryAlbums = async (): Promise<GalleryResponse> => {
  return apiRequest<GalleryResponse>('/api/gallery/albums')
}
