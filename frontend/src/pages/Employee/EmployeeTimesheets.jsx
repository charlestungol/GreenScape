import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Paper, Button, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";
import AxiosInstance from "../../components/AxiosInstance";

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
    </Box>
  );
}