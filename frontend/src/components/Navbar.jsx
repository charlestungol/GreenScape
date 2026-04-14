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
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";

import DashboardIcon from "@mui/icons-material/Dashboard";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";

import Logo from "../assets/img/Logo.png";
import DefaultProfilePic from "../assets/img/Profile.webp";

import { Link, useLocation, useNavigate } from "react-router-dom";
import AxiosInstance from "./AxiosInstance";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const GREEN = "#1c3d37";
const drawerWidth = 300;

const theme = createTheme({
  typography: {
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
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
          fontFamily:
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontWeight: 500,
          fontSize: "0.95rem",
          letterSpacing: "-0.01em",
          color: GREEN,
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

const menuConfig = {
  client: [
    { label: "DASHBOARD", path: "/home", icon: <DashboardIcon sx={{ color: "#1c3d37" }} /> },
    { label: "SERVICES", path: "/services", icon: <WaterDropIcon sx={{ color: "#1c3d37" }} /> },
    { label: "BOOKING", path: "/booking", icon: <CalendarMonthIcon sx={{ color: "#1c3d37" }} /> },
    { label: "SETTINGS", path: "/settings", icon: <SettingsIcon sx={{ color: "#1c3d37" }} /> },
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
      label: "BOOKING REQUESTS",
      path: "/employee/booking-requests",
      icon: <AssignmentTurnedInIcon sx={{ color: GREEN }} />,
    },
    {
      label: "SERVICE SCHEDULE",
      path: "/employee/service-schedule",
      icon: <WaterDropIcon sx={{ color: GREEN }} />,
    },
    {
      label: "FINANCES BOARD",
      path: "/employee/finances",
      icon: <RequestQuoteIcon sx={{ color: GREEN }} />,
    },
    {
      label: "CLIENT VIEW",
      path: "/employee/client-view",
      icon: <PeopleOutlineIcon sx={{ color: GREEN }} />,
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
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bottomNavValue, setBottomNavValue] = useState(0);
  const [userData, setUserData] = useState({ firstName: "User", role: "client" });
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchUserData = async () => {
    setIsLoading(true);
    const profileReady = localStorage.getItem("profile_ready") === "true";
    try {
      const role = localStorage.getItem("role"); // customer | employee | superadmin
      const group = localStorage.getItem("group");

      if (!role) return;

      //CUSTOMER
      if (role === "client") {
        
        if (!profileReady) {
              //customer EXISTS logically but profile is incomplete
              setUserData({
                  firstName: "User",
                  role: "client",
                });
                setIsLoading(false);
                return;
              }

              const res = await AxiosInstance.get("core/customers/me/");
              setUserData({
                firstName: res.data.firstname || "User",
                role: "client",
              });
          return;
        }

      //EMPLOYEE
      if (role === "employee" && group?.toLowerCase() !== "superadmin") {
        const res = await AxiosInstance.get("core/employees/me/");
        setUserData({
          firstName:
            res.data.firstname ||
            res.data.user?.email?.split("@")[0] ||
            "Employee",
          role: "employee",
        });
        return;
      }

      //SUPERADMIN (NO PROFILE)
      if (group?.toLowerCase() === "superadmin") {
        setUserData({
          firstName: localStorage.getItem("first_name") || "Super Admin",
          role: "employee", // UI role
        });
        return;
      }
    } catch (err) {
      if (err?.response) {
        console.warn(
          "User fetch failed:",
          err.response.status,
          err.response.data
        );
      } } finally {
        setIsLoading(false);
          }
  };


  useEffect(() => {
    fetchUserData();
  }, []);

  const menuItems = menuConfig[userData.role] || menuConfig.client;

  // Create bottom nav items: first 4 menu items + logout button
  const bottomNavItems = [
    ...menuItems.slice(0, 4),
    { label: "LOGOUT", path: "logout", icon: <LogoutIcon sx={{ color: "#9e2c2c" }} /> }
  ];

  // Find current index for bottom navigation
  useEffect(() => {
    const currentIndex = bottomNavItems.findIndex(item => item.path === path);
    if (currentIndex !== -1) {
      setBottomNavValue(currentIndex);
    }
  }, [path, bottomNavItems]);

  const handleLogout = async () => {
    const userId = localStorage.getItem("user_id");
    const role = localStorage.getItem("role");

    if (userId && role === "client") {
      const userDataKeys = [
        "userBudget",
        "userExpenses",
        "userServices",
        "userBookings",
        "userSettings",
        "first_name",
        "role",
      ];

      userDataKeys.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value) {
          localStorage.setItem(`user_${userId}_${key}`, value);
        }
      });
    }


    try {
      await AxiosInstance.post("logout/");
    } catch (error) {
      if (error.response?.status !== 401) {
        console.warn("Unexpected logout error:", error);
      }
    }


    [
      "token",
      "access",
      "refresh",
      "user_id",
      "employee_id",
      "employee_number",
      "first_name",
      "last_name",
      "email",
      "role",
      "group",
    ].forEach((key) => localStorage.removeItem(key));

    [
      "userBudget",
      "userExpenses",
      "userServices",
      "userBookings",
      "userSettings",
      "profileImage",
    ].forEach((key) => localStorage.removeItem(key));

    sessionStorage.clear();
    setUserData({ firstName: "User", role: "client" });

    navigate("/", { replace: true });
  };

  const [profileImage, setProfileImage] = useState(() => {
    const savedImage = localStorage.getItem("profileImage");
    return savedImage || DefaultProfilePic;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const savedImage = localStorage.getItem("profileImage");
      setProfileImage(savedImage || DefaultProfilePic);
    };

    const interval = setInterval(handleStorageChange, 1000);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
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

  const profileLink =
    userData.role === "employee" ? "/employee/account" : "/client-profile";

  const drawer = (
    <>
      <Toolbar />

      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <img src={Logo} alt="Logo" style={{ width: isMobile ? "150px" : "200px" }} />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <Link to={profileLink} onClick={handleDrawerClose} style={{ textDecoration: "none" }}>
          <img
            src={profileImage}
            alt="Profile"
            style={{
              width: isMobile ? "100px" : "150px",
              height: isMobile ? "100px" : "150px",
              borderRadius: "50%",
              border: `2px solid ${GREEN}`,
              objectFit: "cover",
              cursor: "pointer",
            }}
          />
        </Link>
      </Box>

      <Typography
        variant="h6"
        sx={{
          mb: 4,
          textAlign: "center",
          fontWeight: 500,
          fontSize: isMobile ? "1rem" : "1.2rem",
          color: GREEN,
          letterSpacing: "-0.01em",
        }}
      >
        {isLoading ? "Loading..." : `Welcome, ${userData.firstName}!`}
      </Typography>

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
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}

          <Box
            sx={{
              my: 2,
              borderTop: "1px solid rgba(28, 61, 55, 0.12)",
            }}
          />

          <ListItem disablePadding>
            <ListItemButton
              onClick={() => {
                handleLogout();
                handleDrawerClose();
              }}
              sx={{
                py: 1,
                px: 2,
                "&:hover": {
                  backgroundColor: "rgba(255, 68, 68, 0.04)",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LogoutIcon sx={{ color: "#9e2c2c" }} />
              </ListItemIcon>
              <ListItemText
                primary="LOGOUT"
                sx={{
                  "& .MuiListItemText-primary": {
                    color: "#9e2c2c !important",
                    fontWeight: 500,
                  },
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </>
  );

  const handleBottomNavChange = (event, newValue) => {
    const selectedItem = bottomNavItems[newValue];
    
    if (selectedItem.label === "LOGOUT") {
      handleLogout();
    } else {
      setBottomNavValue(newValue);
      navigate(selectedItem.path);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", pb: { xs: "56px", md: 0 } }}>
        {/* Mobile AppBar */}
        <AppBar
          position="fixed"
          sx={{
            display: { xs: "flex", md: "none" },
            backgroundColor: "#F8F8F8",
            color: GREEN,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
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
              <img src={Logo} alt="Logo" style={{ height: "40px" }} />
            </Typography>

            <Link to={profileLink} onClick={handleDrawerClose}>
              <img
                src={profileImage}
                alt="Profile"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: `2px solid ${GREEN}`,
                  objectFit: "cover",
                  cursor: "pointer",
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
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
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
            display: { xs: "none", md: "block" },
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

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, md: 3 },
            width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
            mt: { xs: "56px", md: 0 },
            mb: { xs: "56px", md: 0 },
            minHeight: "100vh",
          }}
        >
          {content}
        </Box>

        {/* Bottom Navigation Bar for Mobile - 5 items including logout */}
        <Paper
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            display: { xs: "block", md: "none" },
            zIndex: 1100,
            backgroundColor: "#F8F8F8",
            borderTop: "1px solid rgba(28, 61, 55, 0.12)",
          }}
          elevation={3}
        >
          <BottomNavigation
            showLabels
            value={bottomNavValue}
            onChange={handleBottomNavChange}
            sx={{
              backgroundColor: "#F8F8F8",
              height: "56px",
              "& .MuiBottomNavigationAction-root": {
                color: "#8a9e98",
                "&.Mui-selected": {
                  color: GREEN,
                },
              },
            }}
          >
            {bottomNavItems.map((item, index) => (
              <BottomNavigationAction
                key={index}
                label={item.label}
                icon={React.cloneElement(item.icon, { 
                  sx: { 
                    color: item.label === "LOGOUT" ? "#9e2c2c" : "inherit",
                    fontSize: "24px"
                  } 
                })}
                sx={{
                  "& .MuiBottomNavigationAction-label": {
                    color: item.label === "LOGOUT" ? "#9e2c2c" : "inherit",
                  },
                }}
              />
            ))}
          </BottomNavigation>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}