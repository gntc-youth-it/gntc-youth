import { apiRequest } from '../../../../shared/api'

export interface AdminUserResponse {
  name: string
  churchName: string | null
  generation: number | null
  phoneNumber: string | null
  role: string
}

interface AdminUserListResponse {
  users: AdminUserResponse[]
}

export const getAdminUsers = async (): Promise<AdminUserResponse[]> => {
  const response = await apiRequest<AdminUserListResponse>('/admin/users')
  return response.users
}
