import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Divider,
  Avatar,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export default function EmployeeAccount() {
  const navigate = useNavigate();

  // Mock profile (you can later replace with API GET /me)
  const [profile, setProfile] = useState({
    name: localStorage.getItem("first_name") || "Employee",
    email: "employee@greenscape.com",
  });

  const [password, setPassword] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const handleSaveProfile = () => {
    // Frontend-only for now
    alert("Saved (frontend only). Connect to backend later.");
  };

  const handleChangePassword = () => {
    if (!password.next || password.next !== password.confirm) {
      alert("New password and confirm password must match.");
      return;
    }
    alert("Password changed (frontend only). Connect to backend later.");
    setPassword({ current: "", next: "", confirm: "" });
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, color: "#06632b", mb: 2 }}>
        My Account
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        {/* Profile card */}
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Avatar sx={{ width: 72, height: 72 }}>
              {profile.name?.[0]?.toUpperCase() || "E"}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {profile.name}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                {profile.email}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" sx={{ fontWeight: 900, color: "#06632b", mb: 1 }}>
            Edit Credentials
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <TextField
              label="Name"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            />
            <TextField
              label="Email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
            />
            <Button variant="contained" onClick={handleSaveProfile}>
              Save
            </Button>
          </Box>
        </Paper>

        {/* Password + Logout */}
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, color: "#06632b", mb: 1 }}>
            Change Password
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <TextField
              label="Current Password"
              type="password"
              value={password.current}
              onChange={(e) => setPassword((p) => ({ ...p, current: e.target.value }))}
            />
            <TextField
              label="New Password"
              type="password"
              value={password.next}
              onChange={(e) => setPassword((p) => ({ ...p, next: e.target.value }))}
            />
            <TextField
              label="Confirm New Password"
              type="password"
              value={password.confirm}
              onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
            />
            <Button variant="outlined" onClick={handleChangePassword}>
              Update Password
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" sx={{ fontWeight: 900, color: "#06632b", mb: 1 }}>
            Logout
          </Typography>
          <Button color="error" variant="contained" onClick={handleLogout}>
            Log out
          </Button>
        </Paper>
      </Box>
    </Box>
  );
}
