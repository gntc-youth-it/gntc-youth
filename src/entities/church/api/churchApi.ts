import { apiRequest } from '../../../shared/api'

export interface ChurchItem {
  code: string
  name: string
}

interface ChurchListResponse {
  churches: ChurchItem[]
}

export const getChurches = async (): Promise<ChurchItem[]> => {
  const response = await apiRequest<ChurchListResponse>('/churches')
  return response.churches
}
