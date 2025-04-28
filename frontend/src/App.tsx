import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Box, CircularProgress } from '@mui/material'
import Layout from './components/Layout'
import { useAuthStore } from './stores/authStore'

// Lazy-loaded components
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Teachers = lazy(() => import('./pages/Teachers'))
const Tasks = lazy(() => import('./pages/Tasks'))
const TaskDetails = lazy(() => import('./pages/TaskDetails'))
const TaskCreate = lazy(() => import('./pages/TaskCreate'))
const Profile = lazy(() => import('./pages/Profile'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Loading component
const Loading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
)

// Auth guard component
const ProtectedRoute = ({ children, admin = false, hod = false }: { children: JSX.Element, admin?: boolean, hod?: boolean }) => {
  const { isAuthenticated, user } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (admin && user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />
  }

  if (hod && user?.role !== 'HOD') {
    return <Navigate to="/dashboard" replace />
  }
  
  return children
}

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/teachers" 
            element={
              <ProtectedRoute admin>
                <Teachers />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/tasks" 
            element={
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/tasks/new" 
            element={
              <ProtectedRoute hod>
                <TaskCreate />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/tasks/:id" 
            element={
              <ProtectedRoute>
                <TaskDetails />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
