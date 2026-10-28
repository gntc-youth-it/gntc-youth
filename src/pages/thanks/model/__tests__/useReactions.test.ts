import { act, renderHook } from '@testing-library/react'
import { HttpError } from '../../../../shared/api'
import { addReaction, removeReaction } from '../../api/thanksApi'
import type { ThanksEntry, ThanksEntryReactionsResponse, ThanksReaction } from '../types'
import { useReactions } from '../useReactions'

jest.mock('../../api/thanksApi', () => ({
  addReaction: jest.fn(),
  removeReaction: jest.fn(),
}))

const mockAddReaction = addReaction as jest.MockedFunction<typeof addReaction>
const mockRemoveReaction = removeReaction as jest.MockedFunction<typeof removeReaction>

const makeEntry = (reactions: ThanksReaction[]): ThanksEntry => ({
  id: 12,
  missionDate: '2026-11-09',
  slot: 'MORNING',
  content: '감사',
  media: { fileId: 1, url: 'uploads/1.webp', type: 'IMAGE' },
  author: { userId: 2, name: '김하늘', profileImageUrl: null },
  reactions,
  commentCount: 0,
  latestComment: null,
  isMine: false,
  createdAt: '2026-11-08T22:00:00',
})

// 목록 대신 기록 하나를 들고 있다가 updateEntry가 오면 바꾼다.
// CRA 설정은 테스트마다 jest.fn 구현을 지우므로 일반 함수로 둔다
let entry: ThanksEntry
const updateEntry = (_id: number, update: (current: ThanksEntry) => ThanksEntry) => {
  entry = update(entry)
}
const onEntryGone = jest.fn()
const onError = jest.fn()

const deferred = () => {
  let resolve: (value: ThanksEntryReactionsResponse) => void = () => undefined
  let reject: (error: unknown) => void = () => undefined
  const promise = new Promise<ThanksEntryReactionsResponse>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}

const renderReactions = () => renderHook(() => useReactions({ updateEntry, onEntryGone, onError })).result

beforeEach(() => {
  jest.clearAllMocks()
  entry = makeEntry([{ emoji: 'PRAY', count: 2, reactedByMe: false }])
})

