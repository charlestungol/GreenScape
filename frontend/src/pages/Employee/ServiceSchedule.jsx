import React, { useEffect, useMemo, useState } from "react";
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
import AxiosInstance from "../../components/AxiosInstance";
import { mockServiceSchedules } from "../mock/employeeMockData";

const GREEN = "#1c3d37";
const USE_MOCK_SERVICE_SCHEDULE = true;

const toKey = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
function formatTime(value) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function StatusChip({ status }) {
  const map = {
    scheduled: { label: "Scheduled", color: "default" },
    pending: { label: "Pending", color: "warning" },
    completed: { label: "Completed", color: "success" },
    cancelled: { label: "Cancelled", color: "error" },
  };
  const s = map[String(status || "").toLowerCase()] || { label: status || "Unknown", color: "default" };
  return <Chip label={s.label} color={s.color} size="small" variant="outlined" />;
}

export default function ServiceSchedule() {
  const [view, setView] = useState("week");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("All");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadSchedules = async () => {
      try {
        if (USE_MOCK_SERVICE_SCHEDULE) {
          setRows(mockServiceSchedules);
          setLoading(false);
          return;
        }

        const res = await AxiosInstance.get("core/schedules/");
        setRows(res.data?.results || res.data || []);
      } catch (error) {
        console.error("Service schedule load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSchedules();
  }, []);

  const normalizedRows = useMemo(() => {
    return rows.map((s) => ({
      id: s.booking?.bookingid || s.scheduleid,
      date: toKey(s.starttime),
      timeSlot: `${formatTime(s.starttime)}–${formatTime(s.endtime)}`,
      clientName: s.booking?.customer
        ? `${s.booking.customer.firstname || ""} ${s.booking.customer.lastname || ""}`.trim()
        : "Unknown Client",
      clientNumber: s.booking?.customer?.phonenumber || "—",
      email: s.booking?.customer?.email || "—",
      serviceType: s.booking?.service?.title || "—",
      assignedEmployee: s.employee
        ? `${s.employee.firstname || ""} ${s.employee.lastname || ""}`.trim()
        : "Unassigned",
      location: "N/A",
      status: s.status || "Scheduled",
    }));
  }, [rows]);

  const employeeOptions = useMemo(() => {
    const set = new Set(normalizedRows.map((a) => a.assignedEmployee));
    return ["All", ...Array.from(set)];
  }, [normalizedRows]);

  const monthRange = useMemo(() => {
    const start = startOfMonth(anchorDate);
    const end = endOfMonth(anchorDate);
    return { startKey: toKey(start), endKey: toKey(end) };
  }, [anchorDate]);

  const weekRange = useMemo(() => {
    const start = mondayOf(anchorDate);
    const end = addDays(start, 6);
    return { startKey: toKey(start), endKey: toKey(end) };
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

    return normalizedRows
      .filter(inRange)
      .filter((a) => (statusFilter === "All" ? true : String(a.status).toLowerCase() === statusFilter.toLowerCase()))
      .filter((a) => (employeeFilter === "All" ? true : a.assignedEmployee === employeeFilter))
      .filter(matchSearch)
      .sort((x, y) => (x.date + x.timeSlot).localeCompare(y.date + y.timeSlot));
  }, [normalizedRows, view, weekRange, monthRange, statusFilter, employeeFilter, search]);

  const headerLabel =
    view === "week"
      ? `Week of ${weekRange.startKey} (Mon–Sun)`
      : anchorDate.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: GREEN }}>
            Service Schedule
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            {headerLabel}
          </Typography>
        </Box>

        <ToggleButtonGroup exclusive value={view} onChange={(_, v) => v && setView(v)} size="small">
          <ToggleButton value="week">Weekly</ToggleButton>
          <ToggleButton value="month">Monthly</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Paper elevation={1} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
          <Button
            variant="outlined"
            onClick={() => setAnchorDate((d) => (view === "week" ? addDays(d, -7) : addMonths(d, -1)))}
          >
            Prev
          </Button>
          <Button
            variant="outlined"
            onClick={() => setAnchorDate((d) => (view === "week" ? addDays(d, 7) : addMonths(d, 1)))}
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
            {["All", "Scheduled", "Pending", "Completed", "Cancelled"].map((s) => (
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
            sx={{ minWidth: 220 }}
          >
            {employeeOptions.map((s) => (
              <MenuItem key={s} value={s}>
                {s}
              </MenuItem>
            ))}
          </TextField>

          <Chip label={`${filtered.length} appointments`} size="small" sx={{ ml: "auto" }} variant="outlined" />
        </Box>
      </Paper>

      {loading ? (
        <Typography>Loading service schedule...</Typography>
      ) : (
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
                <TableRow key={`${a.id}-${a.date}`} hover>
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
      )}
    </Box>
  );
}