import React, { useEffect, useMemo, useState } from "react";
import AxiosInstance from "../../components/AxiosInstance";
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Stack,
} from "@mui/material";

const GREEN = "#1c3d37";

/* -------------------- Date Helpers -------------------- */

const pad2 = (n) => String(n).padStart(2, "0");

const toKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
};

function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ==================== COMPONENT ==================== */

export default function EmployeeTimesheets() {
  const [weekAnchor, setWeekAnchor] = useState(() =>
    mondayOf(new Date())
  );

  const [availability, setAvailability] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    employeeId: "",
    dateKey: "",
    startTime: "09:00",
    endTime: "17:00",
  });

  /* -------------------- Load Employees -------------------- */
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await AxiosInstance.get("employee-accounts/");
        const rows =
          Array.isArray(res.data) ? res.data : res.data?.results || [];

        setEmployees(
          rows.map((u) => ({
            id: u.id,       // CustomUser ID ✅
            name: u.email,  // UI unchanged
          }))
        );
      } catch (err) {
        console.error("Employee load error:", err);
      }
    };

    loadEmployees();
  }, []);

  /* -------------------- Load Availability -------------------- */
  useEffect(() => {
    const loadAvailability = async () => {
      try {
        const res = await AxiosInstance.get("core/employee-availability/");
        setAvailability(res.data?.results || res.data || []);
      } catch (err) {
        console.error("Availability load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadAvailability();
  }, []);

  /* -------------------- Week Grid -------------------- */

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i)),
    [weekAnchor]
  );

  const availabilityThisWeek = useMemo(() => {
    const start = new Date(weekAnchor);
    const end = addDays(weekAnchor, 6);
    end.setHours(23, 59, 59, 999);

    return availability.filter((a) => {
      const dt = new Date(a.starttime);
      return dt >= start && dt <= end;
    });
  }, [availability, weekAnchor]);

  const getCellValue = (userId, dateKey) => {
    const entries = availabilityThisWeek.filter(
      (a) =>
        String(a.user) === String(userId) &&
        toKey(a.starttime) === dateKey
    );

    if (entries.length === 0) return "—";

    return entries
      .map(
        (e) =>
          `${formatTime(e.starttime)}–${formatTime(e.endtime)}`
      )
      .join(", ");
  };

  /* -------------------- Form Handling -------------------- */

  const handleFormChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    const { employeeId, dateKey, startTime, endTime } = form;

    if (!employeeId || !dateKey || !startTime || !endTime)
      return alert("Please fill in all fields.");

    if (startTime >= endTime)
      return alert("End time must be after start time.");

    setSaving(true);

    try {
      await AxiosInstance.post("core/employee-availability/", {
        user: employeeId,
        starttime: `${dateKey}T${startTime}:00`,
        endtime: `${dateKey}T${endTime}:00`,
      });

      alert("Availability added.");
      setModalOpen(false);

      const res = await AxiosInstance.get("core/employee-availability/");
      setAvailability(res.data?.results || res.data || []);
    } catch (err) {
      const data = err.response?.data;

      if (data?.non_field_errors) {
        alert(data.non_field_errors[0]);
      } else if (data?.endtime) {
        alert(data.endtime[0]);
      } else {
        alert("Failed to save availability.");
      }
    } finally {
      setSaving(false);
    }
  };

  /* ==================== RENDER ==================== */

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: GREEN, mb: 2 }}>
        Employee Timesheets (Weekly Availability)
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Button variant="outlined" onClick={() => setWeekAnchor(d => addDays(d, -7))}>
          Prev Week
        </Button>
        <Button variant="outlined" onClick={() => setWeekAnchor(d => addDays(d, 7))}>
          Next Week
        </Button>

        <Typography
          variant="body1"
          sx={{ ml: 2, alignSelf: "center", fontWeight: 700 }}
        >
          Week of {toKey(weekAnchor)}
        </Typography>

        <Button
          variant="contained"
          onClick={() => setModalOpen(true)}
          sx={{
            ml: "auto",
            bgcolor: GREEN,
            "&:hover": { bgcolor: "#264d45" },
            borderRadius: 2,
            fontWeight: 700,
            textTransform: "none",
          }}
        >
          + Add Availability
        </Button>
      </Box>

      {loading ? (
        <Typography>Loading timesheets...</Typography>
      ) : (
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><b>Employee</b></TableCell>
                {days.map((d) => (
                  <TableCell key={toKey(d)} align="center">
                    <b>{d.toLocaleDateString(undefined, { weekday: "short" })}</b>
                    <div style={{ opacity: 0.7, fontSize: 12 }}>{toKey(d)}</div>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {employees.map((e) => (
                <TableRow key={e.id}>
                  <TableCell sx={{ fontWeight: 700 }}>{e.name}</TableCell>
                  {days.map((d) => {
                    const k = toKey(d);
                    const value = getCellValue(e.id, k);
                    return (
                      <TableCell
                        key={k}
                        align="center"
                        sx={{
                          bgcolor:
                            value === "—"
                              ? "rgba(0,0,0,0.02)"
                              : "rgba(28, 61, 55, 0.06)",
                          fontWeight: value === "—" ? 400 : 700,
                        }}
                      >
                        {value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* -------------------- Add Availability Modal -------------------- */}

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, color: GREEN }}>
          Add Availability
        </DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Employee</InputLabel>
              <Select
                label="Employee"
                value={form.employeeId}
                onChange={handleFormChange("employeeId")}
              >
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Date"
              type="date"
              size="small"
              fullWidth
              value={form.dateKey}
              onChange={handleFormChange("dateKey")}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Start Time"
              type="time"
              size="small"
              fullWidth
              value={form.startTime}
              onChange={handleFormChange("startTime")}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="End Time"
              type="time"
              size="small"
              fullWidth
              value={form.endTime}
              onChange={handleFormChange("endTime")}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setModalOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{
              bgcolor: GREEN,
              "&:hover": { bgcolor: "#264d45" },
              fontWeight: 700,
              textTransform: "none",
            }}
          >
            {saving ? "Saving…" : "Save Availability"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}