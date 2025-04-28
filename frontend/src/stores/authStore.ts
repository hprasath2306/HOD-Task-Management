import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import apiClient from '../api/apiClient'

// Define User interface
export interface User {
  id: number
  name: string
  email: string
  role: 'ADMIN' | 'HOD' | 'TEACHER'
  createdAt: string
  updatedAt: string
}

// Define Auth Store interface
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, role?: string) => Promise<void>
  logout: () => void
  fetchCurrentUser: () => Promise<void>
}

// Create Auth Store
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (email, password) => {
        try {
          const response = await axios.post('http://localhost:5000/api/auth/login', {
            email,
            password
          })
          
          const { user, token } = response.data
          
          // Set axios default Authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          set({ 
            user, 
            token, 
            isAuthenticated: true 
          })
        } catch (error) {
          console.error('Login error:', error)
          throw error
        }
      },
      
      register: async (name, email, password, role) => {
        try {
          const response = await axios.post('http://localhost:5000/api/auth/register', {
            name,
            email,
            password,
            role
          })
          
          const { user, token } = response.data
          
          // Set axios default Authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          set({ 
            user, 
            token, 
            isAuthenticated: true 
          })
        } catch (error) {
          console.error('Registration error:', error)
          throw error
        }
      },
      
      logout: () => {
        // Remove axios default Authorization header
        delete axios.defaults.headers.common['Authorization']
        
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        })
      },
      
      fetchCurrentUser: async () => {
        try {
          const token = useAuthStore.getState().token
          
          if (!token) {
            set({ isAuthenticated: false })
            return
          }
          
          // Set axios default Authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          const response = await apiClient.get('/auth/me')
          set({ 
            user: response.data, 
            isAuthenticated: true 
          })
        } catch (error) {
          console.error('Fetch user error:', error)
          // Only clear auth if error is 401 (Unauthorized)
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            set({ 
              user: null, 
              token: null, 
              isAuthenticated: false 
            })
          }
        }
      }
    }),
    {
      name: 'auth-storage', // name of the item in localStorage
      partialize: (state) => ({ token: state.token }), // only persist token
    }
  )
) 