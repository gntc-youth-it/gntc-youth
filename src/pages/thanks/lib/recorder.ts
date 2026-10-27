// 화면 안 카메라에서 사진 한 장을 찍거나, 정해진 초만큼 영상을 녹화한다

// 사진·영상 모두 긴 쪽을 이 크기까지 줄인다. 카드에 꽉 차는 크기라 이보다 크면 데이터만 쓴다
const MAX_SIDE = 1280

// 아이폰은 mp4로만 녹화된다. 안드로이드 크롬도 mp4가 되면 mp4로 찍어야 아이폰에서 재생된다
const RECORDER_MIME_TYPES = [
  'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
  'video/mp4;codecs=avc1,mp4a.40.2',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
]

export const canRecordVideo = (): boolean => typeof MediaRecorder !== 'undefined'

export const pickRecorderMimeType = (): string | undefined => {
  if (!canRecordVideo() || typeof MediaRecorder.isTypeSupported !== 'function') return undefined
  return RECORDER_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
}

const fitSize = (width: number, height: number) => {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height, 1))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

// 앞카메라는 미리보기처럼 좌우를 뒤집어 그린다. 보이던 그대로 저장되게
const drawFrame = (ctx: CanvasRenderingContext2D, video: HTMLVideoElement, width: number, height: number, mirrored: boolean) => {
  ctx.save()
  if (mirrored) {
    ctx.translate(width, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(video, 0, 0, width, height)
  ctx.restore()
}

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))

export const capturePhoto = async (video: HTMLVideoElement, mirrored: boolean): Promise<Blob> => {
  const { width, height } = fitSize(video.videoWidth, video.videoHeight)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx || width === 0) throw new Error('사진을 찍지 못했어요.')

  drawFrame(ctx, video, width, height, mirrored)
  const webp = await canvasToBlob(canvas, 'image/webp', 0.85)
  // 사파리는 webp를 못 만들어서 png를 돌려준다. 그때는 jpeg로 만든다
  if (webp?.type === 'image/webp') return webp
  const jpeg = await canvasToBlob(canvas, 'image/jpeg', 0.85)
  if (!jpeg) throw new Error('사진을 찍지 못했어요.')
  return jpeg
}

interface RecordClipOptions {
  video: HTMLVideoElement
  // 카메라 스트림. 소리 트랙은 여기서 가져온다
  stream: MediaStream
  mirrored: boolean
  seconds: number
  onProgress?: (elapsedMs: number) => void
}

// 정해진 초만큼 녹화하고 저절로 멈춘다.
// 아이폰 앞카메라를 그대로 녹화하면 영상이 옆으로 눕는 iOS 버그가 있어서(WebKit 323550),
// 미리보기를 캔버스에 그리고 그 캔버스를 녹화한다. 캔버스 녹화를 못 하는 브라우저는 카메라를 그대로 녹화한다
export const recordClip = ({ video, stream, mirrored, seconds, onProgress }: RecordClipOptions): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const mimeType = pickRecorderMimeType()
    const { width, height } = fitSize(video.videoWidth, video.videoHeight)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    const useCanvas = ctx !== null && typeof canvas.captureStream === 'function'

    let frame = 0
    let ticker: ReturnType<typeof setInterval> | undefined
    let source = stream
    if (ctx && useCanvas) {
      const draw = () => {
        drawFrame(ctx, video, width, height, mirrored)
        frame = requestAnimationFrame(draw)
      }
      draw()
      source = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...stream.getAudioTracks()])
    }

    const cleanup = () => {
      cancelAnimationFrame(frame)
      if (ticker) clearInterval(ticker)
      // 캔버스 트랙만 끈다. 카메라·마이크 트랙은 미리보기가 계속 쓴다
      if (useCanvas) source.getVideoTracks().forEach((track) => track.stop())
    }

    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(source, {
        ...(mimeType ? { mimeType } : {}),
        videoBitsPerSecond: 2_500_000,
        audioBitsPerSecond: 128_000,
      })
    } catch (error) {
      cleanup()
      reject(error)
      return
    }

    const chunks: Blob[] = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onerror = () => {
      cleanup()
      reject(new Error('녹화하지 못했어요.'))
    }
    recorder.onstop = () => {
      cleanup()
      const type = (recorder.mimeType || mimeType || 'video/mp4').split(';')[0]
      resolve(new Blob(chunks, { type }))
    }

    const startedAt = Date.now()
    recorder.start()
    ticker = setInterval(() => onProgress?.(Date.now() - startedAt), 100)
    setTimeout(() => {
      if (recorder.state !== 'inactive') recorder.stop()
    }, seconds * 1000)
  })
