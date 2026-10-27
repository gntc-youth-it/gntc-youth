import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../features/auth'
import { HomePage } from '../pages/home'
import { LoginPage } from '../pages/login'
import { AuthCallbackPage } from '../pages/auth-callback'
import { AdminUsersPage } from '../pages/admin/users'
import { AdminPostsPage } from '../pages/admin/posts'
import { GalleryPage, GalleryWritePage } from '../pages/gallery'
import { SchedulePage } from '../pages/schedule'
import './styles/index.css'

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/gallery/write" element={<GalleryWritePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          {/* 동물원 나들이(2026-10-10)가 끝나 페이지를 지웠다. 카톡 등에 남은 예전 링크는 홈으로 보낸다 */}
          <Route path="/zoo/*" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/posts" element={<AdminPostsPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
