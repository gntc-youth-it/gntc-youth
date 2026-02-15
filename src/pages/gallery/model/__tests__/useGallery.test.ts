import { renderHook, act } from '@testing-library/react'
import { useGallery } from '../useGallery'

describe('useGallery', () => {
  it('초기 상태는 로딩 완료이고 mock 앨범 목록이 반환된다', () => {
    const { result } = renderHook(() => useGallery())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.albums.length).toBeGreaterThan(0)
    expect(result.current.error).toBeNull()
    expect(result.current.selectedCategory).toBe('ALL')
  })

  it('카테고리 ALL 선택 시 모든 앨범이 반환된다', () => {
    const { result } = renderHook(() => useGallery())

    expect(result.current.albums).toHaveLength(3)
  })

  it('카테고리 RETREAT 선택 시 수련회 앨범만 반환된다', () => {
    const { result } = renderHook(() => useGallery())

    act(() => {
      result.current.setSelectedCategory('RETREAT')
    })

    expect(result.current.albums).toHaveLength(1)
    expect(result.current.albums[0].title).toBe('2025 동계 수련회')
  })
})
