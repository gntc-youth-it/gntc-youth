export interface UserProfileResponse {
  name: string
  churchId: string | null
  churchName: string | null
  generation: number | null
  phoneNumber: string | null
  gender: string | null
  genderDisplay: string | null
  profileImageId: number | null
  profileImagePath: string | null
}

export interface UserProfileRequest {
  name: string
  churchId: string | null
  generation: number | null
  phoneNumber: string | null
  gender: string | null
  profileImageId: number | null
}

// PATCH /user/profile. 보낸 필드만 바꾼다
export interface UserProfilePatchRequest {
  name?: string
  profileImageId?: number
}

// 백엔드 ExceptionCode 중 화면에서 따로 안내하는 것
export const PROFILE_ERROR_CODE = {
  // 남이 올린 파일이거나 이미지가 아닌 파일
  IMAGE_NOT_ATTACHABLE: 1106,
} as const

export interface ChurchResponse {
  code: string
  name: string
}

export interface ChurchListResponse {
  churches: ChurchResponse[]
}

export interface ProfileFormData {
  name: string
  churchId: string
  generation: string
  phoneNumber: string
  gender: 'MALE' | 'FEMALE' | null
  profileImageId: number | null
  profileImagePreview: string | null
}
