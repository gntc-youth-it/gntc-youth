import { useCallback, useEffect, useRef, useState } from 'react'
import { getFilePresignedUrl } from '../../../shared/api'
import { MAX_IMAGE_SIZE } from '../../../shared/config'
import { compressImage, uploadToS3 } from '../../../shared/lib'

export type MissionPhotoStatus = 'idle' | 'compressing' | 'uploading' | 'done' | 'error'

export interface MissionPhotoState {
  status: MissionPhotoStatus
  progress: number
  fileId: number | null
  previewUrl: string | null
  error: string | null
}

interface ExistingPhoto {
  fileId: number
  url: string
}

const toUploadError = (error: unknown): string => {
  const message = error instanceof Error ? error.message : ''
  if (message.includes('이미지를 불러올 수 없습니다')) return '이 사진은 열 수 없어요. 다른 사진을 골라 주세요.'
  return '사진을 올리지 못했어요. 인터넷 연결을 확인하고 다시 올려 주세요.'
}

// 사진을 고르면 폰에서 줄인 뒤 S3에 바로 올린다. 갤러리 글쓰기와 같은 방식
export const useMissionPhoto = (existing: ExistingPhoto | null) => {
  const [state, setState] = useState<MissionPhotoState>(() =>
    existing
      ? { status: 'done', progress: 100, fileId: existing.fileId, previewUrl: existing.url, error: null }
      : { status: 'idle', progress: 0, fileId: null, previewUrl: null, error: null }
  )
  // 올리는 도중 다른 사진을 고르면 앞의 업로드 결과는 버린다
  const uploadSeq = useRef(0)
  const lastFile = useRef<File | null>(null)
  const objectUrl = useRef<string | null>(null)

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    },
    []
  )

  const select = useCallback(async (file: File) => {
    // 잘못 고른 파일이면 이미 올린 사진(또는 올리는 중인 사진)은 그대로 두고 안내만 한다
    if (!file.type.startsWith('image/')) {
      setState((prev) => ({ ...prev, error: '사진 파일만 올릴 수 있어요.' }))
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setState((prev) => ({ ...prev, error: '20MB보다 큰 사진은 올릴 수 없어요.' }))
      return
    }

    const seq = ++uploadSeq.current
    lastFile.current = file

    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    objectUrl.current = URL.createObjectURL(file)
    setState({ status: 'compressing', progress: 0, fileId: null, previewUrl: objectUrl.current, error: null })

    try {
      const { blob } = await compressImage(file)
      if (seq !== uploadSeq.current) return
      setState((prev) => ({ ...prev, status: 'uploading' }))

      const extension = blob.type.split('/')[1] || 'webp'
      const { fileId, presignedUrl } = await getFilePresignedUrl(`zoo-mission.${extension}`, blob.type, blob.size)
      await uploadToS3(presignedUrl, blob, blob.type, {
        onProgress: (progress) => {
          if (seq === uploadSeq.current) setState((prev) => ({ ...prev, progress }))
        },
      })
      if (seq !== uploadSeq.current) return

      setState((prev) => ({ ...prev, status: 'done', progress: 100, fileId }))
    } catch (error) {
      if (seq !== uploadSeq.current) return
      setState((prev) => ({ ...prev, status: 'error', fileId: null, error: toUploadError(error) }))
    }
  }, [])

  const retry = useCallback(() => {
    if (lastFile.current) void select(lastFile.current)
  }, [select])

  return { ...state, select, retry }
}
