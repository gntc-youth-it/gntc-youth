import { renderHook, act } from '@testing-library/react'
import { getMissionDraftKey, useMissionDraft } from '../useMissionDraft'

beforeEach(() => {
  localStorage.clear()
})

describe('useMissionDraft', () => {
  it('쓰던 답을 폰에 임시 저장해서 화면을 다시 열어도 이어서 쓴다', () => {
    const first = renderHook(() => useMissionDraft(4, 'AFRICA_1'))

    act(() => first.result.current.setAnswer('q1', '7개'))
    first.unmount()

    const second = renderHook(() => useMissionDraft(4, 'AFRICA_1'))
    expect(second.result.current.answers).toEqual({ q1: '7개' })
  })

  it('임시 저장한 답이 없으면 이미 낸 답으로 시작한다', () => {
    const { result } = renderHook(() =>
      useMissionDraft(4, 'AFRICA_1', [
        { questionId: 'q1', answer: '7개' },
        { questionId: 'q2', answer: '타조' },
      ])
    )

    expect(result.current.answers).toEqual({ q1: '7개', q2: '타조' })
  })

  it('조와 장소마다 따로 저장한다', () => {
    const { result } = renderHook(() => useMissionDraft(4, 'AFRICA_1'))

    act(() => result.current.setAnswer('q1', '7개'))

    expect(localStorage.getItem(getMissionDraftKey(4, 'AFRICA_1'))).toBe(JSON.stringify({ q1: '7개' }))
    expect(localStorage.getItem(getMissionDraftKey(4, 'AUSTRALIA'))).toBeNull()
    expect(localStorage.getItem(getMissionDraftKey(5, 'AFRICA_1'))).toBeNull()
  })

  it('제출하고 나면 임시 저장을 지운다', () => {
    const { result } = renderHook(() => useMissionDraft(4, 'AFRICA_1'))

    act(() => result.current.setAnswer('q1', '7개'))
    act(() => result.current.clearDraft())

    expect(localStorage.getItem(getMissionDraftKey(4, 'AFRICA_1'))).toBeNull()
  })

  it('저장된 값이 깨져 있으면 빈 답으로 시작한다', () => {
    localStorage.setItem(getMissionDraftKey(4, 'AFRICA_1'), '{broken')

    const { result } = renderHook(() => useMissionDraft(4, 'AFRICA_1'))

    expect(result.current.answers).toEqual({})
  })
})
