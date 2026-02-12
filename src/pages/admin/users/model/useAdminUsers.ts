import { useState, useEffect } from 'react'
import { type AdminUserResponse, getAdminUsers } from '../api/adminUserApi'

export const useAdminUsers = () => {
  const [users, setUsers] = useState<AdminUserResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchUsers = async () => {
      try {
        const data = await getAdminUsers()
        if (!cancelled) {
          setUsers(data)
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
  }, [])

  return { users, isLoading, error }
}
