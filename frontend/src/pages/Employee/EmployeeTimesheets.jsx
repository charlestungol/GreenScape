import React, { useMemo, useState } from "react";
import { Box, Typography, Paper, Button, Table, TableHead, TableRow, TableCell, TableBody } from "@mui/material";

const pad2 = (n) => String(n).padStart(2, "0");
const toKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

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

export default function EmployeeTimesheets() {
  const [weekAnchor, setWeekAnchor] = useState(() => mondayOf(new Date()));

  // Placeholder availability (replace with API later)
  const employees = useMemo(
    () => [
      { id: 1, name: "Alex Cruz" },
      { id: 2, name: "Jamie Santos" },
      { id: 3, name: "Morgan Lee" },
    ],
    []
  );

  const availability = useMemo(() => {
    // Example: { employeeId: { dateKey: "09:00–17:00" or "Off" } }
    return {
      1: {
        "2026-02-10": "09:00–17:00",
        "2026-02-11": "09:00–17:00",
        "2026-02-12": "10:00–16:00",
        "2026-02-13": "Off",
        "2026-02-14": "08:00–12:00",
      },
      2: {
        "2026-02-10": "09:00–17:00",
        "2026-02-11": "Off",
        "2026-02-12": "09:00–17:00",
        "2026-02-13": "09:00–17:00",
      },
      3: {
        "2026-02-10": "10:00–18:00",
        "2026-02-11": "10:00–18:00",
        "2026-02-12": "Off",
        "2026-02-13": "10:00–18:00",
      },
    };
  }, []);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i)), [weekAnchor]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: "#06632b", mb: 2 }}>
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
                  const value = availability[e.id]?.[k] || "—";
                  const isOff = value === "Off";
                  return (
                    <TableCell
                      key={k}
                      align="center"
                      sx={{
                        bgcolor: isOff ? "rgba(211,47,47,0.08)" : "rgba(0,0,0,0.02)",
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
    </Box>
  );
}
