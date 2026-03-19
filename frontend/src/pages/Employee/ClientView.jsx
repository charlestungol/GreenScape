import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Box, Paper, Typography, TextField, Select, MenuItem,
  InputLabel, FormControl, List, ListItem, ListItemText,
  Divider, IconButton, Button, Chip, Avatar, Tooltip, Modal
} from "@mui/material";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

const GREEN = "#1c3d37";
const GREEN_LIGHT = "#e8f0ef";
const GREEN_MID = "#2e6b5e";

useEffect (() => {
  const fetchCustomers = async () => {
    try {
      const res = await AxiosInstance.get("/core/customers/")
      const raw = Array.isArray(res.data) ? res.data : (res.data.results || []);

      const mapped = raw.map( c=> ({
        id: c.customerid,
        name: `${c.firstname} ${c.lastname}`.trim(),
        email: c.email,
        phone: c.phonenumber,
        address: c.address,
        original: c,
      }))

      setClients(mapped);
    }
    catch (err) {
      console.error("Failed to load customer:", err)
    }
  };
  fetchCustomers()
}, [])

function StatusChip({ status }) {
  return (
    <Chip
      label={status}
      size="small"
      sx={{
        backgroundColor: status === "Active" ? "#d4edda" : "#f8d7da",
        color: status === "Active" ? "#155724" : "#721c24",
        fontWeight: 700,
        fontSize: "0.7rem",
        height: 22,
      }}
    />
  );
}

