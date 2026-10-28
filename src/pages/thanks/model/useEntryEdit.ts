import { useCallback } from 'react'
import { HttpError } from '../../../shared/api'
import { updateThanksEntry } from '../api/thanksApi'
import { THANKS_ERROR_CODE } from './types'
import type { ThanksEntry } from './types'

interface UseEntryEditOptions {
  updateEntry: (entryId: number, update: (entry: ThanksEntry) => ThanksEntry) => void
  // 다른 기기에서 그 감사를 이미 지운 경우
  onEntryGone: (entryId: number) => void
  onError: (message: string) => void
}

const toEditError = (error: unknown): string => {
  if (error instanceof HttpError) {
    if (error.code === THANKS_ERROR_CODE.INVALID_REQUEST) return '감사제목은 1~80자로 적어 주세요.'
    if (error.code === THANKS_ERROR_CODE.ENTRY_ACCESS_DENIED) return '내가 올린 감사만 고칠 수 있어요.'
  }
  return '감사제목을 고치지 못했어요. 잠시 후 다시 해 주세요.'
}

// 내 감사의 감사제목 고치기. 서버는 고친 감사 전체를 돌려주지만 감사제목만 가져다 쓴다.
// 반응은 누르자마자 화면부터 바꾸는 중일 수 있어서 응답으로 덮지 않는다
export const useEntryEdit = ({ updateEntry, onEntryGone, onError }: UseEntryEditOptions) => {
  // 고쳤으면 true
  const updateContent = useCallback(
    async (entryId: number, content: string): Promise<boolean> => {
      try {
        const { content: saved } = await updateThanksEntry(entryId, content)
        updateEntry(entryId, (entry) => ({ ...entry, content: saved }))
        return true
      } catch (error) {
        if (error instanceof HttpError && error.code === THANKS_ERROR_CODE.ENTRY_NOT_FOUND) {
          onEntryGone(entryId)
          return false
        }
        onError(toEditError(error))
        return false
      }
    },
    [onEntryGone, onError, updateEntry]
  )

  return { updateContent }
}
