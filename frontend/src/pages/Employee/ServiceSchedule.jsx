import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  MenuItem,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
} from "@mui/material";

const pad2 = (n) => String(n).padStart(2, "0");
const toKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function addMonths(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth() + n, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function StatusChip({ status }) {
  const map = {
    Scheduled: { label: "Scheduled", color: "default" },
    "In Progress": { label: "In Progress", color: "info" },
    Completed: { label: "Completed", color: "success" },
    Cancelled: { label: "Cancelled", color: "error" },
  };
  const s = map[status] || map.Scheduled;
  return <Chip label={s.label} color={s.color} size="small" variant="outlined" />;
}

export default function ServiceSchedule() {
  const [view, setView] = useState("week"); // week | month
  const [anchorDate, setAnchorDate] = useState(() => new Date());

  const [statusFilter, setStatusFilter] = useState("All");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [search, setSearch] = useState("");

  // ✅ Mock appointments (replace with API later)
  const appointments = useMemo(
    () => [
      {
        id: "APT-10021",
        date: "2026-02-11",
        timeSlot: "09:00–11:00",
        clientName: "Maria Dela Cruz",
        clientNumber: "403-555-1001",
        email: "maria@email.com",
        serviceType: "Spring Startup",
        assignedEmployee: "Alex Cruz",
        location: "Calgary, AB",
        status: "Scheduled",
      },
      {
        id: "APT-10022",
        date: "2026-02-11",
        timeSlot: "13:00–15:00",
        clientName: "John Santos",
        clientNumber: "403-555-1002",
        email: "john@email.com",
        serviceType: "Repair",
        assignedEmployee: "Morgan Lee",
        location: "Airdrie, AB",
        status: "In Progress",
      },
      {
        id: "APT-10023",
        date: "2026-02-12",
        timeSlot: "10:00–12:00",
        clientName: "Kevin Bautista",
        clientNumber: "403-555-1003",
        email: "kevin@email.com",
        serviceType: "Installation",
        assignedEmployee: "Jamie Santos",
        location: "Calgary, AB",
        status: "Completed",
      },
      {
        id: "APT-10024",
        date: "2026-02-14",
        timeSlot: "08:00–09:30",
        clientName: "Alyssa Reyes",
        clientNumber: "403-555-1004",
        email: "alyssa@email.com",
        serviceType: "Winterization",
        assignedEmployee: "Alex Cruz",
        location: "Okotoks, AB",
        status: "Cancelled",
      },
    ],
    []
  );

  const employeeOptions = useMemo(() => {
    const set = new Set(appointments.map((a) => a.assignedEmployee));
    return ["All", ...Array.from(set)];
  }, [appointments]);

  const monthRange = useMemo(() => {
    const start = startOfMonth(anchorDate);
    const end = endOfMonth(anchorDate);
    return { startKey: toKey(start), endKey: toKey(end) };
  }, [anchorDate]);

  const weekRange = useMemo(() => {
    const start = mondayOf(anchorDate);
    const end = addDays(start, 6);
    return { startKey: toKey(start), endKey: toKey(end), startDate: start };
  }, [anchorDate]);

  const filtered = useMemo(() => {
    const inRange = (a) => {
      if (view === "week") return a.date >= weekRange.startKey && a.date <= weekRange.endKey;
      return a.date >= monthRange.startKey && a.date <= monthRange.endKey;
    };

    const matchSearch = (a) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      const blob = `${a.id} ${a.clientName} ${a.clientNumber} ${a.email} ${a.serviceType} ${a.assignedEmployee} ${a.location}`.toLowerCase();
      return blob.includes(q);
    };

    return appointments
      .filter(inRange)
      .filter((a) => (statusFilter === "All" ? true : a.status === statusFilter))
      .filter((a) => (employeeFilter === "All" ? true : a.assignedEmployee === employeeFilter))
      .filter(matchSearch)
      .sort((x, y) => (x.date + x.timeSlot).localeCompare(y.date + y.timeSlot));
  }, [appointments, view, weekRange, monthRange, statusFilter, employeeFilter, search]);

  const headerLabel =
    view === "week"
      ? `Week of ${weekRange.startKey} (Mon–Sun)`
      : anchorDate.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: "#06632b" }}>
            Service Schedule
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            {headerLabel}
          </Typography>
        </Box>

        <ToggleButtonGroup
          exclusive
          value={view}
          onChange={(_, v) => v && setView(v)}
          size="small"
        >
          <ToggleButton value="week">Weekly</ToggleButton>
          <ToggleButton value="month">Monthly</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Paper elevation={1} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
          <Button
            variant="outlined"
            onClick={() =>
              setAnchorDate((d) => (view === "week" ? addDays(d, -7) : addMonths(d, -1)))
            }
          >
            Prev
          </Button>
          <Button
            variant="outlined"
            onClick={() =>
              setAnchorDate((d) => (view === "week" ? addDays(d, 7) : addMonths(d, 1)))
            }
          >
            Next
          </Button>

          <TextField
            size="small"
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 260 }}
          />

          <TextField
            size="small"
            select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            {["All", "Scheduled", "In Progress", "Completed", "Cancelled"].map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            select
            label="Employee"
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            {employeeOptions.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>

          <Chip
            label={`${filtered.length} appointments`}
            size="small"
            sx={{ ml: "auto" }}
            variant="outlined"
          />
        </Box>
      </Paper>

      <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Appointment ID</b></TableCell>
              <TableCell><b>Date</b></TableCell>
              <TableCell><b>Time Slot</b></TableCell>
              <TableCell><b>Client</b></TableCell>
              <TableCell><b>Contact</b></TableCell>
              <TableCell><b>Service Type</b></TableCell>
              <TableCell><b>Assigned Employee</b></TableCell>
              <TableCell><b>Location</b></TableCell>
              <TableCell><b>Status</b></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filtered.map((a) => (
              <TableRow key={a.id} hover>
                <TableCell>{a.id}</TableCell>
                <TableCell>{a.date}</TableCell>
                <TableCell>{a.timeSlot}</TableCell>
                <TableCell>{a.clientName}</TableCell>
                <TableCell>
                  <div>{a.clientNumber}</div>
                  <div style={{ opacity: 0.7, fontSize: 12 }}>{a.email}</div>
                </TableCell>
                <TableCell>{a.serviceType}</TableCell>
                <TableCell>{a.assignedEmployee}</TableCell>
                <TableCell>{a.location}</TableCell>
                <TableCell><StatusChip status={a.status} /></TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ opacity: 0.7 }}>
                  No appointments found for this view / filter.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
