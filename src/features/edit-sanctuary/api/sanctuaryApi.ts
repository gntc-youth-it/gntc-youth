import { apiRequest } from '../../../shared/api'

interface FilePresignedUrlResponse {
  fileId: number
  presignedUrl: string
}

export async function getFilePresignedUrl(
  filename: string,
  contentType: string,
  fileSize: number
): Promise<FilePresignedUrlResponse> {
  return apiRequest<FilePresignedUrlResponse>('/files/presigned-url', {
    method: 'POST',
    body: JSON.stringify({ filename, contentType, fileSize }),
  })
}

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
