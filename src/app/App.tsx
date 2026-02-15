import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../features/auth'
import { HomePage } from '../pages/home'
import { LoginPage } from '../pages/login'
import { AuthCallbackPage } from '../pages/auth-callback'
import { AdminUsersPage } from '../pages/admin/users'
import { GalleryPage } from '../pages/gallery'
import './styles/index.css'

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/gallery" element={<GalleryPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
