import { apiRequest } from '../../../shared/api'
import type { PresignedUrlResponse } from '../model/types'

export async function getPresignedUrl(
  fileName: string,
  contentType: string,
  fileSize: number
): Promise<PresignedUrlResponse> {
  return apiRequest<PresignedUrlResponse>('/media/presigned-url', {
    method: 'POST',
    body: JSON.stringify({ fileName, contentType, fileSize }),
  })
}
