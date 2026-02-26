import { renderHook, act } from '@testing-library/react'
import { useInfiniteScroll } from '../useInfiniteScroll'
import { createElement } from 'react'
import { render, unmountComponentAtNode } from 'react-dom'

let observeMock: jest.Mock
let disconnectMock: jest.Mock
let intersectionCallback: (entries: Partial<IntersectionObserverEntry>[]) => void

beforeEach(() => {
  observeMock = jest.fn()
  disconnectMock = jest.fn()

  const MockIntersectionObserver = jest.fn((callback) => {
    intersectionCallback = callback
    return { observe: observeMock, unobserve: jest.fn(), disconnect: disconnectMock }
  })
  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
})

// 실제 컴포넌트처럼 ref를 DOM에 연결하는 헬퍼
function TestComponent({
  onLoadMore,
  enabled,
  rootMargin,
}: {
  onLoadMore: () => void
  enabled: boolean
  rootMargin?: string
}) {
  const ref = useInfiniteScroll(onLoadMore, { enabled, rootMargin })
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

  it('enabled=false일 때 observe하지 않는다', () => {
    const onLoadMore = jest.fn()
    const container = document.createElement('div')
    document.body.appendChild(container)

    act(() => {
      render(createElement(TestComponent, { onLoadMore, enabled: false }), container)
    })

    expect(observeMock).not.toHaveBeenCalled()

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
})
