import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../features/auth'
import { EditProfileModal, ProfileCompletionModal } from '../../../features/edit-profile'

export const Header = () => {
  const navigate = useNavigate()
  const { user, isLoggedIn, logout, refreshUser } = useAuth()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // 로그인 상태에서 교회 정보가 없으면 프로필 완성 모달 표시
  useEffect(() => {
    if (isLoggedIn && user && !user.churchId) {
      const dismissed = sessionStorage.getItem('profileCompletionDismissed')
      if (!dismissed) {
        setIsCompletionModalOpen(true)
      }
    }
  }, [isLoggedIn, user])

  const handleProfileSaveSuccess = async () => {
    try {
      await refreshUser()
    } catch {
      console.error('토큰 갱신에 실패했습니다.')
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  const handleNavClick = () => {
    closeSidebar()
  }

  const handleLogin = () => {
    closeSidebar()
    navigate('/login')
  }

  const handleLogout = async () => {
    await logout()
    closeSidebar()
    setIsMenuOpen(false)
  }

  const handleEditProfile = () => {
    setIsMenuOpen(false)
    closeSidebar()
    setIsProfileModalOpen(true)
  }

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isMenuOpen])

  useEffect(() => {
    if (isSidebarOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
    } else {
      const scrollY = document.body.style.top
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      document.body.style.overflow = ''
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1)
      }
    }
  }, [isSidebarOpen])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white md:bg-white/95 md:backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href="#home"
            onClick={scrollToTop}
            className="flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors"
          >
            <img
              src="https://cdn.gntc-youth.com/assets/gntc-youth-logo-black.webp"
              alt="GNTC Youth 로고"
              className="h-8 w-auto"
            />
            <h1 className="text-lg font-bold tracking-tight">GNTC YOUTH</h1>
          </a>

          {/* Hamburger Button (Mobile) */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={toggleSidebar}
            aria-label="메뉴 열기"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span
                className={`block h-0.5 w-full bg-gray-900 transition-all duration-300 ${
                  isSidebarOpen ? 'rotate-45 translate-y-2' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-gray-900 transition-all duration-300 ${
                  isSidebarOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`block h-0.5 w-full bg-gray-900 transition-all duration-300 ${
                  isSidebarOpen ? '-rotate-45 -translate-y-2' : ''
                }`}
              />
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <ul className="flex items-center gap-6">
              <li>
                <a href="#home" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  홈
                </a>
              </li>
              <li>
                <a href="#about" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  소개
                </a>
              </li>
              <li>
                <a href="#schedule" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  일정
                </a>
              </li>
              <li>
                <a href="#gallery" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  갤러리
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  연락처
                </a>
              </li>
            </ul>

            {/* Auth Section */}
            <div className="flex items-center gap-4 pl-6 border-l border-gray-200">
              {isLoggedIn && user ? (
                <div className="relative flex items-center gap-2" ref={menuRef}>
                  <span className="text-sm text-gray-600">{user.name}님 환영합니다</span>
                  <button
                    onClick={() => setIsMenuOpen((prev) => !prev)}
                    className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                    aria-label="사용자 메뉴"
                    data-testid="kebab-menu-button"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="3" r="1.5" fill="#666" />
                      <circle cx="8" cy="8" r="1.5" fill="#666" />
                      <circle cx="8" cy="13" r="1.5" fill="#666" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                      data-testid="user-dropdown-menu"
                    >
                      <button
                        onClick={handleEditProfile}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        내 정보 수정
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  로그인
                </button>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Sidebar Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 md:hidden ${
          isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
      />

      {/* Mobile Sidebar */}
      <nav
        className={`fixed top-0 right-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:hidden ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">메뉴</h2>
        </div>

        {/* Mobile Auth Section */}
        <div className="p-6 border-b border-gray-200">
          {isLoggedIn && user ? (
            <div className="space-y-3">
              <div>
                <span className="block text-sm font-medium text-gray-900">{user.name}님</span>
                <span className="text-sm text-gray-500">환영합니다</span>
              </div>
              <button
                onClick={handleEditProfile}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                내 정보 수정
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              로그인
            </button>
          )}
        </div>

        <ul className="p-6 space-y-4">
          <li>
            <a
              href="#home"
              onClick={handleNavClick}
              className="block text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              홈
            </a>
          </li>
          <li>
            <a
              href="#about"
              onClick={handleNavClick}
              className="block text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              소개
            </a>
          </li>
          <li>
            <a
              href="#schedule"
              onClick={handleNavClick}
              className="block text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              일정
            </a>
          </li>
          <li>
            <a
              href="#gallery"
              onClick={handleNavClick}
              className="block text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              갤러리
            </a>
          </li>
          <li>
            <a
              href="#contact"
              onClick={handleNavClick}
              className="block text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              연락처
            </a>
          </li>
        </ul>
      </nav>

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        open={isCompletionModalOpen}
        onOpenChange={setIsCompletionModalOpen}
        onConfirm={() => setIsProfileModalOpen(true)}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        open={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
        onSaveSuccess={handleProfileSaveSuccess}
      />
    </header>
  )
}
