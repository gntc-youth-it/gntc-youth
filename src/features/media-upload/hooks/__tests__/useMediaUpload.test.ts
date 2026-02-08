jest.mock('../../../../shared/lib', () => ({
  compressImage: jest.fn(),
  compressVideo: jest.fn(),
  isVideoCompressionSupported: jest.fn(() => true),
  uploadToS3: jest.fn(),
}))

jest.mock('../../api', () => ({
  getPresignedUrl: jest.fn(),
}))

import { renderHook, act } from '@testing-library/react'
import { useMediaUpload } from '../useMediaUpload'
import { compressImage, compressVideo, isVideoCompressionSupported, uploadToS3 } from '../../../../shared/lib'
import { getPresignedUrl } from '../../api'

const mockCompressImage = compressImage as jest.MockedFunction<typeof compressImage>
const mockCompressVideo = compressVideo as jest.MockedFunction<typeof compressVideo>
const mockIsSupported = isVideoCompressionSupported as jest.MockedFunction<typeof isVideoCompressionSupported>
const mockUploadToS3 = uploadToS3 as jest.MockedFunction<typeof uploadToS3>
const mockGetPresignedUrl = getPresignedUrl as jest.MockedFunction<typeof getPresignedUrl>

const mockCreateObjectURL = jest.fn()
const mockRevokeObjectURL = jest.fn()

function createFile(type: string, size = 1024, name = 'test'): File {
  const ext = type.startsWith('image') ? '.jpg' : '.mp4'
  return new File([new ArrayBuffer(size)], name + ext, { type })
}

