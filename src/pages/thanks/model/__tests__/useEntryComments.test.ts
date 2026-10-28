import { act, renderHook, waitFor } from '@testing-library/react'
import { HttpError } from '../../../../shared/api'
import { createComment, deleteComment, fetchComments } from '../../api/thanksApi'
import type { ThanksComment, ThanksCommentsResponse, ThanksEntry } from '../types'
import { useEntryComments } from '../useEntryComments'

jest.mock('../../api/thanksApi', () => ({
  fetchComments: jest.fn(),
  createComment: jest.fn(),
  deleteComment: jest.fn(),
}))

const mockFetchComments = fetchComments as jest.MockedFunction<typeof fetchComments>
const mockCreateComment = createComment as jest.MockedFunction<typeof createComment>
const mockDeleteComment = deleteComment as jest.MockedFunction<typeof deleteComment>

const comment = (id: number, userId: number, content: string, isMine = false): ThanksComment => ({
  id,
  author: { userId, name: `청년${userId}`, profileImageUrl: null },
  content,
  isMine,
  createdAt: '2026-11-09T04:20:00',
})

const first = comment(1, 2, '아멘 🙏')
const mine = comment(2, 1, '기도할게요', true)

// 목록의 그 감사. updateEntry가 오면 바꾼다. CRA 설정은 테스트마다 jest.fn 구현을 지우므로 일반 함수로 둔다
let entry: ThanksEntry
const updateEntry = (_id: number, update: (current: ThanksEntry) => ThanksEntry) => {
  entry = update(entry)
}
const onEntryGone = jest.fn()
const onError = jest.fn()

