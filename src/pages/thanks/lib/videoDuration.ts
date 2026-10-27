// 영상 길이(초). 알 수 없으면 null. 녹화한 webm은 길이가 Infinity로 나오는 경우가 있어 그것도 null
export const getVideoDuration = (blob: Blob, timeoutMs = 5000): Promise<number | null> =>
  new Promise((resolve) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(blob)
    let settled = false

    const finish = (duration: number | null) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      URL.revokeObjectURL(url)
      resolve(duration)
    }

    const timer = setTimeout(() => finish(null), timeoutMs)
    video.preload = 'metadata'
    video.muted = true
    video.onloadedmetadata = () => finish(Number.isFinite(video.duration) ? video.duration : null)
    video.onerror = () => finish(null)
    video.src = url
  })