describe('useMediaUpload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsSupported.mockReturnValue(true)
    mockCreateObjectURL.mockReturnValue('blob:preview-url')
    URL.createObjectURL = mockCreateObjectURL as typeof URL.createObjectURL
    URL.revokeObjectURL = mockRevokeObjectURL as typeof URL.revokeObjectURL
  })

  describe('초기 상태', () => {
    it('idle 상태로 시작한다', () => {
      const { result } = renderHook(() => useMediaUpload())

      expect(result.current.state.stage).toBe('idle')
      expect(result.current.state.file).toBeNull()
      expect(result.current.state.previewUrl).toBeNull()
      expect(result.current.state.fileType).toBeNull()
      expect(result.current.state.error).toBeNull()
    })
  })

  describe('selectFile', () => {
    it('이미지 파일을 선택하면 상태를 업데이트한다', () => {
      const { result } = renderHook(() => useMediaUpload())
      const file = createFile('image/jpeg')

      act(() => result.current.selectFile(file))

      expect(result.current.state.file).toBe(file)
      expect(result.current.state.fileType).toBe('image')
      expect(result.current.state.previewUrl).toBe('blob:preview-url')
      expect(result.current.state.stage).toBe('idle')
    })

    it('비디오 파일을 선택하면 fileType이 video이다', () => {
      const { result } = renderHook(() => useMediaUpload())
      const file = createFile('video/mp4')

      act(() => result.current.selectFile(file))

      expect(result.current.state.fileType).toBe('video')
    })

    it('지원하지 않는 타입이면 에러 상태가 된다', () => {
      const { result } = renderHook(() => useMediaUpload())
      const file = createFile('application/pdf')

      act(() => result.current.selectFile(file))

      expect(result.current.state.stage).toBe('error')
      expect(result.current.state.error).toContain('지원하지 않는 파일 형식')
    })

    it('이미지 파일이 20MB를 초과하면 에러 상태가 된다', () => {
      const { result } = renderHook(() => useMediaUpload())
      const file = createFile('image/jpeg', 21 * 1024 * 1024)

      act(() => result.current.selectFile(file))

      expect(result.current.state.stage).toBe('error')
      expect(result.current.state.error).toContain('이미지 파일 크기가 너무 큽니다')
    })

    it('영상 파일이 500MB를 초과하면 에러 상태가 된다', () => {
      const { result } = renderHook(() => useMediaUpload())
      const file = createFile('video/mp4', 501 * 1024 * 1024)

      act(() => result.current.selectFile(file))

      expect(result.current.state.stage).toBe('error')
      expect(result.current.state.error).toContain('영상 파일 크기가 너무 큽니다')
    })

    it('파일 재선택 시 기존 프리뷰 URL을 정리한다', () => {
      const { result } = renderHook(() => useMediaUpload())

      act(() => result.current.selectFile(createFile('image/jpeg')))
      act(() => result.current.selectFile(createFile('image/png')))

      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:preview-url')
    })
  })

  describe('startUpload - 이미지', () => {
    it('이미지 압축 → presigned URL 요청 → S3 업로드 순서로 진행한다', async () => {
      const compressedBlob = new Blob(['compressed'], { type: 'image/webp' })
      mockCompressImage.mockResolvedValue({
        blob: compressedBlob,
        originalSize: 1024,
        compressedSize: 512,
      })
      mockGetPresignedUrl.mockResolvedValue({
        uploadUrl: 'https://s3.example.com/put',
        fileUrl: 'https://cdn.example.com/image.webp',
      })
      mockUploadToS3.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMediaUpload())

      act(() => result.current.selectFile(createFile('image/jpeg', 1024, 'photo')))

      await act(async () => {
        await result.current.startUpload()
      })

      expect(mockCompressImage).toHaveBeenCalled()
      expect(mockGetPresignedUrl).toHaveBeenCalledWith('photo.webp', 'image/webp', expect.any(Number))
      expect(mockUploadToS3).toHaveBeenCalledWith(
        'https://s3.example.com/put',
        compressedBlob,
        'image/webp',
        expect.objectContaining({ onProgress: expect.any(Function) })
      )
      expect(result.current.state.stage).toBe('complete')
      expect(result.current.state.resultUrl).toBe('https://cdn.example.com/image.webp')
    })
  })

  describe('startUpload - 비디오', () => {
    it('비디오 압축 → presigned URL 요청 → S3 업로드 순서로 진행한다', async () => {
      const compressedBlob = new Blob(['compressed'], { type: 'video/mp4' })
      mockCompressVideo.mockResolvedValue({
        blob: compressedBlob,
        originalSize: 5000,
        compressedSize: 2000,
      })
      mockGetPresignedUrl.mockResolvedValue({
        uploadUrl: 'https://s3.example.com/put',
        fileUrl: 'https://cdn.example.com/video.mp4',
      })
      mockUploadToS3.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMediaUpload())

      act(() => result.current.selectFile(createFile('video/mp4', 5000, 'clip')))

      await act(async () => {
        await result.current.startUpload()
      })

      expect(mockCompressVideo).toHaveBeenCalled()
      expect(mockGetPresignedUrl).toHaveBeenCalledWith('clip.mp4', 'video/mp4', expect.any(Number))
      expect(result.current.state.stage).toBe('complete')
      expect(result.current.state.resultUrl).toBe('https://cdn.example.com/video.mp4')
    })

    it('WebAssembly 미지원 시 압축 없이 원본을 업로드한다', async () => {
      mockIsSupported.mockReturnValue(false)
      mockGetPresignedUrl.mockResolvedValue({
        uploadUrl: 'https://s3.example.com/put',
        fileUrl: 'https://cdn.example.com/video.mp4',
      })
      mockUploadToS3.mockResolvedValue(undefined)

      const { result } = renderHook(() => useMediaUpload())
      const file = createFile('video/mp4', 1024, 'raw')

      act(() => result.current.selectFile(file))

      await act(async () => {
        await result.current.startUpload()
      })

      expect(mockCompressVideo).not.toHaveBeenCalled()
      expect(mockUploadToS3).toHaveBeenCalled()
      expect(result.current.state.stage).toBe('complete')
    })
  })

  describe('에러 처리', () => {
    it('파일 없이 startUpload 호출 시 에러 상태가 된다', async () => {
      const { result } = renderHook(() => useMediaUpload())

      await act(async () => {
        await result.current.startUpload()
      })

      expect(result.current.state.stage).toBe('error')
      expect(result.current.state.error).toBe('업로드할 파일이 없습니다.')
    })

    it('압축 실패 시 에러 상태가 된다', async () => {
      mockCompressImage.mockRejectedValue(new Error('압축 실패'))

      const { result } = renderHook(() => useMediaUpload())
      act(() => result.current.selectFile(createFile('image/jpeg')))

      await act(async () => {
        await result.current.startUpload()
      })

      expect(result.current.state.stage).toBe('error')
      expect(result.current.state.error).toBe('압축 실패')
    })

    it('presigned URL 요청 실패 시 에러 상태가 된다', async () => {
      mockCompressImage.mockResolvedValue({
        blob: new Blob(['ok'], { type: 'image/webp' }),
        originalSize: 1024,
        compressedSize: 512,
      })
      mockGetPresignedUrl.mockRejectedValue(new Error('서버 오류'))

      const { result } = renderHook(() => useMediaUpload())
      act(() => result.current.selectFile(createFile('image/jpeg')))

      await act(async () => {
        await result.current.startUpload()
      })

      expect(result.current.state.stage).toBe('error')
      expect(result.current.state.error).toBe('서버 오류')
    })

    it('S3 업로드 실패 시 에러 상태가 된다', async () => {
      mockCompressImage.mockResolvedValue({
        blob: new Blob(['ok'], { type: 'image/webp' }),
        originalSize: 1024,
        compressedSize: 512,
      })
      mockGetPresignedUrl.mockResolvedValue({
        uploadUrl: 'https://s3.example.com/put',
        fileUrl: 'https://cdn.example.com/img.webp',
      })
      mockUploadToS3.mockRejectedValue(new Error('업로드 실패'))

      const { result } = renderHook(() => useMediaUpload())
      act(() => result.current.selectFile(createFile('image/jpeg')))

      await act(async () => {
        await result.current.startUpload()
      })

      expect(result.current.state.stage).toBe('error')
      expect(result.current.state.error).toBe('업로드 실패')
    })
  })

  describe('reset', () => {
    it('상태를 초기화하고 프리뷰 URL을 정리한다', () => {
      const { result } = renderHook(() => useMediaUpload())

      act(() => result.current.selectFile(createFile('image/jpeg')))
      expect(result.current.state.file).not.toBeNull()

      act(() => result.current.reset())

      expect(result.current.state.stage).toBe('idle')
      expect(result.current.state.file).toBeNull()
      expect(result.current.state.previewUrl).toBeNull()
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:preview-url')
    })
  })
})
