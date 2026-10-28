import { act, renderHook, waitFor } from '@testing-library/react'
import { HttpError } from '../../../../shared/api'
import { deleteThanksEntry, fetchThanksEntries } from '../../api/thanksApi'
import type { ThanksEntriesResponse, ThanksEntry } from '../types'
import { useThanksLogs } from '../useThanksLogs'

jest.mock('../../api/thanksApi', () => ({
  fetchThanksEntries: jest.fn(),
  deleteThanksEntry: jest.fn(),
}))

const mockFetchThanksEntries = fetchThanksEntries as jest.MockedFunction<typeof fetchThanksEntries>
const mockDeleteThanksEntry = deleteThanksEntry as jest.MockedFunction<typeof deleteThanksEntry>

const entry = (id: number, userId: number, createdAt: string): ThanksEntry => ({
  id,
  missionDate: '2026-11-09',
  slot: 'MORNING',
  content: `감사 ${id}`,
  media: { fileId: id, url: `uploads/${id}.webp`, type: 'IMAGE' },
  author: { userId, name: `청년${userId}`, profileImageUrl: null },
  reactions: [],
  commentCount: 0,
  latestComment: null,
  isMine: userId === 1,
  createdAt,
})

// 응답이 언제 올지 테스트가 정한다
const deferred = () => {
  let resolve: (value: ThanksEntriesResponse) => void = () => undefined
  const promise = new Promise<ThanksEntriesResponse>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockFetchThanksEntries.mockResolvedValue({
    date: '2026-11-09',
    entries: [entry(1, 1, '2026-11-08T22:00:00'), entry(2, 2, '2026-11-08T23:00:00')],
  })
})

