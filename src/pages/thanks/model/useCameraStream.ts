import { RefObject, useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus = 'starting' | 'ready' | 'denied' | 'unsupported' | 'error'
export type CameraFacing = 'environment' | 'user'

// 카메라는 HTTPS(또는 localhost)에서만 켜진다
export const isCameraSupported = (): boolean =>
  typeof navigator !== 'undefined' &&
  typeof navigator.mediaDevices?.getUserMedia === 'function' &&
  window.isSecureContext !== false

const VIDEO_CONSTRAINTS = (facing: CameraFacing): MediaTrackConstraints => ({
  facingMode: { ideal: facing },
  width: { ideal: 1280 },
  height: { ideal: 720 },
})

// 소리도 녹음하려고 마이크를 같이 요청한다. 마이크를 못 쓰면(없거나 막힘) 영상만이라도 켠다
const openStream = async (facing: CameraFacing): Promise<MediaStream> => {
  try {
    return await navigator.mediaDevices.getUserMedia({ video: VIDEO_CONSTRAINTS(facing), audio: true })
  } catch {
    try {
      return await navigator.mediaDevices.getUserMedia({ video: VIDEO_CONSTRAINTS(facing), audio: false })
    } catch {
      // 해상도 조건이 안 맞는 카메라도 있어서 마지막으로 조건 없이 한 번 더
      return navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false })
    }
  }
}

const toStatus = (error: unknown): CameraStatus =>
  error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError') ? 'denied' : 'error'

// 화면 안 카메라 미리보기. videoRef의 <video>에 카메라를 띄운다
export const useCameraStream = (videoRef: RefObject<HTMLVideoElement>) => {
  const [facing, setFacing] = useState<CameraFacing>('environment')
  const [status, setStatus] = useState<CameraStatus>(() => (isCameraSupported() ? 'starting' : 'unsupported'))
  const [hasAudio, setHasAudio] = useState(false)
  // 다른 앱에 다녀오면 아이폰은 카메라를 끊는다. 그때 다시 켜려고 바꾸는 값
  const [restartKey, setRestartKey] = useState(0)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isCameraSupported()) return
    let cancelled = false
    setStatus('starting')

    openStream(facing)
      .then(async (stream) => {
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        setHasAudio(stream.getAudioTracks().length > 0)
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => undefined)
        }
        if (!cancelled) setStatus('ready')
      })
      .catch((error) => {
        if (!cancelled) setStatus(toStatus(error))
      })

    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [facing, restartKey, videoRef])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return
      const track = streamRef.current?.getVideoTracks()[0]
      if (track && track.readyState === 'ended') setRestartKey((key) => key + 1)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  const switchFacing = useCallback(() => {
    setFacing((current) => (current === 'environment' ? 'user' : 'environment'))
  }, [])

  const getStream = useCallback(() => streamRef.current, [])

  return { status, facing, hasAudio, mirrored: facing === 'user', switchFacing, getStream }
}
