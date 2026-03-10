import React, { useState } from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import DashboardIcon from "@mui/icons-material/Dashboard";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
// import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import Logo from "../assets/img/Logo.png";
import DefaultProfilePic from "../assets/img/Profile.jpg";

import { Link, useLocation, useNavigate } from "react-router-dom";
import AxiosInstance from "./AxiosInstance";
import { createTheme, ThemeProvider } from "@mui/material/styles";

// Modern theme with Inter font
const theme = createTheme({
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 600,
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
    { label: "Clients", path: "/employee/client-view", icon: <PeopleOutlineIcon sx={{ color: "#1c3d37" }} /> },
    { label: "Settings", path: "/settings", icon: <SettingsIcon sx={{ color: "#1c3d37" }} /> },
  ],
};

export default function Navbar({ content }) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // Function to get user data from localStorage
  const getUserData = () => {
    const userId = localStorage.getItem("user_id");
    
    console.log("=== NAVBAR INIT ===");
    console.log("User ID from localStorage:", userId);
    
    let firstName = "User";
    let role = "client";
    
    // Try user-specific storage first
    if (userId) {
      const userFirstName = localStorage.getItem(`user_${userId}_first_name`);
      const userRole = localStorage.getItem(`user_${userId}_role`);
      
      console.log(`User-specific data (user_${userId}_):`);
      console.log(`- first_name: ${userFirstName}`);
      console.log(`- role: ${userRole}`);
      
      // Use user-specific data if available
      if (userFirstName) firstName = userFirstName;
      if (userRole) role = userRole;
      
      // Load saved budget and expenses from user-specific storage
      const savedBudget = localStorage.getItem(`user_${userId}_budget`);
      const savedExpenses = localStorage.getItem(`user_${userId}_expenses`);
      
      if (savedBudget) {
        localStorage.setItem("userBudget", savedBudget);
        console.log(`Restored budget for user ${userId}: ${savedBudget}`);
      }
      if (savedExpenses) {
        localStorage.setItem("userExpenses", savedExpenses);
        console.log(`Restored expenses for user ${userId}`);
      }
      
      // Load any other saved user data
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
    
    // Fallback to global storage if user-specific data not found
    if (firstName === "User") {
      const globalFirstName = localStorage.getItem("first_name");
      if (globalFirstName) firstName = globalFirstName;
    }
    
    if (role === "client") {
      const globalRole = localStorage.getItem("role");
      if (globalRole) role = globalRole;
    }
    
    console.log("Final user data:", { firstName, role });
    return { firstName, role };
  };

  // State for user data - initialized directly
  const [userData, setUserData] = useState(getUserData());

  // Optional: Debug log after initial render
  React.useEffect(() => {
    console.log("UserData state initialized:", userData);
  }, []);

  const menuItems = menuConfig[userData.role] || menuConfig.client;

  /* =========================
     LOGOUT - Save user data and clear authentication only
  ========================= */
  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");
    
    console.log("Logging out user_id:", userId);
    
    // 1. Save ALL user data before clearing authentication
    if (userId) {
      // Define all data keys that belong to the user
      const userDataKeys = [
        "userBudget",
        "userExpenses",
        "userServices",
        "userBookings",
        "userSettings",
        "first_name",
        "role"
      ];
      
      // Save each piece of data with user-specific key
      userDataKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          localStorage.setItem(`user_${userId}_${key}`, value);
          console.log(`Saved user_${userId}_${key}:`, value ? "✓" : "empty");
        }
      });
      
      // Also save any other keys that start with 'user' (like userPreferences, etc.)
      const allKeys = Object.keys(localStorage);
      const userSpecificKeys = allKeys.filter(key => 
        key.startsWith('user') && 
        !key.startsWith(`user_${userId}_`) && // Skip already saved
        !key.includes('_') // Skip keys that already have underscores
      );
      
      userSpecificKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          localStorage.setItem(`user_${userId}_${key}`, value);
          console.log(`Saved user_${userId}_${key} from ${key}`);
        }
      });
    }
    
    // Call logout API using AxiosInstance (cookie-based auth). We always
    // attempt to call the backend so the server can clear auth cookies.
    try {
      await AxiosInstance.post("/logout/");
    } catch (error) {
      console.log("Logout API error:", error);
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
      console.log(`Cleared auth key: ${key}`);
    });
    
    // Clear current session user data (it's already saved in user-specific storage)
    const userDataKeysToClear = [
      "userBudget",
      "userExpenses",
      "userServices",
      "userBookings",
      "userSettings"
    ];
    
    userDataKeysToClear.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Cleared session data: ${key}`);
    });
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Reset component state
    setUserData({ firstName: "User", role: "client" });
    
    console.log("Logout complete. User data saved with prefix:", `user_${userId}_`);
    
    // Navigate to login
    navigate("/", { replace: true });
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex" }}>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
              backgroundColor: "#F8F8F8",
            },
          }}
        >
          <Toolbar />

          {/* LOGO */}
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <img src={Logo} alt="Logo" style={{ width: "200px" }} />
          </Box>

          {/* PROFILE */}
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <img
              src={DefaultProfilePic}
              alt="Profile"
              style={{
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                border: "2px solid #1c3d37",
                objectFit: "cover",
              }}
            />
          </Box>

          {/* WELCOME MESSAGE */}
          <Typography
            variant="h6"
            sx={{
              mb: 4,
              textAlign: "center",
              fontWeight: 500,
              fontSize: "1.2rem",
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
                      slotProps={{
                        primary: {
                          fontSize: '0.95rem',
                          letterSpacing: '-0.01em',
                        }
                      }}
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
                  onClick={handleLogout}
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
                  <ListItemText className="logoutBtn"
                    primary="LOGOUT"
                    slotProps={{
                      primary: {
                        sx: {
                          color: '#9e2c2c !important',
                          fontWeight: 500,
                        }
                      }
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Drawer>

        {/* MAIN CONTENT */}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          {content}
        </Box>
      </Box>
    </ThemeProvider>
  );
}