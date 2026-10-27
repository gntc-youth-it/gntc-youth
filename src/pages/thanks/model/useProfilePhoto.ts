import { useCallback, useEffect, useRef, useState } from 'react'
import { getFilePresignedUrl } from '../../../shared/api'
import { MAX_IMAGE_SIZE } from '../../../shared/config'
import { compressImage, uploadToS3 } from '../../../shared/lib'

export type ProfilePhotoStatus = 'idle' | 'uploading' | 'done' | 'error'

export interface ProfilePhotoState {
  status: ProfilePhotoStatus
  fileId: number | null
  previewUrl: string | null
  error: string | null
}

// 동그랗게 작게 보이는 사진이라 640px이면 충분하다
const PROFILE_COMPRESSION = { maxWidth: 640, maxHeight: 640, quality: 0.85 }

const IDLE: ProfilePhotoState = { status: 'idle', fileId: null, previewUrl: null, error: null }

// 프로필 사진은 늘 새로 올린 파일을 쓴다(감사에 붙인 사진을 다시 쓰지 않는다). 고르자마자 올려 둔다
export const useProfilePhoto = () => {
  const [state, setState] = useState<ProfilePhotoState>(IDLE)
  // 올리는 도중 다른 사진을 고르면 앞의 결과는 버린다
  const uploadSeq = useRef(0)
  const objectUrl = useRef<string | null>(null)

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    },
    []
  )

  const select = useCallback(async (file: File) => {
    // 잘못 고른 파일이면 이미 고른 사진(올리는 중이어도)은 그대로 두고 안내만 한다.
    // 그 파일은 화면에 보인 적이 없으니, 미리보기에 남은 사진이 그대로 저장되는 것이 맞다
    if (!file.type.startsWith('image/')) {
      setState((prev) => ({ ...prev, error: '사진 파일만 고를 수 있어요.' }))
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setState((prev) => ({ ...prev, error: '20MB보다 큰 사진은 쓸 수 없어요.' }))
      return
    }

    const seq = ++uploadSeq.current
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    objectUrl.current = URL.createObjectURL(file)
    setState({ status: 'uploading', fileId: null, previewUrl: objectUrl.current, error: null })

    try {
      const { blob } = await compressImage(file, PROFILE_COMPRESSION)
      const extension = blob.type === 'image/jpeg' ? 'jpg' : blob.type.split('/')[1] || 'webp'
      const { fileId, presignedUrl } = await getFilePresignedUrl(`profile.${extension}`, blob.type, blob.size)
      await uploadToS3(presignedUrl, blob, blob.type)
      if (seq !== uploadSeq.current) return
      setState((prev) => ({ ...prev, status: 'done', fileId }))
    } catch (error) {
      if (seq !== uploadSeq.current) return
      const message =
        error instanceof Error && error.message.includes('이미지를 불러올 수 없습니다')
          ? '이 사진은 열 수 없어요. 다른 사진을 골라 주세요.'
          : '사진을 올리지 못했어요. 인터넷 연결을 확인하고 다시 골라 주세요.'
      setState((prev) => ({ ...prev, status: 'error', fileId: null, error: message }))
    }
  }, [])

  return { ...state, select }
}
