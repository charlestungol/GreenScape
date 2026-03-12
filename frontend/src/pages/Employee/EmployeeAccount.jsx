import React, { useState, useEffect } from "react";
import { Box, Typography, Paper, TextField, Button, Divider, Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AxiosInstance from "../../components/AxiosInstance";

export default function EmployeeAccount() {
  const navigate = useNavigate();

  const userId = localStorage.getItem("user_id");
  const storedFirst = (localStorage.getItem(`user_${userId}_first_name`) || "").trim();

  const [profile, setProfile] = useState({
    name: storedFirst || "Employee",
    email: "employee@greenscape.com",
  });

  const [password, setPassword] = useState({
    current: "",
    next: "",
    confirm: ""
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
  const fetchProfileImage = async () => {
    try {
      const response = await AxiosInstance.get("/core/user-images/");

      if (response.data.length > 0) {
        const latestImage = response.data.at(-1);

        setProfileImage(
          `${process.env.REACT_APP_API_URL}/core/user-images/${latestImage.id}/bytes/`
        );
      }

    } catch (error) {
      console.log("No profile image yet");
    }
  };

  fetchProfileImage();
}, []);

  const handleUpload = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await AxiosInstance.post(
    "/core/user-images/",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

  const handleImageChange = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (imagePreview) {
    URL.revokeObjectURL(imagePreview);
  }

  setImageFile(file);
  setImagePreview(URL.createObjectURL(file));
};

  const handleSaveProfile = async () => {
  if (!imageFile) {
    alert("Please select an image first.");
    return;
  }
  try {
    const data = await handleUpload(imageFile);

    setProfileImage(
      `${process.env.REACT_APP_API_URL}/core/user-images/${data.id}/bytes/`
    );

    setImagePreview(null);
    setImageFile(null);

    alert("Profile updated!");

  } catch (error) {
    console.error("Profile update error:", error);
    alert("Failed to update profile");
  }
};
  const handleChangePassword = () => {
    if (!password.next || password.next !== password.confirm) {
      alert("New password and confirm password must match.");
      return;
    }

    alert("Password changed (frontend only). Connect to backend later.");

    setPassword({ current: "",  next: "",  confirm: ""});
  };

  const handleLogout = async () => {
    try {
      await AxiosInstance.post("/dj-rest-auth/logout/");
    } catch (error) {
      console.log("Logout error:", error);
    }

    if (userId) {
      localStorage.removeItem(`user_${userId}_first_name`);
      localStorage.removeItem(`user_${userId}_last_name`);
      localStorage.removeItem(`user_${userId}_role`);
      localStorage.removeItem(`user_${userId}_email`);
    }

    localStorage.removeItem("user_id");
    navigate("/");
  };

  return (
    <Box sx={{ p: 3 }}>

      <Typography
        variant="h4"
        sx={{ fontWeight: 900, color: "#06632b", mb: 3 }}
      >
        My Account
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 3
        }}
      >

        {/* PROFILE CARD */}

        <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              mb: 3
            }}
          >

            <Box>

              <Avatar
                src={imagePreview || profileImage || ""}
                sx={{
                  width: 96,
                  height: 96,
                  fontSize: 40,
                  bgcolor: "#1e211f"
                }}
              >
                {!(imagePreview || profileImage) && (profile.name?.[0]?.toUpperCase() || "E")}
              </Avatar>

              <Button
                component="label"
                size="small"
                sx={{ mt: 1 }}
              >
                Upload Photo
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>

            </Box>

            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {profile.name}
              </Typography>

              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                {profile.email}
              </Typography>
            </Box>

          </Box>

          <Divider sx={{ mb: 2 }} />

          <Typography
            variant="h6"
            sx={{ fontWeight: 900, color: "#06632b", mb: 2 }}
          >
            Edit Credentials
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            <TextField
              label="Name"
              value={profile.name}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  name: e.target.value
                }))
              }
            />

            <TextField
              label="Email"
              value={profile.email}
              onChange={(e) =>
                setProfile((p) => ({
                  ...p,
                  email: e.target.value
                }))
              }
            />

            <Button
              variant="contained"
              sx={{
                mt: 1,
                backgroundColor: "#06632b",
                "&:hover": { backgroundColor: "#04481f" }
              }}
              onClick={handleSaveProfile}
            >
              Save Profile
            </Button>

          </Box>
        </Paper>


        {/* PASSWORD + LOGOUT */}

        <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>

          <Typography
            variant="h6"
            sx={{ fontWeight: 900, color: "#06632b", mb: 2 }}
          >
            Change Password
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            <TextField
              label="Current Password"
              type="password"
              value={password.current}
              onChange={(e) =>
                setPassword((p) => ({
                  ...p,
                  current: e.target.value
                }))
              }
            />

            <TextField
              label="New Password"
              type="password"
              value={password.next}
              onChange={(e) =>
                setPassword((p) => ({
                  ...p,
                  next: e.target.value
                }))
              }
            />

            <TextField
              label="Confirm New Password"
              type="password"
              value={password.confirm}
              onChange={(e) =>
                setPassword((p) => ({
                  ...p,
                  confirm: e.target.value
                }))
              }
            />

            <Button
              variant="outlined"
              onClick={handleChangePassword}
            >
              Update Password
            </Button>

          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography
            variant="h6"
            sx={{ fontWeight: 900, color: "#06632b", mb: 1 }}
          >
            Logout
          </Typography>

          <Button
            color="error"
            variant="contained"
            onClick={handleLogout}
          >
            Log out
          </Button>

        </Paper>

      </Box>

    </Box>
  );
}