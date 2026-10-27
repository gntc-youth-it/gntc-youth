import { ChangeEvent, useRef, useState } from 'react'
import { pickRecorderMimeType } from '../lib/recorder'
import { prepareMedia } from '../model/prepareMedia'
import type { MediaSource } from '../model/prepareMedia'
import { CameraView } from './CameraView'
import type { CaptureMode } from './CameraView'

// ⚠️ 임시 페이지: PR 미리보기 주소에서 로그인 없이 휴대폰 카메라만 시험한다. 업로드는 하지 않는다. 확인이 끝나면 지운다

interface Result {
  url: string
  blob: Blob
  source: MediaSource
  size?: string
  duration?: string
  prepared?: string
  error?: string
}

const kb = (bytes: number) => `${Math.round(bytes / 1024).toLocaleString()}KB`

const Row = ({ label, value }: { label: string; value?: string }) => (
  <div className="flex gap-3 py-1 text-[13px]">
    <span className="w-24 shrink-0 text-white/50">{label}</span>
    <span className="min-w-0 break-all">{value ?? '…'}</span>
  </div>
)

export const CameraTestPage = () => {
  const [mode, setMode] = useState<CaptureMode>('VIDEO')
  const [result, setResult] = useState<Result | null>(null)
  const [progress, setProgress] = useState(0)
  const albumInput = useRef<HTMLInputElement>(null)
  const photoInput = useRef<HTMLInputElement>(null)
  const videoInput = useRef<HTMLInputElement>(null)

  const update = (patch: Partial<Result>) => setResult((prev) => (prev ? { ...prev, ...patch } : prev))

  const handleMedia = async (blob: Blob, source: MediaSource) => {
    setProgress(0)
    setResult({ url: URL.createObjectURL(blob), blob, source })
    const startedAt = performance.now()
    try {
      const prepared = await prepareMedia(blob, source, setProgress)
      const seconds = ((performance.now() - startedAt) / 1000).toFixed(1)
      const changed = prepared.blob === blob ? '그대로 올림' : `${prepared.blob.type} ${kb(prepared.blob.size)}로 바꿈`
      update({ prepared: `${changed} (${seconds}초)` })
    } catch (error) {
      update({ error: error instanceof Error ? error.message : String(error) })
    }
  }

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) void handleMedia(file, 'album')
  }

  const reset = () => {
    if (result) URL.revokeObjectURL(result.url)
    setResult(null)
  }

  const isVideo = result?.blob.type.startsWith('video/') ?? false
  const canvasCapture = typeof document !== 'undefined' && typeof document.createElement('canvas').captureStream === 'function'

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <input ref={albumInput} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
      <input ref={photoInput} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      <input ref={videoInput} type="file" accept="video/*" capture="environment" onChange={handleFile} className="hidden" />

      <div className="mx-auto flex min-h-screen max-w-md flex-col px-4 pb-8 pt-3">
        {result === null ? (
          <CameraView
            title="카메라 시험"
            subtitle="업로드는 하지 않아요"
            slotLabel="시험"
            mode={mode}
            onModeChange={setMode}
            onCapture={(blob) => void handleMedia(blob, 'camera')}
            onPickAlbum={() => albumInput.current?.click()}
            onNativePhoto={() => photoInput.current?.click()}
            onNativeVideo={() => videoInput.current?.click()}
            onClose={() => window.history.back()}
          />
        ) : (
          <div>
            <p className="text-[18px] font-extrabold">찍은 결과</p>
            <div className="mt-4 overflow-hidden rounded-[22px] bg-black">
              {isVideo ? (
                <video
                  src={result.url}
                  controls
                  playsInline
                  loop
                  className="max-h-[50vh] w-full object-contain"
                  onLoadedMetadata={(event) => {
                    const video = event.currentTarget
                    update({
                      size: `${video.videoWidth}×${video.videoHeight}`,
                      duration: Number.isFinite(video.duration) ? `${video.duration.toFixed(2)}초` : '알 수 없음',
                    })
                  }}
                />
              ) : (
                <img
                  src={result.url}
                  alt="찍은 사진"
                  className="max-h-[50vh] w-full object-contain"
                  onLoad={(event) => update({ size: `${event.currentTarget.naturalWidth}×${event.currentTarget.naturalHeight}` })}
                />
              )}
            </div>
            <div className="mt-4 rounded-2xl bg-white/5 px-4 py-3">
              <Row label="어디서" value={result.source === 'camera' ? '화면 안 카메라' : '앨범·기본 카메라'} />
              <Row label="형식" value={`${result.blob.type || '(비어 있음)'} · ${kb(result.blob.size)}`} />
              <Row label="크기" value={result.size} />
              {isVideo && <Row label="길이" value={result.duration} />}
              <Row label="올리기 전 처리" value={result.error ? `실패: ${result.error}` : result.prepared ?? `처리 중 ${progress}%`} />
            </div>
            <button type="button" onClick={reset} className="mt-4 w-full rounded-full bg-white py-3.5 text-[15px] font-bold text-[#141414]">
              다시 찍기
            </button>
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-white/5 px-4 py-3">
          <p className="pb-1 text-[13px] font-bold text-white/70">이 브라우저</p>
          <Row label="녹화 형식" value={pickRecorderMimeType() ?? (typeof MediaRecorder === 'undefined' ? '녹화 불가' : '브라우저 기본값')} />
          <Row label="캔버스 녹화" value={canvasCapture ? '가능' : '불가'} />
          <Row label="HTTPS" value={window.isSecureContext ? '예' : '아니요'} />
          <Row label="브라우저" value={navigator.userAgent} />
        </div>
      </div>
    </div>
  )
}
