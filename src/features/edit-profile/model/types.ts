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
