import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Divider,
  Avatar,
} from "@mui/material";
import AxiosInstance from "../../components/AxiosInstance";

const GREEN = "#1c3d37";

export default function EmployeeAccount() {
  const [employeeId, setEmployeeId] = useState(localStorage.getItem("employee_id") || "");
  const [profile, setProfile] = useState({
    firstname: "",
    lastname: "",
    phonenumber: "",
    email: localStorage.getItem("email") || "",
    staffstatus: "",
  });

  const [password, setPassword] = useState({
    old_password: "",
    new_password: "",
    confirm: "",
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await AxiosInstance.get("core/employees/");
        const rows = res.data?.results || res.data || [];
        const myRow =
          rows.find((r) => String(r.employeeid) === String(employeeId)) ||
          rows[0] ||
          null;

        if (myRow) {
          setEmployeeId(String(myRow.employeeid));
          setProfile({
            firstname: myRow.firstname || "",
            lastname: myRow.lastname || "",
            phonenumber: myRow.phonenumber || "",
            email: myRow.email || localStorage.getItem("email") || "",
            staffstatus: myRow.staffstatus || "",
          });
        }
      } catch (error) {
        console.error("Account load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [employeeId]);

  const handleProfileChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setPreviewImage(preview);
      localStorage.setItem("profileImage", preview);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (employeeId) {
        await AxiosInstance.patch(`core/employees/${employeeId}/`, {
          firstname: profile.firstname,
          lastname: profile.lastname,
          phonenumber: profile.phonenumber,
          email: profile.email,
          staffstatus: profile.staffstatus,
        });
      }

      try {
        await AxiosInstance.post("change-email/", {
          email: profile.email,
        });
      } catch (emailErr) {
        console.warn("Email update endpoint warning:", emailErr);
      }

      localStorage.setItem("email", profile.email);
      localStorage.setItem("first_name", profile.firstname);
      localStorage.setItem("last_name", profile.lastname);
      alert("Profile updated successfully.");
    } catch (error) {
      console.error("Profile update error:", error);
      alert("Profile update failed.");
    }
  };

  const handleChangePassword = async () => {
    if (!password.old_password || !password.new_password || !password.confirm) {
      alert("Please fill in all password fields.");
      return;
    }

    if (password.new_password !== password.confirm) {
      alert("New password and confirm password do not match.");
      return;
    }

    try {
      await AxiosInstance.post("change-password/", {
        old_password: password.old_password,
        new_password: password.new_password,
      });

      alert("Password changed successfully.");
      setPassword({
        old_password: "",
        new_password: "",
        confirm: "",
      });
    } catch (error) {
      console.error("Password change error:", error);
      alert("Password update failed.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, color: GREEN, mb: 2 }}>
        Account Settings
      </Typography>

      {loading ? (
        <Typography>Loading account...</Typography>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: GREEN, mb: 2 }}>
              Profile Information
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
              <Avatar
                src={previewImage || localStorage.getItem("profileImage") || ""}
                sx={{
                  width: 100,
                  height: 100,
                  mb: 2,
                  border: `2px solid ${GREEN}`,
                }}
              >
                {!previewImage && profile.firstname?.[0]?.toUpperCase()}
              </Avatar>

              <Button variant="outlined" component="label" sx={{ color: GREEN, borderColor: GREEN }}>
                Upload Profile Picture
                <input type="file" hidden accept="image/*" onChange={handleImageChange} />
              </Button>

              <Typography variant="caption" sx={{ mt: 1, opacity: 0.7 }}>
                Preview works now. Saving profile pictures to backend still needs an image upload endpoint.
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="First Name"
                value={profile.firstname}
                onChange={(e) => handleProfileChange("firstname", e.target.value)}
                fullWidth
              />

              <TextField
                label="Last Name"
                value={profile.lastname}
                onChange={(e) => handleProfileChange("lastname", e.target.value)}
                fullWidth
              />

              <TextField
                label="Phone Number"
                value={profile.phonenumber}
                onChange={(e) => handleProfileChange("phonenumber", e.target.value)}
                fullWidth
              />

              <TextField
                label="Staff Status"
                value={profile.staffstatus}
                onChange={(e) => handleProfileChange("staffstatus", e.target.value)}
                fullWidth
              />

              <Button variant="contained" onClick={handleSaveProfile} sx={{ bgcolor: GREEN }}>
                Save Profile
              </Button>
            </Box>
          </Paper>

          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: GREEN, mb: 2 }}>
              Security
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Email"
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileChange("email", e.target.value)}
                fullWidth
              />

              <Button variant="outlined" onClick={handleSaveProfile} sx={{ color: GREEN, borderColor: GREEN }}>
                Update Email
              </Button>

              <Divider sx={{ my: 1 }} />

              <TextField
                label="Current Password"
                type="password"
                value={password.old_password}
                onChange={(e) => setPassword((prev) => ({ ...prev, old_password: e.target.value }))}
                fullWidth
              />

              <TextField
                label="New Password"
                type="password"
                value={password.new_password}
                onChange={(e) => setPassword((prev) => ({ ...prev, new_password: e.target.value }))}
                fullWidth
              />

              <TextField
                label="Confirm New Password"
                type="password"
                value={password.confirm}
                onChange={(e) => setPassword((prev) => ({ ...prev, confirm: e.target.value }))}
                fullWidth
              />

              <Button variant="contained" onClick={handleChangePassword} sx={{ bgcolor: GREEN }}>
                Change Password
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}