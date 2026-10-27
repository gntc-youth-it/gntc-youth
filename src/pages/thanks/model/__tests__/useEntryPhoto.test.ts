import { act, renderHook, waitFor } from '@testing-library/react'
import { compressImage } from '../../../../shared/lib'
import { uploadEntryPhoto } from '../../api/thanksApi'
import { useEntryPhoto } from '../useEntryPhoto'

jest.mock('../../api/thanksApi', () => ({
  uploadEntryPhoto: jest.fn(),
}))

jest.mock('../../../../shared/lib', () => ({
  ...jest.requireActual('../../../../shared/lib'),
  compressImage: jest.fn(),
}))

const mockUploadEntryPhoto = uploadEntryPhoto as jest.MockedFunction<typeof uploadEntryPhoto>
const mockCompressImage = compressImage as jest.MockedFunction<typeof compressImage>

const photoFile = new File(['photo'], 'lunch.jpg', { type: 'image/jpeg' })
const compressed = new Blob(['small'], { type: 'image/webp' })

beforeAll(() => {
  // CRA 설정은 테스트마다 jest.fn 구현을 지우므로 일반 함수로 둔다
  URL.createObjectURL = () => 'blob:preview'
  URL.revokeObjectURL = () => undefined
})

beforeEach(() => {
  jest.clearAllMocks()
  mockCompressImage.mockResolvedValue({ blob: compressed, originalSize: 5, compressedSize: 5 })
  mockUploadEntryPhoto.mockImplementation(async (_blob, onProgress) => {
    onProgress(60)
    return 31
  })
})

describe('useEntryPhoto', () => {
  it('고른 사진을 1280px로 줄여서 올리고 파일 번호를 받는다', async () => {
    const { result } = renderHook(() => useEntryPhoto())

    await act(async () => {
      await result.current.select(photoFile)
    })

    expect(mockCompressImage).toHaveBeenCalledWith(photoFile, { maxWidth: 1280, maxHeight: 1280, quality: 0.8 })
    expect(mockUploadEntryPhoto).toHaveBeenCalledWith(compressed, expect.any(Function))
    expect(result.current.status).toBe('done')
    expect(result.current.fileId).toBe(31)
    expect(result.current.previewUrl).toBe('blob:preview')
  })

  it('올리다 실패하면 안내하고 다시 올릴 수 있다', async () => {
    mockUploadEntryPhoto.mockRejectedValueOnce(new Error('네트워크 오류로 업로드에 실패했습니다.'))
    const { result } = renderHook(() => useEntryPhoto())

    await act(async () => {
      await result.current.select(photoFile)
    })

    expect(result.current.status).toBe('error')
    expect(result.current.fileId).toBeNull()
    expect(result.current.error).toBe('사진을 올리지 못했어요. 인터넷 연결을 확인하고 다시 올려 주세요.')

    act(() => result.current.retry())

    await waitFor(() => expect(result.current.status).toBe('done'))
    expect(result.current.fileId).toBe(31)
  })

  it('사진이 아닌 파일을 고르면 안내만 하고 올리지 않는다', async () => {
    const { result } = renderHook(() => useEntryPhoto())

    await act(async () => {
      await result.current.select(new File(['x'], 'note.pdf', { type: 'application/pdf' }))
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBe('사진 파일만 올릴 수 있어요.')
    expect(mockCompressImage).not.toHaveBeenCalled()
  })

  it('20MB보다 큰 사진은 올리지 않는다', async () => {
    const { result } = renderHook(() => useEntryPhoto())
    const huge = new File(['x'], 'huge.jpg', { type: 'image/jpeg' })
    Object.defineProperty(huge, 'size', { value: 21 * 1024 * 1024 })

    await act(async () => {
      await result.current.select(huge)
    })

    expect(result.current.error).toBe('20MB보다 큰 사진은 올릴 수 없어요.')
    expect(mockCompressImage).not.toHaveBeenCalled()
  })

  it('열 수 없는 사진이면 다른 사진을 고르라고 안내한다', async () => {
    mockCompressImage.mockRejectedValueOnce(new Error('이미지를 불러올 수 없습니다.'))
    const { result } = renderHook(() => useEntryPhoto())

    await act(async () => {
      await result.current.select(photoFile)
    })

    expect(result.current.error).toBe('이 사진은 열 수 없어요. 다른 사진을 골라 주세요.')
  })
})
