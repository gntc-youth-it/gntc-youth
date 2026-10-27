import { act, renderHook } from '@testing-library/react'
import { getFilePresignedUrl } from '../../../../shared/api'
import { compressImage, uploadToS3 } from '../../../../shared/lib'
import { useProfilePhoto } from '../useProfilePhoto'

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

const photo = new File(['photo'], 'me.jpg', { type: 'image/jpeg' })
const small = new Blob(['small'], { type: 'image/webp' })

beforeAll(() => {
  // CRA 설정은 테스트마다 jest.fn 구현을 지우므로 일반 함수로 둔다
  URL.createObjectURL = () => 'blob:me'
  URL.revokeObjectURL = () => undefined
})

beforeEach(() => {
  jest.clearAllMocks()
  mockCompressImage.mockResolvedValue({ blob: small, originalSize: 5, compressedSize: 5 })
  mockGetFilePresignedUrl.mockResolvedValue({ fileId: 9, presignedUrl: 'https://s3.example.com/uploads/p.webp' })
  mockUploadToS3.mockResolvedValue(undefined)
})

describe('useProfilePhoto', () => {
  it('고른 사진을 640px로 줄여 새 파일로 올리고 파일 번호를 받는다', async () => {
    const { result } = renderHook(() => useProfilePhoto())

    await act(async () => {
      await result.current.select(photo)
    })

    expect(mockCompressImage).toHaveBeenCalledWith(photo, { maxWidth: 640, maxHeight: 640, quality: 0.85 })
    expect(mockGetFilePresignedUrl).toHaveBeenCalledWith('profile.webp', 'image/webp', small.size)
    expect(mockUploadToS3).toHaveBeenCalledWith('https://s3.example.com/uploads/p.webp', small, 'image/webp')
    expect(result.current).toMatchObject({ status: 'done', fileId: 9, previewUrl: 'blob:me', error: null })
  })

  it('사진이 아니면 안내만 하고 올리지 않는다', async () => {
    const { result } = renderHook(() => useProfilePhoto())

    await act(async () => {
      await result.current.select(new File(['v'], 'clip.mp4', { type: 'video/mp4' }))
    })

    expect(result.current.error).toBe('사진 파일만 고를 수 있어요.')
    expect(mockCompressImage).not.toHaveBeenCalled()
  })

  it('올리지 못하면 다시 골라 달라고 한다', async () => {
    mockUploadToS3.mockRejectedValueOnce(new Error('네트워크 오류로 업로드에 실패했습니다.'))
    const { result } = renderHook(() => useProfilePhoto())

    await act(async () => {
      await result.current.select(photo)
    })

    expect(result.current).toMatchObject({ status: 'error', fileId: null })
    expect(result.current.error).toBe('사진을 올리지 못했어요. 인터넷 연결을 확인하고 다시 골라 주세요.')
  })
})
