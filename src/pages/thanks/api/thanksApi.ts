import { apiRequest, getFilePresignedUrl } from '../../../shared/api'
import { uploadToS3 } from '../../../shared/lib'
import type {
  CreateThanksEntryRequest,
  ReactionEmoji,
  ThanksEntriesResponse,
  ThanksEntry,
  ThanksEntryReactionsResponse,
} from '../model/types'

export const fetchThanksEntries = (date: string): Promise<ThanksEntriesResponse> =>
  apiRequest<ThanksEntriesResponse>(`/thanks/entries?date=${encodeURIComponent(date)}`)

// 날짜와 칸(아침·오후·저녁)은 서버가 올린 시각으로 정한다
export const createThanksEntry = (data: CreateThanksEntryRequest): Promise<ThanksEntry> =>
  apiRequest<ThanksEntry>('/thanks/entries', { method: 'POST', body: JSON.stringify(data) })

// 서버가 붙어 있던 사진 파일도 같이 지운다
export const deleteThanksEntry = async (entryId: number): Promise<void> => {
  await apiRequest<void>(`/thanks/entries/${entryId}`, { method: 'DELETE' })
}

// 반응 켜기·끄기. 여러 번 보내도 결과가 같고, 그사이 다른 사람이 누른 것까지 반영한 그 감사의 반응 전체를 돌려준다
export const addReaction = (entryId: number, emoji: ReactionEmoji): Promise<ThanksEntryReactionsResponse> =>
  apiRequest<ThanksEntryReactionsResponse>(`/thanks/entries/${entryId}/reactions/${emoji}`, { method: 'PUT' })

export const removeReaction = (entryId: number, emoji: ReactionEmoji): Promise<ThanksEntryReactionsResponse> =>
  apiRequest<ThanksEntryReactionsResponse>(`/thanks/entries/${entryId}/reactions/${emoji}`, { method: 'DELETE' })

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'video/quicktime': 'mov',
}

// 사진·영상을 S3에 바로 올리고 파일 번호를 받는다. 갤러리 글쓰기와 같은 방식
export const uploadEntryMedia = async (blob: Blob, onProgress: (progress: number) => void): Promise<number> => {
  const extension = EXTENSIONS[blob.type] ?? (blob.type.split('/')[1] || 'bin')
  const { fileId, presignedUrl } = await getFilePresignedUrl(`thanks.${extension}`, blob.type, blob.size)
  await uploadToS3(presignedUrl, blob, blob.type, { onProgress })
  return fileId
}
