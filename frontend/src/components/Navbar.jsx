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
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";

import Logo from "../assets/img/Logo.png";
import ProfilePic from "../assets/img/Profile.jpg";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const GREEN = "#1c3d37";
const drawerWidth = 300;

// ✅ Base-style theme (Inter + sizes + selected styles)
const theme = createTheme({
  typography: {
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
          fontFamily:
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontWeight: 500,
          fontSize: "0.95rem",
          letterSpacing: "-0.01em",
          color: GREEN,
          textTransform: "uppercase", // ✅ ensures labels show uppercase
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          "&.Mui-selected": {
            backgroundColor: "rgba(28, 61, 55, 0.08)",
            "&:hover": {
              backgroundColor: "rgba(28, 61, 55, 0.12)",
            },
            "& .MuiListItemText-primary": {
              fontWeight: 600,
              color: GREEN,
            },
          },
        },
      },
    },
  },
});

// ✅ Menu config (keep your routes/features, match base style)
const menuConfig = {
  client: [
    {
      label: "DASHBOARD",
      path: "/home",
      icon: <DashboardIcon sx={{ color: GREEN }} />,
    },
    {
      label: "SERVICES",
      path: "/services",
      icon: <WaterDropIcon sx={{ color: GREEN }} />,
    },
    {
      label: "BOOKING",
      path: "/booking",
      icon: <CalendarMonthIcon sx={{ color: GREEN }} />,
    },
    {
      label: "SETTINGS",
      path: "/settings",
      icon: <SettingsIcon sx={{ color: GREEN }} />,
    },
  ],
  employee: [
    {
      label: "DASHBOARD",
      path: "/employee/dashboard",
      icon: <DashboardIcon sx={{ color: GREEN }} />,
    },
    {
      label: "MY SCHEDULE",
      path: "/employee/my-schedule",
      icon: <CalendarMonthIcon sx={{ color: GREEN }} />,
    },
    {
      label: "EMPLOYEE MANAGEMENT",
      path: "/employee/employee-management",
      icon: <PeopleOutlineIcon sx={{ color: GREEN }} />,
    },
    {
      label: "SERVICE SCHEDULE",
      path: "/employee/service-schedule",
      icon: <WaterDropIcon sx={{ color: GREEN }} />,
    },
    {
      label: "FINANCES BOARD",
      path: "/employee/finances",
      icon: <SettingsIcon sx={{ color: GREEN }} />,
    },
    {
      label: "ACCOUNT",
      path: "/employee/account",
      icon: <AccountCircleIcon sx={{ color: GREEN }} />,
    },
  ],
};

export default function Navbar({ content }) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const firstName = localStorage.getItem("first_name") || "User";
  const role = localStorage.getItem("role") || "client";

  const menuItems = menuConfig[role] || menuConfig.client;

  const handleLogout = async () => {
    const token = localStorage.getItem("token");

    try {
      await fetch("http://127.0.0.1:8000/api/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
    } catch (error) {
      console.log("Logout error:", error);
    }

    localStorage.removeItem("token");
    localStorage.removeItem("first_name");
    localStorage.removeItem("role");
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
              src={ProfilePic}
              alt="Profile"
              style={{
                width: "150px",
                height: "150px",
                borderRadius: "50%",
                border: `2px solid ${GREEN}`,
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
              color: GREEN,
              letterSpacing: "-0.01em",
            }}
          >
            Welcome, {firstName}!
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
                    sx={{ py: 1, px: 2 }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </ListItemButton>
                </ListItem>
              ))}

              {/* LOGOUT DIVIDER */}
              <Box
                sx={{
                  my: 2,
                  borderTop: "1px solid rgba(28, 61, 55, 0.12)",
                }}
              />

              {/* LOGOUT */}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={handleLogout}
                  sx={{
                    py: 1,
                    px: 2,
                    borderRadius: "12px",
                    "&:hover": {
                      backgroundColor: "rgba(255, 68, 68, 0.04)",
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <LogoutIcon sx={{ color: "#ff4444" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="LOGOUT"
                    slotProps={{
                      primary: {
                        sx: {
                          color: "#ff4444",
                          fontWeight: 500,
                          letterSpacing: "-0.01em",
                        },
                      },
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
