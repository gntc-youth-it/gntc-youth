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

// 한 감사의 댓글 달기·지우기는 하나씩 차례로 보낸다. 응답이 모두 그 감사의 댓글 전체라, 동시에 보내면
// 먼저 처리된 요청의 응답이 늦게 도착해 더 새로운 목록을 덮을 수 있다(지운 댓글이 되살아나 보임).
// 앞 요청이 실패해도 다음 요청은 보낸다
const sendInOrder = <T>(queues: Map<number, Promise<unknown>>, entryId: number, send: () => Promise<T>) => {
  const previous = queues.get(entryId)
  const request = previous ? previous.then(send, send) : send()
  queues.set(entryId, request)
  const forget = () => {
    if (queues.get(entryId) === request) queues.delete(entryId)
  }
  void request.then(forget, forget)
  return request
}

// 크게 보기에서 연 감사의 댓글. 보고 있는 동안 30초마다 새로 불러오고,
// 달거나 지우면 서버가 돌려준 댓글 전체로 바꾸면서 목록 카드의 댓글 수와 최근 댓글도 맞춘다
export const useEntryComments = (entryId: number | null, { updateEntry, onEntryGone, onError }: UseEntryCommentsOptions) => {
  // 불러오는 중이면 null
  const [comments, setComments] = useState<ThanksComment[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const sending = useRef(false)
  // 불러오기 응답이 왔을 때 그사이 다시 불러왔거나 달고 지운 결과를 받았으면 그 응답은 버린다
  const requestSeq = useRef(0)
  // 감사마다 마지막으로 줄 세운 댓글 달기·지우기
  const queues = useRef(new Map<number, Promise<unknown>>())
  const currentEntryId = useRef(entryId)
  currentEntryId.current = entryId

  const apply = useCallback(
    (id: number, list: ThanksComment[]) => {
      if (currentEntryId.current === id) {
        setComments(list)
        setError(null)
      }
      const latest = list[list.length - 1]
      updateEntry(id, (entry) => ({
        ...entry,
        commentCount: list.length,
        latestComment: latest ? { author: latest.author, content: latest.content } : null,
      }))
    },
    [updateEntry]
  )

  // 달거나 지운 결과. 그사이 보낸 불러오기는 그 전 목록을 읽었을 수 있어 늦게 와서 덮지 않게 버린다.
  // 다른 감사를 열었으면 그 감사의 불러오기는 그대로 두고 목록 카드만 맞춘다
  const applyChange = useCallback(
    (id: number, list: ThanksComment[]) => {
      if (currentEntryId.current === id) requestSeq.current += 1
      apply(id, list)
    },
    [apply]
  )

  const load = useCallback(async () => {
    if (entryId === null) return
    const seq = ++requestSeq.current
    try {
      const { comments: list } = await fetchComments(entryId)
      if (seq !== requestSeq.current) return
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
      const id = entryId
      sending.current = true
      setIsSending(true)
      try {
        const { comments: list } = await sendInOrder(queues.current, id, () => createComment(id, content))
        applyChange(id, list)
        return true
      } catch (addError) {
        if (hasCode(addError, THANKS_ERROR_CODE.ENTRY_NOT_FOUND)) {
          onEntryGone(id)
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
    [applyChange, entryId, onEntryGone, onError]
  )

  const remove = useCallback(
    async (commentId: number) => {
      if (entryId === null) return
      const openedId = entryId
      try {
        const { entryId: id, comments: list } = await sendInOrder(queues.current, openedId, () => deleteComment(commentId))
        applyChange(id, list)
      } catch (removeError) {
        // 다른 기기에서 이미 지운 댓글이면 목록만 새로 불러온다. 그사이 다른 감사를 열었으면 그냥 둔다
        if (hasCode(removeError, THANKS_ERROR_CODE.COMMENT_NOT_FOUND)) {
          if (currentEntryId.current === openedId) void load()
          return
        }
        onError(
          hasCode(removeError, THANKS_ERROR_CODE.COMMENT_ACCESS_DENIED)
            ? '내가 쓴 댓글만 지울 수 있어요.'
            : '댓글을 지우지 못했어요. 잠시 후 다시 해 주세요.'
        )
      }
    },
    [applyChange, entryId, load, onError]
  )

  return { comments, error, isSending, add, remove, reload: load }
}
