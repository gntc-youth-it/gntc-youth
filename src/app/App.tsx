import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../features/auth'
import { HomePage } from '../pages/home'
import { LoginPage } from '../pages/login'
import { AuthCallbackPage } from '../pages/auth-callback'
import './styles/index.css'

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
