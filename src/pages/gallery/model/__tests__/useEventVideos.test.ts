import { renderHook, act, waitFor } from '@testing-library/react'
import { useEventVideos } from '../useEventVideos'
import { fetchEventVideos, fetchSubCategories } from '../../api/galleryApi'
import type { EventVideo, SubCategory } from '../types'

jest.mock('../../api/galleryApi')

const mockFetchEventVideos = fetchEventVideos as jest.MockedFunction<typeof fetchEventVideos>
const mockFetchSubCategories = fetchSubCategories as jest.MockedFunction<typeof fetchSubCategories>

const mockSubCategories: SubCategory[] = [
  {
    name: 'RETREAT_2026_SUMMER',
    displayName: '2026 여름 수련회',
    imageUrl: 'assets/2026-summer-poster.webp',
    startDate: '2026-08-13',
    endDate: '2026-08-15',
    children: [
      { name: 'RETREAT_2026_SUMMER_SPORTS', displayName: '체육대회' },
      { name: 'RETREAT_2026_SUMMER_WALK', displayName: '함께걷장' },
    ],
  },
  {
    name: 'RETREAT_2026_WINTER',
    displayName: '2026 겨울 수련회',
    imageUrl: 'assets/2026-winter-poster.webp',
    startDate: '2026-01-29',
    endDate: '2026-01-31',
  },
]

const mockVideos: EventVideo[] = [
  {
    id: 1,
    title: '겨울 수련회 찬양',
    link: 'https://www.youtube.com/embed/winter1',
    subCategory: 'RETREAT_2026_WINTER',
    createdAt: '2026-02-01T10:00:00',
  },
  {
    id: 2,
    title: '체육대회 하이라이트',
    link: 'https://www.youtube.com/embed/sports1',
    subCategory: 'RETREAT_2026_SUMMER_SPORTS',
    createdAt: '2026-08-16T10:00:00',
  },
  {
    id: 3,
    title: '여름 수련회 개회 예배',
    link: 'https://www.youtube.com/embed/summer1',
    subCategory: 'RETREAT_2026_SUMMER',
    createdAt: '2026-08-16T09:00:00',
  },
]

beforeEach(() => {
  jest.clearAllMocks()
  mockFetchEventVideos.mockResolvedValue(mockVideos)
  mockFetchSubCategories.mockResolvedValue(mockSubCategories)
})

