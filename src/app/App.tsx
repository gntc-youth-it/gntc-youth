import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../features/auth'
import { HomePage } from '../pages/home'
import { LoginPage } from '../pages/login'
import { AuthCallbackPage } from '../pages/auth-callback'
import { AdminUsersPage } from '../pages/admin/users'
import { AdminPostsPage } from '../pages/admin/posts'
import { GalleryPage, GalleryWritePage } from '../pages/gallery'
import './styles/index.css'

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/gallery/write" element={<GalleryWritePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
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
