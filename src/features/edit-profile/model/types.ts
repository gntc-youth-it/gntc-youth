export interface UserProfileResponse {
  name: string
  churchId: string | null
  churchName: string | null
  generation: number | null
  phoneNumber: string | null
  gender: string | null
  genderDisplay: string | null
}

export interface UserProfileRequest {
  name: string
  churchId: string | null
  generation: number | null
  phoneNumber: string | null
  gender: string | null
}

export interface ProfileFormData {
  name: string
  churchId: string
  generation: string
  phoneNumber: string
  gender: 'MALE' | 'FEMALE' | null
}
