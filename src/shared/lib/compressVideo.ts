export interface VideoCompressionOptions {
  crf?: number
  maxWidth?: number
  onProgress?: (progress: number) => void
}

export interface CompressedVideoResult {
  blob: Blob
  originalSize: number
  compressedSize: number
}

const DEFAULT_CRF = 28
const DEFAULT_MAX_WIDTH = 1280
const FFMPEG_CORE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js'
const FFMPEG_WASM_URL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ffmpegInstance: any = null

async function getFFmpeg() {
  if (ffmpegInstance?.loaded) {
    return ffmpegInstance
  }

  const { FFmpeg } = await import('@ffmpeg/ffmpeg')
  const ffmpeg = new FFmpeg()

  await ffmpeg.load({
    coreURL: FFMPEG_CORE_URL,
    wasmURL: FFMPEG_WASM_URL,
  })

  ffmpegInstance = ffmpeg
  return ffmpeg
}

export function isVideoCompressionSupported(): boolean {
  return typeof WebAssembly !== 'undefined'
}

export async function compressVideo(
  file: File,
  options?: VideoCompressionOptions
): Promise<CompressedVideoResult> {
  if (!isVideoCompressionSupported()) {
    throw new Error('이 브라우저에서는 비디오 압축을 지원하지 않습니다.')
  }

  const crf = options?.crf ?? DEFAULT_CRF
  const maxWidth = options?.maxWidth ?? DEFAULT_MAX_WIDTH
  const onProgress = options?.onProgress

  const ffmpeg = await getFFmpeg()
  const { fetchFile } = await import('@ffmpeg/util')

  const progressHandler = ({ progress }: { progress: number }) => {
    onProgress?.(Math.min(Math.round(progress * 100), 100))
  }

  if (onProgress) {
    ffmpeg.on('progress', progressHandler)
  }

  try {
    await ffmpeg.writeFile('input.mp4', await fetchFile(file))

    const args = [
      '-i', 'input.mp4',
      '-vf', `scale='min(${maxWidth},iw)':-2`,
      '-c:v', 'libx264',
      '-crf', String(crf),
      '-preset', 'fast',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      'output.mp4',
    ]

    await ffmpeg.exec(args)

    const data = await ffmpeg.readFile('output.mp4')
    const blob = new Blob([data], { type: 'video/mp4' })

    return {
      blob,
      originalSize: file.size,
      compressedSize: blob.size,
    }
  } finally {
    try {
      await ffmpeg.deleteFile('input.mp4')
    } catch { /* ignore */ }
    try {
      await ffmpeg.deleteFile('output.mp4')
    } catch { /* ignore */ }

    if (onProgress) {
      ffmpeg.off('progress', progressHandler)
    }
  }
}
