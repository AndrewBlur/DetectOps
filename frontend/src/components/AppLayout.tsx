import React, { useMemo } from 'react';
import { Outlet, NavLink, useNavigate, useParams, useLocation } from 'react-router-dom';

// MUI components and functions
import { styled, useTheme } from '@mui/material/styles';
import type { Theme, CSSObject } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import type { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';

// MUI Icons
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import OnlinePredictionIcon from '@mui/icons-material/OnlinePrediction';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';

// App-specific context hook
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 260;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(9)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 2),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

export default function AppLayout() {
  const theme = useTheme();
  const [open, setOpen] = React.useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const navItems = useMemo(() => [
    { text: 'Back to Projects', icon: <ArrowBackIcon />, path: '/projects' },
    { text: 'Your Images', icon: <PhotoLibraryIcon />, path: `/projects/${projectId}/images` },
    { text: 'Annotated', icon: <PlaylistAddCheckIcon />, path: `/projects/${projectId}/annotated` },
    { text: 'Predictions', icon: <OnlinePredictionIcon />, path: `/projects/${projectId}/predictions` },
  ], [projectId]);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" open={open}>
        <Toolbar sx={{ height: 70 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{
              marginRight: 5,
              ...(open && { display: 'none' }),
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, letterSpacing: '0.05em' }}>
            Vision Workspace
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: theme.palette.primary.main }}>
            DetectOps
          </Typography>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider sx={{ opacity: 0.5 }} />
        <List sx={{ px: 1, py: 2 }}>
          {navItems.map((item) => (
            <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 0.5 }}>
              <Tooltip title={open ? '' : item.text} placement="right">
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  end={item.path === '/projects'}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    borderRadius: 2,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 2 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} primaryTypographyProps={{ fontWeight: 500 }} />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>
        <Divider sx={{ opacity: 0.5 }} />
        <List sx={{ marginTop: 'auto', px: 1, pb: 2 }}>
          <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
            <Tooltip title={open ? '' : "Settings"} placement="right">
              <ListItemButton
                component={NavLink}
                to={`/projects/${projectId}/settings`}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  borderRadius: 2,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 2 : 'auto',
                    justifyContent: 'center',
                  }}
                >
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" sx={{ opacity: open ? 1 : 0 }} primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItemButton>
            </Tooltip>
          </ListItem>
          <ListItem disablePadding sx={{ display: 'block' }}>
            <Tooltip title={open ? '' : "Logout"} placement="right">
              <ListItemButton onClick={handleLogout}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  borderRadius: 2,
                  color: theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover, // Use theme active state
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.error.main,
                  }
                }}>
                <ListItemIcon sx={{ minWidth: 0, mr: open ? 2 : 'auto', justifyContent: 'center' }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" sx={{ opacity: open ? 1 : 0 }} primaryTypographyProps={{ fontWeight: 500 }} />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 4, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  );
}