describe('useEventVideos', () => {
  it('enabled가 false면 API를 호출하지 않는다', () => {
    renderHook(() => useEventVideos(false))

    expect(mockFetchEventVideos).not.toHaveBeenCalled()
    expect(mockFetchSubCategories).not.toHaveBeenCalled()
  })

  it('enabled가 true면 전체 영상과 행사 목록을 조회한다', async () => {
    const { result } = renderHook(() => useEventVideos(true))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockFetchEventVideos).toHaveBeenCalledWith()
    expect(mockFetchSubCategories).toHaveBeenCalledWith('RETREAT')
    expect(result.current.error).toBeNull()
  })

  it('영상을 행사별로 그룹핑하고 하위 프로그램은 상위 수련회로 묶는다', async () => {
    const { result } = renderHook(() => useEventVideos(true))

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(2)
    })

    const summerGroup = result.current.groups.find((g) => g.key === 'RETREAT_2026_SUMMER')!
    expect(summerGroup.label).toBe('2026 여름 수련회')
    // 체육대회(하위 프로그램) 영상 + 여름 수련회 영상이 하나의 그룹으로
    expect(summerGroup.videos.map((v) => v.id)).toEqual([2, 3])

    const winterGroup = result.current.groups.find((g) => g.key === 'RETREAT_2026_WINTER')!
    expect(winterGroup.label).toBe('2026 겨울 수련회')
    expect(winterGroup.videos.map((v) => v.id)).toEqual([1])
  })

  it('그룹은 행사 목록 순서를 따른다', async () => {
    const { result } = renderHook(() => useEventVideos(true))

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(2)
    })

    // 영상 배열에서는 겨울이 먼저지만, 행사 목록 순서(여름 → 겨울)를 따름
    expect(result.current.groups.map((g) => g.key)).toEqual([
      'RETREAT_2026_SUMMER',
      'RETREAT_2026_WINTER',
    ])
  })

  it('행사 목록에 없는 subCategory는 raw 이름으로 그룹핑하고 뒤에 배치한다', async () => {
    mockFetchEventVideos.mockResolvedValue([
      {
        id: 9,
        title: '알 수 없는 행사 영상',
        link: 'https://www.youtube.com/embed/unknown1',
        subCategory: 'UNKNOWN_EVENT',
        createdAt: '2026-01-01T10:00:00',
      },
      ...mockVideos,
    ])

    const { result } = renderHook(() => useEventVideos(true))

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(3)
    })

    const unknownGroup = result.current.groups[2]
    expect(unknownGroup.key).toBe('UNKNOWN_EVENT')
    expect(unknownGroup.label).toBe('UNKNOWN_EVENT')
  })

  it('행사 목록 조회가 실패해도 영상은 raw 이름으로 표시된다', async () => {
    mockFetchSubCategories.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useEventVideos(true))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.groups.map((g) => g.label)).toContain('RETREAT_2026_WINTER')
  })

  it('영상 조회 실패 시 에러 메시지를 반환한다', async () => {
    mockFetchEventVideos.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useEventVideos(true))

    await waitFor(() => {
      expect(result.current.error).toBe('영상을 불러오는데 실패했습니다.')
    })
    expect(result.current.groups).toHaveLength(0)
  })

  it('실패 후 탭에 재진입하면 다시 조회한다', async () => {
    mockFetchEventVideos.mockRejectedValueOnce(new Error('Network error'))

    const { result, rerender } = renderHook(({ enabled }) => useEventVideos(enabled), {
      initialProps: { enabled: true },
    })

    await waitFor(() => {
      expect(result.current.error).toBe('영상을 불러오는데 실패했습니다.')
    })

    // 탭 이탈 후 재진입
    rerender({ enabled: false })
    rerender({ enabled: true })

    await waitFor(() => {
      expect(result.current.error).toBeNull()
    })
    expect(mockFetchEventVideos).toHaveBeenCalledTimes(2)
    expect(result.current.groups).toHaveLength(2)
  })

  it('한 번 로드된 후에는 탭을 재진입해도 다시 조회하지 않는다', async () => {
    const { result, rerender } = renderHook(({ enabled }) => useEventVideos(enabled), {
      initialProps: { enabled: true },
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    rerender({ enabled: false })
    rerender({ enabled: true })

    expect(mockFetchEventVideos).toHaveBeenCalledTimes(1)
  })

  it('그룹에 영상이 있는 하위 프로그램 목록이 children 순서로 포함된다', async () => {
    // 함께걷장 영상이 체육대회보다 먼저 등록되어도 children 순서를 따라야 함
    mockFetchEventVideos.mockResolvedValue([
      {
        id: 5,
        title: '함께걷장 스케치',
        link: 'https://www.youtube.com/embed/walk1',
        subCategory: 'RETREAT_2026_SUMMER_WALK',
        createdAt: '2026-08-17T10:00:00',
      },
      ...mockVideos,
    ])

    const { result } = renderHook(() => useEventVideos(true))

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(2)
    })

    const summerGroup = result.current.groups.find((g) => g.key === 'RETREAT_2026_SUMMER')!
    expect(summerGroup.programs.map((p) => p.key)).toEqual([
      'RETREAT_2026_SUMMER_SPORTS',
      'RETREAT_2026_SUMMER_WALK',
    ])
    expect(summerGroup.programs[0].label).toBe('체육대회')
    expect(summerGroup.programs[0].videos.map((v) => v.id)).toEqual([2])
    expect(summerGroup.programs[1].videos.map((v) => v.id)).toEqual([5])

    // children이 없거나 하위 프로그램 영상이 없는 그룹은 programs가 빈 배열
    const winterGroup = result.current.groups.find((g) => g.key === 'RETREAT_2026_WINTER')!
    expect(winterGroup.programs).toEqual([])
  })

  it('selectProgram으로 해당 그룹의 영상만 프로그램 필터링된다', async () => {
    const { result } = renderHook(() => useEventVideos(true))

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(2)
    })

    act(() => {
      result.current.selectProgram('RETREAT_2026_SUMMER', 'RETREAT_2026_SUMMER_SPORTS')
    })

    expect(result.current.selectedProgramByGroup['RETREAT_2026_SUMMER']).toBe(
      'RETREAT_2026_SUMMER_SPORTS',
    )
    const summerGroup = result.current.filteredGroups.find((g) => g.key === 'RETREAT_2026_SUMMER')!
    expect(summerGroup.videos.map((v) => v.id)).toEqual([2])

    // 다른 그룹은 영향받지 않음
    const winterGroup = result.current.filteredGroups.find((g) => g.key === 'RETREAT_2026_WINTER')!
    expect(winterGroup.videos.map((v) => v.id)).toEqual([1])

    act(() => {
      result.current.selectProgram('RETREAT_2026_SUMMER', null)
    })

    expect(
      result.current.filteredGroups.find((g) => g.key === 'RETREAT_2026_SUMMER')!.videos,
    ).toHaveLength(2)
  })

  it('행사 필터와 프로그램 필터를 조합할 수 있다', async () => {
    const { result } = renderHook(() => useEventVideos(true))

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(2)
    })

    act(() => {
      result.current.selectGroup('RETREAT_2026_SUMMER')
      result.current.selectProgram('RETREAT_2026_SUMMER', 'RETREAT_2026_SUMMER_SPORTS')
    })

    expect(result.current.filteredGroups).toHaveLength(1)
    expect(result.current.filteredGroups[0].videos.map((v) => v.id)).toEqual([2])
  })

  it('selectGroup으로 특정 행사만 필터링할 수 있다', async () => {
    const { result } = renderHook(() => useEventVideos(true))

    await waitFor(() => {
      expect(result.current.groups).toHaveLength(2)
    })

    expect(result.current.filteredGroups).toHaveLength(2)

    act(() => {
      result.current.selectGroup('RETREAT_2026_WINTER')
    })

    expect(result.current.selectedGroupKey).toBe('RETREAT_2026_WINTER')
    expect(result.current.filteredGroups).toHaveLength(1)
    expect(result.current.filteredGroups[0].key).toBe('RETREAT_2026_WINTER')

    act(() => {
      result.current.selectGroup(null)
    })

    expect(result.current.filteredGroups).toHaveLength(2)
  })
})
