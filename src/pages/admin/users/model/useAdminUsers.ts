import { useState, useEffect } from 'react'
import { type AdminUserListResponse, getAdminUsers } from '../api/adminUserApi'

const EMPTY_RESPONSE: AdminUserListResponse = {
  users: [],
  totalElements: 0,
  totalPages: 0,
  page: 0,
  size: 10,
}

interface UseAdminUsersParams {
  page: number
  size: number
  name?: string
}

export const useAdminUsers = ({ page, size, name }: UseAdminUsersParams) => {
  const [data, setData] = useState<AdminUserListResponse>(EMPTY_RESPONSE)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    const fetchUsers = async () => {
      try {
        const response = await getAdminUsers({ page, size, name: name || undefined })
        if (!cancelled) {
          setData(response)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchUsers()

    return () => {
      cancelled = true
    }
  }, [page, size, name, refreshKey])

  const refetch = () => setRefreshKey((k) => k + 1)

  return { data, isLoading, error, refetch }
}
