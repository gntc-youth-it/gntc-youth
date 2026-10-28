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
// - 같은 반응을 빠르게 연타하면 요청이 끝날 때까지 무시한다
// - 한 감사의 반응 요청은 하나씩 차례로 보낸다. 동시에 보내면 먼저 처리된 요청의 응답이 늦게 도착해
//   더 새로운 상태를 덮어쓸 수 있는데(🙏 응답이 ❤️ 응답보다 늦게 와서 ❤️가 꺼져 보임), 차례로 보내면
//   응답이 서버가 처리한 순서대로 오므로 늘 마지막 응답이 최신이다
export const useReactions = ({ updateEntry, onEntryGone, onError }: UseReactionsOptions) => {
  // 아직 응답을 못 받은(차례를 기다리는 것 포함) 반응과, 그 반응을 켜려는지(true) 끄려는지(false)
  const pending = useRef(new Map<string, boolean>())
  // 감사마다 마지막으로 줄 세운 요청. 다음 요청은 이게 끝난 뒤에 보낸다
  const queues = useRef(new Map<number, Promise<void>>())
  // 반응을 보내다 이미 지워진 것을 안 감사. 줄 서 있던 요청은 보내지 않는다
  const goneEntries = useRef(new Set<number>())

  // 서버 값은 그 요청을 처리한 순간의 것이라, 아직 응답을 못 받은 다른 반응은 누른 대로 다시 얹는다
  const withPending = useCallback((entryId: number, reactions: ThanksReaction[]) => {
    let next = reactions
    pending.current.forEach((on, key) => {
      const [id, emoji] = key.split(':')
      if (Number(id) === entryId) next = setMyReaction(next, emoji as ReactionEmoji, on)
    })
    return next
  }, [])

  const send = useCallback(
    async (entryId: number, emoji: ReactionEmoji, on: boolean) => {
      const key = keyOf(entryId, emoji)
      if (goneEntries.current.has(entryId)) {
        pending.current.delete(key)
        return
      }
      try {
        const { reactions } = on ? await addReaction(entryId, emoji) : await removeReaction(entryId, emoji)
        pending.current.delete(key)
        updateEntry(entryId, (current) => ({ ...current, reactions: withPending(entryId, reactions) }))
      } catch (error) {
        pending.current.delete(key)
        if (error instanceof HttpError && error.code === THANKS_ERROR_CODE.ENTRY_NOT_FOUND) {
          goneEntries.current.add(entryId)
          onEntryGone(entryId)
          return
        }
        updateEntry(entryId, (current) => ({ ...current, reactions: setMyReaction(current.reactions, emoji, !on) }))
        onError('반응을 보내지 못했어요. 잠시 후 다시 눌러 주세요.')
      }
    },
    [onEntryGone, onError, updateEntry, withPending]
  )

  const react = useCallback(
    (entry: ThanksEntry, emoji: ReactionEmoji): Promise<void> => {
      const key = keyOf(entry.id, emoji)
      // 같은 반응이 아직 가는 중이면 이번 누름은 무시한다
      if (pending.current.has(key)) return Promise.resolve()

      const on = !(entry.reactions.find((reaction) => reaction.emoji === emoji)?.reactedByMe ?? false)
      pending.current.set(key, on)
      updateEntry(entry.id, (current) => ({ ...current, reactions: setMyReaction(current.reactions, emoji, on) }))

      // 줄 선 요청이 없으면 바로 보내고, 있으면 그 뒤에 보낸다. send는 오류를 스스로 처리해서 줄이 끊기지 않는다
      const previous = queues.current.get(entry.id)
      const request = previous ? previous.then(() => send(entry.id, emoji, on)) : send(entry.id, emoji, on)
      queues.current.set(entry.id, request)
      void request.then(() => {
        if (queues.current.get(entry.id) === request) queues.current.delete(entry.id)
      })
      return request
    },
    [send, updateEntry]
  )

  return { react }
}
