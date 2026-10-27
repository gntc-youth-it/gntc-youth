import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { HttpError } from '../../../shared/api'
import { createThanksEntry } from '../api/thanksApi'
import { formatKstTime, formatSlotDeadline, getCurrentSlot, getMissionDate, getSlotInfo } from '../model/slots'
import { CONTENT_MAX_LENGTH, THANKS_ERROR_CODE } from '../model/types'
import type { ThanksEntry } from '../model/types'
import { useEntryMedia } from '../model/useEntryMedia'
import type { EntryMediaState } from '../model/useEntryMedia'
import type { MediaSource } from '../model/prepareMedia'
import { CameraView } from './CameraView'
import type { CaptureMode } from './CameraView'
import { EntryCardFace } from './EntryCard'

interface WriteSheetProps {
  now: Date
  onClose: () => void
  onPosted: (entry: ThanksEntry) => void
}

const toSubmitError = (error: unknown): string => {
  if (error instanceof HttpError) {
    if (error.code === THANKS_ERROR_CODE.ALREADY_POSTED) return '이 시간 감사는 이미 올렸어요.'
    if (error.code === THANKS_ERROR_CODE.SLOT_CLOSED) return '지금은 감사를 올릴 수 있는 시간이 아니에요.'
    if (error.code === THANKS_ERROR_CODE.FILE_NOT_ATTACHABLE || error.code === THANKS_ERROR_CODE.FILE_NOT_FOUND) {
      return '이 사진은 올릴 수 없어요. 다시 찍거나 골라 주세요.'
    }
  }
  return '올리지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.'
}

const mediaStatusText = ({ status, progress, mediaType }: EntryMediaState): string => {
  const noun = mediaType === 'VIDEO' ? '영상' : '사진'
  if (status === 'processing') return mediaType === 'VIDEO' ? `영상 다듬는 중 ${progress}%` : '사진을 줄이는 중…'
  if (status === 'uploading') return `${noun} 올리는 중 ${progress}%`
  if (status === 'done') return `${noun} 준비 완료`
  return ''
}

const CloseButton = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="닫기"
    className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
  >
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  </button>
)

