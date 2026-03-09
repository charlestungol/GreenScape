import React from "react";
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
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import Logo from "../assets/img/Logo.png";
import ProfilePic from "../assets/img/Profile.jpg";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";

/* =========================
   THEME
========================= */
const theme = createTheme({
  typography: { fontFamily: "'Courier New', monospace" },
});

const drawerWidth = 300;

/* =========================
   ROLE-BASED MENU CONFIG
========================= */
const menuConfig = {
  client: [
    {
      label: "Dashboard",
      path: "/home",
      icon: <DashboardIcon sx={{ color: "#06632b" }} />,
    },
    {
      label: "Services",
      path: "/services",
      icon: <WaterDropIcon sx={{ color: "#06632b" }} />,
    },
    {
      label: "Booking",
      path: "/booking",
      icon: <CalendarMonthIcon sx={{ color: "#06632b" }} />,
    },
    {
      label: "Settings",
      path: "/settings",
      icon: <SettingsIcon sx={{ color: "#06632b" }} />,
    },
  ],
  employee: [
    {
      label: "Dashboard",
      path: "/employee/dashboard",
      icon: <DashboardIcon sx={{ color: "#06632b" }} />,
    },
    {
      label: "My Schedule",
      path: "/employee/my-schedule",
      icon: <CalendarMonthIcon sx={{ color: "#06632b" }} />,
    },
    {
      label: "Employee Management",
      path: "/employee/employee-management",
      icon: <PeopleOutlineIcon sx={{ color: "#06632b" }} />,
    },
    {
      label: "Service Schedule",
      path: "/employee/service-schedule",
      icon: <WaterDropIcon sx={{ color: "#06632b" }} />,
    },
    {
      label: "Finances Board",
      path: "/employee/finances",
      icon: <SettingsIcon sx={{ color: "#06632b" }} />,
    },
    {
      label: "Account",
      path: "/employee/account",
      icon: <AccountCircleIcon sx={{ color: "#06632b" }} />,
    }
  ],
};

/* =========================
   NAVBAR COMPONENT
========================= */
export default function Navbar({ content }) {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;

  // Safe localStorage access with error handling
  const getLocalStorageItem = (key, defaultValue) => {
    try {
      return localStorage.getItem(key) || defaultValue;
    } catch (error) {
      console.error(`Error accessing localStorage for key ${key}:`, error);
      return defaultValue;
    }
  };

  const firstName = getLocalStorageItem("first_name", "User");
  const role = getLocalStorageItem("role", "client");

  const isEmployee = role === "employee";

  /* =========================
     LOGOUT
  ========================= */
  const handleLogout = async () => {
    const token = getLocalStorageItem("token", null);

    if (token) {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/logout/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        });

        if (!response.ok) {
          console.warn("Logout API call failed with status:", response.status);
        }
      } catch (error) {
        console.error("Logout error:", error);
        // Still proceed with local logout even if API fails
      }
    }

    // Clear localStorage safely
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage:", error);
      // If clear fails, try removing individual items
      const keysToRemove = ["token", "first_name", "role", "user_id", "email"];
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Error removing ${key}:`, e);
        }
      });
    }

    navigate("/");
  };

  // Get menu items based on role
  const menuItems = isEmployee ? menuConfig.employee : menuConfig.client;

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex" }}>
        {/* =========================
            DRAWER
        ========================= */}
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: drawerWidth,
              boxSizing: "border-box",
              backgroundColor: "#F8F8F8",
              color: "#06632b",
            },
          }}
        >
          <Toolbar />

          {/* LOGO */}
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <img 
              src={Logo} 
              alt="Logo" 
              style={{ width: "200px" }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "fallback-logo.png"; // Add a fallback image
              }}
            />
          </Box>

          {/* PROFILE */}
          <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
            <img
              src={ProfilePic}
              alt="Profile"
              style={{
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                border: "2px solid #06632b",
                objectFit: "cover",
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "fallback-profile.jpg"; // Add a fallback image
              }}
            />
          </Box>

          <Typography
            sx={{
              mb: 4,
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "1.2rem",
            }}
          >
            Welcome, {firstName}!
          </Typography>

          {/* MENU */}
          <Box sx={{ overflow: "auto" }}>
            <List>
              {menuItems.map((item) => (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    selected={path === item.path}
                    sx={{
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(6, 99, 43, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(6, 99, 43, 0.2)',
                        },
                      },
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              ))}
              
              {/* LOGOUT (shared for both roles) */}
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={handleLogout}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(6, 99, 43, 0.1)',
                    },
                  }}
                >
                  <ListItemIcon>
                    <LogoutIcon sx={{ color: "#06632b" }} />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Drawer>

        {/* =========================
            MAIN CONTENT
        ========================= */}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          {content || (
            <Typography variant="h6" color="textSecondary">
              Select an option from the menu to get started
            </Typography>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}