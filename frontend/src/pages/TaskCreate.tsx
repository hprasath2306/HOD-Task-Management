import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material'
import { ArrowBack, Save } from '@mui/icons-material'
import { tasksApi, usersApi } from '../api/apiClient'
import { useAuthStore } from '../stores/authStore'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers'

interface Teacher {
  id: number
  name: string
  email: string
  role: string
}

const TaskCreate = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [assignedToId, setAssignedToId] = useState<number | ''>('')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(false)
  const [teachersLoading, setTeachersLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch teachers for the dropdown
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setTeachersLoading(true)
        const response = await usersApi.getTeachers({ excludeHOD: true })
        setTeachers(response.data)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load teachers')
      } finally {
        setTeachersLoading(false)
      }
    }

    fetchTeachers()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    
    if (!assignedToId) {
      setError('Please select a teacher to assign the task')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      await tasksApi.createTask({
        title,
        description,
        dueDate: dueDate ? dueDate.toISOString() : undefined,
        assignedToId: assignedToId as number
      })
      
      navigate('/tasks')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  // Check if user is HOD
  if (user?.role !== 'HOD') {
    return (
      <Box>
        <Alert severity="error">
          You don't have permission to create tasks. Only HOD can create tasks.
        </Alert>
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/tasks')}
          sx={{ mt: 2 }}
        >
          Back to Tasks
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          onClick={() => navigate('/tasks')} 
          sx={{ mr: 1 }}
          aria-label="back"
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">Create New Task</Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Title"
              fullWidth
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Due Date (Optional)"
                value={dueDate}
                onChange={(newValue) => setDueDate(newValue)}
                slotProps={{ 
                  textField: { 
                    fullWidth: true,
                    disabled: loading
                  } 
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={loading || teachersLoading}>
              <InputLabel id="assigned-to-label">Assign To</InputLabel>
              <Select
                labelId="assigned-to-label"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value as number)}
                label="Assign To"
                required
              >
                {teachersLoading ? (
                  <MenuItem value="" disabled>
                    Loading teachers...
                  </MenuItem>
                ) : teachers.length === 0 ? (
                  <MenuItem value="" disabled>
                    No teachers available
                  </MenuItem>
                ) : (
                  teachers.map((teacher) => (
                    <MenuItem key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.role})
                    </MenuItem>
                  ))
                )}
              </Select>
              <FormHelperText>Select a teacher to assign this task</FormHelperText>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/tasks')}
              sx={{ mr: 1 }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={loading || teachersLoading}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  )
}

export default TaskCreate 