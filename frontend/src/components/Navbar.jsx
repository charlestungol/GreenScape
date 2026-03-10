import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

import DashboardIcon from "@mui/icons-material/Dashboard";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";

import Logo from "../assets/img/Logo.png";
import DefaultProfilePic from "../assets/img/Profile.webp";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";


const theme = createTheme({
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#F8F8F8",
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
          fontWeight: 500,
          fontSize: '0.95rem',
          letterSpacing: '-0.01em',
          color: '#1c3d37',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          '&.Mui-selected': {
            backgroundColor: 'rgba(28, 61, 55, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(28, 61, 55, 0.12)',
            },
            '& .MuiListItemText-primary': {
              fontWeight: 600,
              color: '#1c3d37',
            },
          },
        },
      },
    },
  },
});

const drawerWidth = 300;

const menuConfig = {
  client: [
    { label: "DASHBOARD", path: "/home", icon: <DashboardIcon sx={{ color: "#1c3d37" }} /> },
    { label: "SERVICES", path: "/services", icon: <WaterDropIcon sx={{ color: "#1c3d37" }} /> },
    { label: "BOOKING", path: "/booking", icon: <CalendarMonthIcon sx={{ color: "#1c3d37" }} /> },
    { label: "SETTINGS", path: "/settings", icon: <SettingsIcon sx={{ color: "#1c3d37" }} /> },
  ],
  employee: [
    { label: "Dashboard", path: "/employeeHome", icon: <DashboardIcon sx={{ color: "#1c3d37" }} /> },
    { label: "Client", path: "/client", icon: <PeopleOutlineIcon sx={{ color: "#1c3d37" }} /> },
    { label: "Settings", path: "/settings", icon: <SettingsIcon sx={{ color: "#1c3d37" }} /> },
  ],
};

