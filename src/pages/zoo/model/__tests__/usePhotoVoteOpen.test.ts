import { act, renderHook } from '@testing-library/react'
import { usePhotoVoteOpen } from '../usePhotoVoteOpen'

const at = (kst: string) => new Date(`${kst}+09:00`)

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe('usePhotoVoteOpen', () => {
  it('오후 4:30이 되면 새로고침하지 않아도 열린다', () => {
    jest.setSystemTime(at('2026-10-10T16:29:00'))
    const { result } = renderHook(() => usePhotoVoteOpen())
    expect(result.current).toBe(false)

    act(() => {
      jest.advanceTimersByTime(59_000)
    })
    expect(result.current).toBe(false)

    act(() => {
      jest.advanceTimersByTime(1_000)
    })
    expect(result.current).toBe(true)
  })

  it('4:30이 지난 뒤에 들어오면 처음부터 열려 있다', () => {
    jest.setSystemTime(at('2026-10-10T17:00:00'))
    const { result } = renderHook(() => usePhotoVoteOpen())

    expect(result.current).toBe(true)
  })

  it('휴대폰이 잠들어 타이머가 늦어져도 화면으로 돌아오면 바로 확인한다', () => {
    jest.setSystemTime(at('2026-10-10T16:00:00'))
    const { result } = renderHook(() => usePhotoVoteOpen())

    // 타이머는 울리지 않은 채 시계만 4:30을 지났다
    jest.setSystemTime(at('2026-10-10T16:31:00'))
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current).toBe(true)
  })

  it('타이머가 일찍 울려도 닫힌 채로 있다가 4:30에 열린다', () => {
    jest.setSystemTime(at('2026-10-10T16:00:00'))
    const { result } = renderHook(() => usePhotoVoteOpen())

    // 화면에 돌아왔지만 아직 4:30 전이면 그대로 닫혀 있고, 타이머를 다시 건다
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(result.current).toBe(false)

    act(() => {
      jest.advanceTimersByTime(30 * 60 * 1000)
    })
    expect(result.current).toBe(true)
  })
})
