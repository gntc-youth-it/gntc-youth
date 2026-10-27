import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react'
import { HttpError } from '../../../shared/api'
import { patchProfile, PROFILE_ERROR_CODE } from '../../../features/edit-profile'
import type { UserProfilePatchRequest, UserProfileResponse } from '../../../features/edit-profile'
import { THANKS_ERROR_CODE } from '../model/types'
import { useProfilePhoto } from '../model/useProfilePhoto'
import { toMediaSrc } from '../lib/mediaSrc'
import { Avatar } from './Avatar'

export const NAME_MAX_LENGTH = 20

interface ProfileSheetProps {
  // prompt: 사진이 없어서 처음 들어왔을 때 띄운 것 / edit: 오른쪽 위 내 사진 버튼으로 연 것
  mode: 'prompt' | 'edit'
  user: { id: number; name: string; profileImagePath?: string }
  onLater: () => void
  onSaved: (profile: UserProfileResponse) => void
}

const toSaveError = (error: unknown): string => {
  if (error instanceof HttpError) {
    if (error.code === PROFILE_ERROR_CODE.IMAGE_NOT_ATTACHABLE || error.code === THANKS_ERROR_CODE.FILE_NOT_FOUND) {
      return '이 사진은 프로필로 쓸 수 없어요. 다른 사진을 골라 주세요.'
    }
    if (error.code === 1001) return `이름을 1~${NAME_MAX_LENGTH}자로 적어 주세요.`
  }
  return '저장하지 못했어요. 잠시 후 다시 해 주세요.'
}

const CameraIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
)

// 다른 청년들이 알아볼 수 있게 프로필 사진과 이름을 정한다. 보낸 것만 바뀐다(PATCH)
export const ProfileSheet = ({ mode, user, onLater, onSaved }: ProfileSheetProps) => {
  const photo = useProfilePhoto()
  const [name, setName] = useState(user.name)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  // 뒤에 있는 목록이 같이 스크롤되지 않게 막고, Esc로 닫는다
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onLater()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onLater])

  const trimmedName = name.trim()
  const nameChanged = trimmedName !== user.name
  const hasNewPhoto = photo.status === 'done' && photo.fileId !== null
  const isNameValid = trimmedName.length > 0 && trimmedName.length <= NAME_MAX_LENGTH
  const canSave = isNameValid && (nameChanged || hasNewPhoto) && photo.status !== 'uploading' && !isSaving

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // 같은 사진을 다시 골라도 onChange가 오도록 비운다
    event.target.value = ''
    if (file) void photo.select(file)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSave) return

    const request: UserProfilePatchRequest = {}
    if (nameChanged) request.name = trimmedName
    if (hasNewPhoto && photo.fileId !== null) request.profileImageId = photo.fileId

    setIsSaving(true)
    setSaveError(null)
    try {
      onSaved(await patchProfile(request))
    } catch (error) {
      setSaveError(toSaveError(error))
      setIsSaving(false)
    }
  }

  const currentPhoto = photo.previewUrl ?? (user.profileImagePath ? toMediaSrc(user.profileImagePath) : null)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'prompt' ? '프로필 사진과 이름 정하기' : '내 프로필'}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 sm:items-center"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-t-[28px] bg-white px-6 pb-[calc(24px+env(safe-area-inset-bottom))] pt-7 text-[#191F28] sm:rounded-[28px]"
      >
        <h2 className="whitespace-pre-line break-keep text-center text-[19px] font-extrabold leading-snug">
          {mode === 'prompt' ? '다른 청년들이 알아볼 수 있게\n사진과 이름을 정해 주세요' : '내 프로필'}
        </h2>
        <p className="mt-1.5 text-center text-[14px] text-[#6B7684]">감사 카드에 이 사진과 이름이 나와요</p>

        <input ref={fileInput} type="file" accept="image/*" onChange={handleFile} className="hidden" data-testid="profile-photo-input" />
        <div className="mt-6 flex flex-col items-center">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            aria-label="프로필 사진 고르기"
            className="relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#191F28] focus-visible:ring-offset-2"
          >
            {currentPhoto ? (
              <img src={currentPhoto} alt="" className="h-[104px] w-[104px] rounded-full object-cover ring-4 ring-[#F2EFEA]" />
            ) : (
              <Avatar author={{ userId: user.id, name: trimmedName || user.name, profileImageUrl: null }} size={104} className="ring-4 ring-[#F2EFEA]" />
            )}
            <span className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-[#191F28] text-white ring-2 ring-white">
              <CameraIcon />
            </span>
            {photo.status === 'uploading' && (
              <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40 text-[12px] font-semibold text-white">
                올리는 중…
              </span>
            )}
          </button>
          <p role="status" className={`mt-2 min-h-[20px] text-[13px] ${photo.error ? 'text-[#E5484D]' : 'text-[#8B95A1]'}`}>
            {photo.error ?? (currentPhoto ? '사진을 누르면 바꿀 수 있어요' : '사진을 눌러 골라 주세요')}
          </p>
        </div>

        <label className="mt-4 block">
          <span className="text-[13px] font-semibold text-[#4E5968]">이름</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={NAME_MAX_LENGTH}
            placeholder="이름을 적어 주세요"
            className="mt-1.5 w-full rounded-2xl bg-[#F2F4F6] px-4 py-3.5 text-[16px] outline-none focus:ring-2 focus:ring-[#191F28]"
          />
        </label>

        {saveError && (
          <p role="alert" className="mt-3 rounded-2xl bg-[#FFF0F0] px-4 py-3 text-[14px] text-[#E5484D]">
            {saveError}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSave}
          className="mt-5 w-full rounded-full bg-[#191F28] py-4 text-[16px] font-bold text-white transition-transform active:scale-[0.98] disabled:opacity-35"
        >
          {isSaving ? '저장하는 중…' : '저장하기'}
        </button>
        <button type="button" onClick={onLater} className="mt-2 w-full py-3 text-[14px] font-semibold text-[#8B95A1]">
          {mode === 'prompt' ? '나중에 할게요' : '닫기'}
        </button>
      </form>
    </div>
  )
}
