import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import OnboardingPage from './pages/OnboardingPage'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'
import ProfilePage from './pages/ProfilePage'
import SellerProfilePage from './pages/SellerProfilePage'
// import PremiumPage from './pages/PremiumPage'
import AnalyticsPage from './pages/AnalyticsPage'
import { ChatListPage, ChatWindowPage } from './pages/ChatPage'
import InstallPrompt from './components/InstallPrompt'
import NotificationSetup from './components/NotificationSetup'

function ProtectedRoute({ children }) {
  // const { user, loading, needsOnboarding } = useAuth()
  // const navigate = useNavigate()

  // useEffect(() => {
  //   if (!loading && needsOnboarding) navigate('/onboarding')
  // }, [loading, needsOnboarding])

  // if (loading) return (
  //   <div className="min-h-screen bg-[#0f0a1e] flex items-center justify-center">
  //     <div className="text-[#f5a623] text-2xl animate-pulse">🛍️</div>
  //   </div>
  // )
  // if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/home" /> : <LoginPage />} />
      {/* <Route path="/login" element={<LoginPage />} /> */}
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingPage /></ProtectedRoute>} />
      <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/explore" element={<ProtectedRoute><ExplorePage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      {/* <Route path="/premium" element={<ProtectedRoute><PremiumPage /></ProtectedRoute>} /> */}
      <Route path="/seller/:sellerId" element={<ProtectedRoute><SellerProfilePage /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatListPage /></ProtectedRoute>} />
      <Route path="/chat/:sellerId" element={<ProtectedRoute><ChatWindowPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <InstallPrompt />
        <NotificationSetup />
      </AuthProvider>
    </BrowserRouter>
  )
}
