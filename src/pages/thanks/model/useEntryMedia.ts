import { useCallback, useEffect, useRef, useState } from 'react'
import { uploadEntryMedia } from '../api/thanksApi'
import { MediaError, mediaTypeOf, prepareMedia } from './prepareMedia'
import type { EntryMediaType, MediaSource } from './prepareMedia'

export type EntryMediaStatus = 'idle' | 'processing' | 'uploading' | 'done' | 'error'

export interface EntryMediaState {
  status: EntryMediaStatus
  progress: number
  fileId: number | null
  previewUrl: string | null
  mediaType: EntryMediaType | null
  error: string | null
}

const IDLE: EntryMediaState = { status: 'idle', progress: 0, fileId: null, previewUrl: null, mediaType: null, error: null }

// 찍거나 고르자마자 다듬어서 올려 둔다. 감사제목을 쓰는 동안 올라가서 [올리기]가 빨라진다
export const useEntryMedia = () => {
  const [state, setState] = useState<EntryMediaState>(IDLE)
  // 올리는 도중 다시 찍거나 다른 걸 고르면 앞의 결과는 버린다
  const uploadSeq = useRef(0)
  const lastInput = useRef<{ blob: Blob; source: MediaSource } | null>(null)
  const objectUrl = useRef<string | null>(null)

  const revokePreview = useCallback(() => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    objectUrl.current = null
  }, [])

  useEffect(() => revokePreview, [revokePreview])

  const select = useCallback(async (blob: Blob, source: MediaSource) => {
    const mediaType = mediaTypeOf(blob)
    // 잘못 고른 파일이면 이미 고른 것은 그대로 두고 안내만 한다
    if (!mediaType) {
      setState((prev) => ({ ...prev, error: '사진이나 영상만 올릴 수 있어요.' }))
      return
    }

    const seq = ++uploadSeq.current
    lastInput.current = { blob, source }
    revokePreview()
    objectUrl.current = URL.createObjectURL(blob)
    setState({ status: 'processing', progress: 0, fileId: null, previewUrl: objectUrl.current, mediaType, error: null })

    const isCurrent = () => seq === uploadSeq.current
    try {
      const prepared = await prepareMedia(blob, source, (progress) => {
        if (isCurrent()) setState((prev) => ({ ...prev, progress }))
      })
      if (!isCurrent()) return
      setState((prev) => ({ ...prev, status: 'uploading', progress: 0 }))

      const fileId = await uploadEntryMedia(prepared.blob, (progress) => {
        if (isCurrent()) setState((prev) => ({ ...prev, progress }))
      })
      if (!isCurrent()) return
      setState((prev) => ({ ...prev, status: 'done', progress: 100, fileId }))
    } catch (error) {
      if (!isCurrent()) return
      const message =
        error instanceof MediaError ? error.message : '올리지 못했어요. 인터넷 연결을 확인하고 다시 올려 주세요.'
      setState((prev) => ({ ...prev, status: 'error', fileId: null, error: message }))
    }
  }, [revokePreview])

  const retry = useCallback(() => {
    if (lastInput.current) void select(lastInput.current.blob, lastInput.current.source)
  }, [select])

  // 다시 찍으러 갈 때. 올리던 것이 있으면 결과를 버린다
  const reset = useCallback(() => {
    uploadSeq.current += 1
    lastInput.current = null
    revokePreview()
    setState(IDLE)
  }, [revokePreview])

  return { ...state, select, retry, reset }
}
