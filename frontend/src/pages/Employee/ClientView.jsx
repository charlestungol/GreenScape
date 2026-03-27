import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Box, Paper, Typography, TextField, List, ListItem, ListItemText,
  Divider, IconButton, Button, Avatar, Tooltip, Modal, CircularProgress,
  Alert, Stepper, Step, StepLabel, Fade
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIcon        from "@mui/icons-material/ArrowBack";
import EditIcon             from "@mui/icons-material/Edit";
import SaveIcon             from "@mui/icons-material/Save";
import CancelIcon           from "@mui/icons-material/Cancel";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import AxiosInstance from "../../components/AxiosInstance";
import PersonAddIcon from "@mui/icons-material/PersonAdd"
import HomeIcon             from "@mui/icons-material/Home";
import PersonIcon           from "@mui/icons-material/Person";
import CheckCircleIcon      from "@mui/icons-material/CheckCircle";
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from "@mui/material";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
 

// ─── Constants ────────────────────────────────────────────────────────────────
const GREEN       = "#1c3d37";
const GREEN_LIGHT = "#e8f0ef";
const GREEN_MID   = "#2e6b5e";
const API_BASE = "http://localhost:8000/core";



// ─── Helpers ──────────────────────────────────────────────────────────────────
function mapCustomer(raw) {
  return {
    id:          raw.customerid,
    customerid:  raw.customerid,
    firstname:   raw.firstname   ?? "",
    lastname:    raw.lastname    ?? "",
    name:        `${raw.firstname ?? ""} ${raw.lastname ?? ""}`.trim(),
    email:       raw.email       ?? "",
    phonenumber: raw.phonenumber ?? "",
    address:     raw.address     ?? null,
    photos:      [],
  };
}

function getInitials(name) {
  return name.split(" ").filter(Boolean).map(n => n[0]).join("").toUpperCase();
}

// ─── Field definitions ────────────────────────────────────────────────────────
const ADDRESS_FIELDS = [
  { label: "Street",      key: "street",     placeholder: "123 Main St",  col: 2 },
  { label: "City",        key: "city",       placeholder: "Calgary",      col: 1 },
  { label: "Province",    key: "province",   placeholder: "AB",           col: 1 },
  { label: "Postal Code", key: "postalcode", placeholder: "T2P 1J9",      col: 1 },
];

const CUSTOMER_FIELDS = [
  { label: "First Name",    key: "firstname",   placeholder: "John",              col: 1 },
  { label: "Last Name",     key: "lastname",    placeholder: "Doe",               col: 1 },
  { label: "Email",         key: "email",       placeholder: "john@example.com",  col: 2 },
  { label: "Phone Number",  key: "phonenumber", placeholder: "403-555-0101",      col: 2 },
];

// ─── Add Client Modal ─────────────────────────────────────────────────────────
const EMPTY_ADDRESS  = { street: "", city: "", province: "", postalcode: "" };
const EMPTY_CUSTOMER = { firstname: "", lastname: "", email: "", phonenumber: "" };
const STEPS = ["Address", "Client Details", "Done"];

