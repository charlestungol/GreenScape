import React, { useMemo, useState } from "react";
import { Box, Paper, Typography, Divider, Button } from "@mui/material";
import MonthCalendar from "../../components/MonthCalendar";

const pad2 = (n) => String(n).padStart(2, "0");
const toKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

function parseTimeToHours(t) {
  // "09:30" -> 9.5
  const [hh, mm] = t.split(":").map(Number);
  return hh + (mm || 0) / 60;
}
function hoursBetween(start, end) {
  return Math.max(0, parseTimeToHours(end) - parseTimeToHours(start));
}
function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0-6
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

export default function MySchedule() {
  const employeeName = localStorage.getItem("first_name") || "Employee";
  const [selectedDateKey, setSelectedDateKey] = useState(toKey(new Date()));
  const [weekAnchor, setWeekAnchor] = useState(() => mondayOf(new Date()));

  // Placeholder schedule (replace with API later)
  const schedule = useMemo(() => {
    return {
      "2026-02-11": { type: "work", start: "09:00", end: "17:00" },
      "2026-02-12": { type: "work", start: "10:00", end: "16:00" },
      "2026-02-13": { type: "off" },
      "2026-02-14": { type: "work", start: "08:00", end: "12:00" },
      "2026-02-15": { type: "off" },
      "2026-02-16": { type: "work", start: "09:00", end: "17:00" },
      "2026-02-17": { type: "work", start: "09:00", end: "15:00" },
    };
  }, []);

  const eventsByDate = useMemo(() => {
    const out = {};
    Object.entries(schedule).forEach(([k, v]) => {
      if (v.type === "off") out[k] = [{ label: "Day Off", type: "off" }];
      else out[k] = [{ label: "Work", sublabel: `${v.start}–${v.end}`, type: "work" }];
    });
    return out;
  }, [schedule]);

  const selected = schedule[selectedDateKey];
  const selectedHours =
    selected?.type === "work" ? hoursBetween(selected.start, selected.end) : 0;

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i));
  }, [weekAnchor]);

  const weeklyHours = useMemo(() => {
    return weekDays.reduce((sum, d) => {
      const k = toKey(d);
      const entry = schedule[k];
      if (entry?.type === "work") return sum + hoursBetween(entry.start, entry.end);
      return sum;
    }, 0);
  }, [schedule, weekDays]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: "#06632b", mb: 2 }}>
        My Schedule
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 2 }}>
        <MonthCalendar
          title={`${employeeName}'s Calendar`}
          eventsByDate={eventsByDate}
          onSelectDate={(k) => setSelectedDateKey(k)}
        />

        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#06632b" }}>
            Day Details
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.75, mb: 1 }}>
            {selectedDateKey}
          </Typography>

          <Divider sx={{ my: 1 }} />

          {!selected ? (
            <Typography variant="body1">No schedule set for this date.</Typography>
          ) : selected.type === "off" ? (
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              Day Off
            </Typography>
          ) : (
            <>
              <Typography variant="body1">
                <b>Start:</b> {selected.start}
              </Typography>
              <Typography variant="body1">
                <b>End:</b> {selected.end}
              </Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <b>Hours:</b> {selectedHours.toFixed(2)}
              </Typography>
            </>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" sx={{ fontWeight: 800, color: "#06632b" }}>
            Weekly Hours
          </Typography>

          <Box sx={{ display: "flex", gap: 1, my: 1 }}>
            <Button variant="outlined" onClick={() => setWeekAnchor((d) => addDays(d, -7))}>
              Prev Week
            </Button>
            <Button variant="outlined" onClick={() => setWeekAnchor((d) => addDays(d, 7))}>
              Next Week
            </Button>
          </Box>

          <Typography variant="body1" sx={{ fontWeight: 800 }}>
            Total (Mon–Sun): {weeklyHours.toFixed(2)} hrs
          </Typography>

          <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
            {weekDays.map((d) => {
              const k = toKey(d);
              const entry = schedule[k];
              const h = entry?.type === "work" ? hoursBetween(entry.start, entry.end) : 0;

              return (
                <Box
                  key={k}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    p: 1,
                    borderRadius: 2,
                    bgcolor: "rgba(0,0,0,0.03)",
                  }}
                >
                  <span>
                    {d.toLocaleDateString(undefined, { weekday: "short" })} • {k}
                  </span>
                  <span style={{ fontWeight: 700 }}>
                    {entry?.type === "work" ? `${entry.start}-${entry.end} (${h.toFixed(2)}h)` : "Off"}
                  </span>
                </Box>
              );
            })}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
