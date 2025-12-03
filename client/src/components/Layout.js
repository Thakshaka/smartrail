import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Container,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Chip,
  Fade,
  Slide,
  useScrollTrigger
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  Search,
  Train,
  Notifications,
  Person,
  BookOnline,
  ContactSupport,
  Logout,
  Settings,
  AdminPanelSettings
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useAlert } from '../contexts/AlertContext';

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { alerts } = useSocket();
  const { showSuccess } = useAlert();

  // Scroll trigger for AppBar elevation
  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    showSuccess('Logged out successfully');
    navigate('/');
    handleProfileMenuClose();
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const menuItems = [
    { text: 'Home', path: '/', icon: <Home /> },
    { text: 'Search Trains', path: '/search', icon: <Search /> },
    ...(isAuthenticated ? [
      { text: 'Book Tickets', path: '/booking', icon: <BookOnline /> },
      { text: 'Track Trains', path: '/tracking', icon: <Train /> },
      { text: 'Alerts', path: '/alerts', icon: <Notifications /> },
      { text: 'Contact', path: '/contact', icon: <ContactSupport /> },
      ...(user?.role === 'admin' ? [
        { text: 'Admin Dashboard', path: '/admin', icon: <AdminPanelSettings /> }
      ] : [])
    ] : [
      { text: 'Contact', path: '/contact', icon: <ContactSupport /> }
    ])
  ];

  const drawer = (
    <Box sx={{ width: 280, height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Box sx={{ p: 3, textAlign: 'center', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
        <Box component="img" src="/logo.png" alt="SmartRail" sx={{ height: 40, width: 40, mb: 1 }} />
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, letterSpacing: '-0.02em' }}>
          SmartRail
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          Sri Lanka Railway
        </Typography>
      </Box>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
      <List sx={{ px: 2, py: 1 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => handleNavigation(item.path)}
            selected={location.pathname === item.path}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              color: 'white',
              '&.Mui-selected': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.3)',
                },
              },
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'white' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      {isAuthenticated && (
        <>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', my: 2 }} />
          <List sx={{ px: 2 }}>
            <ListItem 
              button 
              onClick={() => handleNavigation('/profile')}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}><Person /></ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>
            <ListItem 
              button 
              onClick={handleLogout}
              sx={{
                borderRadius: 2,
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              <ListItemIcon sx={{ color: 'white' }}><Logout /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Slide appear={false} direction="down" in={!trigger}>
        <AppBar 
          position="fixed" 
          elevation={trigger ? 4 : 0}
          sx={{
            background: trigger 
              ? 'rgba(255,255,255,0.95)' 
              : 'linear-gradient(135deg, #1a237e 0%, #534bae 100%)',
            backdropFilter: 'blur(20px)',
            transition: 'all 0.3s ease-in-out',
            borderBottom: trigger ? '1px solid rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <Toolbar sx={{ py: 1 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2, 
                display: { sm: 'none' },
                color: trigger ? 'primary.main' : 'white'
              }}
            >
              <MenuIcon />
            </IconButton>
            
            <Box 
              onClick={() => navigate('/')} 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                flexGrow: 1, 
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.02)',
                }
              }}
            >
              <Box 
                component="img" 
                src="/logo.png" 
                alt="SmartRail" 
                sx={{ 
                  height: 40, 
                  width: 40
                }} 
              />
              <Typography 
                variant="h6" 
                component="div"
                sx={{ 
                  color: trigger ? 'primary.main' : 'white',
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  letterSpacing: '-0.02em'
                }}
              >
                SmartRail
              </Typography>
            </Box>

            {/* Desktop Navigation */}
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 0.5 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    color: trigger ? 'primary.main' : 'white',
                    backgroundColor: location.pathname === item.path 
                      ? (trigger ? 'rgba(26,35,126,0.1)' : 'rgba(255,255,255,0.2)')
                      : 'transparent',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    fontWeight: 600,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: location.pathname === item.path 
                        ? (trigger ? 'rgba(26,35,126,0.15)' : 'rgba(255,255,255,0.25)')
                        : (trigger ? 'rgba(26,35,126,0.08)' : 'rgba(255,255,255,0.1)'),
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>

            {/* User Menu */}
            {isAuthenticated ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton
                  color="inherit"
                  onClick={() => navigate('/alerts')}
                  sx={{
                    color: trigger ? 'primary.main' : 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      transform: 'scale(1.1)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <Badge badgeContent={alerts.length} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>
                
                <IconButton
                  onClick={handleProfileMenuOpen}
                  sx={{ 
                    ml: 1,
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 40, 
                      height: 40,
                      background: trigger 
                        ? 'linear-gradient(135deg, #1a237e, #534bae)' 
                        : 'linear-gradient(135deg, #ff6f00, #ff9f40)',
                      fontWeight: 700,
                      fontSize: '1.1rem',
                    }}
                  >
                    {user?.first_name?.charAt(0) || 'U'}
                  </Avatar>
                </IconButton>
              
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleProfileMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  PaperProps={{
                    sx: {
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      mt: 1,
                    }
                  }}
                >
                  <MenuItem 
                    onClick={() => { handleNavigation('/profile'); handleProfileMenuClose(); }}
                    sx={{ borderRadius: 2, mx: 1, my: 0.5 }}
                  >
                    <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                    Profile
                  </MenuItem>
                  <MenuItem 
                    onClick={() => { handleNavigation('/booking'); handleProfileMenuClose(); }}
                    sx={{ borderRadius: 2, mx: 1, my: 0.5 }}
                  >
                    <ListItemIcon><BookOnline fontSize="small" /></ListItemIcon>
                    My Bookings
                  </MenuItem>
                  <Divider />
                  <MenuItem 
                    onClick={handleLogout}
                    sx={{ borderRadius: 2, mx: 1, my: 0.5, color: 'error.main' }}
                  >
                    <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  color="inherit"
                  onClick={() => navigate('/login')}
                  sx={{
                    color: trigger ? 'primary.main' : 'white',
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: trigger ? 'rgba(26,35,126,0.08)' : 'rgba(255,255,255,0.1)',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  Login
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/register')}
                  sx={{
                    color: trigger ? 'primary.main' : 'white',
                    borderColor: trigger ? 'primary.main' : 'white',
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: trigger ? 'primary.main' : 'white',
                      color: trigger ? 'white' : 'primary.main',
                      transform: 'translateY(-1px)',
                    },
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  Register
                </Button>
              </Box>
            )}
          </Toolbar>
        </AppBar>
      </Slide>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, pt: 10, pb: 4 }}>
        <Container maxWidth="xl">
          <Fade in timeout={600}>
            <Box>
              {children}
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 4,
          px: 2,
          mt: 'auto',
          background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
          color: 'white',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box component="img" src="/logo.png" alt="SmartRail" sx={{ height: 24, width: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                SmartRail
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Chip 
                label="Sri Lanka Railway" 
                size="small" 
                sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.1)', 
                  color: 'white',
                  fontWeight: 500 
                }} 
              />
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                © 2024 SmartRail. All rights reserved.
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 