// 기록하기. 먼저 셋로그처럼 화면 안 카메라로 찍고(앨범도 가능), 찍은 걸 목록과 같은 카드로 보며 감사제목을 쓴다
export const WriteSheet = ({ now, onClose, onPosted }: WriteSheetProps) => {
  const media = useEntryMedia()
  const [step, setStep] = useState<'capture' | 'compose'>('capture')
  const [captureMode, setCaptureMode] = useState<CaptureMode>('PHOTO')
  const [content, setContent] = useState('')
  const [isPreviewMuted, setIsPreviewMuted] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const albumInput = useRef<HTMLInputElement>(null)
  const nativePhotoInput = useRef<HTMLInputElement>(null)
  const nativeVideoInput = useRef<HTMLInputElement>(null)

  // 칸은 쓰는 사이에도 바뀔 수 있어서 지금 시각으로 다시 계산한다. 실제로 어느 칸에 들어갈지는 서버가 정한다
  const slot = getCurrentSlot(now)
  const today = getMissionDate(now)
  const slotLabel = slot ? getSlotInfo(slot).label : ''
  const title = slot ? `${slotLabel} 감사 남기기` : '감사 남기기'
  const subtitle = slot ? `${formatSlotDeadline(today, slot)}까지 올릴 수 있어요` : '아침 감사는 06:00부터 올릴 수 있어요'
  const hasDraft = media.status !== 'idle' || content.trim().length > 0

  const handleClose = () => {
    if (hasDraft && !isSubmitting && !window.confirm('쓰던 감사를 지우고 닫을까요?')) return
    onClose()
  }

  // 뒤에 있는 목록이 같이 스크롤되지 않게 막는다
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const pickMedia = (blob: Blob, source: MediaSource) => {
    void media.select(blob, source)
    setIsPreviewMuted(true)
    setStep('compose')
  }

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // 같은 파일을 다시 골라도 onChange가 오도록 비운다
    event.target.value = ''
    if (file) pickMedia(file, 'album')
  }

  const retake = () => {
    media.reset()
    setSubmitError(null)
    setStep('capture')
  }

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed || media.status !== 'done' || media.fileId === null) return

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const entry = await createThanksEntry({ content: trimmed, fileId: media.fileId })
      onPosted(entry)
    } catch (error) {
      setSubmitError(toSubmitError(error))
      setIsSubmitting(false)
    }
  }

  const canSubmit = slot !== null && media.status === 'done' && content.trim().length > 0 && !isSubmitting
  const isWorking = media.status === 'processing' || media.status === 'uploading'

  return (
    <div role="dialog" aria-modal="true" aria-label="감사 기록하기" className="fixed inset-0 z-50 overflow-y-auto bg-[#141414] text-white">
      {/* 앨범은 사진과 영상을 둘 다 고를 수 있다. 화면 안 카메라를 못 쓰면 휴대폰 기본 카메라를 연다 */}
      <input ref={albumInput} type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" data-testid="album-input" />
      <input ref={nativePhotoInput} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      <input ref={nativeVideoInput} type="file" accept="video/*" capture="environment" onChange={handleFile} className="hidden" />

      {step === 'capture' ? (
        <div className="mx-auto flex min-h-full max-w-md flex-col px-4 pt-3">
          <CameraView
            title={title}
            subtitle={subtitle}
            slotLabel={slotLabel}
            mode={captureMode}
            onModeChange={setCaptureMode}
            onCapture={(blob) => pickMedia(blob, 'camera')}
            onPickAlbum={() => albumInput.current?.click()}
            onNativePhoto={() => nativePhotoInput.current?.click()}
            onNativeVideo={() => nativeVideoInput.current?.click()}
            onClose={handleClose}
          />
        </div>
      ) : (
        <>
          <div className="mx-auto max-w-md px-4 pb-32 pt-3">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[18px] font-extrabold">{title}</p>
                <p className="text-[13px] text-white/55">{subtitle}</p>
              </div>
              <CloseButton onClick={handleClose} />
            </div>

            <div className="mt-5">
              {media.previewUrl && media.mediaType && (
                <EntryCardFace
                  media={{ url: media.previewUrl, type: media.mediaType }}
                  muted={isPreviewMuted}
                  slotLabel={slotLabel}
                  time={formatKstTime(now)}
                  content={content.trim()}
                  placeholder="감사제목이 여기에 보여요"
                >
                  {media.mediaType === 'VIDEO' && (
                    <button
                      type="button"
                      onClick={() => setIsPreviewMuted((muted) => !muted)}
                      className="absolute bottom-3 right-3 rounded-full bg-black/55 px-3 py-1.5 text-[12px] font-semibold"
                    >
                      {isPreviewMuted ? '🔇 눌러서 소리 듣기' : '🔊 소리 끄기'}
                    </button>
                  )}
                  {isWorking && (
                    <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/30" aria-hidden="true">
                      <div className="h-full bg-white transition-[width]" style={{ width: `${Math.max(media.progress, 8)}%` }} />
                    </div>
                  )}
                </EntryCardFace>
              )}
            </div>

            <div className="mt-3 flex min-h-[28px] items-center justify-between gap-3 text-[13px]">
              <p role="status" className={media.error ? 'text-[#FF8A80]' : 'text-white/55'}>
                {media.error ?? mediaStatusText(media)}
              </p>
              <div className="flex shrink-0 gap-2">
                {media.status === 'error' && (
                  <button type="button" onClick={media.retry} className="rounded-full bg-white px-3 py-1 font-bold text-[#141414]">
                    다시 올리기
                  </button>
                )}
                <button type="button" onClick={retake} className="rounded-full bg-white/10 px-3 py-1 font-semibold">
                  다시 찍기
                </button>
                <button type="button" onClick={() => albumInput.current?.click()} className="rounded-full bg-white/10 px-3 py-1 font-semibold">
                  앨범
                </button>
              </div>
            </div>

            <label className="mt-4 block">
              <span className="sr-only">감사제목</span>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={CONTENT_MAX_LENGTH}
                rows={3}
                placeholder={slot ? `${slotLabel}에 어떤 일이 감사했나요?` : '어떤 일이 감사했나요?'}
                className="w-full resize-none rounded-2xl bg-white/10 p-4 text-[16px] leading-relaxed text-white placeholder:text-white/40 outline-none focus:ring-2 focus:ring-white/40"
              />
            </label>
            <p className="mt-1 text-right text-[12px] text-white/45">
              {content.length}/{CONTENT_MAX_LENGTH} · 카드에는 앞부분만, 누르면 전부 보여요
            </p>

            {submitError && (
              <p role="alert" className="mt-3 rounded-2xl bg-[#FF8A80]/15 px-4 py-3 text-[14px] text-[#FFB4AB]">
                {submitError}
              </p>
            )}
          </div>

          <div className="fixed inset-x-0 bottom-0 bg-[#141414]/95 px-4 pb-[calc(16px+env(safe-area-inset-bottom))] pt-3">
            <div className="mx-auto max-w-md">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full rounded-full bg-white py-4 text-[16px] font-bold text-[#141414] transition-transform active:scale-[0.98] disabled:opacity-35"
              >
                {isSubmitting ? '올리는 중…' : '감사 올리기'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
