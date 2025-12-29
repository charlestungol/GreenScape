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

import Logo from "../assets/img/Logo.png";
import ProfilePic from "../assets/img/Profile.jpg";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({
  typography: { fontFamily: "'Courier New', monospace" },
});

const drawerWidth = 300;

export default function Navbar({ content }) {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const firstName = localStorage.getItem("first_name") || "User";
  const role = localStorage.getItem("role");

  const routes = {
    dashboard: role === "employee" ? "/employeeHome" : "/home",
    services: "/services",
    booking: "/booking",
    settings: "/settings",
  };

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
    navigate("/");
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
              color: "#06632b",
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
                border: "2px solid #06632b",
                objectFit: "cover",
              }}
            />
          </Box>

          <Typography
            sx={{
              mb: 4,
              textAlign: "center",
              color: "#06632b",
              fontWeight: "bold",
              fontSize: "1.2rem",
            }}
          >
            Welcome, {firstName}!
          </Typography>

          {/* MENU */}
          <Box sx={{ overflow: "auto" }}>
            <List>

              {/* Dashboard */}
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to={routes.dashboard}
                  selected={path === routes.dashboard}
                >
                  <ListItemIcon>
                    <DashboardIcon sx={{ color: "#06632b" }} />
                  </ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItemButton>
              </ListItem>

              {/* Services */}
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to={routes.services}
                  selected={path === routes.services}
                >
                  <ListItemIcon>
                    <WaterDropIcon sx={{ color: "#06632b" }} />
                  </ListItemIcon>
                  <ListItemText primary="Services" />
                </ListItemButton>
              </ListItem>

              {/* Booking */}
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to={routes.booking}
                  selected={path === routes.booking}
                >
                  <ListItemIcon>
                    <CalendarMonthIcon sx={{ color: "#06632b" }} />
                  </ListItemIcon>
                  <ListItemText primary="Booking" />
                </ListItemButton>
              </ListItem>

              {/* Settings */}
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to={routes.settings}
                  selected={path === routes.settings}
                >
                  <ListItemIcon>
                    <SettingsIcon sx={{ color: "#06632b" }} />
                  </ListItemIcon>
                  <ListItemText primary="Settings" />
                </ListItemButton>
              </ListItem>

              {/* LOGOUT */}
              <ListItem disablePadding>
                <ListItemButton onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon sx={{ color: "#06632b" }} />
                  </ListItemIcon>
                  <ListItemText primary="Logout" />
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
