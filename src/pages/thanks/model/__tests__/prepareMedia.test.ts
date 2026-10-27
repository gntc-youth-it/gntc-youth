import { compressImage, compressVideo, isVideoCompressionSupported } from '../../../../shared/lib'
import { getVideoDuration } from '../../lib/videoDuration'
import { MediaError, mediaTypeOf, prepareMedia } from '../prepareMedia'

jest.mock('../../../../shared/lib', () => ({
  ...jest.requireActual('../../../../shared/lib'),
  compressImage: jest.fn(),
  compressVideo: jest.fn(),
  isVideoCompressionSupported: jest.fn(),
}))

jest.mock('../../lib/videoDuration', () => ({
  getVideoDuration: jest.fn(),
}))

const mockCompressImage = compressImage as jest.MockedFunction<typeof compressImage>
const mockCompressVideo = compressVideo as jest.MockedFunction<typeof compressVideo>
const mockIsVideoCompressionSupported = isVideoCompressionSupported as jest.MockedFunction<typeof isVideoCompressionSupported>
const mockGetVideoDuration = getVideoDuration as jest.MockedFunction<typeof getVideoDuration>

const mp4 = new Blob(['mp4'], { type: 'video/mp4' })
const converted = new Blob(['converted'], { type: 'video/mp4' })

beforeEach(() => {
  jest.clearAllMocks()
  mockIsVideoCompressionSupported.mockReturnValue(true)
  mockCompressVideo.mockResolvedValue({ blob: converted, originalSize: 3, compressedSize: 9 })
})

describe('mediaTypeOf', () => {
  it('type으로 사진과 영상을 가린다', () => {
    expect(mediaTypeOf(new Blob([''], { type: 'image/webp' }))).toBe('IMAGE')
    expect(mediaTypeOf(new Blob([''], { type: 'video/quicktime' }))).toBe('VIDEO')
    expect(mediaTypeOf(new Blob([''], { type: 'application/pdf' }))).toBeNull()
  })

  it('type이 비어 있으면 파일 이름으로 본다', () => {
    expect(mediaTypeOf(new File([''], 'clip.MOV', { type: '' }))).toBe('VIDEO')
    expect(mediaTypeOf(new File([''], 'photo.heic', { type: '' }))).toBe('IMAGE')
  })
})

describe('prepareMedia 사진', () => {
  it('화면 안 카메라로 찍은 사진은 그대로 올린다', async () => {
    const photo = new Blob(['p'], { type: 'image/webp' })

    await expect(prepareMedia(photo, 'camera')).resolves.toEqual({ blob: photo, mediaType: 'IMAGE' })
    expect(mockCompressImage).not.toHaveBeenCalled()
  })

  it('앨범 사진은 1280px로 줄인다', async () => {
    const photo = new File(['p'], 'a.jpg', { type: 'image/jpeg' })
    const small = new Blob(['s'], { type: 'image/webp' })
    mockCompressImage.mockResolvedValue({ blob: small, originalSize: 1, compressedSize: 1 })

    await expect(prepareMedia(photo, 'album')).resolves.toEqual({ blob: small, mediaType: 'IMAGE' })
    expect(mockCompressImage).toHaveBeenCalledWith(photo, { maxWidth: 1280, maxHeight: 1280, quality: 0.8 })
  })

  it('열 수 없는 사진이면 다른 사진을 고르라고 한다', async () => {
    mockCompressImage.mockRejectedValue(new Error('이미지를 불러올 수 없습니다.'))

    await expect(prepareMedia(new File(['p'], 'a.jpg', { type: 'image/jpeg' }), 'album')).rejects.toThrow(
      new MediaError('이 사진은 열 수 없어요. 다른 사진을 골라 주세요.')
    )
  })
})

describe('prepareMedia 영상', () => {
  it('화면 안 카메라로 녹화한 mp4는 그대로 올린다', async () => {
    await expect(prepareMedia(mp4, 'camera')).resolves.toEqual({ blob: mp4, mediaType: 'VIDEO' })
    expect(mockCompressVideo).not.toHaveBeenCalled()
  })

  it('녹화가 webm이면 아이폰에서도 보이게 mp4로 바꾸고, 못 바꾸면 그대로 올린다', async () => {
    const webm = new Blob(['w'], { type: 'video/webm' })

    await expect(prepareMedia(webm, 'camera')).resolves.toEqual({ blob: converted, mediaType: 'VIDEO' })
    expect(mockCompressVideo).toHaveBeenCalledWith(webm, expect.objectContaining({ maxDurationSec: 5, maxWidth: 1280 }))

    mockCompressVideo.mockRejectedValueOnce(new Error('wasm'))
    await expect(prepareMedia(webm, 'camera')).resolves.toEqual({ blob: webm, mediaType: 'VIDEO' })
  })

  it('앨범의 5초 이하 mp4는 그대로 올린다', async () => {
    mockGetVideoDuration.mockResolvedValue(5.2)

    await expect(prepareMedia(mp4, 'album')).resolves.toEqual({ blob: mp4, mediaType: 'VIDEO' })
    expect(mockCompressVideo).not.toHaveBeenCalled()
  })

  it('앨범의 긴 영상은 앞 5초만 mp4로 남긴다', async () => {
    mockGetVideoDuration.mockResolvedValue(42)

    await expect(prepareMedia(mp4, 'album')).resolves.toEqual({ blob: converted, mediaType: 'VIDEO' })
    expect(mockCompressVideo).toHaveBeenCalledWith(mp4, expect.objectContaining({ maxDurationSec: 5 }))
  })

  it('아이폰 mov는 짧아도 mp4로 바꾸고, 못 바꾸면 5초 이하일 때만 그대로 올린다', async () => {
    const mov = new File(['m'], 'clip.mov', { type: 'video/quicktime' })
    mockGetVideoDuration.mockResolvedValue(3)

    await expect(prepareMedia(mov, 'album')).resolves.toEqual({ blob: converted, mediaType: 'VIDEO' })

    mockCompressVideo.mockRejectedValueOnce(new Error('wasm'))
    await expect(prepareMedia(mov, 'album')).resolves.toEqual({ blob: mov, mediaType: 'VIDEO' })
  })

  it('긴 영상을 자를 수 없는 브라우저면 5초 이하로 골라 달라고 한다', async () => {
    mockIsVideoCompressionSupported.mockReturnValue(false)
    mockGetVideoDuration.mockResolvedValue(12)

    await expect(prepareMedia(mp4, 'album')).rejects.toThrow(
      new MediaError('5초가 넘는 영상은 올릴 수 없어요. 5초 이하로 골라 주세요.')
    )
  })
})

it('사진이나 영상이 아니면 올리지 않는다', async () => {
  await expect(prepareMedia(new Blob(['x'], { type: 'application/pdf' }), 'album')).rejects.toThrow(
    new MediaError('사진이나 영상만 올릴 수 있어요.')
  )
})
