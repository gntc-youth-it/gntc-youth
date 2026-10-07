import { renderHook, act } from '@testing-library/react'
import { useZooCourse, COURSE_STORAGE_KEY, VISITED_STORAGE_KEY } from '../useZooCourse'

let mockSearchParams = new URLSearchParams()
const mockSetSearchParams = jest.fn()

jest.mock('react-router-dom', () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}))

beforeEach(() => {
  localStorage.clear()
  mockSearchParams = new URLSearchParams()
  jest.clearAllMocks()
})

describe('useZooCourse', () => {
  it('코스를 고르기 전에는 안내할 장소가 없다', () => {
    const { result } = renderHook(() => useZooCourse())

    expect(result.current.course).toBeNull()
    expect(result.current.stops).toEqual([])
    expect(result.current.legs).toEqual([])
    expect(result.current.nextStop).toBeNull()
  })

  it('공유 링크의 코스로 시작하고 기기에 저장한다', () => {
    mockSearchParams = new URLSearchParams('course=b')

    const { result } = renderHook(() => useZooCourse())

    expect(result.current.course).toBe('B')
    expect(result.current.nextStop?.name).toBe('제2아프리카관')
    expect(localStorage.getItem(COURSE_STORAGE_KEY)).toBe('B')
  })

  it('공유 링크가 기기에 저장된 코스보다 우선한다', () => {
    localStorage.setItem(COURSE_STORAGE_KEY, 'A')
    mockSearchParams = new URLSearchParams('course=b')

    const { result } = renderHook(() => useZooCourse())

    expect(result.current.course).toBe('B')
  })

  it('링크가 없으면 기기에 저장된 코스를 이어서 쓴다', () => {
    localStorage.setItem(COURSE_STORAGE_KEY, 'A')

    const { result } = renderHook(() => useZooCourse())

    expect(result.current.course).toBe('A')
  })

  it('코스를 고르면 주소에도 남겨 그대로 공유할 수 있다', () => {
    const { result } = renderHook(() => useZooCourse())

    act(() => result.current.selectCourse('A'))

    expect(result.current.course).toBe('A')
    expect(mockSetSearchParams).toHaveBeenCalledWith({ course: 'a' }, { replace: true })
    expect(localStorage.getItem(COURSE_STORAGE_KEY)).toBe('A')
  })

  it('도착하면 코스 순서상 다음 장소로 넘어가고 기록을 저장한다', () => {
    mockSearchParams = new URLSearchParams('course=a')
    const { result } = renderHook(() => useZooCourse())

    expect(result.current.nextStop?.name).toBe('제1아프리카관')

    act(() => result.current.markArrived())

    expect(result.current.nextStop?.name).toBe('호주관')
    expect(JSON.parse(localStorage.getItem(VISITED_STORAGE_KEY) ?? '[]')).toEqual(['AFRICA_1'])
  })

  it('건너뛴 장소가 있으면 그곳을 다음 장소로 안내한다', () => {
    mockSearchParams = new URLSearchParams('course=a')
    const { result } = renderHook(() => useZooCourse())

    act(() => result.current.toggleVisited('AUSTRALIA'))

    expect(result.current.nextStop?.name).toBe('제1아프리카관')
  })

  it('도착 표시를 다시 누르면 취소된다', () => {
    mockSearchParams = new URLSearchParams('course=a')
    const { result } = renderHook(() => useZooCourse())

    act(() => result.current.toggleVisited('AFRICA_1'))
    act(() => result.current.toggleVisited('AFRICA_1'))

    expect(result.current.visited).toEqual([])
    expect(result.current.nextStop?.name).toBe('제1아프리카관')
  })

  it('모든 장소에 도착하면 다음 장소가 없다', () => {
    mockSearchParams = new URLSearchParams('course=b')
    const { result } = renderHook(() => useZooCourse())

    for (let i = 0; i < 7; i++) {
      act(() => result.current.markArrived())
    }

    expect(result.current.visited).toHaveLength(7)
    expect(result.current.nextStop).toBeNull()
  })

  it('기록을 지우면 첫 장소부터 다시 안내한다', () => {
    localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify(['AFRICA_1', 'AUSTRALIA']))
    mockSearchParams = new URLSearchParams('course=a')
    const { result } = renderHook(() => useZooCourse())

    expect(result.current.nextStop?.name).toBe('대동물관')

    act(() => result.current.resetVisited())

    expect(result.current.nextStop?.name).toBe('제1아프리카관')
  })

  it('저장된 기록 중 알 수 없는 값은 무시한다', () => {
    localStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify(['AFRICA_1', 'unknown', 3]))

    const { result } = renderHook(() => useZooCourse())

    expect(result.current.visited).toEqual(['AFRICA_1'])
  })

  it('저장된 기록이 깨져 있으면 빈 기록으로 시작한다', () => {
    localStorage.setItem(VISITED_STORAGE_KEY, '{broken')

    const { result } = renderHook(() => useZooCourse())

    expect(result.current.visited).toEqual([])
  })
})