describe('useReactions', () => {
  it('누르자마자 켜고, 서버가 돌려준 반응 전체로 맞춘다', async () => {
    const server = deferred()
    mockAddReaction.mockReturnValue(server.promise)
    const result = renderReactions()

    let reacting: Promise<void> = Promise.resolve()
    act(() => {
      reacting = result.current.react(entry, 'PRAY')
    })
    expect(entry.reactions).toEqual([{ emoji: 'PRAY', count: 3, reactedByMe: true }])

    await act(async () => {
      // 그사이 다른 사람도 눌러서 서버에는 4개다
      server.resolve({ entryId: 12, reactions: [{ emoji: 'PRAY', count: 4, reactedByMe: true }] })
      await reacting
    })

    expect(mockAddReaction).toHaveBeenCalledWith(12, 'PRAY')
    expect(entry.reactions).toEqual([{ emoji: 'PRAY', count: 4, reactedByMe: true }])
  })

  it('내가 누른 반응을 다시 누르면 끈다', async () => {
    entry = makeEntry([{ emoji: 'HEART', count: 1, reactedByMe: true }])
    mockRemoveReaction.mockResolvedValue({ entryId: 12, reactions: [] })
    const result = renderReactions()

    await act(async () => {
      await result.current.react(entry, 'HEART')
    })

    expect(mockRemoveReaction).toHaveBeenCalledWith(12, 'HEART')
    expect(entry.reactions).toEqual([])
  })

  it('요청이 끝나기 전에 같은 반응을 또 누르면 무시한다', async () => {
    const server = deferred()
    mockAddReaction.mockReturnValue(server.promise)
    const result = renderReactions()

    let reacting: Promise<void> = Promise.resolve()
    act(() => {
      reacting = result.current.react(entry, 'PRAY')
    })
    await act(async () => {
      await result.current.react(entry, 'PRAY')
    })

    expect(mockAddReaction).toHaveBeenCalledTimes(1)
    expect(mockRemoveReaction).not.toHaveBeenCalled()
    await act(async () => {
      server.resolve({ entryId: 12, reactions: [{ emoji: 'PRAY', count: 3, reactedByMe: true }] })
      await reacting
    })
  })

  it('한 감사의 반응은 하나씩 차례로 보내고, 차례를 기다리는 반응은 서버 값 위에 누른 대로 얹는다', async () => {
    const pray = deferred()
    const heart = deferred()
    mockAddReaction.mockImplementation((_id, emoji) => (emoji === 'PRAY' ? pray.promise : heart.promise))
    const result = renderReactions()

    let reactingPray: Promise<void> = Promise.resolve()
    let reactingHeart: Promise<void> = Promise.resolve()
    act(() => {
      reactingPray = result.current.react(entry, 'PRAY')
    })
    act(() => {
      reactingHeart = result.current.react(entry, 'HEART')
    })

    // ❤️는 🙏 응답을 받을 때까지 보내지 않는다
    expect(mockAddReaction).toHaveBeenCalledTimes(1)
    expect(mockAddReaction).toHaveBeenLastCalledWith(12, 'PRAY')

    // 🙏 응답에는 아직 ❤️가 없지만, 차례를 기다리는 ❤️는 화면에 누른 대로 남는다
    await act(async () => {
      pray.resolve({ entryId: 12, reactions: [{ emoji: 'PRAY', count: 3, reactedByMe: true }] })
      await reactingPray
    })
    expect(entry.reactions).toEqual([
      { emoji: 'PRAY', count: 3, reactedByMe: true },
      { emoji: 'HEART', count: 1, reactedByMe: true },
    ])
    expect(mockAddReaction).toHaveBeenCalledTimes(2)
    expect(mockAddReaction).toHaveBeenLastCalledWith(12, 'HEART')

    await act(async () => {
      heart.resolve({
        entryId: 12,
        reactions: [
          { emoji: 'PRAY', count: 3, reactedByMe: true },
          { emoji: 'HEART', count: 2, reactedByMe: true },
        ],
      })
      await reactingHeart
    })
    expect(entry.reactions).toEqual([
      { emoji: 'PRAY', count: 3, reactedByMe: true },
      { emoji: 'HEART', count: 2, reactedByMe: true },
    ])
  })

  it('다른 감사의 반응은 기다리지 않고 바로 보낸다', async () => {
    const first = deferred()
    mockAddReaction.mockReturnValueOnce(first.promise).mockResolvedValueOnce({ entryId: 99, reactions: [] })
    const other: ThanksEntry = { ...makeEntry([]), id: 99 }
    const result = renderReactions()

    let reacting: Promise<void> = Promise.resolve()
    act(() => {
      reacting = result.current.react(entry, 'PRAY')
    })
    await act(async () => {
      await result.current.react(other, 'PRAY')
    })

    expect(mockAddReaction).toHaveBeenCalledWith(99, 'PRAY')
    await act(async () => {
      first.resolve({ entryId: 12, reactions: [{ emoji: 'PRAY', count: 3, reactedByMe: true }] })
      await reacting
    })
  })

  it('보내지 못하면 되돌리고 알린다', async () => {
    const server = deferred()
    mockAddReaction.mockReturnValue(server.promise)
    const result = renderReactions()

    let reacting: Promise<void> = Promise.resolve()
    act(() => {
      reacting = result.current.react(entry, 'PRAY')
    })
    expect(entry.reactions).toEqual([{ emoji: 'PRAY', count: 3, reactedByMe: true }])

    await act(async () => {
      server.reject(new Error('offline'))
      await reacting
    })

    expect(entry.reactions).toEqual([{ emoji: 'PRAY', count: 2, reactedByMe: false }])
    expect(onError).toHaveBeenCalledWith('반응을 보내지 못했어요. 잠시 후 다시 눌러 주세요.')
  })

  it('이미 지워진 감사(6003)면 목록에서 빼도록 한 번만 알리고, 차례를 기다리던 반응은 보내지 않는다', async () => {
    const pray = deferred()
    mockAddReaction.mockReturnValueOnce(pray.promise)
    const result = renderReactions()

    let reactingPray: Promise<void> = Promise.resolve()
    let reactingHeart: Promise<void> = Promise.resolve()
    act(() => {
      reactingPray = result.current.react(entry, 'PRAY')
    })
    act(() => {
      reactingHeart = result.current.react(entry, 'HEART')
    })
    await act(async () => {
      pray.reject(new HttpError(404, '감사 기록을 찾을 수 없어요.', 6003))
      await reactingPray
      await reactingHeart
    })

    expect(onEntryGone).toHaveBeenCalledTimes(1)
    expect(onEntryGone).toHaveBeenCalledWith(12)
    expect(mockAddReaction).toHaveBeenCalledTimes(1)
    expect(onError).not.toHaveBeenCalled()
  })
})
