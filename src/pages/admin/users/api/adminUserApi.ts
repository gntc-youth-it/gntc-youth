import { apiRequest } from '../../../../shared/api'

export interface AdminUserResponse {
  userId: number
  name: string
  churchId: string | null
  churchName: string | null
  generation: number | null
  phoneNumber: string | null
  role: string
}

export interface UserRoleUpdateResponse {
  userId: number
  name: string
  role: string
  churchName: string | null
  previousLeader: {
    id: number
    name: string
    role: string
  } | null
}

export interface ChurchLeaderResponse {
  churchId: string
  churchName: string
  leader: {
    id: number
    name: string
    email: string
  } | null
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

export const getChurchLeader = async (churchId: string): Promise<ChurchLeaderResponse> => {
  return apiRequest<ChurchLeaderResponse>(`/admin/churches/${churchId}/leader`)
}

export const updateUserRole = async (userId: number, role: string): Promise<UserRoleUpdateResponse> => {
  return apiRequest<UserRoleUpdateResponse>(`/admin/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  })
}