// Photo Light Box (image gallery)
function PhotoLightbox({ photos, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);

  return (
    <Modal open onClose={onClose}>
      <Box sx={{
        position: "fixed", inset: 0, bgcolor: "rgba(0,0,0,0.88)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
        onClick={onClose}
      >
        {/* Close */}
        <IconButton onClick={onClose} sx={{ position: "absolute", top: 16, right: 16, color: "#fff" }}>
          <CloseIcon />
        </IconButton>

        {/* Prev */}
        {photos.length > 1 && (
          <IconButton onClick={e => { e.stopPropagation(); prev(); }}
            sx={{ position: "absolute", left: 16, color: "#fff", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}>
            <NavigateBeforeIcon fontSize="large" />
          </IconButton>
        )}

        <Box
          component="img"
          src={photos[idx].dataUrl}
          alt={photos[idx].name}
          onClick={e => e.stopPropagation()}
          sx={{ maxWidth: "85vw", maxHeight: "85vh", borderRadius: 2, objectFit: "contain", boxShadow: 10 }}
        />

        {/* Next */}
        {photos.length > 1 && (
          <IconButton onClick={e => { e.stopPropagation(); next(); }}
            sx={{ position: "absolute", right: 16, color: "#fff", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.2)" } }}>
            <NavigateNextIcon fontSize="large" />
          </IconButton>
        )}

        {/* Counter */}
        <Typography sx={{ position: "absolute", bottom: 20, color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>
          {idx + 1} / {photos.length}
        </Typography>
      </Box>
    </Modal>
  );
}

// Detail / Edit Page
function ClientDetailPage({ client, onBack, onSave }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...client, photos: client.photos || [] });
  const [lightbox, setLightbox] = useState(null); // index or null
  const fileInputRef = useRef(null);

  const handleChange = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = () => {
    onSave(form);
    setEditing(false);
  };

  const handleCancel = () => {
    setForm({ ...client, photos: client.photos || [] });
    setEditing(false);
  };

  // Photo upload — convert to base64 dataUrl for in-memory storage
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setForm(f => ({
          ...f,
          photos: [...f.photos, { id: Date.now() + Math.random(), name: file.name, dataUrl: ev.target.result }]
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleDeletePhoto = (photoId) => {
    setForm(f => ({ ...f, photos: f.photos.filter(p => p.id !== photoId) }));
  };

  const fields = [
    { label: "Full Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Phone", key: "phone" },
    { label: "Company", key: "company" },
  ];

  return (
    <Box sx={{ flex: 1, p: 3, overflowY: "auto", maxWidth: 680 }}>
      {lightbox !== null && (
        <PhotoLightbox photos={form.photos} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}

      {/* Back button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onBack}
        sx={{ color: GREEN, fontWeight: 700, mb: 2, textTransform: "none", pl: 0 }}
      >
        Back to Client List
      </Button>

      {/* Header card */}
      <Paper elevation={0} sx={{ border: `1.5px solid ${GREEN_LIGHT}`, borderRadius: 3, p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Avatar
            src={form.photos.length > 0 ? form.photos[0].dataUrl : undefined}
            sx={{ bgcolor: GREEN, width: 56, height: 56, fontWeight: 800, fontSize: "1.3rem" }}
          >
            {getInitials(form.name)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: GREEN, lineHeight: 1.2 }}>
              {form.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">{form.company}</Typography>
          </Box>
          <StatusChip status={form.status} />
          {!editing && (
            <Tooltip title="Edit client">
              <IconButton
                onClick={() => setEditing(true)}
                sx={{ color: GREEN, border: `1.5px solid ${GREEN_LIGHT}`, borderRadius: 2, ml: 1 }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Fields */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
          {fields.map(({ label, key }) => (
            <Box key={key}>
              {editing ? (
                <TextField
                  label={label}
                  value={form[key]}
                  onChange={handleChange(key)}
                  fullWidth
                  size="small"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
                />
              ) : (
                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {label}
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, color: "#1a1a1a" }}>
                    {form[key] || "—"}
                  </Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>

        {/* Status dropdown when editing */}
        {editing && (
          <Box sx={{ mt: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={form.status} onChange={handleChange("status")} label="Status" sx={{ borderRadius: 2 }}>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </Paper>

      {/* Notes */}
      <Paper elevation={0} sx={{ border: `1.5px solid ${GREEN_LIGHT}`, borderRadius: 3, p: 3, mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: GREEN, mb: 1.5 }}>
          Notes
        </Typography>
        {editing ? (
          <TextField
            value={form.notes}
            onChange={handleChange("notes")}
            multiline
            minRows={3}
            fullWidth
            size="small"
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {form.notes || "No notes yet."}
          </Typography>
        )}
      </Paper>

      {/* Photos */}
      <Paper elevation={0} sx={{ border: `1.5px solid ${GREEN_LIGHT}`, borderRadius: 3, p: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: GREEN }}>
            Photos {form.photos.length > 0 && (
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                ({form.photos.length})
              </Typography>
            )}
          </Typography>
          <Tooltip title="Upload photos">
            <Button
              size="small"
              startIcon={<AddPhotoAlternateIcon />}
              onClick={() => fileInputRef.current.click()}
              sx={{ color: GREEN, fontWeight: 700, textTransform: "none", border: `1.5px solid ${GREEN_LIGHT}`, borderRadius: 2 }}
            >
              Add Photos
            </Button>
          </Tooltip>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handlePhotoUpload}
          />
        </Box>

        {form.photos.length === 0 ? (
          <Box
            onClick={() => fileInputRef.current.click()}
            sx={{
              border: `2px dashed ${GREEN_LIGHT}`,
              borderRadius: 2,
              p: 4,
              textAlign: "center",
              cursor: "pointer",
              color: "text.secondary",
              "&:hover": { borderColor: GREEN, color: GREEN, bgcolor: GREEN_LIGHT },
              transition: "all 0.15s",
            }}
          >
            <AddPhotoAlternateIcon sx={{ fontSize: 36, mb: 1, opacity: 0.5 }} />
            <Typography variant="body2">Click to upload photos</Typography>
            <Typography variant="caption">PNG, JPG, GIF supported</Typography>
          </Box>
        ) : (
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 1.5 }}>
            {form.photos.map((photo, idx) => (
              <Box
                key={photo.id}
                sx={{ position: "relative", borderRadius: 2, overflow: "hidden", aspectRatio: "1", cursor: "pointer", "&:hover .delete-btn": { opacity: 1 }, "&:hover img": { filter: "brightness(0.85)" } }}
              >
                <Box
                  component="img"
                  src={photo.dataUrl}
                  alt={photo.name}
                  onClick={() => setLightbox(idx)}
                  sx={{ width: "100%", height: "100%", objectFit: "cover", transition: "filter 0.15s", display: "block" }}
                />
                <IconButton
                  className="delete-btn"
                  size="small"
                  onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                  sx={{
                    position: "absolute", top: 4, right: 4,
                    bgcolor: "rgba(0,0,0,0.6)", color: "#fff",
                    opacity: 0, transition: "opacity 0.15s",
                    width: 26, height: 26,
                    "&:hover": { bgcolor: "rgba(200,0,0,0.8)" },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
            {/* Add more tile */}
            <Box
              onClick={() => fileInputRef.current.click()}
              sx={{
                aspectRatio: "1", borderRadius: 2,
                border: `2px dashed ${GREEN_LIGHT}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "text.secondary",
                "&:hover": { borderColor: GREEN, color: GREEN, bgcolor: GREEN_LIGHT },
                transition: "all 0.15s",
              }}
            >
              <AddPhotoAlternateIcon sx={{ fontSize: 28, opacity: 0.5 }} />
            </Box>
          </Box>
        )}
      </Paper>

      {/* Save / Cancel */}
      {editing && (
        <Box sx={{ display: "flex", gap: 1.5, mt: 2.5 }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{ bgcolor: GREEN, "&:hover": { bgcolor: GREEN_MID }, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          >
            Save Changes
          </Button>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={handleCancel}
            sx={{ borderColor: GREEN, color: GREEN, borderRadius: 2, textTransform: "none", fontWeight: 700 }}
          >
            Cancel
          </Button>
        </Box>
      )}
    </Box>
  );
}

// Main Client List Page
export default function EmployeeClientList() {
  const [clients, setClients] = useState(initialClientsData);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedClientId, setSelectedClientId] = useState(null);

  const selectedClient = clients.find(c => c.id === selectedClientId) || null;

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filterStatus === "All" || c.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [search, filterStatus, clients]);

  const handleSave = (updated) => {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  if (selectedClient) {
    return (
      <Box sx={{ display: "flex", height: "100%" }}>
        <ClientDetailPage
          client={selectedClient}
          onBack={() => setSelectedClientId(null)}
          onSave={handleSave}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", height: "100%" }}>
      <Box sx={{ flex: 1, p: 3, overflowY: "auto" }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: GREEN, mb: 2 }}>
          Client List
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            label="Search clients"
            variant="outlined"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FormControl variant="outlined" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Paper elevation={1} sx={{ borderRadius: 2 }}>
          <List disablePadding>
            {filteredClients.length === 0 && (
              <ListItem>
                <ListItemText primary="No clients found." />
              </ListItem>
            )}
            {filteredClients.map((client, idx) => (
              <React.Fragment key={client.id}>
                <ListItem
                  sx={{
                    py: 1.5,
                    "&:hover": { backgroundColor: GREEN_LIGHT, cursor: "pointer" },
                    transition: "background 0.15s",
                  }}
                  secondaryAction={
                    <Tooltip title="View details">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => setSelectedClientId(client.id)}
                        sx={{ color: GREEN }}
                      >
                        <ArrowForwardIosIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                  onClick={() => setSelectedClientId(client.id)}
                >
                  <Avatar sx={{ bgcolor: GREEN, width: 38, height: 38, fontSize: "0.85rem", fontWeight: 700, mr: 2 }}>
                    {getInitials(client.name)}
                  </Avatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography fontWeight={700} fontSize="0.95rem">{client.name}</Typography>
                        <StatusChip status={client.status} />
                      </Box>
                    }
                    secondary={
                      <Typography component="span" variant="body2" color="text.secondary">
                        {client.email} · {client.company}
                      </Typography>
                    }
                  />
                </ListItem>
                {idx < filteredClients.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Box>
    </Box>
  );
}
