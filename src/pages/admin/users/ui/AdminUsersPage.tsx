import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../../features/auth'
import { Header } from '../../../../widgets/header'
import { Footer } from '../../../../widgets/footer'
import { useAdminUsers } from '../model/useAdminUsers'

const ITEMS_PER_PAGE = 10

const getRoleBadge = (role: string) => {
  switch (role) {
    case 'MASTER':
      return { label: '관리자', className: 'bg-purple-100 text-purple-700' }
    case 'LEADER':
      return { label: '회장', className: 'bg-blue-100 text-blue-700' }
    default:
      return { label: '일반', className: 'bg-orange-50 text-orange-600' }
  }
}

export const AdminUsersPage = () => {
  const { user, isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const { users, isLoading, error } = useAdminUsers()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    return users.filter((u) => u.name.includes(searchQuery.trim()))
  }, [searchQuery, users])

  const totalItems = filteredUsers.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  // MASTER 권한 체크
  if (!isLoggedIn || user?.role !== 'MASTER') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-lg">접근 권한이 없습니다.</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">사용자 관리</h1>
            <p className="mt-1 text-sm text-gray-500">
              GNTC-YOUTH 회원 목록을 관리하고 권한을 설정합니다
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 mb-6">
          <label className="text-sm font-semibold text-gray-600 shrink-0">검색:</label>
          <div className="relative w-full max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="이름으로 검색..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full h-11 pl-10 pr-4 border border-gray-200 rounded-md bg-white text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="py-16 text-center text-sm text-red-500">
              사용자 목록을 불러오는데 실패했습니다.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left text-sm font-semibold text-gray-600 px-6 py-3.5 w-[120px]">성전</th>
                      <th className="text-left text-sm font-semibold text-gray-600 px-6 py-3.5 w-[120px]">이름</th>
                      <th className="text-left text-sm font-semibold text-gray-600 px-6 py-3.5 w-[80px]">기수</th>
                      <th className="text-left text-sm font-semibold text-gray-600 px-6 py-3.5 w-[160px]">전화번호</th>
                      <th className="text-center text-sm font-semibold text-gray-600 px-6 py-3.5 w-[120px]">권한</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedUsers.map((u, index) => {
                      const roleBadge = getRoleBadge(u.role)
                      return (
                        <tr key={`${u.name}-${index}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-900">{u.churchName ?? '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{u.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{u.generation ? `${u.generation}기` : '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{u.phoneNumber ?? '-'}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${roleBadge.className}`}>
                              {roleBadge.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                    {paginatedUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                          {searchQuery.trim() ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100">
                {paginatedUsers.map((u, index) => {
                  const roleBadge = getRoleBadge(u.role)
                  return (
                    <div key={`${u.name}-${index}`} className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{u.name}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleBadge.className}`}>
                          {roleBadge.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 space-y-0.5">
                        <p>{u.churchName ?? '-'} · {u.generation ? `${u.generation}기` : '-'}</p>
                        <p>{u.phoneNumber ?? '-'}</p>
                      </div>
                    </div>
                  )
                })}
                {paginatedUsers.length === 0 && (
                  <div className="p-8 text-center text-sm text-gray-400">
                    {searchQuery.trim() ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && !error && totalItems > 0 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-500">전체 {totalItems}명</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
