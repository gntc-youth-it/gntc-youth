import { renderHook, act } from '@testing-library/react'
import { usePolling } from '../usePolling'

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
}

const advance = async (ms: number) => {
  await act(async () => {
    jest.advanceTimersByTime(ms)
    await Promise.resolve()
  })
}

beforeEach(() => {
  jest.useFakeTimers()
  setVisibility('visible')
})

afterEach(() => {
  jest.useRealTimers()
  setVisibility('visible')
})

describe('usePolling', () => {
  it('정한 간격마다 다시 불러온다', async () => {
    const callback = jest.fn().mockResolvedValue(undefined)
    renderHook(() => usePolling(callback, 5000))

    expect(callback).not.toHaveBeenCalled()
    await advance(5000)
    expect(callback).toHaveBeenCalledTimes(1)
    await advance(5000)
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('화면이 가려져 있으면 건너뛴다', async () => {
    const callback = jest.fn().mockResolvedValue(undefined)
    setVisibility('hidden')
    renderHook(() => usePolling(callback, 5000))

    await advance(5000)

    expect(callback).not.toHaveBeenCalled()
  })

  it('다시 화면으로 돌아오면 바로 불러온다', async () => {
    const callback = jest.fn().mockResolvedValue(undefined)
    renderHook(() => usePolling(callback, 5000))

    act(() => {
      setVisibility('visible')
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('꺼져 있거나 화면을 벗어나면 멈춘다', async () => {
    const callback = jest.fn().mockResolvedValue(undefined)
    const { rerender, unmount } = renderHook(({ enabled }) => usePolling(callback, 5000, enabled), {
      initialProps: { enabled: false },
    })

    await advance(5000)
    expect(callback).not.toHaveBeenCalled()

    rerender({ enabled: true })
    await advance(5000)
    expect(callback).toHaveBeenCalledTimes(1)

    unmount()
    await advance(10000)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('불러오기에 실패해도 다음 주기에 다시 시도한다', async () => {
    const callback = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(undefined)
    renderHook(() => usePolling(callback, 5000))

    await advance(5000)
    await advance(5000)

    expect(callback).toHaveBeenCalledTimes(2)
  })
})
