import { PHOTO_VOTE_OPENS_LABEL, groupByStop, isPhotoVoteOpen, orderForViewer, rankResults } from '../photo'
import type { ZooPhotoResult } from '../photo'

const ids = (items: { id: number }[]) => items.map((item) => item.id)

describe('orderForViewer', () => {
  const items = Array.from({ length: 20 }, (_, index) => ({ id: index + 1 }))

  it('같은 사람에게는 늘 같은 순서로 섞어 보여준다', () => {
    const first = orderForViewer(items, 7)

    expect(ids(orderForViewer(items, 7))).toEqual(ids(first))
    expect([...ids(first)].sort((a, b) => a - b)).toEqual(ids(items))
    expect(ids(first)).not.toEqual(ids(items))
  })

  it('사람마다 순서가 다르다', () => {
    expect(ids(orderForViewer(items, 1))).not.toEqual(ids(orderForViewer(items, 2)))
  })

  it('새 사진이 올라와도 보던 사진들의 순서는 그대로다', () => {
    const before = ids(orderForViewer(items, 3))
    const after = ids(orderForViewer([...items, { id: 21 }], 3)).filter((id) => id !== 21)

    expect(after).toEqual(before)
  })

  it('넘겨받은 목록은 바꾸지 않는다', () => {
    const original = ids(items)
    orderForViewer(items, 5)

    expect(ids(items)).toEqual(original)
  })
})

describe('groupByStop', () => {
  it('A코스 순서로 장소별로 묶고, 사진이 없는 장소는 뺀다', () => {
    const groups = groupByStop([
      { id: 1, stopId: 'AFRICA_2' as const },
      { id: 2, stopId: 'AFRICA_1' as const },
      { id: 3, stopId: 'AFRICA_2' as const },
    ])

    expect(groups.map((group) => group.stopId)).toEqual(['AFRICA_1', 'AFRICA_2'])
    expect(ids(groups[1].items)).toEqual([1, 3])
  })
})

describe('rankResults', () => {
  const makeResult = (id: number, voteCount: number): ZooPhotoResult => ({
    id,
    stopId: 'AFRICA_1',
    teamId: id,
    teamName: `${id}조`,
    photoPath: `uploads/${id}.webp`,
    voteCount,
  })

  it('표가 많은 순서로 정렬하고, 같은 표 수는 같은 순위로 매긴다', () => {
    const ranked = rankResults([makeResult(1, 2), makeResult(2, 5), makeResult(3, 5), makeResult(4, 0)])

    expect(ranked.map((result) => [result.id, result.rank])).toEqual([
      [2, 1],
      [3, 1],
      [1, 3],
      [4, 4],
    ])
  })
})

describe('isPhotoVoteOpen', () => {
  it('10월 10일(토) 오후 4:30(한국 시간)부터 열린다', () => {
    expect(isPhotoVoteOpen(new Date('2026-10-10T16:29:59+09:00').getTime())).toBe(false)
    expect(isPhotoVoteOpen(new Date('2026-10-10T16:30:00+09:00').getTime())).toBe(true)
    expect(isPhotoVoteOpen(new Date('2026-10-11T09:00:00+09:00').getTime())).toBe(true)
    expect(PHOTO_VOTE_OPENS_LABEL).toBe('10월 10일(토) 오후 4:30')
  })
})
