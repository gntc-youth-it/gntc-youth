import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '../../../shared/ui'
import { useChurchInfo } from '../../../entities/church'
import type { PrayerTopicResponse } from '../../../entities/church'
import { CDN_BASE_URL } from '../../../shared/config'
import type { SanctuaryFormData } from '../model/types'

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm']

const detectMediaType = (url: string): 'video' | 'image' => {
  const pathname = url.split('?')[0].toLowerCase()
  return VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext)) ? 'video' : 'image'
}

interface EditSanctuaryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  churchId: string
  churchName: string
}

const MAX_PRAYERS = 5

export const EditSanctuaryModal = ({
  open,
  onOpenChange,
  churchId,
  churchName,
}: EditSanctuaryModalProps) => {
  const { churchInfo } = useChurchInfo(churchId)
  const [formData, setFormData] = useState<SanctuaryFormData>({
    prayers: [],
    media: '',
    mediaType: 'image',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && churchInfo) {
      const mediaUrl = churchInfo.groupPhotoPath
        ? `${CDN_BASE_URL}${churchInfo.groupPhotoPath}`
        : ''
      setFormData({
        prayers: churchInfo.prayerTopics
          .sort((a: PrayerTopicResponse, b: PrayerTopicResponse) => a.sortOrder - b.sortOrder)
          .map((t: PrayerTopicResponse) => t.content),
        media: mediaUrl,
        mediaType: mediaUrl ? detectMediaType(mediaUrl) : 'image',
      })
      setError(null)
    }
  }, [open, churchInfo])

  const handlePrayerChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      prayers: prev.prayers.map((prayer, i) => (i === index ? value : prayer)),
    }))
  }

  const handleAddPrayer = () => {
    if (formData.prayers.length >= MAX_PRAYERS) return
    setFormData((prev) => ({
      ...prev,
      prayers: [...prev.prayers, ''],
    }))
  }

  const handleRemovePrayer = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      prayers: prev.prayers.filter((_, i) => i !== index),
    }))
  }

  const handleSave = async () => {
    const nonEmptyPrayers = formData.prayers.filter((p) => p.trim())
    if (nonEmptyPrayers.length === 0) {
      setError('기도제목을 최소 1개 이상 입력해주세요.')
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      // TODO: API 연동
      console.log('Save sanctuary data:', { churchId, ...formData, prayers: nonEmptyPrayers })
      onOpenChange(false)
    } catch (err) {
      console.error('성전 정보 저장에 실패했습니다:', err)
      setError('성전 정보 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isVideo = file.type.startsWith('video/')
    const previewUrl = URL.createObjectURL(file)
    setFormData((prev) => ({
      ...prev,
      media: previewUrl,
      mediaType: isVideo ? 'video' : 'image',
    }))
  }

  const handleCancel = () => {
    setError(null)
    onOpenChange(false)
  }

  if (!churchId) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] p-0 gap-0 flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col gap-2 px-10 pt-10 pb-8">
          <DialogTitle className="text-[28px] font-bold text-[#1A1A1A]">
            성전 정보 수정
          </DialogTitle>
          <DialogDescription className="text-sm text-[#666666]">
            성전 사진과 기도제목을 수정할 수 있습니다
          </DialogDescription>
        </div>

        {/* Error */}
        {error && (
          <div className="px-10">
            <p className="text-sm text-red-500 bg-red-50 px-4 py-3 rounded-lg mb-4">
              {error}
            </p>
          </div>
        )}

        {/* Main Content - Two Columns */}
        <div className="flex gap-8 px-10 pb-10">
          {/* Left Section - Media */}
          <div className="flex flex-col gap-6 w-[420px] flex-shrink-0">
            {/* Media Section */}
            <div className="flex flex-col gap-4 bg-[#F8F9FA] rounded-xl p-6">
              <h3 className="text-base font-semibold text-[#333333]">
                성전 사진/영상
              </h3>

              {/* Current Media */}
              <div className="flex flex-col gap-3">
                <span className="text-sm text-[#666666]">현재 파일</span>
                <div className="w-full h-[200px] bg-[#E5E7EB] rounded-lg flex items-center justify-center overflow-hidden">
                  {formData.media ? (
                    formData.mediaType === 'video' ? (
                      <video
                        src={formData.media}
                        className="w-full h-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={formData.media}
                        alt="성전 미디어"
                        className="w-full h-full object-cover"
                      />
                    )
                  ) : (
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#9CA3AF"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Upload Button */}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,video/mp4,video/quicktime"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="w-full h-11 flex items-center justify-center gap-2 bg-white border border-[#3B5BDB] rounded-md text-sm font-medium text-[#3B5BDB] hover:bg-blue-50 transition-colors"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  새 파일 업로드
                </button>
                <p className="text-xs text-[#9CA3AF] text-center">
                  이미지 (JPG, PNG) 또는 동영상 (MP4, MOV) 파일만 업로드 가능
                </p>
              </div>
            </div>

            {/* Info Section */}
            <div className="flex flex-col gap-4 bg-[#FFF7ED] rounded-xl p-6">
              <div className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#EA580C"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4" />
                  <path d="M12 8h.01" />
                </svg>
                <span className="text-sm font-semibold text-[#EA580C]">
                  업로드 시 주의사항
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs text-[#92400E] leading-relaxed">
                  • 업로드한 파일은 모든 청년부원이 볼 수 있습니다
                </p>
                <p className="text-xs text-[#92400E] leading-relaxed">
                  • 성전 관련 사진/영상만 업로드해주세요
                </p>
                <p className="text-xs text-[#92400E] leading-relaxed">
                  • 파일 크기는 최대 100MB까지 가능합니다
                </p>
              </div>
            </div>
          </div>

          {/* Right Section - Prayers */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col gap-4 bg-[#F8F9FA] rounded-xl p-6 h-full">
              {/* Prayer Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#333333]">
                  기도제목
                </h3>
                <button
                  type="button"
                  onClick={handleAddPrayer}
                  disabled={formData.prayers.length >= MAX_PRAYERS}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#3B5BDB] text-white text-[13px] font-medium rounded-md hover:bg-[#364FC7] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  추가
                </button>
              </div>

              {/* Prayer Items */}
              <div className="flex flex-col gap-3">
                {formData.prayers.map((prayer, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 bg-white rounded-md p-3"
                  >
                    <span className="text-sm font-medium text-[#3B5BDB] flex-shrink-0">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={prayer}
                      onChange={(e) => handlePrayerChange(index, e.target.value)}
                      placeholder="기도제목을 입력하세요"
                      className="flex-1 h-10 px-3 bg-[#F8F9FA] rounded-md text-sm text-[#333333] outline-none focus:ring-2 focus:ring-[#3B5BDB] focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePrayer(index)}
                      className="flex-shrink-0 p-2 text-[#DC2626] hover:bg-red-50 rounded transition-colors"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                ))}

                <p className="text-xs text-[#9CA3AF] text-center mt-1">
                  최대 {MAX_PRAYERS}개까지 추가할 수 있습니다
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 px-10 py-8 border-t border-[#E0E0E0]">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="px-6 py-3 text-sm font-semibold text-[#666666] bg-white border border-[#E0E0E0] rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-3 text-sm font-semibold text-white bg-[#3B5BDB] rounded-md hover:bg-[#364FC7] transition-colors disabled:opacity-50"
          >
            {isSaving ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