describe('useThanksLogs', () => {
  it('그날 기록을 불러와 마지막으로 올린 사람부터 묶는다', async () => {
    const { result } = renderHook(() => useThanksLogs('2026-11-09', { poll: false }))

    await waitFor(() => expect(result.current.logs).not.toBeNull())
    expect(mockFetchThanksEntries).toHaveBeenCalledWith('2026-11-09')
    expect(result.current.logs?.map((log) => log.author.userId)).toEqual([2, 1])
  })

  it('불러오지 못하면 안내 문구를 준다', async () => {
    mockFetchThanksEntries.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useThanksLogs('2026-11-09', { poll: false }))

    await waitFor(() => expect(result.current.error).toBe('감사로그를 불러오지 못했어요. 잠시 후 다시 열어 주세요.'))
    expect(result.current.logs).toBeNull()
  })

  it('지우면 목록에서 뺀다', async () => {
    mockDeleteThanksEntry.mockResolvedValue(undefined)
    const { result } = renderHook(() => useThanksLogs('2026-11-09', { poll: false }))
    await waitFor(() => expect(result.current.logs).not.toBeNull())

    await act(async () => {
      await result.current.deleteEntry(1)
    })

    expect(mockDeleteThanksEntry).toHaveBeenCalledWith(1)
    expect(result.current.logs?.map((log) => log.author.userId)).toEqual([2])
  })

  it('이미 지워진 기록(6003)이면 실패로 보지 않고 목록에서 뺀다', async () => {
    mockDeleteThanksEntry.mockRejectedValue(new HttpError(404, '감사 기록을 찾을 수 없어요.', 6003))
    const { result } = renderHook(() => useThanksLogs('2026-11-09', { poll: false }))
    await waitFor(() => expect(result.current.logs).not.toBeNull())

    await act(async () => {
      await result.current.deleteEntry(1)
    })

    expect(result.current.logs?.map((log) => log.author.userId)).toEqual([2])
  })

  it('그 밖의 오류는 화면에 알리도록 그대로 던지고 목록은 그대로 둔다', async () => {
    mockDeleteThanksEntry.mockRejectedValue(new HttpError(403, '내가 올린 감사만 지울 수 있어요.', 6004))
    const { result } = renderHook(() => useThanksLogs('2026-11-09', { poll: false }))
    await waitFor(() => expect(result.current.logs).not.toBeNull())

    await expect(result.current.deleteEntry(1)).rejects.toThrow('내가 올린 감사만 지울 수 있어요.')
    expect(result.current.logs?.flatMap((log) => log.entries)).toHaveLength(2)
  })

  it('올리기 전에 보낸 새로고침 응답이 늦게 와도 방금 올린 기록을 지우지 않는다', async () => {
    const { result } = renderHook(() => useThanksLogs('2026-11-09', { poll: false }))
    await waitFor(() => expect(result.current.logs).not.toBeNull())

    const stale = deferred()
    mockFetchThanksEntries.mockReturnValueOnce(stale.promise)
    let reloading: Promise<void> = Promise.resolve()
    act(() => {
      reloading = result.current.reload()
    })
    act(() => result.current.addEntry({ ...entry(3, 1, '2026-11-09T04:00:00'), slot: 'AFTERNOON' }))

    await act(async () => {
      stale.resolve({ date: '2026-11-09', entries: [entry(1, 1, '2026-11-08T22:00:00'), entry(2, 2, '2026-11-08T23:00:00')] })
      await reloading
    })

    expect(result.current.logs?.flatMap((log) => log.entries).map((item) => item.id)).toContain(3)
  })

  it('지우기 전에 보낸 새로고침 응답이 늦게 와도 지운 기록을 되살리지 않는다', async () => {
    mockDeleteThanksEntry.mockResolvedValue(undefined)
    const { result } = renderHook(() => useThanksLogs('2026-11-09', { poll: false }))
    await waitFor(() => expect(result.current.logs).not.toBeNull())

    const stale = deferred()
    mockFetchThanksEntries.mockReturnValueOnce(stale.promise)
    let reloading: Promise<void> = Promise.resolve()
    act(() => {
      reloading = result.current.reload()
    })
    await act(async () => {
      await result.current.deleteEntry(1)
    })

    await act(async () => {
      stale.resolve({ date: '2026-11-09', entries: [entry(1, 1, '2026-11-08T22:00:00'), entry(2, 2, '2026-11-08T23:00:00')] })
      await reloading
    })

    expect(result.current.logs?.flatMap((log) => log.entries).map((item) => item.id)).toEqual([2])
  })

  it('기록 하나만 바꾸고, 그 전에 보낸 새로고침 응답이 늦게 와도 덮지 않는다', async () => {
    const { result } = renderHook(() => useThanksLogs('2026-11-09', { poll: false }))
    await waitFor(() => expect(result.current.logs).not.toBeNull())

    const stale = deferred()
    mockFetchThanksEntries.mockReturnValueOnce(stale.promise)
    let reloading: Promise<void> = Promise.resolve()
    act(() => {
      reloading = result.current.reload()
    })
    act(() =>
      result.current.updateEntry(1, (current) => ({ ...current, reactions: [{ emoji: 'PRAY', count: 1, reactedByMe: true }] }))
    )
    await act(async () => {
      stale.resolve({ date: '2026-11-09', entries: [entry(1, 1, '2026-11-08T22:00:00'), entry(2, 2, '2026-11-08T23:00:00')] })
      await reloading
    })

    const updated = result.current.logs?.flatMap((log) => log.entries).find((item) => item.id === 1)
    expect(updated?.reactions).toEqual([{ emoji: 'PRAY', count: 1, reactedByMe: true }])
  })

  it('다른 날짜로 넘어간 뒤에 앞 날짜 기록을 지우고 고치고 빼는 응답이 와도, 새 날짜를 불러온 응답을 버리지 않는다', async () => {
    const { result, rerender } = renderHook(({ date }) => useThanksLogs(date, { poll: false }), {
      initialProps: { date: '2026-11-09' },
    })
    await waitFor(() => expect(result.current.logs).not.toBeNull())

    let finishDelete: () => void = () => undefined
    mockDeleteThanksEntry.mockReturnValueOnce(
      new Promise<void>((done) => {
        finishDelete = done
      })
    )
    let deleting: Promise<void> = Promise.resolve()
    act(() => {
      deleting = result.current.deleteEntry(1)
    })
    const previousDay = deferred()
    mockFetchThanksEntries.mockReturnValueOnce(previousDay.promise)
    rerender({ date: '2026-11-08' })

    // 11/9 기록에 대한 응답들이 전날로 넘어간 뒤에야 온다
    await act(async () => {
      finishDelete()
      await deleting
    })
    act(() => result.current.updateEntry(2, (current) => ({ ...current, content: '고친 감사' })))
    act(() => result.current.dropEntry(2))
    await act(async () => {
      previousDay.resolve({ date: '2026-11-08', entries: [{ ...entry(5, 3, '2026-11-07T23:00:00'), missionDate: '2026-11-08' }] })
    })

    expect(result.current.logs?.flatMap((log) => log.entries).map((item) => item.id)).toEqual([5])
  })

  it('다른 기기에서 지운 기록은 서버에 다시 묻지 않고 목록에서만 뺀다', async () => {
    const { result } = renderHook(() => useThanksLogs('2026-11-09', { poll: false }))
    await waitFor(() => expect(result.current.logs).not.toBeNull())

    act(() => result.current.dropEntry(1))

    expect(mockDeleteThanksEntry).not.toHaveBeenCalled()
    expect(result.current.logs?.map((log) => log.author.userId)).toEqual([2])
  })

  it('방금 올린 기록을 바로 맨 위에 넣는다', async () => {
    const { result } = renderHook(() => useThanksLogs('2026-11-09', { poll: false }))
    await waitFor(() => expect(result.current.logs).not.toBeNull())

    act(() => result.current.addEntry({ ...entry(3, 1, '2026-11-09T04:00:00'), slot: 'AFTERNOON' }))

    expect(result.current.logs?.[0].author.userId).toBe(1)
    expect(result.current.logs?.[0].entries.map((item) => item.id)).toEqual([1, 3])
  })
})
