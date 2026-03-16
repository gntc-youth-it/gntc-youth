import { apiRequest } from '../../../shared/api'

export interface ChurchItem {
  code: string
  name: string
}

interface ChurchListResponse {
  churches: ChurchItem[]
}

export interface PrayerTopicResponse {
  id: number
  content: string
  sortOrder: number
}

export interface ChurchInfoResponse {
  churchId: string
  groupPhotoFileId: number | null
  groupPhotoPath: string | null
  prayerTopics: PrayerTopicResponse[]
  randomPhotos: string[]
}

export const getChurches = async (): Promise<ChurchItem[]> => {
  const response = await apiRequest<ChurchListResponse>('/churches')
  return response.churches
}

export const getChurchInfo = async (churchId: string): Promise<ChurchInfoResponse> => {
  return apiRequest<ChurchInfoResponse>(`/churches/${churchId}/info`)
}
