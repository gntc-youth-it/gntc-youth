export type UploadStage =
  | 'idle'
  | 'compressing'
  | 'uploading'
  | 'complete'
  | 'error'

export type MediaFileType = 'image' | 'video'

export interface MediaUploadState {
  stage: UploadStage
  file: File | null
  previewUrl: string | null
  compressionProgress: number
  uploadProgress: number
  resultUrl: string | null
  error: string | null
  fileType: MediaFileType | null
}

export interface PresignedUrlResponse {
  uploadUrl: string
  fileUrl: string
}

export interface FileValidationResult {
  valid: boolean
  error?: string
  fileType: MediaFileType | null
}
