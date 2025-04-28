import { useState, useEffect } from 'react'
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  CircularProgress
} from '@mui/material'
import { Edit, Delete, Add } from '@mui/icons-material'
import { usersApi } from '../api/apiClient'

interface Teacher {
  id: number
  name: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

const Teachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add')
  const [currentTeacher, setCurrentTeacher] = useState<Partial<Teacher> | null>(null)
  
  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isHOD, setIsHOD] = useState(false)
  
  const fetchTeachers = async () => {
    try {
      setLoading(true)
      const response = await usersApi.getTeachers()
      setTeachers(response.data)
      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchTeachers()
  }, [])
  
  const handleOpenAddDialog = () => {
    setDialogMode('add')
    setName('')
    setEmail('')
    setPassword('')
    setIsHOD(false)
    setCurrentTeacher(null)
    setOpenDialog(true)
  }
  
  const handleOpenEditDialog = (teacher: Teacher) => {
    setDialogMode('edit')
    setName(teacher.name)
    setEmail(teacher.email)
    setPassword('')
    setIsHOD(teacher.role === 'HOD')
    setCurrentTeacher(teacher)
    setOpenDialog(true)
  }
  
  const handleCloseDialog = () => {
    setOpenDialog(false)
  }
  
  const handleSubmit = async () => {
    try {
      if (dialogMode === 'add') {
        await usersApi.createTeacher({
          name,
          email,
          password,
          isHOD
        })
      } else if (dialogMode === 'edit' && currentTeacher) {
        await usersApi.updateTeacher(currentTeacher.id!, {
          name,
          email,
          isHOD
        })
      }
      
      fetchTeachers()
      handleCloseDialog()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Operation failed')
    }
  }
  
  const handleDeleteTeacher = async (id: number) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return
    
    try {
      await usersApi.deleteTeacher(id)
      fetchTeachers()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete teacher')
    }
  }
  
  if (loading && teachers.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    )
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Manage Teachers</Typography>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={handleOpenAddDialog}
        >
          Add Teacher
        </Button>
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
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teachers.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No teachers found. Add a teacher to get started.
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>{teacher.name}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{teacher.role}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenEditDialog(teacher)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteTeacher(teacher.id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'add' ? 'Add New Teacher' : 'Edit Teacher'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {dialogMode === 'add' && (
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
          <FormControlLabel
            control={
              <Switch
                checked={isHOD}
                onChange={(e) => setIsHOD(e.target.checked)}
              />
            }
            label="Assign as HOD"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {dialogMode === 'add' ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default Teachers 