const deferred = () => {
  let resolve: (value: ThanksCommentsResponse) => void = () => undefined
  const promise = new Promise<ThanksCommentsResponse>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

const renderComments = (entryId: number | null = 12) =>
  renderHook(() => useEntryComments(entryId, { updateEntry, onEntryGone, onError })).result

beforeEach(() => {
  jest.clearAllMocks()
  entry = {
    id: 12,
    missionDate: '2026-11-09',
    slot: 'MORNING',
    content: '감사',
    media: { fileId: 1, url: 'uploads/1.webp', type: 'IMAGE' },
    author: { userId: 3, name: '김하늘', profileImageUrl: null },
    reactions: [],
    commentCount: 1,
    latestComment: { author: first.author, content: first.content },
    isMine: false,
    createdAt: '2026-11-08T22:00:00',
  }
  mockFetchComments.mockResolvedValue({ entryId: 12, comments: [first] })
})

describe('useEntryComments', () => {
  it('연 감사의 댓글을 불러온다', async () => {
    const result = renderComments()

    expect(result.current.comments).toBeNull()
    await waitFor(() => expect(result.current.comments).toEqual([first]))
    expect(mockFetchComments).toHaveBeenCalledWith(12)
  })

  it('연 감사가 없으면 불러오지 않는다', () => {
    renderComments(null)

    expect(mockFetchComments).not.toHaveBeenCalled()
  })

  it('댓글을 달면 돌려받은 전체로 바꾸고, 목록 카드의 댓글 수와 최근 댓글도 맞춘다', async () => {
    mockCreateComment.mockResolvedValue({ entryId: 12, comments: [first, mine] })
    const result = renderComments()
    await waitFor(() => expect(result.current.comments).not.toBeNull())

    let added = false
    await act(async () => {
      added = await result.current.add('기도할게요')
    })

    expect(added).toBe(true)
    expect(mockCreateComment).toHaveBeenCalledWith(12, '기도할게요')
    expect(result.current.comments).toEqual([first, mine])
    expect(entry.commentCount).toBe(2)
    expect(entry.latestComment).toEqual({ author: mine.author, content: '기도할게요' })
  })

  it('보내는 동안 또 보내면 무시한다(같은 댓글이 두 번 달리지 않게)', async () => {
    const server = deferred()
    mockCreateComment.mockReturnValue(server.promise)
    const result = renderComments()
    await waitFor(() => expect(result.current.comments).not.toBeNull())

    let sending: Promise<boolean> = Promise.resolve(false)
    act(() => {
      sending = result.current.add('기도할게요')
    })
    expect(result.current.isSending).toBe(true)

    let second = true
    await act(async () => {
      second = await result.current.add('기도할게요')
    })
    expect(second).toBe(false)
    expect(mockCreateComment).toHaveBeenCalledTimes(1)

    await act(async () => {
      server.resolve({ entryId: 12, comments: [first, mine] })
      await sending
    })
    expect(result.current.isSending).toBe(false)
  })

  it('댓글이 비었거나 너무 길면(1001) 알리고 달지 않는다', async () => {
    mockCreateComment.mockRejectedValue(new HttpError(400, '잘못된 요청입니다.', 1001))
    const result = renderComments()
    await waitFor(() => expect(result.current.comments).not.toBeNull())

    let added = true
    await act(async () => {
      added = await result.current.add('x')
    })

    expect(added).toBe(false)
    expect(onError).toHaveBeenCalledWith('댓글은 1~100자로 적어 주세요.')
  })

  it('그사이 지워진 감사(6003)면 목록에서 빼도록 알린다', async () => {
    mockCreateComment.mockRejectedValue(new HttpError(404, '감사 기록을 찾을 수 없어요.', 6003))
    const result = renderComments()
    await waitFor(() => expect(result.current.comments).not.toBeNull())

    await act(async () => {
      await result.current.add('기도할게요')
    })

    expect(onEntryGone).toHaveBeenCalledWith(12)
    expect(onError).not.toHaveBeenCalled()
  })

  it('내 댓글을 지우면 남은 목록으로 바꾸고, 최근 댓글은 그 전 댓글이 된다', async () => {
    mockFetchComments.mockResolvedValue({ entryId: 12, comments: [first, mine] })
    mockDeleteComment.mockResolvedValue({ entryId: 12, comments: [first] })
    const result = renderComments()
    await waitFor(() => expect(result.current.comments).toHaveLength(2))

    await act(async () => {
      await result.current.remove(2)
    })

    expect(mockDeleteComment).toHaveBeenCalledWith(2)
    expect(result.current.comments).toEqual([first])
    expect(entry.commentCount).toBe(1)
    expect(entry.latestComment).toEqual({ author: first.author, content: first.content })
  })

  it('남의 댓글(6007)이면 알리고, 이미 지워진 댓글(6006)이면 목록만 새로 불러온다', async () => {
    const result = renderComments()
    await waitFor(() => expect(result.current.comments).not.toBeNull())

    mockDeleteComment.mockRejectedValueOnce(new HttpError(403, '내 댓글이 아니에요.', 6007))
    await act(async () => {
      await result.current.remove(1)
    })
    expect(onError).toHaveBeenCalledWith('내가 쓴 댓글만 지울 수 있어요.')

    mockDeleteComment.mockRejectedValueOnce(new HttpError(404, '댓글이 없어요.', 6006))
    await act(async () => {
      await result.current.remove(1)
    })
    expect(mockFetchComments).toHaveBeenCalledTimes(2)
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('댓글을 단 뒤에 늦게 온 불러오기 응답은 방금 바뀐 목록을 덮지 않는다', async () => {
    const result = renderComments()
    await waitFor(() => expect(result.current.comments).not.toBeNull())

    const stale = deferred()
    mockFetchComments.mockReturnValueOnce(stale.promise)
    mockCreateComment.mockResolvedValue({ entryId: 12, comments: [first, mine] })
    let reloading: Promise<void> = Promise.resolve()
    act(() => {
      reloading = result.current.reload()
    })
    await act(async () => {
      await result.current.add('기도할게요')
    })
    await act(async () => {
      stale.resolve({ entryId: 12, comments: [first] })
      await reloading
    })

    expect(result.current.comments).toEqual([first, mine])
  })

  it('불러오지 못하면 안내하고, 다시 불러올 수 있다', async () => {
    mockFetchComments.mockRejectedValueOnce(new Error('offline'))
    const result = renderComments()

    await waitFor(() => expect(result.current.error).toBe('댓글을 불러오지 못했어요.'))
    await act(async () => {
      await result.current.reload()
    })
    expect(result.current.comments).toEqual([first])
    expect(result.current.error).toBeNull()
  })
})
