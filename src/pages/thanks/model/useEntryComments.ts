import { useCallback, useEffect, useRef, useState } from 'react'
import { HttpError } from '../../../shared/api'
import { usePolling } from '../../../shared/lib'
import { createComment, deleteComment, fetchComments } from '../api/thanksApi'
import { THANKS_ERROR_CODE } from './types'
import type { ThanksComment, ThanksEntry } from './types'

interface UseEntryCommentsOptions {
  updateEntry: (entryId: number, update: (entry: ThanksEntry) => ThanksEntry) => void
  // 다른 기기에서 그 감사를 이미 지운 경우
  onEntryGone: (entryId: number) => void
  onError: (message: string) => void
}

const POLL_INTERVAL_MS = 30 * 1000

const hasCode = (error: unknown, code: number) => error instanceof HttpError && error.code === code

// 크게 보기에서 연 감사의 댓글. 보고 있는 동안 30초마다 새로 불러오고,
// 달거나 지우면 서버가 돌려준 댓글 전체로 바꾸면서 목록 카드의 댓글 수와 최근 댓글도 맞춘다
export const useEntryComments = (entryId: number | null, { updateEntry, onEntryGone, onError }: UseEntryCommentsOptions) => {
  // 불러오는 중이면 null
  const [comments, setComments] = useState<ThanksComment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const sending = useRef(false)
  // 댓글을 달거나 지우면 그 전에 보낸 불러오기 응답은 버린다. 늦게 와서 방금 바뀐 목록을 덮지 않게
  const requestSeq = useRef(0)
  const currentEntryId = useRef(entryId)
  currentEntryId.current = entryId

  const apply = useCallback(
    (id: number, list: ThanksComment[]) => {
      if (currentEntryId.current === id) setComments(list)
      const latest = list[list.length - 1]
      updateEntry(id, (entry) => ({
        ...entry,
        commentCount: list.length,
        latestComment: latest ? { author: latest.author, content: latest.content } : null,
      }))
    },
    [updateEntry]
  )

  const load = useCallback(async () => {
    if (entryId === null) return
    const seq = ++requestSeq.current
    try {
      const { comments: list } = await fetchComments(entryId)
      if (seq !== requestSeq.current) return
      setError(null)
      apply(entryId, list)
    } catch (loadError) {
      if (seq !== requestSeq.current) return
      if (hasCode(loadError, THANKS_ERROR_CODE.ENTRY_NOT_FOUND)) {
        onEntryGone(entryId)
        return
      }
      setError('댓글을 불러오지 못했어요.')
    }
  }, [apply, entryId, onEntryGone])

  useEffect(() => {
    setComments(null)
    setError(null)
    void load()
  }, [load])

  usePolling(load, POLL_INTERVAL_MS, entryId !== null)

  // 보내는 동안에는 다시 보내지 않는다(같은 댓글이 두 번 달리지 않게). 달았으면 true
  const add = useCallback(
    async (content: string): Promise<boolean> => {
      if (entryId === null || sending.current) return false
      sending.current = true
      setIsSending(true)
      requestSeq.current += 1
      try {
        const { comments: list } = await createComment(entryId, content)
        apply(entryId, list)
        return true
      } catch (addError) {
        if (hasCode(addError, THANKS_ERROR_CODE.ENTRY_NOT_FOUND)) {
          onEntryGone(entryId)
          return false
        }
        onError(
          hasCode(addError, THANKS_ERROR_CODE.INVALID_REQUEST)
            ? '댓글은 1~100자로 적어 주세요.'
            : '댓글을 달지 못했어요. 잠시 후 다시 해 주세요.'
        )
        return false
      } finally {
        sending.current = false
        setIsSending(false)
      }
    },
    [apply, entryId, onEntryGone, onError]
  )

  const remove = useCallback(
    async (commentId: number) => {
      requestSeq.current += 1
      try {
        const { entryId: id, comments: list } = await deleteComment(commentId)
        apply(id, list)
      } catch (removeError) {
        // 다른 기기에서 이미 지운 댓글이면 목록만 새로 불러온다
        if (hasCode(removeError, THANKS_ERROR_CODE.COMMENT_NOT_FOUND)) {
          void load()
          return
        }
        onError(
          hasCode(removeError, THANKS_ERROR_CODE.COMMENT_ACCESS_DENIED)
            ? '내가 쓴 댓글만 지울 수 있어요.'
            : '댓글을 지우지 못했어요. 잠시 후 다시 해 주세요.'
        )
      }
    },
    [apply, load, onError]
  )

  return { comments, error, isSending, add, remove, reload: load }
}
