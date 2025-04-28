import axios from 'axios'

// Create an axios instance
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Add a request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage')
      ? JSON.parse(localStorage.getItem('auth-storage') || '{}').state?.token
      : null

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

// Add a response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors globally by redirecting to login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('auth-storage')
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

export default apiClient

// Auth API
export const authApi = {
  login: (email: string, password: string) => 
    apiClient.post('/auth/login', { email, password }),
  
  register: (name: string, email: string, password: string, role?: string) => 
    apiClient.post('/auth/register', { name, email, password, role }),
  
  getCurrentUser: () => 
    apiClient.get('/auth/me')
}

// Users API
export const usersApi = {
  getTeachers: (params?: { excludeHOD?: boolean }) => 
    apiClient.get('/users/teachers', { params }),
  
  getTeacher: (id: number) => 
    apiClient.get(`/users/teachers/${id}`),
  
  createTeacher: (teacherData: { name: string, email: string, password: string, isHOD?: boolean }) => 
    apiClient.post('/users/teachers', teacherData),
  
  updateTeacher: (id: number, teacherData: { name?: string, email?: string, isHOD?: boolean }) => 
    apiClient.put(`/users/teachers/${id}`, teacherData),
  
  deleteTeacher: (id: number) => 
    apiClient.delete(`/users/teachers/${id}`)
}

// Tasks API
export const tasksApi = {
  getTasks: () => 
    apiClient.get('/tasks'),
  
  getTask: (id: number) => 
    apiClient.get(`/tasks/${id}`),
  
  createTask: (taskData: { title: string, description?: string, dueDate?: string, assignedToId: number }) => 
    apiClient.post('/tasks', taskData),
  
  updateTask: (id: number, taskData: { title?: string, description?: string, dueDate?: string | null, assignedToId?: number }) => 
    apiClient.put(`/tasks/${id}`, taskData),
  
  updateTaskStatus: (id: number, statusData: { status: string, comment?: string }) => 
    apiClient.put(`/tasks/${id}/status`, statusData),
  
  deleteTask: (id: number) => 
    apiClient.delete(`/tasks/${id}`)
} 