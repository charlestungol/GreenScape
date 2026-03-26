import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import AxiosInstance from "../../components/AxiosInstance";

const GREEN = "#1c3d37";
const GREEN_MID = "#2e6b5e";

export default function EmployeeAccount() {
  const [employeeId, setEmployeeId] = useState(localStorage.getItem("employee_id") || "");
  const [profile, setProfile] = useState({
    firstname: "",
    lastname: "",
    phonenumber: "",
    email: localStorage.getItem("email") || "",
  });

  const [password, setPassword] = useState({
    old_password: "",
    new_password: "",
    confirm: "",
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Confirmation dialog state
  const [emailConfirmOpen, setEmailConfirmOpen] = useState(false);
  const [passwordConfirmOpen, setPasswordConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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
        });
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

  // ── Email confirmation ──
  const handleEmailConfirm = async () => {
    setSaving(true);
    try {
      if (employeeId) {
        await AxiosInstance.patch(`core/employees/${employeeId}/`, {
          email: profile.email,
        });
      }
      try {
        await AxiosInstance.post("change-email/", { email: profile.email });
      } catch (emailErr) {
        console.warn("Email update endpoint warning:", emailErr);
      }
      localStorage.setItem("email", profile.email);
      setEmailConfirmOpen(false);
      alert("Email updated successfully.");
    } catch (error) {
      console.error("Email update error:", error);
      alert("Email update failed.");
    } finally {
      setSaving(false);
    }
  };

  // ── Password confirmation ──
  const handlePasswordConfirm = async () => {
    setSaving(true);
    try {
      await AxiosInstance.post("change-password/", {
        old_password: password.old_password,
        new_password: password.new_password,
      });
      setPasswordConfirmOpen(false);
      alert("Password changed successfully.");
      setPassword({ old_password: "", new_password: "", confirm: "" });
    } catch (error) {
      console.error("Password change error:", error);
      alert("Password update failed. Make sure your current password is correct and that new password falls within guidelines");
    } finally {
      setSaving(false);
    }
  };

  // ── Validate before opening password dialog ──
  const handleChangePasswordClick = () => {
    if (!password.old_password || !password.new_password || !password.confirm) {
      alert("Please fill in all password fields.");
      return;
    }
    if (password.new_password !== password.confirm) {
      alert("New password and confirm password do not match.");
      return;
    }
    setPasswordConfirmOpen(true);
  };

  const btnStyle = {
    bgcolor: GREEN,
    "&:hover": { bgcolor: GREEN_MID },
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 700,
  };

  const outlinedBtnStyle = {
    color: GREEN,
    borderColor: GREEN,
    borderRadius: 2,
    textTransform: "none",
    fontWeight: 700,
    "&:hover": { borderColor: GREEN_MID, color: GREEN_MID },
  };

  const cancelBtnStyle = { color: "text.secondary", textTransform: "none" };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, color: GREEN, mb: 2 }}>
        Account Settings
      </Typography>

      {/* ── Email Confirmation Dialog ── */}
      <Dialog open={emailConfirmOpen} onClose={() => !saving && setEmailConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800, color: GREEN }}>Update Email</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to change your email to{" "}
            <strong>{profile.email}</strong>? You may need to verify your new email address.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEmailConfirmOpen(false)} disabled={saving} sx={cancelBtnStyle}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleEmailConfirm}
            disabled={saving}
            endIcon={saving && <CircularProgress size={14} color="inherit" />}
            sx={btnStyle}
          >
            {saving ? "Updating…" : "Yes, Update Email"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Password Confirmation Dialog ── */}
      <Dialog open={passwordConfirmOpen} onClose={() => !saving && setPasswordConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800, color: GREEN }}>Change Password</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to change your password? You will need to use your new password next time you log in.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPasswordConfirmOpen(false)} disabled={saving} sx={cancelBtnStyle}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePasswordConfirm}
            disabled={saving}
            endIcon={saving && <CircularProgress size={14} color="inherit" />}
            sx={btnStyle}
          >
            {saving ? "Changing…" : "Yes, Change Password"}
          </Button>
        </DialogActions>
      </Dialog>

      {loading ? (
        <Typography>Loading account...</Typography>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          {/* ── Profile Info ── */}
          <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: GREEN, mb: 2 }}>
              Profile Information
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
              <Avatar
                src={previewImage || localStorage.getItem("profileImage") || ""}
                sx={{ width: 100, height: 100, mb: 2, border: `2px solid ${GREEN}` }}
              >
                {!previewImage && profile.firstname?.[0]?.toUpperCase()}
              </Avatar>

              <Button variant="outlined" component="label" sx={outlinedBtnStyle}>
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
              <Button variant="contained" onClick={handleSaveProfile} sx={btnStyle}>
                Save Profile
              </Button>
            </Box>
          </Paper>

          {/* ── Security ── */}
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
              <Button
                variant="outlined"
                onClick={() => setEmailConfirmOpen(true)}
                sx={outlinedBtnStyle}
              >
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
              <Button variant="contained" onClick={handleChangePasswordClick} sx={btnStyle}>
                Change Password
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
