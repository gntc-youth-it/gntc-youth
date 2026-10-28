import { act, renderHook } from '@testing-library/react'
import { HttpError } from '../../../../shared/api'
import { updateThanksEntry } from '../../api/thanksApi'
import type { ThanksEntry } from '../types'
import { useEntryEdit } from '../useEntryEdit'

jest.mock('../../api/thanksApi', () => ({
  updateThanksEntry: jest.fn(),
}))

const mockUpdateThanksEntry = updateThanksEntry as jest.MockedFunction<typeof updateThanksEntry>

const makeEntry = (): ThanksEntry => ({
  id: 12,
  missionDate: '2026-11-09',
  slot: 'MORNING',
  content: '점심 사 준 동기에게 감사',
  media: { fileId: 1, url: 'uploads/1.webp', type: 'IMAGE' },
  author: { userId: 1, name: '정은혜', profileImageUrl: null },
  reactions: [],
  commentCount: 0,
  latestComment: null,
  isMine: true,
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

const renderEdit = () => renderHook(() => useEntryEdit({ updateEntry, onEntryGone, onError })).result

const save = async (result: ReturnType<typeof renderEdit>) => {
  let saved: boolean | undefined
  await act(async () => {
    saved = await result.current.updateContent(12, '동기와 선배에게 감사')
  })
  return saved
}

beforeEach(() => {
  jest.clearAllMocks()
  entry = makeEntry()
})

describe('useEntryEdit', () => {
  it('고치면 서버가 저장한 감사제목으로 바꾸고, 반응은 응답으로 덮지 않는다', async () => {
    // 응답을 기다리는 사이 반응을 눌러 화면에는 이미 켜져 있다
    entry = { ...entry, reactions: [{ emoji: 'PRAY', count: 1, reactedByMe: true }] }
    mockUpdateThanksEntry.mockResolvedValue({ ...makeEntry(), content: '동기와 선배에게 감사' })
    const result = renderEdit()

    expect(await save(result)).toBe(true)
    expect(mockUpdateThanksEntry).toHaveBeenCalledWith(12, '동기와 선배에게 감사')
    expect(entry.content).toBe('동기와 선배에게 감사')
    expect(entry.reactions).toEqual([{ emoji: 'PRAY', count: 1, reactedByMe: true }])
  })

  it('그사이 지워진 감사(6003)면 목록에서 빼도록 알린다', async () => {
    mockUpdateThanksEntry.mockRejectedValue(new HttpError(404, '감사 기록을 찾을 수 없어요.', 6003))
    const result = renderEdit()

    expect(await save(result)).toBe(false)
    expect(onEntryGone).toHaveBeenCalledWith(12)
    expect(onError).not.toHaveBeenCalled()
  })

  it.each([
    ['1~80자가 아니면(1001)', new HttpError(400, '잘못된 요청입니다.', 1001), '감사제목은 1~80자로 적어 주세요.'],
    ['남의 감사면(6004)', new HttpError(403, '내가 올린 감사만 고치거나 지울 수 있어요.', 6004), '내가 올린 감사만 고칠 수 있어요.'],
    ['연결이 끊기면', new Error('offline'), '감사제목을 고치지 못했어요. 잠시 후 다시 해 주세요.'],
  ])('%s 알리고 감사제목은 그대로 둔다', async (_case, error, message) => {
    mockUpdateThanksEntry.mockRejectedValue(error)
    const result = renderEdit()

    expect(await save(result)).toBe(false)
    expect(onError).toHaveBeenCalledWith(message)
    expect(onEntryGone).not.toHaveBeenCalled()
    expect(entry.content).toBe('점심 사 준 동기에게 감사')
  })
})
