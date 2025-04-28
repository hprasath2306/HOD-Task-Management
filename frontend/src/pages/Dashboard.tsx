import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  CircularProgress
} from '@mui/material'
import {
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  AssignmentTurnedIn as CompletedIcon,
  AssignmentLate as PendingIcon
} from '@mui/icons-material'
import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

// Define interfaces for dashboard data
interface DashboardData {
  teacherCount: number
  taskCount: number
  completedTaskCount: number
  pendingTaskCount: number
}

const Dashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch teachers count (admin only)
        let teacherCount = 0
        if (user?.role === 'ADMIN') {
          const teachersResponse = await axios.get('/api/users/teachers')
          teacherCount = teachersResponse.data.length
        }
        
        // Fetch tasks
        const tasksResponse = await axios.get('/api/tasks')
        const tasks = tasksResponse.data
        
        // Calculate task statistics
        const taskCount = tasks.length
        const completedTaskCount = tasks.filter((task: any) => task.status === 'COMPLETED').length
        const pendingTaskCount = taskCount - completedTaskCount
        
        setData({
          teacherCount,
          taskCount,
          completedTaskCount,
          pendingTaskCount
        })
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    
    fetchDashboardData()
  }, [user])
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    )
  }
  
  if (error) {
    return (
      <Box>
        <Typography color="error">{error}</Typography>
      </Box>
    )
  }
  
  // Define dashboard cards based on user role
  const dashboardItems = [
    // Admin only
    ...(user?.role === 'ADMIN' ? [
      {
        title: 'Teachers',
        count: data?.teacherCount || 0,
        icon: <PeopleIcon fontSize="large" color="primary" />,
        onClick: () => navigate('/teachers')
      }
    ] : []),
    // All users
    {
      title: 'Total Tasks',
      count: data?.taskCount || 0,
      icon: <AssignmentIcon fontSize="large" color="primary" />,
      onClick: () => navigate('/tasks')
    },
    {
      title: 'Completed Tasks',
      count: data?.completedTaskCount || 0,
      icon: <CompletedIcon fontSize="large" color="success" />,
      onClick: () => navigate('/tasks')
    },
    {
      title: 'Pending Tasks',
      count: data?.pendingTaskCount || 0,
      icon: <PendingIcon fontSize="large" color="warning" />,
      onClick: () => navigate('/tasks')
    }
  ]
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Box sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          {dashboardItems.map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item.title}>
              <Card sx={{ height: '100%' }}>
                <CardActionArea onClick={item.onClick} sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    {item.icon}
                    <Typography variant="h4" component="div" sx={{ mt: 2 }}>
                      {item.count}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {item.title}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Welcome, {user?.name}!
        </Typography>
        <Typography variant="body1">
          {user?.role === 'ADMIN' && 'Manage teachers and monitor all activities in the system.'}
          {user?.role === 'HOD' && 'Create and assign tasks to teachers, monitor their progress.'}
          {user?.role === 'TEACHER' && 'View and update your assigned tasks.'}
        </Typography>
      </Box>
    </Box>
  )
}

export default Dashboard 