import React, { useEffect, useMemo, useState } from "react";
import AxiosInstance from "../../components/AxiosInstance";
import { Box, Typography, Paper, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select,
  InputLabel, FormControl, Stack } from "@mui/material";

const GREEN = "#1c3d37";

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
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function EmployeeTimesheets() {
  const [weekAnchor, setWeekAnchor] = useState(() => mondayOf(new Date()));
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ employeeId: "", dateKey: "", startTime: "09:00", endTime: "17:00" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSchedules = async () => {
      try {
        const res = await AxiosInstance.get("core/schedules/");
        setSchedules(res.data?.results || res.data || []);
      } catch (error) {
        console.error("Timesheets load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSchedules();
  }, []);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i)), [weekAnchor]);

  const employees = useMemo(() => {
    const map = new Map();
    schedules.forEach((s) => {
      const e = s.employee;
      if (e && !map.has(e.employeeid)) {
        map.set(e.employeeid, {
          id: e.employeeid,
          name: `${e.firstname || ""} ${e.lastname || ""}`.trim() || `Employee ${e.employeeid}`,
        });
      }
    });
    return Array.from(map.values());
  }, [schedules]);

  const schedulesThisWeek = useMemo(() => {
    const start = new Date(weekAnchor);
    const end = addDays(weekAnchor, 6);
    end.setHours(23, 59, 59, 999);

    return schedules.filter((s) => {
      const dt = new Date(s.starttime);
      return dt >= start && dt <= end;
    });
  }, [schedules, weekAnchor]);

  const getCellValue = (employeeId, dateKey) => {
    const entries = schedulesThisWeek.filter(
      (s) => String(s.employee?.employeeid) === String(employeeId) && toKey(s.starttime) === dateKey
    );

    if (entries.length === 0) return "—";

    return entries
      .map((e) => `${formatTime(e.starttime)}–${formatTime(e.endtime)}`)
      .join(", ");
  };

  const handleFormChange = (field) => (e) => {
  setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSave = async () => {
  const { employeeId, dateKey, startTime, endTime } = form;
  if (!employeeId || !dateKey || !startTime || !endTime) return alert("Please fill in all fields.");
  if (startTime >= endTime) return alert("End time must be after start time.");
  setSaving(true);
  try {
    await AxiosInstance.post("core/schedules/", {
      employee: employeeId,
      starttime: new Date(`${dateKey}T${startTime}:00`).toISOString(),
      endtime: new Date(`${dateKey}T${endTime}:00`).toISOString(),
    });
    alert("Schedule added!");
    setModalOpen(false);
    const res = await AxiosInstance.get("core/schedules/");
    setSchedules(res.data?.results || res.data || []);
  } catch (err) {
    alert("Failed to save schedule.");
  } finally {
    setSaving(false);
  }
    };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: GREEN, mb: 2 }}>
        Employee Timesheets (Weekly Availability)
      </Typography>

      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
        <Button variant="outlined" onClick={() => setWeekAnchor((d) => addDays(d, -7))}>
          Prev Week
        </Button>
        <Button variant="outlined" onClick={() => setWeekAnchor((d) => addDays(d, 7))}>
          Next Week
        </Button>
        <Typography variant="body1" sx={{ ml: 2, alignSelf: "center", fontWeight: 700 }}>
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
          + Add Schedule
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
                          bgcolor: value === "—" ? "rgba(0,0,0,0.02)" : "rgba(28, 61, 55, 0.06)",
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
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: GREEN }}>Add Work Schedule</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Employee</InputLabel>
            <Select label="Employee" value={form.employeeId} onChange={handleFormChange("employeeId")}>
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>{emp.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Date" type="date" size="small" fullWidth value={form.dateKey}
            onChange={handleFormChange("dateKey")} InputLabelProps={{ shrink: true }} />
          <TextField label="Start Time" type="time" size="small" fullWidth value={form.startTime}
            onChange={handleFormChange("startTime")} InputLabelProps={{ shrink: true }} />
          <TextField label="End Time" type="time" size="small" fullWidth value={form.endTime}
            onChange={handleFormChange("endTime")} InputLabelProps={{ shrink: true }} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={() => setModalOpen(false)} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}
          sx={{ bgcolor: GREEN, "&:hover": { bgcolor: "#264d45" }, textTransform: "none", fontWeight: 700 }}>
          {saving ? "Saving…" : "Save Schedule"}
        </Button>
      </DialogActions>
    </Dialog>
  </Box>
  );
}

