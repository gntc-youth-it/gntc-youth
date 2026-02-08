import { useState, useCallback, useRef, useEffect } from 'react'
import { compressImage, compressVideo, isVideoCompressionSupported, uploadToS3 } from '../../../shared/lib'
import { getPresignedUrl } from '../api'
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_VIDEO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  IMAGE_COMPRESSION_OPTIONS,
  VIDEO_COMPRESSION_OPTIONS,
} from '../model/constants'
import type { MediaUploadState, MediaFileType, FileValidationResult } from '../model/types'

const initialState: MediaUploadState = {
  stage: 'idle',
  file: null,
  previewUrl: null,
  compressionProgress: 0,
  uploadProgress: 0,
  resultUrl: null,
  error: null,
  fileType: null,
}

function detectFileType(file: File): MediaFileType | null {
  if (ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'image'
  if (ACCEPTED_VIDEO_TYPES.includes(file.type)) return 'video'
  return null
}

function validateFile(file: File): FileValidationResult {
  const fileType = detectFileType(file)

  if (!fileType) {
    return {
      valid: false,
      error: `지원하지 않는 파일 형식입니다. (${file.type || '알 수 없음'})`,
      fileType: null,
    }
  }

  if (fileType === 'image' && file.size > MAX_IMAGE_SIZE) {
    return {
      valid: false,
      error: `이미지 파일 크기가 너무 큽니다. (최대 ${MAX_IMAGE_SIZE / 1024 / 1024}MB)`,
      fileType,
    }
  }

  if (fileType === 'video' && file.size > MAX_VIDEO_SIZE) {
    return {
      valid: false,
      error: `영상 파일 크기가 너무 큽니다. (최대 ${MAX_VIDEO_SIZE / 1024 / 1024}MB)`,
      fileType,
    }
  }

  return { valid: true, fileType }
}

export function useMediaUpload() {
  const [state, setState] = useState<MediaUploadState>(initialState)
  const previewUrlRef = useRef<string | null>(null)
  const abortedRef = useRef(false)

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      abortedRef.current = true
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current)
      }
    }
  }, [])

  const reset = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    abortedRef.current = false
    setState(initialState)
  }, [])

  const selectFile = useCallback((file: File) => {
    // 기존 프리뷰 URL 정리
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }

    const { valid, error, fileType } = validateFile(file)

    if (!valid || !fileType) {
      setState({
        ...initialState,
        stage: 'error',
        error: error ?? '파일 검증에 실패했습니다.',
      })
      return
    }

    const previewUrl = URL.createObjectURL(file)
    previewUrlRef.current = previewUrl

    setState({
      ...initialState,
      file,
      previewUrl,
      fileType,
    })
  }, [])

  const startUpload = useCallback(async () => {
    const { file, fileType } = state

    if (!file || !fileType) {
      setState((prev) => ({
        ...prev,
        stage: 'error',
        error: '업로드할 파일이 없습니다.',
      }))
      return
    }

    abortedRef.current = false

    try {
      // 1. 압축 단계
      setState((prev) => ({ ...prev, stage: 'compressing', compressionProgress: 0, error: null }))

      let compressedBlob: Blob
      let contentType: string

      if (fileType === 'image') {
        const result = await compressImage(file, IMAGE_COMPRESSION_OPTIONS)
        compressedBlob = result.blob
        contentType = result.blob.type
      } else {
        if (!isVideoCompressionSupported()) {
          // WebAssembly 미지원 시 원본 그대로 업로드
          compressedBlob = file
          contentType = file.type
        } else {
          const result = await compressVideo(file, {
            ...VIDEO_COMPRESSION_OPTIONS,
            onProgress: (progress) => {
              if (!abortedRef.current) {
                setState((prev) => ({ ...prev, compressionProgress: progress }))
              }
            },
          })
          compressedBlob = result.blob
          contentType = 'video/mp4'
        }
      }

      if (abortedRef.current) return

      setState((prev) => ({ ...prev, compressionProgress: 100 }))

      // 2. Presigned URL 요청
      setState((prev) => ({ ...prev, stage: 'uploading', uploadProgress: 0 }))

      const ext = contentType.split('/')[1] || (fileType === 'image' ? 'webp' : 'mp4')
      const fileName = file.name.replace(/\.[^/.]+$/, '') + `.${ext}`
      const { uploadUrl, fileUrl } = await getPresignedUrl(fileName, contentType, compressedBlob.size)

      if (abortedRef.current) return

      // 3. S3 업로드
      await uploadToS3(uploadUrl, compressedBlob, contentType, {
        onProgress: (progress) => {
          if (!abortedRef.current) {
            setState((prev) => ({ ...prev, uploadProgress: progress }))
          }
        },
      })

      if (abortedRef.current) return

      setState((prev) => ({
        ...prev,
        stage: 'complete',
        uploadProgress: 100,
        resultUrl: fileUrl,
      }))
    } catch (err) {
      if (abortedRef.current) return

      const message = err instanceof Error ? err.message : '업로드 중 오류가 발생했습니다.'
      setState((prev) => ({
        ...prev,
        stage: 'error',
        error: message,
      }))
    }
  }, [state.file, state.fileType])

  return {
    state,
    selectFile,
    startUpload,
    reset,
  }
}
