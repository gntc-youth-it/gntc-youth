import { getSlotOrder, parseServerTime } from './slots'
import type { ReactionEmoji, ThanksEntry, ThanksLog, ThanksReaction } from './types'

// 하루치 기록을 사람별로 묶는다. 각자의 카드는 아침→오후→저녁, 사람은 마지막으로 올린 시각이 최신인 순
export const groupLogs = (entries: ThanksEntry[]): ThanksLog[] => {
  const byAuthor = new Map<number, ThanksEntry[]>()
  entries.forEach((entry) => {
    const list = byAuthor.get(entry.author.userId) ?? []
    list.push(entry)
    byAuthor.set(entry.author.userId, list)
  })

  return Array.from(byAuthor.values())
    .map((list) => {
      const sorted = [...list].sort((a, b) => getSlotOrder(a.slot) - getSlotOrder(b.slot))
      const lastPostedAt = list.reduce(
        (latest, entry) => (parseServerTime(entry.createdAt) > parseServerTime(latest) ? entry.createdAt : latest),
        list[0].createdAt
      )
      return { author: sorted[0].author, entries: sorted, lastPostedAt }
    })
    .sort((a, b) => parseServerTime(b.lastPostedAt) - parseServerTime(a.lastPostedAt))
}

const flatten = (logs: ThanksLog[]): ThanksEntry[] => logs.flatMap((log) => log.entries)

// 방금 올린 기록을 목록에 바로 넣는다. 같은 id가 있으면 바꾼다
export const upsertEntry = (logs: ThanksLog[], entry: ThanksEntry): ThanksLog[] =>
  groupLogs([...flatten(logs).filter((item) => item.id !== entry.id), entry])

export const removeEntry = (logs: ThanksLog[], entryId: number): ThanksLog[] =>
  groupLogs(flatten(logs).filter((item) => item.id !== entryId))

// 반응을 누르면 켜고, 다시 누르면 끈다. 서버 응답 전에 화면부터 바꿀 때 쓴다
export const toggleReaction = (reactions: ThanksReaction[], emoji: ReactionEmoji): ThanksReaction[] => {
  const current = reactions.find((reaction) => reaction.emoji === emoji)
  if (!current) return [...reactions, { emoji, count: 1, reactedByMe: true }]

  return reactions
    .map((reaction) =>
      reaction.emoji === emoji
        ? {
            ...reaction,
            count: reaction.count + (reaction.reactedByMe ? -1 : 1),
            reactedByMe: !reaction.reactedByMe,
          }
        : reaction
    )
    .filter((reaction) => reaction.count > 0)
}
