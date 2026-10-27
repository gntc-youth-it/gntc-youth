import { apiRequest } from '../../../shared/api'
import type { UserProfileResponse, UserProfileRequest, UserProfilePatchRequest, ChurchListResponse } from '../model/types'

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

// 보낸 것(이름, 프로필 사진)만 바꾼다. 성전·기수 등이 없는 사람도 쓸 수 있다
export const patchProfile = async (
  data: UserProfilePatchRequest
): Promise<UserProfileResponse> => {
  return apiRequest<UserProfileResponse>('/user/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}
