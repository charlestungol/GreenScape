import React, { useEffect, useState } from "react";
import AxiosInstance from "../../components/AxiosInstance";

const GREEN = "#1c3d37";
const GREEN_MID = "#2e6b5e";
const GREEN_LIGHT = "#e1f5ee";

const styles = {
  page: {
    padding: "2rem",
    fontFamily: "inherit",
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: 800,
    color: GREEN,
    letterSpacing: "0.05em",
    marginBottom: "1.5rem",
  },
  container: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr",
    gap: "1.5rem",
    alignItems: "start",
  },
  card: {
    background: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "12px",
    padding: "1.5rem",
  },
  sectionTitle: {
    fontSize: "0.85rem",
    fontWeight: 800,
    color: GREEN,
    letterSpacing: "0.08em",
    marginBottom: "1.25rem",
    borderBottom: `2px solid ${GREEN_LIGHT}`,
    paddingBottom: "0.5rem",
  },
  avatarWrapper: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "1.25rem",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: "50%",
    objectFit: "cover",
    border: `3px solid ${GREEN}`,
  },
  avatarInitials: {
    width: 100,
    height: 100,
    borderRadius: "50%",
    background: GREEN_LIGHT,
    border: `3px solid ${GREEN}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
    fontWeight: 800,
    color: GREEN,
  },
  fileNote: {
    fontSize: "0.75rem",
    color: "#888",
    textAlign: "center",
  },
  fileError: {
    fontSize: "0.75rem",
    color: "#c0392b",
    textAlign: "center",
    background: "#fdecea",
    borderRadius: "6px",
    padding: "0.4rem 0.75rem",
  },
  chooseBtn: {
    display: "inline-block",
    padding: "0.4rem 1rem",
    border: `1.5px solid ${GREEN}`,
    borderRadius: "6px",
    color: GREEN,
    fontSize: "0.8rem",
    fontWeight: 800,
    cursor: "pointer",
    letterSpacing: "0.05em",
    background: "transparent",
    transition: "background 0.15s",
  },
  removeBtn: {
    padding: "0.4rem 1rem",
    border: "1.5px solid #c0392b",
    borderRadius: "6px",
    color: "#c0392b",
    fontSize: "0.8rem",
    fontWeight: 800,
    cursor: "pointer",
    background: "transparent",
  },
  saveImgBtn: {
    padding: "0.4rem 1.25rem",
    background: GREEN,
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "0.8rem",
    fontWeight: 800,
    cursor: "pointer",
    letterSpacing: "0.05em",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "1rem 1.5rem",
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
  },
  infoItemFull: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    gridColumn: "1 / -1",
  },
  infoLabel: {
    fontSize: "0.72rem",
    fontWeight: 800,
    color: "#888",
    letterSpacing: "0.08em",
  },
  infoValue: {
    fontSize: "0.95rem",
    color: "#222",
    fontWeight: 500,
  },
  divider: {
    border: "none",
    borderTop: `1px solid ${GREEN_LIGHT}`,
    margin: "1.25rem 0",
  },
  input: {
    width: "100%",
    padding: "0.5rem 0.75rem",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "0.95rem",
    boxSizing: "border-box",
    outline: "none",
    fontFamily: "inherit",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    marginBottom: "1rem",
  },
  label: {
    fontSize: "0.78rem",
    fontWeight: 700,
    color: "#555",
    letterSpacing: "0.04em",
    marginBottom: "0.2rem",
    display: "block",
  },
  btnPrimary: {
    width: "100%",
    padding: "0.55rem",
    background: GREEN,
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontWeight: 800,
    fontSize: "0.9rem",
    cursor: "pointer",
    letterSpacing: "0.03em",
  },
  btnOutlined: {
    width: "100%",
    padding: "0.55rem",
    background: "transparent",
    color: GREEN,
    border: `1.5px solid ${GREEN}`,
    borderRadius: "6px",
    fontWeight: 800,
    fontSize: "0.9rem",
    cursor: "pointer",
  },
  messageAlert: {
    padding: "0.6rem 1rem",
    borderRadius: "6px",
    marginBottom: "1rem",
    fontSize: "0.9rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    borderRadius: "12px",
    padding: "1.5rem",
    width: 380,
    maxWidth: "90vw",
    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
  },
  modalTitle: {
    fontWeight: 800,
    fontSize: "1.1rem",
    color: GREEN,
    marginBottom: "0.75rem",
  },
  modalText: {
    fontSize: "0.9rem",
    color: "#444",
    marginBottom: "1.25rem",
    lineHeight: 1.5,
  },
  modalActions: {
    display: "flex",
    gap: "0.75rem",
    justifyContent: "flex-end",
  },
  modalCancel: {
    padding: "0.45rem 1rem",
    background: "transparent",
    border: "1px solid #ccc",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: "0.85rem",
  },
  modalConfirm: {
    padding: "0.45rem 1.25rem",
    background: GREEN,
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 800,
    fontSize: "0.85rem",
  },
};

const DEFAULT_IMAGE = null;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function ConfirmModal({ open, title, message, onConfirm, onCancel, saving }) {
  if (!open) return null;
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalTitle}>{title}</div>
        <div style={styles.modalText}>{message}</div>
        <div style={styles.modalActions}>
          <button style={styles.modalCancel} onClick={onCancel} disabled={saving}>Cancel</button>
          <button style={styles.modalConfirm} onClick={onConfirm} disabled={saving}>
            {saving ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeAccount() {
  const [employeeId, setEmployeeId] = useState(localStorage.getItem("employee_id") || "");
  const [profile, setProfile] = useState({
    firstname: "",
    lastname: "",
    phonenumber: "",
    email: localStorage.getItem("email") || "",
  });

  const [password, setPassword] = useState({ old_password: "", new_password: "", confirm: "" });
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");

  const [selectedImage, setSelectedImage] = useState(localStorage.getItem("profileImage") || null);
  const [fileError, setFileError] = useState("");
  const [fileSize, setFileSize] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

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
      } catch (err) {
        console.error("Account load error:", err);
        showMessage("error", "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3500);
  };

  const formatFileSize = (bytes) => {
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`File too large. Max 5MB. Your file: ${formatFileSize(file.size)}`);
      setFileSize(file.size);
      return;
    }
    setFileError("");
    setFileSize(file.size);
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => { setSelectedImage(ev.target.result); setIsUploading(false); };
    reader.onerror = () => { setFileError("Error reading file."); setIsUploading(false); };
    reader.readAsDataURL(file);
  };

  const handleSaveImage = () => {
    if (selectedImage) {
      localStorage.setItem("profileImage", selectedImage);
      window.dispatchEvent(new Event("storage"));
      showMessage("success", "Profile picture saved!");
    }
  };

  const handleRemoveImage = () => {
    if (window.confirm("Remove your profile picture?")) {
      localStorage.removeItem("profileImage");
      window.dispatchEvent(new Event("storage"));
      setSelectedImage(null);
      setFileError("");
      setFileSize(null);
      showMessage("success", "Profile picture removed.");
    }
  };

  const hasImageChanged = () => selectedImage !== (localStorage.getItem("profileImage") || null);

  const handleUpdateEmailClick = () => {
    if (!profile.email) { showMessage("error", "Please enter a new email."); return; }
    if (!emailCurrentPassword) { showMessage("error", "Please enter your current password."); return; }
    setEmailConfirmOpen(true);
  };

  const handleEmailConfirm = async () => {
    setSaving(true);
    try {
      await AxiosInstance.patch("core/employees/me/", { email: profile.email });
      try {
        await AxiosInstance.post("change-email/", { email: profile.email, current_password: emailCurrentPassword });
      } catch {}
      localStorage.setItem("email", profile.email);
      setEmailConfirmOpen(false);
      setEmailCurrentPassword("");
      showMessage("success", "Email updated successfully.");
    } catch {
      showMessage("error", "Email update failed.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePasswordClick = () => {
    if (!password.old_password || !password.new_password || !password.confirm) {
      showMessage("error", "Please fill in all password fields."); return;
    }
    if (password.new_password !== password.confirm) {
      showMessage("error", "New passwords do not match."); return;
    }
    setPasswordConfirmOpen(true);
  };

  const handlePasswordConfirm = async () => {
    setSaving(true);
    try {
      await AxiosInstance.post("change-password/", {
        old_password: password.old_password,
        new_password: password.new_password,
      });
      setPasswordConfirmOpen(false);
      setPassword({ old_password: "", new_password: "", confirm: "" });
      showMessage("success", "Password changed successfully.");
    } catch {
      showMessage("error", "Password update failed. Check your current password and try again.");
    } finally {
      setSaving(false);
    }
  };

  const initials = `${profile.firstname?.[0] || ""}${profile.lastname?.[0] || ""}`.toUpperCase();

  const msgColors = {
    success: { background: "#e6f4ea", color: "#1c6b3a", border: "1px solid #a8d5b5" },
    error: { background: "#fdecea", color: "#8b0000", border: "1px solid #f5c6c6" },
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.title}>ACCOUNT SETTINGS</div>
        <p style={{ color: GREEN }}>Loading account...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <ConfirmModal
        open={emailConfirmOpen}
        title="Update Email"
        message={`Are you sure you want to change your email to ${profile.email}?`}
        onConfirm={handleEmailConfirm}
        onCancel={() => !saving && setEmailConfirmOpen(false)}
        saving={saving}
      />
      <ConfirmModal
        open={passwordConfirmOpen}
        title="Change Password"
        message="Are you sure you want to change your password? You'll need to use the new one next time you log in."
        onConfirm={handlePasswordConfirm}
        onCancel={() => !saving && setPasswordConfirmOpen(false)}
        saving={saving}
      />

      <div style={styles.title}>ACCOUNT SETTINGS</div>

      {message.text && (
        <div style={{ ...styles.messageAlert, ...msgColors[message.type] }}>
          <span>{message.text}</span>
          <button
            onClick={() => setMessage({ type: "", text: "" })}
            style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 800, fontSize: "1rem", color: "inherit" }}
          >×</button>
        </div>
      )}

      <div style={styles.container}>
        {/* ── Left: Profile Image ── */}
        <div style={styles.card}>
          <div style={styles.sectionTitle}>PROFILE PICTURE</div>
          <div style={styles.avatarWrapper}>
            {selectedImage
              ? <img src={selectedImage} alt="Profile" style={styles.avatar} />
              : <div style={styles.avatarInitials}>{initials || "?"}</div>
            }

            {fileSize && !fileError && (
              <span style={styles.fileNote}>Size: {formatFileSize(fileSize)}</span>
            )}
            {fileError && <div style={styles.fileError}>{fileError}</div>}
            {isUploading && <span style={styles.fileNote}>Uploading…</span>}

            <label style={styles.chooseBtn}>
              CHOOSE IMAGE
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} style={{ display: "none" }} />
            </label>

            {selectedImage && (
              <button style={styles.removeBtn} onClick={handleRemoveImage} disabled={isUploading}>REMOVE</button>
            )}

            {hasImageChanged() && !fileError && (
              <button style={styles.saveImgBtn} onClick={handleSaveImage} disabled={isUploading}>SAVE IMAGE</button>
            )}

            <span style={styles.fileNote}>Max 5MB · JPG, PNG, WEBP</span>
          </div>
        </div>

        {/* ── Right: Info + Security ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Personal Information (display-only, like ClientProfile) */}
          <div style={styles.card}>
            <div style={styles.sectionTitle}>PERSONAL INFORMATION</div>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>FIRST NAME</span>
                <span style={styles.infoValue}>{profile.firstname || "—"}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>LAST NAME</span>
                <span style={styles.infoValue}>{profile.lastname || "—"}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>EMAIL</span>
                <span style={styles.infoValue}>{profile.email || "—"}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>PHONE NUMBER</span>
                <span style={styles.infoValue}>{profile.phonenumber || "—"}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>EMPLOYEE ID</span>
                <span style={styles.infoValue}>{employeeId || "—"}</span>
              </div>
            </div>
          </div>

          {/* Security */}
          <div style={styles.card}>
            <div style={styles.sectionTitle}>SECURITY</div>

            {/* Email update */}
            <div style={styles.inputGroup}>
              <div>
                <label style={styles.label}>NEW EMAIL</label>
                <input
                  style={styles.input}
                  type="email"
                  maxLength={50}
                  value={profile.email}
                  onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div>
                <label style={styles.label}>CURRENT PASSWORD</label>
                <input
                  style={styles.input}
                  type="password"
                  maxLength={16}
                  value={emailCurrentPassword}
                  onChange={(e) => setEmailCurrentPassword(e.target.value)}
                />
              </div>
              <button style={styles.btnOutlined} onClick={handleUpdateEmailClick}>Update Email</button>
            </div>

            <hr style={styles.divider} />

            {/* Password change */}
            <div style={styles.inputGroup}>
              <div>
                <label style={styles.label}>CURRENT PASSWORD</label>
                <input
                  style={styles.input}
                  type="password"
                  maxLength={16}
                  value={password.old_password}
                  onChange={(e) => setPassword((p) => ({ ...p, old_password: e.target.value }))}
                />
              </div>
              <div>
                <label style={styles.label}>NEW PASSWORD</label>
                <input
                  style={styles.input}
                  type="password"
                  maxLength={16}
                  value={password.new_password}
                  onChange={(e) => setPassword((p) => ({ ...p, new_password: e.target.value }))}
                />
              </div>
              <div>
                <label style={styles.label}>CONFIRM NEW PASSWORD</label>
                <input
                  style={styles.input}
                  type="password"
                  maxLength={16}
                  value={password.confirm}
                  onChange={(e) => setPassword((p) => ({ ...p, confirm: e.target.value }))}
                />
              </div>
              <button style={styles.btnPrimary} onClick={handleChangePasswordClick}>Change Password</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
