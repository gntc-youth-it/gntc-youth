import { renderHook, waitFor } from '@testing-library/react'
import { useChurchInfo, clearChurchInfoCache } from '../useChurchInfo'
import { HttpError } from '../../../../shared/api'

const mockGetChurchInfo = jest.fn()

jest.mock('../../api', () => ({
  getChurchInfo: (...args: unknown[]) => mockGetChurchInfo(...args),
}))

describe('useChurchInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearChurchInfoCache()
  })

  it('churchId가 빈 문자열이면 API를 호출하지 않는다', () => {
    const { result } = renderHook(() => useChurchInfo(''))

    expect(mockGetChurchInfo).not.toHaveBeenCalled()
    expect(result.current.churchInfo).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('성전 정보를 성공적으로 가져온다', async () => {
    const mockResponse = {
      churchId: 'anyang',
      groupPhotoPath: '/uploads/anyang-2025.mp4',
      prayerTopics: [
        { id: 1, content: '기도제목 1', sortOrder: 1 },
        { id: 2, content: '기도제목 2', sortOrder: 2 },
      ],
    }
    mockGetChurchInfo.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useChurchInfo('anyang'))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockGetChurchInfo).toHaveBeenCalledWith('anyang')
    expect(result.current.churchInfo).toEqual(mockResponse)
    expect(result.current.error).toBeNull()
  })

  it('API 실패 시 에러를 설정한다', async () => {
    mockGetChurchInfo.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useChurchInfo('anyang'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.churchInfo).toBeNull()
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe('Network error')
    expect(result.current.notFound).toBe(false)
  })

  it('404 응답 시 notFound를 설정하고 error는 설정하지 않는다', async () => {
    mockGetChurchInfo.mockRejectedValue(new HttpError(404, 'Not Found'))

    const { result } = renderHook(() => useChurchInfo('anyang'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.notFound).toBe(true)
    expect(result.current.churchInfo).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('404 이후 다른 성전으로 변경하면 notFound가 초기화된다', async () => {
    mockGetChurchInfo.mockRejectedValueOnce(new HttpError(404, 'Not Found'))

    const { result, rerender } = renderHook(
      ({ churchId }) => useChurchInfo(churchId),
      { initialProps: { churchId: 'anyang' } }
    )

    await waitFor(() => {
      expect(result.current.notFound).toBe(true)
    })

    const mockResponse = {
      churchId: 'suwon',
      groupPhotoPath: '/uploads/suwon.jpg',
      prayerTopics: [{ id: 1, content: '수원 기도제목', sortOrder: 1 }],
    }
    mockGetChurchInfo.mockResolvedValueOnce(mockResponse)
    rerender({ churchId: 'suwon' })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.notFound).toBe(false)
    expect(result.current.churchInfo).toEqual(mockResponse)
  })

  it('churchId가 변경되면 새로운 데이터를 가져온다', async () => {
    const mockResponse1 = {
      churchId: 'anyang',
      groupPhotoPath: '/uploads/anyang.mp4',
      prayerTopics: [{ id: 1, content: '안양 기도제목', sortOrder: 1 }],
    }
    const mockResponse2 = {
      churchId: 'suwon',
      groupPhotoPath: '/uploads/suwon.jpg',
      prayerTopics: [{ id: 2, content: '수원 기도제목', sortOrder: 1 }],
    }

    mockGetChurchInfo.mockResolvedValueOnce(mockResponse1)

    const { result, rerender } = renderHook(
      ({ churchId }) => useChurchInfo(churchId),
      { initialProps: { churchId: 'anyang' } }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.churchInfo).toEqual(mockResponse1)

    mockGetChurchInfo.mockResolvedValueOnce(mockResponse2)
    rerender({ churchId: 'suwon' })

    await waitFor(() => {
      expect(result.current.churchInfo).toEqual(mockResponse2)
    })

    expect(mockGetChurchInfo).toHaveBeenCalledTimes(2)
    expect(mockGetChurchInfo).toHaveBeenLastCalledWith('suwon')
  })
})
