import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  TextField,
  MenuItem,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material'
import {
  ArrowBack,
  Check,
  HourglassBottom,
  Assignment,
  Delete,
  Edit,
  Send
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
    role: string
  }
  assignedTo: {
    id: number
    name: string
    role: string
  }
  statusUpdates: Array<{
    id: number
    status: string
    comment?: string
    createdAt: string
    user: {
      id: number
      name: string
      role: string
    }
  }>
}

const TaskDetails = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [comment, setComment] = useState('')
  const [updateLoading, setUpdateLoading] = useState(false)
  
  const fetchTask = async () => {
    if (!id) return
    try {
      setLoading(true)
      const response = await tasksApi.getTask(parseInt(id))
      setTask(response.data)
      setStatus(response.data.status)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load task details')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchTask()
  }, [id])
  
  const handleStatusUpdate = async () => {
    if (!id) return
    try {
      setUpdateLoading(true)
      await tasksApi.updateTaskStatus(parseInt(id), {
        status,
        comment
      })
      setComment('')
      fetchTask()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update task status')
    } finally {
      setUpdateLoading(false)
    }
  }
  
  const handleDeleteTask = async () => {
    if (!id || !confirm('Are you sure you want to delete this task?')) return
    try {
      await tasksApi.deleteTask(parseInt(id))
      navigate('/tasks')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete task')
    }
  }
  
  const getStatusChip = (status: string) => {
    switch(status) {
      case 'PENDING':
        return <Chip icon={<Assignment />} label="Pending" color="default" />
      case 'IN_PROGRESS':
        return <Chip icon={<HourglassBottom />} label="In Progress" color="primary" />
      case 'COMPLETED':
        return <Chip icon={<Check />} label="Completed" color="success" />
      default:
        return <Chip label={status} />
    }
  }
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    )
  }
  
  if (error) {
    return (
      <Box>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/tasks')}
          sx={{ mb: 2 }}
        >
          Back to Tasks
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }
  
  if (!task) {
    return (
      <Box>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/tasks')}
          sx={{ mb: 2 }}
        >
          Back to Tasks
        </Button>
        <Alert severity="warning">Task not found</Alert>
      </Box>
    )
  }
  
  const canUpdateStatus = user?.id === task.assignedTo.id || user?.role === 'HOD'
  const canEditTask = user?.id === task.createdBy.id && user?.role === 'HOD'
  
  return (
    <Box>
      <Button 
        startIcon={<ArrowBack />} 
        onClick={() => navigate('/tasks')}
        sx={{ mb: 2 }}
      >
        Back to Tasks
      </Button>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h4">{task.title}</Typography>
          <Box>
            {getStatusChip(task.status)}
          </Box>
        </Box>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Assigned By</Typography>
            <Typography variant="body1">{task.createdBy.name}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Assigned To</Typography>
            <Typography variant="body1">{task.assignedTo.name}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Created At</Typography>
            <Typography variant="body1">{formatDate(task.createdAt)}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" color="text.secondary">Due Date</Typography>
            <Typography variant="body1">
              {task.dueDate ? formatDate(task.dueDate) : 'No due date'}
            </Typography>
          </Grid>
        </Grid>
        
        <Typography variant="subtitle1" gutterBottom>Description</Typography>
        <Typography variant="body1" paragraph>
          {task.description || 'No description provided'}
        </Typography>
        
        {canEditTask && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <Button 
              startIcon={<Edit />} 
              variant="outlined"
              onClick={() => navigate(`/tasks/${task.id}/edit`)}
            >
              Edit Task
            </Button>
            <Button 
              startIcon={<Delete />} 
              variant="outlined" 
              color="error"
              onClick={handleDeleteTask}
            >
              Delete Task
            </Button>
          </Box>
        )}
      </Paper>
      
      {canUpdateStatus && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Update Status</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Status"
                fullWidth
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={updateLoading}
              >
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                label="Comment"
                fullWidth
                multiline
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={updateLoading}
                placeholder="Add a comment (optional)"
              />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleStatusUpdate}
              disabled={updateLoading || status === task.status}
            >
              Update
            </Button>
          </Box>
        </Paper>
      )}
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Status History</Typography>
        <Divider sx={{ mb: 2 }} />
        
        {task.statusUpdates.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No status updates yet</Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {task.statusUpdates.map((update) => (
              <Card key={update.id} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2">
                      {update.user.name} ({update.user.role})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(update.createdAt)}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    {getStatusChip(update.status)}
                  </Box>
                  {update.comment && (
                    <Typography variant="body2">
                      {update.comment}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Paper>
    </Box>
  )
}

export default TaskDetails 