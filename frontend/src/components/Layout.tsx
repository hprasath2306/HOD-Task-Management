import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Container,
  ListItemButton,
  useTheme,
  alpha,
  Tooltip,
  Badge,
  Paper
} from '@mui/material'
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  ChevronLeft as ChevronLeftIcon
} from '@mui/icons-material'
import { useAuthStore } from '../stores/authStore'

const Layout = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, fetchCurrentUser } = useAuthStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  
  // Fetch current user on component mount
  useEffect(() => {
    fetchCurrentUser()
  }, [fetchCurrentUser])
  
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen)
  }
  
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  
  const handleProfileMenuClose = () => {
    setAnchorEl(null)
  }
  
  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
      roles: ['ADMIN', 'HOD', 'TEACHER']
    },
    {
      text: 'Teachers',
      icon: <PeopleIcon />,
      path: '/teachers',
      roles: ['ADMIN', 'HOD']
    },
    {
      text: 'Tasks',
      icon: <AssignmentIcon />,
      path: '/tasks',
      roles: ['ADMIN', 'HOD', 'TEACHER']
    },
    {
      text: 'Profile',
      icon: <PersonIcon />,
      path: '/profile',
      roles: ['ADMIN', 'HOD', 'TEACHER']
    }
  ]
  
  const drawer = (
    <Box sx={{ width: 280 }} role="presentation">
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText 
        }}
      >
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          Task Scheduler
        </Typography>
        <IconButton onClick={handleDrawerToggle} sx={{ color: 'inherit' }}>
          <ChevronLeftIcon />
        </IconButton>
      </Box>
      <Divider />
      
      {user && (
        <Box 
          sx={{ 
            p: 3, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            backgroundColor: alpha(theme.palette.primary.main, 0.05)
          }}
        >
          <Avatar 
            sx={{ 
              width: 64, 
              height: 64, 
              bgcolor: theme.palette.secondary.main,
              mb: 1,
              fontSize: '1.5rem',
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            {user.name.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {user.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {user.role}
          </Typography>
        </Box>
      )}
      
      <Divider sx={{ mb: 2 }} />
      
      <List sx={{ px: 2 }}>
        {menuItems
          .filter(item => user && item.roles.includes(user.role))
          .map((item) => {
            const isActive = location.pathname === item.path
            return (
              <ListItem 
                disablePadding
                key={item.text} 
                sx={{ mb: 1 }}
              >
                <ListItemButton
                  onClick={() => {
                    navigate(item.path)
                    setDrawerOpen(false)
                  }}
                  sx={{ 
                    borderRadius: 2,
                    backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                    color: isActive ? theme.palette.primary.main : 'inherit',
                    '&:hover': {
                      backgroundColor: isActive 
                        ? alpha(theme.palette.primary.main, 0.2) 
                        : alpha(theme.palette.primary.main, 0.05)
                    }
                  }}
                >
                  <ListItemIcon sx={{ 
                    minWidth: 40,
                    color: isActive ? theme.palette.primary.main : 'inherit'
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      fontWeight: isActive ? 'bold' : 'normal' 
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )
          })}
      </List>
      
      <Box sx={{ p: 2, mt: 'auto' }}>
        <Button
          fullWidth
          variant="outlined"
          color="error"
          onClick={handleLogout}
          startIcon={<LogoutIcon />}
          sx={{ borderRadius: 2 }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  )
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        }}
        elevation={0}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            HOD Task Scheduling
          </Typography>
          
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Notifications">
                <IconButton color="inherit" sx={{ mr: 1 }}>
                  <Badge badgeContent={0} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Profile">
                <IconButton onClick={handleProfileMenuOpen} color="inherit">
                  <Avatar sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: theme.palette.secondary.main,
                    fontSize: '0.9rem',
                    fontWeight: 'bold'
                  }}>
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  elevation: 2,
                  sx: { 
                    mt: 1,
                    minWidth: 200,
                    borderRadius: 2
                  }
                }}
              >
                <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center' }}>
                  <Avatar 
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      bgcolor: theme.palette.secondary.main,
                      mr: 1.5
                    }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                      {user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.role}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider />
                
                <MenuItem onClick={() => {
                  navigate('/profile')
                  handleProfileMenuClose()
                }}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  My Profile
                </MenuItem>
                
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" color="error" />
                  </ListItemIcon>
                  <Typography color="error">Logout</Typography>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        PaperProps={{
          sx: { width: 280, border: 'none' }
        }}
      >
        {drawer}
      </Drawer>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          mt: 8
        }}
      >
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: 3,
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)'
            }}
          >
            <Outlet />
          </Paper>
        </Container>
      </Box>
    </Box>
  )
}

export default Layout 