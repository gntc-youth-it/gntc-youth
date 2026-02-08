import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '../../../shared/ui'
import { GenderSelector } from './GenderSelector'
import type { ProfileFormData } from '../model/types'

interface EditProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const initialFormData: ProfileFormData = {
  name: '',
  temple: '',
  generation: '',
  phone: '',
  gender: null,
}

const inputClassName =
  'w-full h-11 px-4 border border-gray-200 rounded-md bg-white text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'

export const EditProfileModal = ({ open, onOpenChange }: EditProfileModalProps) => {
  const [formData, setFormData] = useState<ProfileFormData>(initialFormData)

  const handleChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    console.log('프로필 저장 데이터:', formData)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setFormData(initialFormData)
    onOpenChange(false)
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
            <input
              type="text"
              value={formData.temple}
              onChange={(e) => handleChange('temple', e.target.value)}
              placeholder="성전을 입력하세요"
              className={inputClassName}
            />
          </div>

          {/* 기수 */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              기수 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
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
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
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
            className="px-6 py-3 text-sm font-semibold text-gray-500 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-8 py-3 text-sm font-semibold text-white bg-[#3B5BDB] rounded-md hover:bg-[#364FC7] transition-colors"
          >
            저장하기
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
