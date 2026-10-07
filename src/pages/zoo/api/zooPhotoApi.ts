import { apiRequest } from '../../../shared/api'
import type { ZooPhotoListResponse, ZooPhotoResultsResponse } from '../model/photo'

export const fetchZooPhotos = async (): Promise<ZooPhotoListResponse> => {
  return apiRequest<ZooPhotoListResponse>('/zoo/photos')
}

// 투표와 취소는 여러 번 보내도 결과가 같다
export const voteZooPhoto = async (photoId: number): Promise<void> => {
  await apiRequest<void>(`/zoo/photos/${photoId}/vote`, { method: 'PUT' })
}

export const unvoteZooPhoto = async (photoId: number): Promise<void> => {
  await apiRequest<void>(`/zoo/photos/${photoId}/vote`, { method: 'DELETE' })
}

// 운영자(MASTER)만 볼 수 있다
export const fetchZooPhotoResults = async (): Promise<ZooPhotoResultsResponse> => {
  return apiRequest<ZooPhotoResultsResponse>('/zoo/photos/results')
}
