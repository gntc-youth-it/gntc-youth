import { useEffect, useRef, useState } from 'react'
import { canRecordVideo, capturePhoto, recordClip } from '../lib/recorder'
import { VIDEO_MAX_SECONDS } from '../model/types'
import { useCameraStream } from '../model/useCameraStream'

export type CaptureMode = 'PHOTO' | 'VIDEO'

interface CameraViewProps {
  title: string
  subtitle: string
  slotLabel: string
  mode: CaptureMode
  onModeChange: (mode: CaptureMode) => void
  onCapture: (blob: Blob) => void
  onPickAlbum: () => void
  // 화면 안 카메라를 못 쓸 때 휴대폰 기본 카메라로 찍는다
  onNativePhoto: () => void
  onNativeVideo: () => void
  onClose: () => void
}

const RING_RADIUS = 35
const RING_LENGTH = 2 * Math.PI * RING_RADIUS

const AlbumIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
)

const FlipIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
    <path d="M4 3v5h5" />
    <path d="M4 13a8 8 0 0 0 14.3 4.9L20 16" />
    <path d="M20 21v-5h-5" />
  </svg>
)

const isKakaoInApp = () => typeof navigator !== 'undefined' && /KAKAOTALK/i.test(navigator.userAgent)

// 셋로그처럼 카드 모양 틀 안에 카메라를 띄우고, 사진은 누르면 찰칵, 영상은 누르면 정확히 5초 찍는다
export const CameraView = ({
  title,
  subtitle,
  slotLabel,
  mode,
  onModeChange,
  onCapture,
  onPickAlbum,
  onNativePhoto,
  onNativeVideo,
  onClose,
}: CameraViewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { status, hasAudio, mirrored, switchFacing, getStream } = useCameraStream(videoRef)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedMs, setRecordedMs] = useState(0)
  const [isFlashing, setIsFlashing] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const isUnavailable = status === 'unsupported' || status === 'denied' || status === 'error'

  const handleShutter = async () => {
    const video = videoRef.current
    const stream = getStream()
    if (!video || !stream || status !== 'ready' || isRecording) return
    setNotice(null)

    if (mode === 'PHOTO') {
      setIsFlashing(true)
      setTimeout(() => mounted.current && setIsFlashing(false), 180)
      try {
        onCapture(await capturePhoto(video, mirrored))
      } catch {
        setNotice('사진을 찍지 못했어요. 다시 눌러 주세요.')
      }
      return
    }

    if (!canRecordVideo()) {
      onNativeVideo()
      return
    }
    setRecordedMs(0)
    setIsRecording(true)
    try {
      const blob = await recordClip({ video, stream, mirrored, seconds: VIDEO_MAX_SECONDS, onProgress: setRecordedMs })
      if (mounted.current) onCapture(blob)
    } catch {
      if (mounted.current) setNotice('녹화하지 못했어요. 다시 눌러 주세요.')
    } finally {
      if (mounted.current) setIsRecording(false)
    }
  }

  const remainingSec = Math.max(0, Math.ceil(VIDEO_MAX_SECONDS - recordedMs / 1000))
  const progress = Math.min(1, recordedMs / (VIDEO_MAX_SECONDS * 1000))

  const hint = (() => {
    if (notice) return notice
    if (isRecording) return `찍는 중… ${remainingSec}초 남았어요`
    if (mode === 'VIDEO') return hasAudio || status !== 'ready' ? `누르면 ${VIDEO_MAX_SECONDS}초 동안 찍어요` : `누르면 ${VIDEO_MAX_SECONDS}초 동안 찍어요 · 마이크를 못 써서 소리 없이 찍혀요`
    return '누르면 찰칵 찍어요'
  })()

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[18px] font-extrabold">{title}</p>
          <p className="text-[13px] text-white/55">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="relative mt-5 aspect-[16/10] w-full overflow-hidden rounded-[22px] bg-black ring-[3px] ring-white">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          aria-label="카메라 미리보기"
          className="h-full w-full object-cover"
          style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
        />
        <span className="absolute left-4 top-3 text-[13px] font-bold text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.45)]">
          {slotLabel}
        </span>
        {isRecording && (
          <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[12px] font-bold">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF4D4F]" />
            {remainingSec}
          </span>
        )}
        {isFlashing && <div className="absolute inset-0 bg-white/80" aria-hidden="true" />}
        {status === 'starting' && (
          <p className="absolute inset-0 grid place-items-center text-[14px] text-white/70">카메라를 켜는 중…</p>
        )}
        {isUnavailable && (
          <div className="absolute inset-0 grid place-items-center px-6 text-center">
            <p className="break-keep text-[14px] leading-relaxed text-white/80">
              {status === 'denied' ? '카메라를 쓸 수 없어요. 카메라 권한을 허락해 주세요.' : '이 브라우저에서는 카메라를 열 수 없어요.'}
              <br />
              아래 버튼으로 휴대폰 카메라를 열어 찍을 수 있어요.
            </p>
          </div>
        )}
      </div>

      {isUnavailable ? (
        <div className="mt-6 space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" onClick={onNativePhoto} className="rounded-2xl bg-white py-3.5 text-[15px] font-bold text-[#141414]">
              사진 찍기
            </button>
            <button type="button" onClick={onNativeVideo} className="rounded-2xl bg-white py-3.5 text-[15px] font-bold text-[#141414]">
              영상 찍기
            </button>
          </div>
          <button type="button" onClick={onPickAlbum} className="w-full rounded-2xl bg-white/10 py-3.5 text-[15px] font-bold">
            앨범에서 고르기
          </button>
          <p className="break-keep pt-1 text-center text-[12px] leading-relaxed text-white/50">
            영상은 {VIDEO_MAX_SECONDS}초가 넘으면 앞 {VIDEO_MAX_SECONDS}초만 올라가요.
            {isKakaoInApp() && (
              <>
                <br />
                카카오톡 안에서는 카메라가 안 켜질 수 있어요. 오른쪽 아래 메뉴에서 &apos;다른 브라우저로 열기&apos;를 누르면 바로 찍을 수 있어요.
              </>
            )}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex justify-center" role="radiogroup" aria-label="찍을 것">
            <div className="flex rounded-full bg-white/10 p-1">
              {(['PHOTO', 'VIDEO'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={mode === option}
                  disabled={isRecording}
                  onClick={() => onModeChange(option)}
                  className={`rounded-full px-5 py-1.5 text-[14px] font-bold transition-colors ${
                    mode === option ? 'bg-white text-[#141414]' : 'text-white/70'
                  }`}
                >
                  {option === 'PHOTO' ? '사진' : `영상 ${VIDEO_MAX_SECONDS}초`}
                </button>
              ))}
            </div>
          </div>

          <p role="status" className={`mt-4 min-h-[20px] text-center text-[13px] ${notice ? 'text-[#FFB4AB]' : 'text-white/60'}`}>
            {hint}
          </p>

          <div className="mt-auto flex items-center justify-between px-6 pb-[calc(20px+env(safe-area-inset-bottom))] pt-6">
            <button
              type="button"
              onClick={onPickAlbum}
              disabled={isRecording}
              aria-label="앨범에서 고르기"
              className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 disabled:opacity-40"
            >
              <AlbumIcon />
            </button>

            <button
              type="button"
              onClick={handleShutter}
              disabled={status !== 'ready'}
              aria-label={mode === 'PHOTO' ? '사진 찍기' : `${VIDEO_MAX_SECONDS}초 영상 찍기`}
              className="relative grid h-[84px] w-[84px] place-items-center disabled:opacity-40"
            >
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 84 84" aria-hidden="true">
                <circle cx="42" cy="42" r={RING_RADIUS} fill="none" stroke="white" strokeOpacity={isRecording ? 0.3 : 1} strokeWidth="5" />
                {isRecording && (
                  <circle
                    cx="42"
                    cy="42"
                    r={RING_RADIUS}
                    fill="none"
                    stroke="#FF4D4F"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={RING_LENGTH}
                    strokeDashoffset={RING_LENGTH * (1 - progress)}
                  />
                )}
              </svg>
              <span
                className={`grid place-items-center rounded-full text-[18px] font-extrabold transition-all ${
                  mode === 'PHOTO' ? 'h-[62px] w-[62px] bg-white text-[#141414]' : 'h-[58px] w-[58px] bg-[#FF4D4F] text-white'
                } ${isRecording ? 'scale-75' : ''}`}
              >
                {isRecording ? remainingSec : ''}
              </span>
            </button>

            <button
              type="button"
              onClick={switchFacing}
              disabled={isRecording || status !== 'ready'}
              aria-label="앞·뒤 카메라 바꾸기"
              className="grid h-12 w-12 place-items-center rounded-full bg-white/10 disabled:opacity-40"
            >
              <FlipIcon />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
