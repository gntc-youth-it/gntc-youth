import { renderHook, act, waitFor } from '@testing-library/react'
import { getFilePresignedUrl } from '../../../../shared/api'
import { compressImage, uploadToS3 } from '../../../../shared/lib'
import { useMissionPhoto } from '../useMissionPhoto'

jest.mock('../../../../shared/api', () => ({
  ...jest.requireActual('../../../../shared/api'),
  getFilePresignedUrl: jest.fn(),
}))

jest.mock('../../../../shared/lib', () => ({
  ...jest.requireActual('../../../../shared/lib'),
  compressImage: jest.fn(),
  uploadToS3: jest.fn(),
}))

const mockGetFilePresignedUrl = getFilePresignedUrl as jest.MockedFunction<typeof getFilePresignedUrl>
const mockCompressImage = compressImage as jest.MockedFunction<typeof compressImage>
const mockUploadToS3 = uploadToS3 as jest.MockedFunction<typeof uploadToS3>

const photoFile = new File(['photo'], 'giraffe.jpg', { type: 'image/jpeg' })
const compressed = new Blob(['small'], { type: 'image/webp' })

beforeAll(() => {
  // CRA 설정은 테스트마다 jest.fn 구현을 지우므로 일반 함수로 둔다
  URL.createObjectURL = () => 'blob:preview'
  URL.revokeObjectURL = () => undefined
})

beforeEach(() => {
  jest.clearAllMocks()
  mockCompressImage.mockResolvedValue({ blob: compressed, originalSize: 5, compressedSize: 5 })
  mockGetFilePresignedUrl.mockResolvedValue({ fileId: 31, presignedUrl: 'https://s3.example.com/uploads/a.webp' })
  mockUploadToS3.mockImplementation(async (_url, _blob, _type, options) => {
    options?.onProgress?.(60)
  })
})

describe('useMissionPhoto', () => {
  it('고른 사진을 줄여서 올리고 파일 번호를 받는다', async () => {
    const { result } = renderHook(() => useMissionPhoto(null))

    await act(async () => {
      await result.current.select(photoFile)
    })

    expect(mockGetFilePresignedUrl).toHaveBeenCalledWith('zoo-mission.webp', 'image/webp', compressed.size)
    expect(mockUploadToS3).toHaveBeenCalledWith(
      'https://s3.example.com/uploads/a.webp',
      compressed,
      'image/webp',
      expect.any(Object)
    )
    expect(result.current.status).toBe('done')
    expect(result.current.fileId).toBe(31)
    expect(result.current.previewUrl).toBe('blob:preview')
  })

  it('이미 낸 사진이 있으면 그 사진으로 시작한다', () => {
    const { result } = renderHook(() => useMissionPhoto({ fileId: 9, url: 'https://cdn.example.com/uploads/old.webp' }))

    expect(result.current.status).toBe('done')
    expect(result.current.fileId).toBe(9)
    expect(result.current.previewUrl).toBe('https://cdn.example.com/uploads/old.webp')
  })

  it('올리다 실패하면 안내하고 다시 올릴 수 있다', async () => {
    mockUploadToS3.mockRejectedValueOnce(new Error('네트워크 오류로 업로드에 실패했습니다.'))
    const { result } = renderHook(() => useMissionPhoto(null))

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

  it('사진이 아닌 파일을 고르면 이미 올린 사진은 그대로 둔다', async () => {
    const { result } = renderHook(() => useMissionPhoto({ fileId: 9, url: 'https://cdn.example.com/uploads/old.webp' }))

    await act(async () => {
      await result.current.select(new File(['x'], 'note.pdf', { type: 'application/pdf' }))
    })

    expect(result.current.status).toBe('done')
    expect(result.current.fileId).toBe(9)
    expect(result.current.error).toBe('사진 파일만 올릴 수 있어요.')
    expect(mockCompressImage).not.toHaveBeenCalled()
  })

  it('열 수 없는 사진이면 다른 사진을 고르라고 안내한다', async () => {
    mockCompressImage.mockRejectedValueOnce(new Error('이미지를 불러올 수 없습니다.'))
    const { result } = renderHook(() => useMissionPhoto(null))

    await act(async () => {
      await result.current.select(photoFile)
    })

    expect(result.current.error).toBe('이 사진은 열 수 없어요. 다른 사진을 골라 주세요.')
  })
})
