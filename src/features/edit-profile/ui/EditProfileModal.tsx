import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  ProfileImage,
} from '../../../shared/ui'
import { GenderSelector } from './GenderSelector'
import { getMyProfile, saveProfile, getChurches } from '../api'
import { getFilePresignedUrl } from '../../../shared/api'
import { compressImage, uploadToS3, buildCdnUrl } from '../../../shared/lib'
import { IMAGE_COMPRESSION_OPTIONS } from '../../../shared/config'
import type { ProfileFormData, UserProfileRequest, ChurchResponse } from '../model/types'

interface EditProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveSuccess?: () => void
}

const initialFormData: ProfileFormData = {
  name: '',
  churchId: '',
  generation: '',
  phoneNumber: '',
  gender: null,
  profileImageId: null,
  profileImagePreview: null,
}

const inputClassName =
  'w-full h-11 px-4 border border-gray-200 rounded-md bg-white text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'

const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

type SaveStage = 'idle' | 'compressing' | 'uploading' | 'saving'

export const EditProfileModal = ({ open, onOpenChange, onSaveSuccess }: EditProfileModalProps) => {
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData)
  const [churches, setChurches] = useState<ChurchResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [saveStage, setSaveStage] = useState<SaveStage>('idle')
  const [error, setError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isSaving = saveStage !== 'idle'

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [profile, churchList] = await Promise.all([
        getMyProfile(),
        getChurches(),
      ])
      setChurches(churchList.churches)
      setFormData({
        name: profile.name || '',
        churchId: profile.churchId || '',
        generation: profile.generation != null ? String(profile.generation) : '',
        phoneNumber: formatPhoneNumber(profile.phoneNumber || ''),
        gender: (profile.gender === 'MALE' || profile.gender === 'FEMALE') ? profile.gender : null,
        profileImageId: profile.profileImageId,
        profileImagePreview: profile.profileImagePath ? buildCdnUrl(profile.profileImagePath) : null,
      })
      setSelectedFile(null)
    } catch (error) {
      console.error('프로필 정보를 불러오는데 실패했습니다:', error)
      setError('프로필 정보를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      fetchProfile()
    }
  }, [open, fetchProfile])

  // blob URL 메모리 누수 방지
  useEffect(() => {
    const currentPreviewUrl = formData.profileImagePreview
    if (currentPreviewUrl && currentPreviewUrl.startsWith('blob:')) {
      return () => {
        URL.revokeObjectURL(currentPreviewUrl)
      }
    }
  }, [formData.profileImagePreview])

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setSelectedFile(file)
    setFormData((prev) => ({
      ...prev,
      profileImagePreview: previewUrl,
    }))
    setError(null)

    event.target.value = ''
  }

  const handleSave = async () => {
    const validations: Record<string, unknown> = {
      '이름': formData.name.trim(),
      '성전': formData.churchId,
      '기수': formData.generation,
      '성별': formData.gender,
    }

    const missingFields = Object.entries(validations)
      .filter(([, value]) => !value)
      .map(([key]) => key)

    if (missingFields.length > 0) {
      setError(`필수 항목을 입력해주세요: ${missingFields.join(', ')}`)
      return
    }

    setError(null)
    let profileImageId = formData.profileImageId

    try {
      // 새 파일이 선택된 경우 압축 + 업로드
      if (selectedFile) {
        setSaveStage('compressing')
        const compressed = await compressImage(selectedFile, IMAGE_COMPRESSION_OPTIONS)

        setSaveStage('uploading')
        const ext = compressed.blob.type.split('/')[1] || 'webp'
        const filename = selectedFile.name.replace(/\.[^/.]+$/, '') + `.${ext}`
        const { fileId, presignedUrl } = await getFilePresignedUrl(
          filename,
          compressed.blob.type,
          compressed.blob.size
        )

        await uploadToS3(presignedUrl, compressed.blob, compressed.blob.type)
        profileImageId = fileId
      }

      setSaveStage('saving')
      const request: UserProfileRequest = {
        name: formData.name,
        churchId: formData.churchId || null,
        generation: formData.generation ? Number(formData.generation) : null,
        phoneNumber: formData.phoneNumber ? formData.phoneNumber.replace(/\D/g, '') : null,
        gender: formData.gender,
        profileImageId,
      }
      await saveProfile(request)
      onSaveSuccess?.()
      onOpenChange(false)
    } catch (error) {
      console.error('프로필 저장에 실패했습니다:', error)
      setError('프로필 저장에 실패했습니다.')
    } finally {
      setSaveStage('idle')
    }
  }

  const handleCancel = () => {
    setFormData(initialFormData)
    setSelectedFile(null)
    setError(null)
    onOpenChange(false)
  }

  const getSaveButtonText = () => {
    switch (saveStage) {
      case 'compressing':
        return '이미지 압축 중...'
      case 'uploading':
        return '업로드 중...'
      case 'saving':
        return '저장 중...'
      default:
        return '저장하기'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] p-10 gap-8 flex flex-col">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <DialogTitle className="text-[28px] font-bold text-gray-900">
            내 정보 수정
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            GNTC-YOUTH 회원 정보를 수정할 수 있습니다
          </DialogDescription>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            불러오는 중...
          </div>
        ) : (
          <>
            {/* Error */}
            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-md">
                {error}
              </p>
            )}

            {/* Profile Image */}
            <div className="flex flex-col items-center gap-3">
              <ProfileImage
                src={formData.profileImagePreview}
                alt="프로필 이미지"
                size={80}
                fallbackTestId="profile-image-fallback"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                data-testid="profile-image-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSaving}
                className="text-sm font-medium text-[#3B5BDB] hover:text-[#364FC7] transition-colors disabled:opacity-50"
              >
                프로필 사진 변경
              </button>
            </div>

            {/* Form */}
            <div className="flex flex-col gap-6 bg-gray-50 rounded-xl p-8">
              {/* 이름 */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="이름을 입력하세요"
                  className={inputClassName}
                />
              </div>

              {/* 성전 */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  성전 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.churchId}
                  onChange={(e) => handleChange('churchId', e.target.value)}
                  className={inputClassName}
                >
                  <option value="">성전을 선택하세요</option>
                  {churches.map((church) => (
                    <option key={church.code} value={church.code}>
                      {church.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 기수 */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  기수 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.generation}
                  onChange={(e) => handleChange('generation', e.target.value)}
                  placeholder="기수를 입력하세요"
                  className={inputClassName}
                />
              </div>

              {/* 전화번호 */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">전화번호</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleChange('phoneNumber', formatPhoneNumber(e.target.value))}
                  placeholder="010-0000-0000"
                  className={inputClassName}
                />
              </div>

              {/* 성별 */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  성별 <span className="text-red-500">*</span>
                </label>
                <GenderSelector
                  value={formData.gender}
                  onChange={(gender) =>
                    setFormData((prev) => ({ ...prev, gender }))
                  }
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="px-6 py-3 text-sm font-semibold text-gray-500 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 text-sm font-semibold text-white bg-[#3B5BDB] rounded-md hover:bg-[#364FC7] transition-colors disabled:opacity-50"
              >
                {getSaveButtonText()}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
