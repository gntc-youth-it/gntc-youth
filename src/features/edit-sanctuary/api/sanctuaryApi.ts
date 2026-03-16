import { apiRequest } from '../../../shared/api'

interface PrayerTopicRequest {
  content: string
  sortOrder: number
}

interface UpdateChurchInfoRequest {
  groupPhotoFileId: number | null
  prayerTopics: PrayerTopicRequest[]
}

export async function updateChurchInfo(
  churchId: string,
  data: UpdateChurchInfoRequest
): Promise<void> {
  await apiRequest(`/churches/${churchId}/info`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
