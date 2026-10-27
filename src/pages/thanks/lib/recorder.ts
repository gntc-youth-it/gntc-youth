// 화면 안 카메라에서 사진 한 장을 찍거나, 정해진 초만큼 영상을 녹화한다

// 카드와 카메라 미리보기 틀의 비율(16:10). 찍은 사진·영상도 미리보기에 보이던 이 영역만 남긴다
export const CARD_ASPECT = 16 / 10
// 잘라 낸 사진·영상의 가로를 이 크기까지 줄인다. 카드에 꽉 차는 크기라 이보다 크면 데이터만 쓴다
const MAX_WIDTH = 1280

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

export interface CropArea {
  // 카메라 화면에서 잘라 낼 영역
  sx: number
  sy: number
  sw: number
  sh: number
  // 잘라 낸 결과의 크기
  width: number
  height: number
}

// 미리보기는 16:10 틀에 object-cover로 가운데를 꽉 채운다. 그때 보이는 영역과 같은 곳을 잘라 낸다
export const getCropArea = (videoWidth: number, videoHeight: number): CropArea => {
  const isWider = videoWidth / videoHeight > CARD_ASPECT
  const sw = isWider ? videoHeight * CARD_ASPECT : videoWidth
  const sh = isWider ? videoHeight : videoWidth / CARD_ASPECT
  // 원본보다 크게 늘리지는 않는다. 크기는 짝수로 맞춘다(영상 인코더가 홀수를 싫어한다)
  const width = Math.round(Math.min(MAX_WIDTH, sw) / 2) * 2
  const height = Math.round(width / CARD_ASPECT / 2) * 2
  return { sx: (videoWidth - sw) / 2, sy: (videoHeight - sh) / 2, sw, sh, width, height }
}

// 보이던 영역만 그린다. 앞카메라는 미리보기처럼 좌우를 뒤집어 보이던 그대로 저장되게 한다
const drawFrame = (ctx: CanvasRenderingContext2D, video: HTMLVideoElement, area: CropArea, mirrored: boolean) => {
  ctx.save()
  if (mirrored) {
    ctx.translate(area.width, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(video, area.sx, area.sy, area.sw, area.sh, 0, 0, area.width, area.height)
  ctx.restore()
}

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))

export const capturePhoto = async (video: HTMLVideoElement, mirrored: boolean): Promise<Blob> => {
  if (!video.videoWidth || !video.videoHeight) throw new Error('사진을 찍지 못했어요.')
  const area = getCropArea(video.videoWidth, video.videoHeight)
  const canvas = document.createElement('canvas')
  canvas.width = area.width
  canvas.height = area.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('사진을 찍지 못했어요.')

  drawFrame(ctx, video, area, mirrored)
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
// 미리보기에 보이던 16:10 영역만 캔버스에 그려 그 캔버스를 녹화한다. 그래서 찍히는 것이 보이던 것과 같다.
// 카메라를 그대로 녹화하면 아이폰 앞카메라 영상이 옆으로 눕는 iOS 버그(WebKit 323550)도 이렇게 피한다.
// 캔버스 녹화를 못 하는 브라우저만 카메라 화면 전체를 그대로 녹화한다
export const recordClip = ({ video, stream, mirrored, seconds, onProgress }: RecordClipOptions): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const mimeType = pickRecorderMimeType()
    const area = getCropArea(video.videoWidth || 1280, video.videoHeight || 800)
    const canvas = document.createElement('canvas')
    canvas.width = area.width
    canvas.height = area.height
    const ctx = canvas.getContext('2d')
    const useCanvas = ctx !== null && typeof canvas.captureStream === 'function'

    let frame = 0
    let ticker: ReturnType<typeof setInterval> | undefined
    let source = stream
    if (ctx && useCanvas) {
      const draw = () => {
        drawFrame(ctx, video, area, mirrored)
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
