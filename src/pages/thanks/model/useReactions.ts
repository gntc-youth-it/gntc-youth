import { useCallback, useRef } from 'react'
import { HttpError } from '../../../shared/api'
import { addReaction, removeReaction } from '../api/thanksApi'
import { setMyReaction } from './logs'
import { THANKS_ERROR_CODE } from './types'
import type { ReactionEmoji, ThanksEntry, ThanksReaction } from './types'

interface UseReactionsOptions {
  updateEntry: (entryId: number, update: (entry: ThanksEntry) => ThanksEntry) => void
  // 다른 기기에서 그 감사를 이미 지운 경우
  onEntryGone: (entryId: number) => void
  onError: (message: string) => void
}

const keyOf = (entryId: number, emoji: ReactionEmoji) => `${entryId}:${emoji}`

// 반응은 누르자마자 화면부터 바꾸고, 서버가 돌려준 그 감사의 반응 전체로 맞춘다.
// 같은 반응을 빠르게 연타하면 요청이 끝날 때까지 무시해서, 켜기·끄기 응답이 뒤바뀐 순서로 반영되지 않게 한다
export const useReactions = ({ updateEntry, onEntryGone, onError }: UseReactionsOptions) => {
  // 아직 응답을 못 받은 반응과, 그 반응을 켜려는지(true) 끄려는지(false)
  const pending = useRef(new Map<string, boolean>())

  // 서버 값은 그 요청을 처리한 순간의 것이라, 아직 응답을 못 받은 다른 반응은 누른 대로 다시 얹는다
  const withPending = useCallback((entryId: number, reactions: ThanksReaction[]) => {
    let next = reactions
    pending.current.forEach((on, key) => {
      const [id, emoji] = key.split(':')
      if (Number(id) === entryId) next = setMyReaction(next, emoji as ReactionEmoji, on)
    })
    return next
  }, [])

  const react = useCallback(
    async (entry: ThanksEntry, emoji: ReactionEmoji) => {
      const key = keyOf(entry.id, emoji)
      if (pending.current.has(key)) return

      const on = !(entry.reactions.find((reaction) => reaction.emoji === emoji)?.reactedByMe ?? false)
      pending.current.set(key, on)
      updateEntry(entry.id, (current) => ({ ...current, reactions: setMyReaction(current.reactions, emoji, on) }))

      try {
        const { reactions } = on ? await addReaction(entry.id, emoji) : await removeReaction(entry.id, emoji)
        pending.current.delete(key)
        updateEntry(entry.id, (current) => ({ ...current, reactions: withPending(entry.id, reactions) }))
      } catch (error) {
        pending.current.delete(key)
        if (error instanceof HttpError && error.code === THANKS_ERROR_CODE.ENTRY_NOT_FOUND) {
          onEntryGone(entry.id)
          return
        }
        updateEntry(entry.id, (current) => ({ ...current, reactions: setMyReaction(current.reactions, emoji, !on) }))
        onError('반응을 보내지 못했어요. 잠시 후 다시 눌러 주세요.')
      }
    },
    [onEntryGone, onError, updateEntry, withPending]
  )

  return { react }
}
