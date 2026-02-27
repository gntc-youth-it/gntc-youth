import { apiRequest } from './apiClient'

export interface FilePresignedUrlResponse {
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
