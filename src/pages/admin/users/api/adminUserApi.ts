import { apiRequest } from '../../../../shared/api'

export interface AdminUserResponse {
  name: string
  churchName: string | null
  generation: number | null
  phoneNumber: string | null
  role: string
}

export interface AdminUserListResponse {
  users: AdminUserResponse[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

interface GetAdminUsersParams {
  page: number
  size: number
  name?: string
}

export const getAdminUsers = async (params: GetAdminUsersParams): Promise<AdminUserListResponse> => {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    size: String(params.size),
  })
  if (params.name) {
    searchParams.set('name', params.name)
  }
  return apiRequest<AdminUserListResponse>(`/admin/users?${searchParams.toString()}`)
}
