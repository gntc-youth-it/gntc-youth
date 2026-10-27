import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { HttpError } from '../../../shared/api'
import { createThanksEntry } from '../api/thanksApi'
import { formatKstTime, formatSlotDeadline, getCurrentSlot, getMissionDate, getSlotInfo } from '../model/slots'
import { CONTENT_MAX_LENGTH, THANKS_ERROR_CODE } from '../model/types'
import type { ThanksEntry } from '../model/types'
import { useEntryPhoto } from '../model/useEntryPhoto'
import type { EntryPhotoStatus } from '../model/useEntryPhoto'
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
      return '이 사진은 올릴 수 없어요. 사진을 다시 골라 주세요.'
    }
  }
  return '올리지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.'
}

const PHOTO_STATUS_TEXT: Record<EntryPhotoStatus, (progress: number) => string> = {
  idle: () => '',
  compressing: () => '사진을 줄이는 중…',
  uploading: (progress) => `사진 올리는 중 ${progress}%`,
  done: () => '사진 준비 완료',
  error: () => '',
}

const CameraIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

const AlbumIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
)

// 기록하기. 사진을 고르면 목록과 똑같은 카드로 미리 보여 주고, 감사제목을 쓰면 카드 가운데에 바로 겹친다
export const WriteSheet = ({ now, onClose, onPosted }: WriteSheetProps) => {
  const photo = useEntryPhoto()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const cameraInput = useRef<HTMLInputElement>(null)
  const albumInput = useRef<HTMLInputElement>(null)

  // 칸은 쓰는 사이에도 바뀔 수 있어서 지금 시각으로 다시 계산한다. 실제로 어느 칸에 들어갈지는 서버가 정한다
  const slot = getCurrentSlot(now)
  const today = getMissionDate(now)
  const hasDraft = photo.status !== 'idle' || content.trim().length > 0

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

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // 같은 사진을 다시 골라도 onChange가 오도록 비운다
    event.target.value = ''
    if (file) void photo.select(file)
  }

  const handleSubmit = async () => {
    const trimmed = content.trim()
    if (!trimmed || photo.status !== 'done' || photo.fileId === null) return

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const entry = await createThanksEntry({ content: trimmed, fileId: photo.fileId })
      onPosted(entry)
    } catch (error) {
      setSubmitError(toSubmitError(error))
      setIsSubmitting(false)
    }
  }

  const canSubmit = slot !== null && photo.status === 'done' && content.trim().length > 0 && !isSubmitting
  const isUploading = photo.status === 'compressing' || photo.status === 'uploading'

  return (
    <div role="dialog" aria-modal="true" aria-label="감사 기록하기" className="fixed inset-0 z-50 overflow-y-auto bg-[#141414] text-white">
      <div className="mx-auto max-w-md px-4 pb-32 pt-3">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[18px] font-extrabold">{slot ? `${getSlotInfo(slot).label} 감사 남기기` : '감사 남기기'}</p>
            <p className="text-[13px] text-white/55">
              {slot ? `${formatSlotDeadline(today, slot)}까지 올릴 수 있어요` : '아침 감사는 06:00부터 올릴 수 있어요'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="닫기"
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <input ref={cameraInput} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
        <input ref={albumInput} type="file" accept="image/*" onChange={handleFile} className="hidden" />

        <div className="mt-5">
          {photo.previewUrl ? (
            <EntryCardFace
              media={{ url: photo.previewUrl, type: 'IMAGE' }}
              slotLabel={slot ? getSlotInfo(slot).label : ''}
              time={formatKstTime(now)}
              content={content.trim()}
              placeholder="감사제목이 여기에 보여요"
            >
              {isUploading && (
                <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/30" aria-hidden="true">
                  <div className="h-full bg-white transition-[width]" style={{ width: `${Math.max(photo.progress, 8)}%` }} />
                </div>
              )}
            </EntryCardFace>
          ) : (
            <div className="grid aspect-[16/10] w-full place-items-center rounded-[22px] border-2 border-dashed border-white/25">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => cameraInput.current?.click()}
                  className="flex flex-col items-center gap-1.5 rounded-2xl bg-white px-5 py-3.5 text-[14px] font-bold text-[#141414]"
                >
                  <CameraIcon />
                  사진 찍기
                </button>
                <button
                  type="button"
                  onClick={() => albumInput.current?.click()}
                  className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/10 px-5 py-3.5 text-[14px] font-bold"
                >
                  <AlbumIcon />
                  앨범에서 고르기
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex min-h-[28px] items-center justify-between gap-3 text-[13px]">
          <p role="status" className={photo.error ? 'text-[#FF8A80]' : 'text-white/55'}>
            {photo.error ?? PHOTO_STATUS_TEXT[photo.status](photo.progress)}
          </p>
          {photo.previewUrl && (
            <div className="flex shrink-0 gap-2">
              {photo.status === 'error' && (
                <button type="button" onClick={photo.retry} className="rounded-full bg-white px-3 py-1 font-bold text-[#141414]">
                  다시 올리기
                </button>
              )}
              <button type="button" onClick={() => cameraInput.current?.click()} className="rounded-full bg-white/10 px-3 py-1 font-semibold">
                다시 찍기
              </button>
              <button type="button" onClick={() => albumInput.current?.click()} className="rounded-full bg-white/10 px-3 py-1 font-semibold">
                앨범
              </button>
            </div>
          )}
        </div>

        <label className="mt-4 block">
          <span className="sr-only">감사제목</span>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={CONTENT_MAX_LENGTH}
            rows={3}
            placeholder={slot ? `${getSlotInfo(slot).label}에 어떤 일이 감사했나요?` : '어떤 일이 감사했나요?'}
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
    </div>
  )
}
