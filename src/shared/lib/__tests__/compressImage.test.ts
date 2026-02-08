import { compressImage } from '../compressImage'

const mockCreateObjectURL = jest.fn()
const mockRevokeObjectURL = jest.fn()

const mockDrawImage = jest.fn()
const mockGetContext = jest.fn()
const mockToBlob = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()

  mockCreateObjectURL.mockReturnValue('blob:mock-url')
  URL.createObjectURL = mockCreateObjectURL
  URL.revokeObjectURL = mockRevokeObjectURL

  mockGetContext.mockReturnValue({ drawImage: mockDrawImage })
  mockToBlob.mockImplementation((callback: (blob: Blob | null) => void, type: string) => {
    callback(new Blob(['fake'], { type }))
  })

  jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'canvas') {
      return {
        width: 0,
        height: 0,
        getContext: mockGetContext,
        toBlob: mockToBlob,
      } as unknown as HTMLCanvasElement
    }
    return document.createElement(tag)
  })
})

afterEach(() => {
  jest.restoreAllMocks()
})

function createMockFile(size: number, type = 'image/jpeg'): File {
  const buffer = new ArrayBuffer(size)
  return new File([buffer], 'test.jpg', { type })
}

function mockImageLoad(width: number, height: number) {
  jest.spyOn(globalThis, 'Image').mockImplementation(() => {
    const img = {
      naturalWidth: width,
      naturalHeight: height,
      src: '',
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
    }
    setTimeout(() => img.onload?.(), 0)
    return img as unknown as HTMLImageElement
  })
}

describe('compressImage', () => {
  it('이미지를 WebP로 변환한다', async () => {
    mockImageLoad(800, 600)
    const file = createMockFile(1024, 'image/jpeg')

    const result = await compressImage(file)

    expect(result.blob).toBeInstanceOf(Blob)
    expect(result.blob.type).toBe('image/webp')
    expect(result.originalSize).toBe(1024)
  })

  it('원본 크기가 maxWidth보다 크면 리사이즈한다', async () => {
    mockImageLoad(4000, 2000)
    const file = createMockFile(5000, 'image/png')

    await compressImage(file, { maxWidth: 1920, maxHeight: 1920 })

    const canvas = (document.createElement as jest.Mock).mock.results.find(
      (r: { value: unknown }) => (r.value as { toBlob?: unknown }).toBlob
    )?.value
    expect(canvas.width).toBe(1920)
    expect(canvas.height).toBe(960)
  })

  it('원본 크기가 maxHeight보다 크면 리사이즈한다', async () => {
    mockImageLoad(1000, 4000)
    const file = createMockFile(5000, 'image/png')

    await compressImage(file, { maxWidth: 1920, maxHeight: 1920 })

    const canvas = (document.createElement as jest.Mock).mock.results.find(
      (r: { value: unknown }) => (r.value as { toBlob?: unknown }).toBlob
    )?.value
    expect(canvas.width).toBe(480)
    expect(canvas.height).toBe(1920)
  })

  it('원본이 max 이내면 리사이즈하지 않는다', async () => {
    mockImageLoad(800, 600)
    const file = createMockFile(1024, 'image/jpeg')

    await compressImage(file, { maxWidth: 1920, maxHeight: 1920 })

    const canvas = (document.createElement as jest.Mock).mock.results.find(
      (r: { value: unknown }) => (r.value as { toBlob?: unknown }).toBlob
    )?.value
    expect(canvas.width).toBe(800)
    expect(canvas.height).toBe(600)
  })

  it('Object URL을 정리한다', async () => {
    mockImageLoad(100, 100)
    const file = createMockFile(100)

    await compressImage(file)

    expect(mockCreateObjectURL).toHaveBeenCalledWith(file)
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('WebP 변환 실패 시 JPEG로 폴백한다', async () => {
    mockImageLoad(100, 100)
    const file = createMockFile(100)

    mockToBlob.mockImplementation((callback: (blob: Blob | null) => void, type: string) => {
      if (type === 'image/webp') {
        callback(null)
        return
      }
      callback(new Blob(['fake'], { type: 'image/jpeg' }))
    })

    const result = await compressImage(file)

    expect(result.blob.type).toBe('image/jpeg')
  })

  it('Canvas 컨텍스트 생성 실패 시 에러를 던진다', async () => {
    mockImageLoad(100, 100)
    mockGetContext.mockReturnValue(null)
    const file = createMockFile(100)

    await expect(compressImage(file)).rejects.toThrow('Canvas 컨텍스트를 생성할 수 없습니다.')
  })

  it('이미지 로드 실패 시 에러를 던진다', async () => {
    jest.spyOn(globalThis, 'Image').mockImplementation(() => {
      const img = {
        src: '',
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
      }
      setTimeout(() => img.onerror?.(), 0)
      return img as unknown as HTMLImageElement
    })

    const file = createMockFile(100)

    await expect(compressImage(file)).rejects.toThrow('이미지를 불러올 수 없습니다.')
    expect(mockRevokeObjectURL).toHaveBeenCalled()
  })

  it('quality 옵션을 전달한다', async () => {
    mockImageLoad(100, 100)
    const file = createMockFile(100)

    await compressImage(file, { quality: 0.5 })

    expect(mockToBlob).toHaveBeenCalledWith(expect.any(Function), 'image/webp', 0.5)
  })
})