export default function Navbar({ content }) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const muiTheme = useTheme();
  // Fix: Use muiTheme.breakpoints.down('md') instead of theme.breakpoints
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  console.log("Is mobile view:", isMobile);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Function to get user data from localStorage
  const getUserData = () => {
    const userId = localStorage.getItem("user_id");
    
    let firstName = "User";
    let role = "client";
    
    if (userId) {
      const userFirstName = localStorage.getItem(`user_${userId}_first_name`);
      const userRole = localStorage.getItem(`user_${userId}_role`);
      
      if (userFirstName) firstName = userFirstName;
      if (userRole) role = userRole;
      
      const savedBudget = localStorage.getItem(`user_${userId}_budget`);
      const savedExpenses = localStorage.getItem(`user_${userId}_expenses`);
      
      if (savedBudget) {
        localStorage.setItem("userBudget", savedBudget);
      }
      if (savedExpenses) {
        localStorage.setItem("userExpenses", savedExpenses);
      }
      
      const savedServices = localStorage.getItem(`user_${userId}_services`);
      const savedBookings = localStorage.getItem(`user_${userId}_bookings`);
      const savedSettings = localStorage.getItem(`user_${userId}_settings`);
      
      if (savedServices) {
        localStorage.setItem("userServices", savedServices);
      }
      if (savedBookings) {
        localStorage.setItem("userBookings", savedBookings);
      }
      if (savedSettings) {
        localStorage.setItem("userSettings", savedSettings);
      }
    }
    
    if (firstName === "User") {
      const globalFirstName = localStorage.getItem("first_name");
      if (globalFirstName) firstName = globalFirstName;
    }
    
    if (role === "client") {
      const globalRole = localStorage.getItem("role");
      if (globalRole) role = globalRole;
    }
    
    return { firstName, role };
  };

  const [userData, setUserData] = useState(getUserData());

  React.useEffect(() => {
    console.log("UserData state initialized:", userData);
  }, []);

  const menuItems = menuConfig[userData.role] || menuConfig.client;

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");
    
    if (userId) {
      const userDataKeys = [
        "userBudget",
        "userExpenses",
        "userServices",
        "userBookings",
        "userSettings",
        "first_name",
        "role"
      ];
      
      userDataKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          localStorage.setItem(`user_${userId}_${key}`, value);
        }
      });
    }
    
    if (token) {
      try {
        await fetch("http://127.0.0.1:8000/api/logout/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        });
      } catch (error) {
        console.log("Logout API error:", error);
      }
    }
    
    const authKeysToClear = [
      "token", 
      "user_id",      
      "first_name",    
      "last_name",
      "email",
    ];
    
    authKeysToClear.forEach(key => {
      localStorage.removeItem(key);
    });
    
    const userDataKeysToClear = [
      "userBudget",
      "userExpenses",
      "userServices",
      "userBookings",
      "userSettings"
    ];
    
    userDataKeysToClear.forEach(key => {
      localStorage.removeItem(key);
    });
    
    sessionStorage.clear();
    setUserData({ firstName: "User", role: "client" });
    
    navigate("/", { replace: true });
  };

  const [profileImage, setProfileImage] = useState(() => {
    const savedImage = localStorage.getItem('profileImage');
    return savedImage || DefaultProfilePic;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const savedImage = localStorage.getItem('profileImage');
      setProfileImage(savedImage || DefaultProfilePic);
    };

    const interval = setInterval(handleStorageChange, 1000);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDrawerClose = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Drawer content
  const drawer = (
    <>
      <Toolbar />
      
      {/* LOGO */}
      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <img src={Logo} alt="Logo" style={{ width: isMobile ? "150px" : "200px" }} />
      </Box>

      {/* PROFILE */}
      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <Link to="/client-profile" onClick={handleDrawerClose} style={{ textDecoration: 'none' }}>
          <img
            src={profileImage}
            alt="Profile"
            style={{
              width: isMobile ? "100px" : "150px",
              height: isMobile ? "100px" : "150px",
              borderRadius: "50%",
              border: "2px solid #1c3d37",
              objectFit: "cover",
              cursor: "pointer",
            }}
          />
        </Link>
      </Box>

      {/* WELCOME MESSAGE */}
      <Typography
        variant="h6"
        sx={{
          mb: 4,
          textAlign: "center",
          fontWeight: 500,
          fontSize: isMobile ? "1rem" : "1.2rem",
          color: "#1c3d37",
          letterSpacing: '-0.01em',
        }}
      >
        Welcome, {userData.firstName}!
      </Typography>

      {/* MENU */}
      <Box sx={{ overflow: "auto", px: 2 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem disablePadding key={item.path} sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={path === item.path}
                onClick={handleDrawerClose}
                sx={{
                  py: 1,
                  px: 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.label}
                />
              </ListItemButton>
            </ListItem>
          ))}

          {/* LOGOUT DIVIDER */}
          <Box sx={{ 
            my: 2, 
            borderTop: '1px solid rgba(28, 61, 55, 0.12)' 
          }} />

          {/* LOGOUT */}
          <ListItem disablePadding>
            <ListItemButton 
              onClick={() => {
                handleLogout();
                handleDrawerClose();
              }}
              sx={{
                py: 1,
                px: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 68, 68, 0.04)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LogoutIcon sx={{ color: '#9e2c2c' }} />
              </ListItemIcon>
              <ListItemText 
                primary="LOGOUT"
                sx={{
                  '& .MuiListItemText-primary': {
                    color: '#9e2c2c !important',
                    fontWeight: 500,
                  }
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex" }}>
        {/* Mobile App Bar */}
        <AppBar
          position="fixed"
          sx={{
            display: { xs: 'block', sm: 'block', md: 'none' }, 
            backgroundColor: '#F8F8F8',
            color: '#1c3d37',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
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
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              <img src={Logo} alt="Logo" style={{ height: '40px' }} />
            </Typography>
            {/* Mobile profile icon */}
            <Link to="/client-profile" onClick={handleDrawerClose}>
              <img
                src={profileImage}
                alt="Profile"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '2px solid #1c3d37',
                  objectFit: 'cover',
                  cursor: 'pointer',
                }}
              />
            </Link>
          </Toolbar>
        </AppBar>

        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: "#F8F8F8",
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'none', md: 'block' }, 
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
              backgroundColor: "#F8F8F8",
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* MAIN CONTENT */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3 },
            width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
            mt: { xs: '64px', md: 0 },
            minHeight: '100vh',
          }}
        >
          <Toolbar sx={{ display: { xs: 'block', md: 'none' } }} />
          {content}
        </Box>
      </Box>
    </ThemeProvider>
  );
}