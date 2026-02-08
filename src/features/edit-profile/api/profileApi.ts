import { apiRequest } from '../../../shared/api'
import type { UserProfileResponse, UserProfileRequest, ChurchListResponse } from '../model/types'

export const getMyProfile = async (): Promise<UserProfileResponse> => {
  return apiRequest<UserProfileResponse>('/user/profile')
}

export const getChurches = async (): Promise<ChurchListResponse> => {
  return apiRequest<ChurchListResponse>('/churches')
}

export const saveProfile = async (
  data: UserProfileRequest
): Promise<UserProfileResponse> => {
  return apiRequest<UserProfileResponse>('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}