function AddClientModal({ open, onClose, onCreated }) {
  const [step, setStep]           = useState(0);
  const [addrForm, setAddrForm]   = useState(EMPTY_ADDRESS);
  const [custForm, setCustForm]   = useState(EMPTY_CUSTOMER);
  const [createdAddr, setCreatedAddr] = useState(null);  // address API response
  const [createdCust, setCreatedCust] = useState(null);  // customer API response
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  // Reset everything when modal opens
  useEffect(() => {
    if (open) {
      setStep(0);
      setAddrForm(EMPTY_ADDRESS);
      setCustForm(EMPTY_CUSTOMER);
      setCreatedAddr(null);
      setCreatedCust(null);
      setError(null);
    }
  }, [open]);

  const handleAddrChange = (key) => (e) =>
    setAddrForm(f => ({ ...f, [key]: e.target.value }));

  const handleCustChange = (key) => (e) =>
    setCustForm(f => ({ ...f, [key]: e.target.value }));

  // Step 1 — POST /core/addresses/
  const handleCreateAddress = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await AxiosInstance.post("/core/addresses/", addrForm);
      setCreatedAddr(data);
      setStep(1);
    } catch (err) {
      setError(
        err.response?.data
          ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${v}`).join(" | ")
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — POST /core/customers/
  const handleCreateCustomer = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await AxiosInstance.post("/core/customers/", {
        ...custForm,
        addressid: createdAddr.addressid,
      });
      const mapped = mapCustomer(data);
      setCreatedCust(mapped);
      onCreated(mapped);   // update parent list immediately
      setStep(2);
    } catch (err) {
      setError(
        err.response?.data
          ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${v}`).join(" | ")
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  const isAddrValid = ADDRESS_FIELDS.every(f => addrForm[f.key].trim() !== "");
  const isCustValid = CUSTOMER_FIELDS.every(f => custForm[f.key].trim() !== "");

  return (
    <Modal open={open} onClose={step < 2 ? onClose : undefined}>
      <Fade in={open}>
        <Box sx={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: { xs: "92vw", sm: 520 },
          bgcolor: "background.paper",
          borderRadius: 3,
          boxShadow: 24,
          overflow: "hidden",
        }}>
          {/* ── Modal header ── */}
          <Box sx={{
            bgcolor: GREEN, px: 3, py: 2.5,
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <PersonAddIcon sx={{ color: "#fff", fontSize: 22 }} />
              <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, fontSize: "1rem" }}>
                Add New Client
              </Typography>
            </Box>
            {step < 2 && (
              <IconButton onClick={onClose} size="small" sx={{ color: "rgba(255,255,255,0.7)", "&:hover": { color: "#fff" } }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          {/* ── Stepper ── */}
          <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
            <Stepper activeStep={step} alternativeLabel>
              {STEPS.map((label, i) => (
                <Step key={label} completed={step > i}>
                  <StepLabel
                    StepIconProps={{
                      sx: {
                        "&.Mui-active":    { color: GREEN },
                        "&.Mui-completed": { color: GREEN_MID },
                      }
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: step === i ? 700 : 400 }}>
                      {label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <Divider />

          {/* ── Step 0 — Address ── */}
          {step === 0 && (
            <Box sx={{ px: 3, py: 2.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <HomeIcon sx={{ color: GREEN, fontSize: 18 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: GREEN }}>
                  Client Address
                </Typography>
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                {ADDRESS_FIELDS.map(({ label, key, placeholder, col }) => (
                  <TextField
                    key={key}
                    label={label}
                    placeholder={placeholder}
                    value={addrForm[key]}
                    onChange={handleAddrChange(key)}
                    size="small"
                    fullWidth
                    sx={{
                      gridColumn: col === 2 ? "1 / -1" : undefined,
                      "& .MuiOutlinedInput-root": { borderRadius: 2 },
                      "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: GREEN },
                      "& .MuiInputLabel-root.Mui-focused": { color: GREEN },
                    }}
                  />
                ))}
              </Box>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 3 }}>
                <Button onClick={onClose} sx={{ color: "text.secondary", textTransform: "none" }}>
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCreateAddress}
                  disabled={loading || !isAddrValid}
                  endIcon={loading ? <CircularProgress size={14} color="inherit" /> : <ArrowForwardIosIcon sx={{ fontSize: "0.75rem !important" }} />}
                  sx={{ bgcolor: GREEN, "&:hover": { bgcolor: GREEN_MID }, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                >
                  {loading ? "Saving…" : "Next"}
                </Button>
              </Box>
            </Box>
          )}

          {/* ── Step 1 — Customer details ── */}
          {step === 1 && (
            <Box sx={{ px: 3, py: 2.5 }}>
              {/* Address summary pill */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <HomeIcon sx={{ color: GREEN_MID, fontSize: 16 }} />
                <Typography variant="caption" sx={{ color: GREEN_MID, fontWeight: 600 }}>
                  {addrForm.street}, {addrForm.city}, {addrForm.province} {addrForm.postalcode}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <PersonIcon sx={{ color: GREEN, fontSize: 18 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: GREEN }}>
                  Client Details
                </Typography>
              </Box>

              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                {CUSTOMER_FIELDS.map(({ label, key, placeholder, col }) => (
                  <TextField
                    key={key}
                    label={label}
                    placeholder={placeholder}
                    value={custForm[key]}
                    onChange={handleCustChange(key)}
                    size="small"
                    fullWidth
                    sx={{
                      gridColumn: col === 2 ? "1 / -1" : undefined,
                      "& .MuiOutlinedInput-root": { borderRadius: 2 },
                      "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: GREEN },
                      "& .MuiInputLabel-root.Mui-focused": { color: GREEN },
                    }}
                  />
                ))}
              </Box>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => { setStep(0); setError(null); }}
                  sx={{ color: GREEN, textTransform: "none", fontWeight: 700 }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCreateCustomer}
                  disabled={loading || !isCustValid}
                  endIcon={loading ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
                  sx={{ bgcolor: GREEN, "&:hover": { bgcolor: GREEN_MID }, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                >
                  {loading ? "Creating…" : "Create Client"}
                </Button>
              </Box>
            </Box>
          )}

          {/* ── Step 2 — Success ── */}
          {step === 2 && createdCust && (
            <Box sx={{ px: 3, py: 4, textAlign: "center" }}>
              <CheckCircleIcon sx={{ fontSize: 56, color: GREEN, mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: GREEN, mb: 0.5 }}>
                Client Created!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {createdCust.firstname} {createdCust.lastname} has been added to your client list.
              </Typography>
              <Button
                variant="contained"
                onClick={onClose}
                sx={{ bgcolor: GREEN, "&:hover": { bgcolor: GREEN_MID }, borderRadius: 2, textTransform: "none", fontWeight: 700, px: 4 }}
              >
                Done
              </Button>
            </Box>
          )}
        </Box>
      </Fade>
    </Modal>
  );
}

// ─── Photo Lightbox ───────────────────────────────────────────────────────────
function PhotoLightbox({ photos, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);
  return (
    <Modal open onClose={onClose}>
      <Box sx={{ position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
        <IconButton onClick={onClose} sx={{ position: "absolute", top: 16, right: 16, color: "#fff" }}><CloseIcon /></IconButton>
        {photos.length > 1 && (
          <IconButton onClick={e => { e.stopPropagation(); prev(); }} sx={{ position: "absolute", left: 16, color: "#fff", bgcolor: "rgba(255,255,255,0.1)" }}>
            <NavigateBeforeIcon fontSize="large" />
          </IconButton>
        )}
        <Box component="img" src={photos[idx].dataUrl} alt={photos[idx].name} onClick={e => e.stopPropagation()}
          sx={{ maxWidth: "85vw", maxHeight: "85vh", borderRadius: 2, objectFit: "contain", boxShadow: 10 }} />
        {photos.length > 1 && (
          <IconButton onClick={e => { e.stopPropagation(); next(); }} sx={{ position: "absolute", right: 16, color: "#fff", bgcolor: "rgba(255,255,255,0.1)" }}>
            <NavigateNextIcon fontSize="large" />
          </IconButton>
        )}
        <Typography sx={{ position: "absolute", bottom: 20, color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>
          {idx + 1} / {photos.length}
        </Typography>
      </Box>
    </Modal>
  );
}

// ─── Detail / Edit Page ───────────────────────────────────────────────────────
function ClientDetailPage({ client, onBack, onSave, onDelete }) {
  const [editing, setEditing]       = useState(false);
  const [form, setForm]             = useState({ ...client });
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState(null);
  const [lightbox, setLightbox]     = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false); // ← new
  const [deleting, setDeleting]     = useState(false);   // ← new
  const fileInputRef                = useRef(null);

  const handleChange        = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
  const handleAddressChange = (field) => (e) => setForm(f => ({ ...f, address: { ...(f.address ?? {}), [field]: e.target.value } }));

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        firstname:   form.firstname,
        lastname:    form.lastname,
        email:       form.email,
        phonenumber: form.phonenumber,
        ...(form.address && {
          address: {
            street: form.address.street ?? "", city: form.address.city ?? "",
            province: form.address.province ?? "", postalcode: form.address.postalcode ?? "",
          },
        }),
      };
      const { data } = await AxiosInstance.patch(`/core/customers/${client.customerid}/`, payload);
      const updated = { ...mapCustomer(data), photos: form.photos };
      onSave(updated);
      setForm(updated);
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data ? JSON.stringify(err.response.data) : err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── DELETE /core/customers/{id}/
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await AxiosInstance.delete(`/core/customers/${client.customerid}/`);
      onDelete(client.customerid); // remove from parent list and go back
    } catch (err) {
      setSaveError(err.response?.data ? JSON.stringify(err.response.data) : err.message);
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => { setForm({ ...client }); setSaveError(null); setEditing(false); };

  const handlePhotoUpload = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setForm(f => ({ ...f, photos: [...f.photos, { id: Date.now() + Math.random(), name: file.name, dataUrl: ev.target.result }] }));
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleDeletePhoto = (photoId) => setForm(f => ({ ...f, photos: f.photos.filter(p => p.id !== photoId) }));

  const personalFields = [
    { label: "First Name", key: "firstname" }, { label: "Last Name", key: "lastname" },
    { label: "Email",      key: "email" },      { label: "Phone",     key: "phonenumber" },
  ];
  const addressFields = [
    { label: "Street",      key: "street" },  { label: "City",        key: "city" },
    { label: "Province",    key: "province" }, { label: "Postal Code", key: "postalcode" },
  ];

  return (
    <Box sx={{ flex: 1, p: 3, overflowY: "auto", maxWidth: 680 }}>
      {lightbox !== null && <PhotoLightbox photos={form.photos} startIndex={lightbox} onClose={() => setLightbox(null)} />}

      {/* ── Confirm Delete Dialog ── */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800, color: GREEN }}>Delete Client</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{client.firstname} {client.lastname}</strong>?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ color: "text.secondary", textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <DeleteForeverIcon />}
            sx={{ bgcolor: "#c62828", "&:hover": { bgcolor: "#b71c1c" }, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          >
            {deleting ? "Deleting…" : "Yes, Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Button startIcon={<ArrowBackIcon />} onClick={onBack}
        sx={{ color: GREEN, fontWeight: 700, mb: 2, textTransform: "none", pl: 0 }}>
        Back to Client List
      </Button>

      {/* ── Header card ── */}
      <Paper elevation={0} sx={{ border: `1.5px solid ${GREEN_LIGHT}`, borderRadius: 3, p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Avatar src={form.photos[0]?.dataUrl} sx={{ bgcolor: GREEN, width: 56, height: 56, fontWeight: 800, fontSize: "1.3rem" }}>
            {getInitials(`${form.firstname} ${form.lastname}`)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: GREEN, lineHeight: 1.2 }}>
              {form.firstname} {form.lastname}
            </Typography>
            <Typography variant="body2" color="text.secondary">{form.email}</Typography>
          </Box>

          {/* ── Edit + Delete buttons ── */}
          {!editing && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Edit client">
                <IconButton onClick={() => setEditing(true)}
                  sx={{ color: GREEN, border: `1.5px solid ${GREEN_LIGHT}`, borderRadius: 2 }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete client">
                <IconButton onClick={() => setConfirmOpen(true)}
                  sx={{ color: "#c62828", border: "1.5px solid #fecdd3", borderRadius: 2, "&:hover": { bgcolor: "#fef2f2" } }}>
                  <DeleteForeverIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          {personalFields.map(({ label, key }) => (
            <Box key={key}>
              {editing ? (
                <TextField label={label} value={form[key]} onChange={handleChange(key)} fullWidth size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 }, "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: GREEN }, "& .MuiInputLabel-root.Mui-focused": { color: GREEN } }} />
              ) : (
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{form[key] || "—"}</Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* ── Address card ── */}
      <Paper elevation={0} sx={{ border: `1.5px solid ${GREEN_LIGHT}`, borderRadius: 3, p: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: GREEN, mb: 1.5 }}>Address</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          {addressFields.map(({ label, key }) => (
            <Box key={key}>
              {editing ? (
                <TextField label={label} value={form.address?.[key] ?? ""} onChange={handleAddressChange(key)} fullWidth size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 }, "& .MuiOutlinedInput-root.Mui-focused fieldset": { borderColor: GREEN }, "& .MuiInputLabel-root.Mui-focused": { color: GREEN } }} />
              ) : (
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{form.address?.[key] || "—"}</Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>
      </Paper>

      {/* ── Photos card ── */}
      <Paper elevation={0} sx={{ border: `1.5px solid ${GREEN_LIGHT}`, borderRadius: 3, p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: GREEN }}>
            Photos {form.photos.length > 0 && <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>({form.photos.length})</Typography>}
          </Typography>
          <Button size="small" startIcon={<AddPhotoAlternateIcon />} onClick={() => fileInputRef.current.click()}
            sx={{ color: GREEN, fontWeight: 700, textTransform: "none", border: `1.5px solid ${GREEN_LIGHT}`, borderRadius: 2 }}>
            Add Photos
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handlePhotoUpload} />
        </Box>
        {form.photos.length === 0 ? (
          <Box onClick={() => fileInputRef.current.click()}
            sx={{ border: `2px dashed ${GREEN_LIGHT}`, borderRadius: 2, p: 4, textAlign: "center", cursor: "pointer", color: "text.secondary", "&:hover": { borderColor: GREEN, color: GREEN, bgcolor: GREEN_LIGHT }, transition: "all 0.15s" }}>
            <AddPhotoAlternateIcon sx={{ fontSize: 36, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2">Click to upload photos</Typography>
            <Typography variant="caption">PNG, JPG, GIF supported</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 1.5 }}>
            {form.photos.map((photo, idx) => (
              <Box key={photo.id} sx={{ position: "relative", borderRadius: 2, overflow: "hidden", aspectRatio: "1", cursor: "pointer",
                "&:hover .delete-btn": { opacity: 1 }, "&:hover img": { filter: "brightness(0.85)" } }}>
                <Box component="img" src={photo.dataUrl} alt={photo.name} onClick={() => setLightbox(idx)}
                  sx={{ width: "100%", height: "100%", objectFit: "cover", transition: "filter 0.15s", display: "block" }} />
                <IconButton className="delete-btn" size="small"
                  onClick={e => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                  sx={{ position: "absolute", top: 4, right: 4, bgcolor: "rgba(0,0,0,0.6)", color: "#fff",
                    opacity: 0, transition: "opacity 0.15s", width: 26, height: 26, "&:hover": { bgcolor: "rgba(200,0,0,0.8)" } }}>
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
            <Box onClick={() => fileInputRef.current.click()}
              sx={{ aspectRatio: "1", borderRadius: 2, border: `2px dashed ${GREEN_LIGHT}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "text.secondary",
                "&:hover": { borderColor: GREEN, color: GREEN, bgcolor: GREEN_LIGHT }, transition: "all 0.15s" }}>
              <AddPhotoAlternateIcon sx={{ fontSize: 28, opacity: 0.5 }} />
            </Box>
          </Box>
        )}
      </Paper>

      {saveError && <Alert severity="error" sx={{ mt: 2 }} onClose={() => setSaveError(null)}>{saveError}</Alert>}

      {editing && (
        <Box sx={{ display: "flex", gap: 1.5, mt: 2.5 }}>
          <Button variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSave} disabled={saving}
            sx={{ bgcolor: GREEN, "&:hover": { bgcolor: GREEN_MID }, borderRadius: 2, textTransform: "none", fontWeight: 700 }}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
          <Button variant="outlined" startIcon={<CancelIcon />} onClick={handleCancel} disabled={saving}
            sx={{ borderColor: GREEN, color: GREEN, borderRadius: 2, textTransform: "none", fontWeight: 700 }}>
            Cancel
          </Button>
        </Box>
      )}
    </Box>
  );
}
// ─── Main List Page ───────────────────────────────────────────────────────────
export default function EmployeeClientList() {
  const [clients, setClients]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [search, setSearch]         = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [addOpen, setAddOpen]       = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    AxiosInstance.get("/core/customers/")
      .then(({ data }) => {
        if (cancelled) return;
        const raw = Array.isArray(data) ? data : (data.results ?? []);
        setClients(raw.map(mapCustomer));
      })
      .catch(err => { if (!cancelled) setFetchError(err.response?.data?.detail ?? err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const selectedClient = clients.find(c => c.customerid === selectedId) ?? null;

  const filteredClients = useMemo(() =>
    clients.filter(c => {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phonenumber.includes(q);
    }), [search, clients]);

  const handleSave    = (updated) => setClients(prev => prev.map(c => c.customerid === updated.customerid ? updated : c));
  const handleCreated = (newClient) => setClients(prev => [newClient, ...prev]);
  const handleDelete = (deletedId) => {
    setClients(prev => prev.filter(c => c.customerid !== deletedId));
    setSelectedId(null); // go back to list
  };

  if (selectedClient) {
    return (
      <Box sx={{ display: "flex", height: "100%" }}>
        <ClientDetailPage
          client={selectedClient}
          onBack={() => setSelectedId(null)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      <Box sx={{ flex: 1, p: 3, overflowY: "auto" }}>

        {/* ── Header row ── */}
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: GREEN }}>
            Client List
          </Typography>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setAddOpen(true)}
            sx={{ bgcolor: GREEN, "&:hover": { bgcolor: GREEN_MID }, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          >
            Add Client
          </Button>
        </Box>

        {/* ── Search ── */}
        <TextField label="Search clients" variant="outlined" fullWidth value={search}
          onChange={e => setSearch(e.target.value)} sx={{ mb: 2 }} />

        {loading && <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress sx={{ color: GREEN }} /></Box>}
        {fetchError && <Alert severity="error" sx={{ mb: 2 }}>{fetchError}</Alert>}

        {!loading && !fetchError && (
          <Paper elevation={1} sx={{ borderRadius: 2 }}>
            <List disablePadding>
              {filteredClients.length === 0 && <ListItem><ListItemText primary="No clients found." /></ListItem>}
              {filteredClients.map((client, idx) => (
                <React.Fragment key={client.customerid}>
                  <ListItem
                    sx={{ py: 1.5, "&:hover": { backgroundColor: GREEN_LIGHT, cursor: "pointer" }, transition: "background 0.15s" }}
                    secondaryAction={
                      <Tooltip title="View details">
                        <IconButton edge="end" size="small" onClick={() => setSelectedId(client.customerid)} sx={{ color: GREEN }}>
                          <ArrowForwardIosIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                    onClick={() => setSelectedId(client.customerid)}
                  >
                    <Avatar sx={{ bgcolor: GREEN, width: 38, height: 38, fontSize: "0.85rem", fontWeight: 700, mr: 2 }}>
                      {getInitials(client.name)}
                    </Avatar>
                    <ListItemText
                      primary={<Typography fontWeight={700} fontSize="0.95rem">{client.name}</Typography>}
                      secondary={<Typography component="span" variant="body2" color="text.secondary">{client.email} · {client.phonenumber}</Typography>}
                    />
                  </ListItem>
                  {idx < filteredClients.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}
      </Box>

      {/* ── Add Client Modal ── */}
      <AddClientModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={handleCreated}
      />
    </Box>
  );
}