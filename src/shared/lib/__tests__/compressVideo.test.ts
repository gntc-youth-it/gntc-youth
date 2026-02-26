const mockInstance = {
  load: jest.fn(),
  exec: jest.fn(),
  writeFile: jest.fn(),
  readFile: jest.fn(),
  deleteFile: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  loaded: false,
}

jest.mock('@ffmpeg/ffmpeg', () => ({
  FFmpeg: jest.fn(() => mockInstance),
}))

jest.mock('@ffmpeg/util', () => ({
  fetchFile: jest.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}))

function createMockVideoFile(size = 1024): File {
  const buffer = new ArrayBuffer(size)
  return new File([buffer], 'test.mp4', { type: 'video/mp4' })
}

describe('compressVideo module', () => {
  let compressVideo: (file: File, options?: import('../compressVideo').VideoCompressionOptions) => Promise<import('../compressVideo').CompressedVideoResult>
  let isVideoCompressionSupported: () => boolean

  beforeEach(async () => {
    jest.clearAllMocks()
    jest.resetModules()
    mockInstance.loaded = false
    mockInstance.load.mockResolvedValue(undefined)
    mockInstance.exec.mockResolvedValue(undefined)
    mockInstance.writeFile.mockResolvedValue(undefined)
    mockInstance.readFile.mockResolvedValue(new Uint8Array([1, 2, 3]))
    mockInstance.deleteFile.mockResolvedValue(undefined)

    const mod = await import('../compressVideo')
    compressVideo = mod.compressVideo
    isVideoCompressionSupported = mod.isVideoCompressionSupported
  })

  describe('isVideoCompressionSupported', () => {
    it('WebAssembly가 있으면 true를 반환한다', () => {
      expect(isVideoCompressionSupported()).toBe(true)
    })
  })

  describe('compressVideo', () => {
    it('영상을 압축하고 결과를 반환한다', async () => {
      const file = createMockVideoFile(5000)

      const result = await compressVideo(file)

      expect(result.blob).toBeInstanceOf(Blob)
      expect(result.blob.type).toBe('video/mp4')
      expect(result.originalSize).toBe(5000)
      expect(result.compressedSize).toBeGreaterThan(0)
    })

    it('FFmpeg를 로드하고 올바른 인자로 exec를 호출한다', async () => {
      const file = createMockVideoFile()

      await compressVideo(file)

      expect(mockInstance.load).toHaveBeenCalled()
      expect(mockInstance.writeFile).toHaveBeenCalledWith('input.mp4', expect.anything())
      expect(mockInstance.exec).toHaveBeenCalledWith([
        '-i', 'input.mp4',
        '-vf', "scale='min(1280,iw)':-2",
        '-c:v', 'libx264',
        '-crf', '28',
        '-preset', 'ultrafast',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        'output.mp4',
      ])
      expect(mockInstance.readFile).toHaveBeenCalledWith('output.mp4')
    })

    it('커스텀 crf와 maxWidth를 적용한다', async () => {
      const file = createMockVideoFile()

      await compressVideo(file, { crf: 35, maxWidth: 720 })

      expect(mockInstance.exec).toHaveBeenCalledWith(
        expect.arrayContaining([
          '-crf', '35',
          '-vf', "scale='min(720,iw)':-2",
        ])
      )
    })

    it('onProgress 콜백을 등록하고 해제한다', async () => {
      const onProgress = jest.fn()
      const file = createMockVideoFile()

      await compressVideo(file, { onProgress })

      expect(mockInstance.on).toHaveBeenCalledWith('progress', expect.any(Function))
      expect(mockInstance.off).toHaveBeenCalledWith('progress', expect.any(Function))
    })

    it('onProgress가 없으면 이벤트를 등록하지 않는다', async () => {
      const file = createMockVideoFile()

      await compressVideo(file)

      expect(mockInstance.on).not.toHaveBeenCalled()
      expect(mockInstance.off).not.toHaveBeenCalled()
    })

    it('progress 이벤트를 0~100 범위로 변환한다', async () => {
      const onProgress = jest.fn()
      const file = createMockVideoFile()

      mockInstance.on.mockImplementation((_event: string, handler: (data: { progress: number }) => void) => {
        handler({ progress: 0.5 })
        handler({ progress: 1.2 })
      })

      await compressVideo(file, { onProgress })

      expect(onProgress).toHaveBeenCalledWith(50)
      expect(onProgress).toHaveBeenCalledWith(100)
    })

    it('완료 후 가상 파일을 정리한다', async () => {
      const file = createMockVideoFile()

      await compressVideo(file)

      expect(mockInstance.deleteFile).toHaveBeenCalledWith('input.mp4')
      expect(mockInstance.deleteFile).toHaveBeenCalledWith('output.mp4')
    })

    it('skipBelowSize 이하 MP4 파일은 압축을 스킵한다', async () => {
      const file = createMockVideoFile(1000)

      const result = await compressVideo(file, { skipBelowSize: 2000 })

      expect(result.blob).toBe(file)
      expect(result.originalSize).toBe(1000)
      expect(result.compressedSize).toBe(1000)
      expect(mockInstance.load).not.toHaveBeenCalled()
      expect(mockInstance.exec).not.toHaveBeenCalled()
    })

    it('skipBelowSize 이하여도 MP4가 아니면 압축한다', async () => {
      const file = new File([new ArrayBuffer(1000)], 'test.mov', { type: 'video/quicktime' })

      await compressVideo(file, { skipBelowSize: 2000 })

      expect(mockInstance.exec).toHaveBeenCalled()
    })

    it('skipBelowSize 초과 MP4 파일은 압축한다', async () => {
      const file = createMockVideoFile(3000)

      await compressVideo(file, { skipBelowSize: 2000 })

      expect(mockInstance.exec).toHaveBeenCalled()
    })

    it('스킵 시 onProgress를 100으로 호출한다', async () => {
      const onProgress = jest.fn()
      const file = createMockVideoFile(1000)

      await compressVideo(file, { skipBelowSize: 2000, onProgress })

      expect(onProgress).toHaveBeenCalledWith(100)
    })

    it('exec 실패 시에도 가상 파일을 정리한다', async () => {
      mockInstance.exec.mockRejectedValueOnce(new Error('exec failed'))
      const file = createMockVideoFile()

      await expect(compressVideo(file)).rejects.toThrow('exec failed')
      expect(mockInstance.deleteFile).toHaveBeenCalledWith('input.mp4')
      expect(mockInstance.deleteFile).toHaveBeenCalledWith('output.mp4')
    })
  })
})
