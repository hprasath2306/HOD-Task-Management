import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  CircularProgress
} from '@mui/material'
import {
  Add,
  Visibility,
  Check,
  HourglassBottom,
  Assignment
} from '@mui/icons-material'
import { tasksApi } from '../api/apiClient'
import { useAuthStore } from '../stores/authStore'

interface Task {
  id: number
  title: string
  description?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  dueDate?: string
  createdAt: string
  updatedAt: string
  createdBy: {
    id: number
    name: string
    email: string
    role: string
  }
  assignedTo: {
    id: number
    name: string
    email: string
    role: string
  }
}

const Tasks = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const fetchTasks = async () => {
    try {
      setLoading(true)
      const response = await tasksApi.getTasks()
      setTasks(response.data)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchTasks()
  }, [])
  
  const getStatusChip = (status: string) => {
    switch(status) {
      case 'PENDING':
        return <Chip icon={<Assignment />} label="Pending" color="default" size="small" />
      case 'IN_PROGRESS':
        return <Chip icon={<HourglassBottom />} label="In Progress" color="primary" size="small" />
      case 'COMPLETED':
        return <Chip icon={<Check />} label="Completed" color="success" size="small" />
      default:
        return <Chip label={status} size="small" />
    }
  }
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }
  
  if (loading && tasks.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    )
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Tasks</Typography>
        {user?.role === 'HOD' && (
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => navigate('/tasks/new')}
          >
            Create Task
          </Button>
        )}
      </Box>
      
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {user?.role === 'HOD' 
                    ? 'No tasks found. Create a task to get started.' 
                    : 'No tasks assigned to you yet.'}
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>{task.assignedTo.name}</TableCell>
                  <TableCell>{getStatusChip(task.status)}</TableCell>
                  <TableCell>{formatDate(task.dueDate)}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => navigate(`/tasks/${task.id}`)}>
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default Tasks 