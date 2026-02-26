import { renderHook, act } from '@testing-library/react'
import { useInfiniteScroll } from '../useInfiniteScroll'
import { createElement } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'

let observeMock: jest.Mock
let unobserveMock: jest.Mock
let disconnectMock: jest.Mock
let intersectionCallback: (entries: Partial<IntersectionObserverEntry>[]) => void

beforeEach(() => {
  observeMock = jest.fn()
  unobserveMock = jest.fn()
  disconnectMock = jest.fn()

  const MockIntersectionObserver = jest.fn((callback) => {
    intersectionCallback = callback
    return { observe: observeMock, unobserve: unobserveMock, disconnect: disconnectMock }
  })
  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
})

// 실제 컴포넌트처럼 ref를 DOM에 연결하는 헬퍼
function TestComponent({
  onLoadMore,
  enabled,
  rootMargin,
  reobserveDelay,
}: {
  onLoadMore: () => void
  enabled: boolean
  rootMargin?: string
  reobserveDelay?: number
}) {
  const ref = useInfiniteScroll(onLoadMore, { enabled, rootMargin, reobserveDelay })
  return createElement('div', { ref, 'data-testid': 'sentinel' })
}

describe('useInfiniteScroll', () => {
  it('enabled=true이고 sentinel이 연결되면 observe한다', () => {
    const onLoadMore = jest.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)

    act(() => {
      render(createElement(TestComponent, { onLoadMore, enabled: true }), container)
    })

    expect(observeMock).toHaveBeenCalled()

    unmountComponentAtNode(container)
    document.body.removeChild(container)
  })

  it('enabled=false일 때 교차해도 onLoadMore를 호출하지 않는다', () => {
    const onLoadMore = jest.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)

    act(() => {
      render(createElement(TestComponent, { onLoadMore, enabled: false }), container)
    })

    // observer는 생성되지만 enabled=false이면 콜백이 무시됨
    expect(observeMock).toHaveBeenCalled()

    act(() => {
      intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })

    expect(onLoadMore).not.toHaveBeenCalled()

    unmountComponentAtNode(container)
    document.body.removeChild(container)
  })

  it('sentinel이 교차하면 onLoadMore를 호출한다', () => {
    const onLoadMore = jest.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)

    act(() => {
      render(createElement(TestComponent, { onLoadMore, enabled: true }), container)
    })

    act(() => {
      intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry])
    })

    expect(onLoadMore).toHaveBeenCalledTimes(1)

    unmountComponentAtNode(container)
    document.body.removeChild(container)
  })

  it('sentinel이 교차하지 않으면 onLoadMore를 호출하지 않는다', () => {
    const onLoadMore = jest.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)

    act(() => {
      render(createElement(TestComponent, { onLoadMore, enabled: true }), container)
    })

    act(() => {
      intersectionCallback([{ isIntersecting: false } as IntersectionObserverEntry])
    })

    expect(onLoadMore).not.toHaveBeenCalled()

    unmountComponentAtNode(container)
    document.body.removeChild(container)
  })

  it('언마운트 시 observer를 disconnect한다', () => {
    const onLoadMore = jest.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)

    act(() => {
      render(createElement(TestComponent, { onLoadMore, enabled: true }), container)
    })

    expect(observeMock).toHaveBeenCalled()

    act(() => {
      unmountComponentAtNode(container)
    })

    expect(disconnectMock).toHaveBeenCalled()
    document.body.removeChild(container)
  })

  it('rootMargin 옵션이 IntersectionObserver에 전달된다', () => {
    const onLoadMore = jest.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)

    act(() => {
      render(
        createElement(TestComponent, { onLoadMore, enabled: true, rootMargin: '500px' }),
        container
      )
    })

    expect(window.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { rootMargin: '500px' }
    )

    unmountComponentAtNode(container)
    document.body.removeChild(container)
  })

  it('rootMargin 미지정 시 기본값 200px이 사용된다', () => {
    const onLoadMore = jest.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)

    act(() => {
      render(createElement(TestComponent, { onLoadMore, enabled: true }), container)
    })

    expect(window.IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { rootMargin: '200px' }
    )

    unmountComponentAtNode(container)
    document.body.removeChild(container)
  })

  describe('무한 API 호출 방지', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })
    afterEach(() => {
      jest.useRealTimers()
    })

    it('enabled가 false→true로 전환될 때 observer를 재생성하지 않는다', () => {
      const onLoadMore = jest.fn()
      const container = document.createElement('div')
      document.body.appendChild(container)

      // 1. enabled=true로 최초 렌더
      act(() => {
        render(createElement(TestComponent, { onLoadMore, enabled: true }), container)
      })
      const constructorCallCount = (window.IntersectionObserver as jest.Mock).mock.calls.length

      // 2. sentinel 교차 → loadMore 1회 호출
      act(() => {
        intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry])
      })
      expect(onLoadMore).toHaveBeenCalledTimes(1)

      // 3. enabled=false (isFetchingMore=true 시뮬레이션)
      act(() => {
        render(createElement(TestComponent, { onLoadMore, enabled: false }), container)
      })

      // 4. enabled=true (API 응답 완료 시뮬레이션)
      act(() => {
        render(createElement(TestComponent, { onLoadMore, enabled: true }), container)
      })

      // IntersectionObserver 생성자가 다시 호출되지 않아야 함
      expect((window.IntersectionObserver as jest.Mock).mock.calls.length).toBe(constructorCallCount)
      // enabled 전환 직후 onLoadMore가 추가 호출되지 않아야 함
      expect(onLoadMore).toHaveBeenCalledTimes(1)

      unmountComponentAtNode(container)
      document.body.removeChild(container)
    })

    it('enabled=true 전환 직후에는 onLoadMore가 호출되지 않고, 150ms 후 재관찰한다', () => {
      const onLoadMore = jest.fn()
      const container = document.createElement('div')
      document.body.appendChild(container)

      act(() => {
        render(createElement(TestComponent, { onLoadMore, enabled: true }), container)
      })

      // sentinel 교차 → loadMore 호출
      act(() => {
        intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry])
      })
      expect(onLoadMore).toHaveBeenCalledTimes(1)

      // fetch 시작 시뮬레이션
      act(() => {
        render(createElement(TestComponent, { onLoadMore, enabled: false }), container)
      })
      // fetch 완료 시뮬레이션
      act(() => {
        render(createElement(TestComponent, { onLoadMore, enabled: true }), container)
      })

      // 150ms 전: 재관찰 아직 발생하지 않음
      act(() => {
        jest.advanceTimersByTime(100)
      })
      expect(unobserveMock).not.toHaveBeenCalled()
      expect(onLoadMore).toHaveBeenCalledTimes(1)

      // 150ms 후: unobserve + observe로 재관찰
      act(() => {
        jest.advanceTimersByTime(50)
      })
      expect(unobserveMock).toHaveBeenCalledTimes(1)
      // observe: 최초 1회 + 재관찰 1회 = 2회
      expect(observeMock).toHaveBeenCalledTimes(2)

      unmountComponentAtNode(container)
      document.body.removeChild(container)
    })

    it('재관찰 시 sentinel이 교차 중이면 onLoadMore를 호출한다', () => {
      const onLoadMore = jest.fn()
      const container = document.createElement('div')
      document.body.appendChild(container)

      act(() => {
        render(createElement(TestComponent, { onLoadMore, enabled: true }), container)
      })

      // 첫 교차 → loadMore
      act(() => {
        intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry])
      })
      expect(onLoadMore).toHaveBeenCalledTimes(1)

      // fetch 사이클 시뮬레이션
      act(() => {
        render(createElement(TestComponent, { onLoadMore, enabled: false }), container)
      })
      act(() => {
        render(createElement(TestComponent, { onLoadMore, enabled: true }), container)
      })

      // 150ms 후 재관찰 → observer가 다시 observe 호출
      // 이때 sentinel이 여전히 뷰포트에 있으면 콜백 발동
      act(() => {
        jest.advanceTimersByTime(150)
      })

      // 재관찰로 인해 observer 콜백이 다시 호출되는 상황 시뮬레이션
      // (실제 브라우저에서는 observe() 호출 시 현재 교차 상태로 콜백 발생)
      act(() => {
        intersectionCallback([{ isIntersecting: true } as IntersectionObserverEntry])
      })
      expect(onLoadMore).toHaveBeenCalledTimes(2)

      unmountComponentAtNode(container)
      document.body.removeChild(container)
    })

    it('reobserveDelay 옵션으로 재관찰 딜레이를 커스텀할 수 있다', () => {
      const onLoadMore = jest.fn()
      const container = document.createElement('div')
      document.body.appendChild(container)

      act(() => {
        render(
          createElement(TestComponent, { onLoadMore, enabled: true, reobserveDelay: 300 }),
          container
        )
      })

      // fetch 사이클 시뮬레이션
      act(() => {
        render(
          createElement(TestComponent, { onLoadMore, enabled: false, reobserveDelay: 300 }),
          container
        )
      })
      act(() => {
        render(
          createElement(TestComponent, { onLoadMore, enabled: true, reobserveDelay: 300 }),
          container
        )
      })

      // 150ms 후: 기본값이었으면 재관찰되지만, 300ms로 설정했으므로 아직 안 됨
      act(() => {
        jest.advanceTimersByTime(150)
      })
      expect(unobserveMock).not.toHaveBeenCalled()

      // 300ms 후: 재관찰 발생
      act(() => {
        jest.advanceTimersByTime(150)
      })
      expect(unobserveMock).toHaveBeenCalledTimes(1)
      expect(observeMock).toHaveBeenCalledTimes(2)

      unmountComponentAtNode(container)
      document.body.removeChild(container)
    })

    it('재관찰 전에 enabled가 다시 false가 되면 재관찰을 취소한다', () => {
      const onLoadMore = jest.fn()
      const container = document.createElement('div')
      document.body.appendChild(container)

      act(() => {
        render(createElement(TestComponent, { onLoadMore, enabled: true }), container)
      })

      // fetch 사이클: enabled true → false → true → false
      act(() => {
        render(createElement(TestComponent, { onLoadMore, enabled: false }), container)
      })
      act(() => {
        render(createElement(TestComponent, { onLoadMore, enabled: true }), container)
      })
      // 150ms 전에 다시 enabled=false
      act(() => {
        jest.advanceTimersByTime(50)
      })
      act(() => {
        render(createElement(TestComponent, { onLoadMore, enabled: false }), container)
      })

      // 150ms 경과해도 재관찰이 취소되어 unobserve 호출 없음
      act(() => {
        jest.advanceTimersByTime(200)
      })
      expect(unobserveMock).not.toHaveBeenCalled()

      unmountComponentAtNode(container)
      document.body.removeChild(container)
    })
  })
})
