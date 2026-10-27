import { groupLogs, removeEntry, toggleReaction, upsertEntry } from '../logs'
import type { Slot, ThanksAuthor, ThanksEntry } from '../types'

const author = (userId: number): ThanksAuthor => ({ userId, name: `청년${userId}`, profileImageUrl: null })

const entry = (id: number, userId: number, slot: Slot, createdAt: string): ThanksEntry => ({
  id,
  missionDate: '2026-11-09',
  slot,
  content: `감사 ${id}`,
  media: { fileId: id, url: `https://cdn.gntc-youth.com/uploads/${id}.webp`, type: 'IMAGE' },
  author: author(userId),
  reactions: [],
  commentCount: 0,
  latestComment: null,
  isMine: false,
  createdAt,
})

describe('groupLogs', () => {
  it('마지막으로 올린 시각이 최신인 사람부터 보여 준다', () => {
    const logs = groupLogs([
      entry(1, 1, 'MORNING', '2026-11-09T07:00:00+09:00'),
      entry(2, 2, 'MORNING', '2026-11-09T08:00:00+09:00'),
      entry(3, 1, 'AFTERNOON', '2026-11-09T13:00:00+09:00'),
    ])

    expect(logs.map((log) => log.author.userId)).toEqual([1, 2])
    expect(logs[0].lastPostedAt).toBe('2026-11-09T13:00:00+09:00')
  })

  it('한 사람의 카드는 아침, 오후, 저녁 순서로 쌓는다', () => {
    const [log] = groupLogs([
      entry(1, 1, 'EVENING', '2026-11-09T19:00:00+09:00'),
      entry(2, 1, 'MORNING', '2026-11-09T07:00:00+09:00'),
      entry(3, 1, 'AFTERNOON', '2026-11-09T13:00:00+09:00'),
    ])

    expect(log.entries.map((item) => item.slot)).toEqual(['MORNING', 'AFTERNOON', 'EVENING'])
  })

  it('기록이 없으면 빈 목록이다', () => {
    expect(groupLogs([])).toEqual([])
  })
})

describe('upsertEntry / removeEntry', () => {
  const logs = groupLogs([
    entry(1, 1, 'MORNING', '2026-11-09T07:00:00+09:00'),
    entry(2, 2, 'MORNING', '2026-11-09T08:00:00+09:00'),
  ])

  it('방금 올린 기록을 넣으면 그 사람이 맨 위로 온다', () => {
    const next = upsertEntry(logs, entry(3, 1, 'AFTERNOON', '2026-11-09T13:00:00+09:00'))

    expect(next.map((log) => log.author.userId)).toEqual([1, 2])
    expect(next[0].entries.map((item) => item.id)).toEqual([1, 3])
  })

  it('같은 기록이 이미 있으면 바꾼다', () => {
    const next = upsertEntry(logs, { ...entry(2, 2, 'MORNING', '2026-11-09T08:00:00+09:00'), content: '고친 감사' })

    expect(next.flatMap((log) => log.entries)).toHaveLength(2)
    expect(next[0].entries[0].content).toBe('고친 감사')
  })

  it('기록을 지우고, 남은 기록이 없는 사람은 목록에서 뺀다', () => {
    const next = removeEntry(logs, 2)

    expect(next.map((log) => log.author.userId)).toEqual([1])
  })
})

describe('toggleReaction', () => {
  it('처음 누르면 1개가 생긴다', () => {
    expect(toggleReaction([], 'PRAY')).toEqual([{ emoji: 'PRAY', count: 1, reactedByMe: true }])
  })

  it('다른 사람이 누른 반응에 더한다', () => {
    expect(toggleReaction([{ emoji: 'HEART', count: 2, reactedByMe: false }], 'HEART')).toEqual([
      { emoji: 'HEART', count: 3, reactedByMe: true },
    ])
  })

  it('내 반응을 다시 누르면 빼고, 0개가 되면 없앤다', () => {
    expect(toggleReaction([{ emoji: 'CLAP', count: 1, reactedByMe: true }], 'CLAP')).toEqual([])
    expect(toggleReaction([{ emoji: 'CLAP', count: 3, reactedByMe: true }], 'CLAP')).toEqual([
      { emoji: 'CLAP', count: 2, reactedByMe: false },
    ])
  })
})
