import { apiRequest } from '../../../shared/api'
import type { UserProfileResponse, UserProfileRequest } from '../model/types'

export const getMyProfile = async (): Promise<UserProfileResponse> => {
  return apiRequest<UserProfileResponse>('/user/profile')
}

export const saveProfile = async (
  data: UserProfileRequest
): Promise<UserProfileResponse> => {
  return apiRequest<UserProfileResponse>('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
