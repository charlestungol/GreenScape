import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Paper, Divider, Button } from "@mui/material";
import MonthCalendar from "../../components/MonthCalendar";
import AxiosInstance from "../../components/AxiosInstance";

const GREEN = "#1c3d37";

const toKey = (d) => {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
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

function hoursBetween(start, end) {
  const ms = new Date(end) - new Date(start);
  return ms > 0 ? ms / (1000 * 60 * 60) : 0;
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MySchedule() {
  const [schedules, setSchedules] = useState([]);
  const [selectedDateKey, setSelectedDateKey] = useState(toKey(new Date()));
  const [weekAnchor, setWeekAnchor] = useState(() =>
    mondayOf(new Date())
  );
  const [loading, setLoading] = useState(true);

  /* -------------------- Load MY schedules -------------------- */
  useEffect(() => {
    const loadSchedules = async () => {
      try {
        // ✅ Backend already filters by authenticated user
        const res = await AxiosInstance.get("core/schedules/");
        const rows = res.data?.results || res.data || [];
        setSchedules(rows);
      } catch (error) {
        console.error("MySchedule load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSchedules();
  }, []);

  /* -------------------- Calendar Events -------------------- */

  const eventsByDate = useMemo(() => {
    const out = {};
    schedules.forEach((s) => {
      const k = toKey(s.starttime);
      if (!out[k]) out[k] = [];
      out[k].push({
        label: s.status || "Scheduled",
        sublabel: `${formatTime(s.starttime)}–${formatTime(s.endtime)}`,
        type: "work",
      });
    });
    return out;
  }, [schedules]);

  const selectedEvents = useMemo(() => {
    return schedules.filter(
      (s) => toKey(s.starttime) === selectedDateKey
    );
  }, [schedules, selectedDateKey]);

  const selectedHours = useMemo(() => {
    return selectedEvents.reduce(
      (sum, s) => sum + hoursBetween(s.starttime, s.endtime),
      0
    );
  }, [selectedEvents]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) =>
      addDays(weekAnchor, i)
    );
  }, [weekAnchor]);

  const weeklyHours = useMemo(() => {
    const start = new Date(weekAnchor);
    const end = addDays(weekAnchor, 6);
    end.setHours(23, 59, 59, 999);

    return schedules.reduce((sum, s) => {
      const dt = new Date(s.starttime);
      if (dt >= start && dt <= end) {
        return sum + hoursBetween(s.starttime, s.endtime);
      }
      return sum;
    }, 0);
  }, [schedules, weekAnchor]);

  /* -------------------- Render -------------------- */

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: GREEN, mb: 2 }}>
        My Schedule
      </Typography>

      {loading ? (
        <Typography>Loading schedule...</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 2,
          }}
        >
          <MonthCalendar
            title="My Calendar"
            eventsByDate={eventsByDate}
            onSelectDate={(k) => setSelectedDateKey(k)}
          />

          <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: GREEN }}>
              Day Details
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.75, mb: 1 }}>
              {selectedDateKey}
            </Typography>

            <Divider sx={{ my: 1 }} />

            {selectedEvents.length === 0 ? (
              <Typography>No schedule set for this date.</Typography>
            ) : (
              selectedEvents.map((s) => (
                <Box key={s.scheduleid} sx={{ mb: 1.5 }}>
                  <Typography>
                    <b>Start:</b> {formatTime(s.starttime)}
                  </Typography>
                  <Typography>
                    <b>End:</b> {formatTime(s.endtime)}
                  </Typography>
                  <Typography>
                    <b>Status:</b> {s.status}
                  </Typography>
                </Box>
              ))
            )}

            <Typography variant="body1" sx={{ mt: 1, fontWeight: 700 }}>
              Total Day Hours: {selectedHours.toFixed(2)}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ fontWeight: 800, color: GREEN }}>
              Weekly Hours
            </Typography>

            <Box sx={{ display: "flex", gap: 1, my: 1 }}>
              <Button variant="outlined" onClick={() => setWeekAnchor(d => addDays(d, -7))}>
                Prev Week
              </Button>
              <Button variant="outlined" onClick={() => setWeekAnchor(d => addDays(d, 7))}>
                Next Week
              </Button>
            </Box>

            <Typography variant="body1" sx={{ fontWeight: 800 }}>
              Total (Mon–Sun): {weeklyHours.toFixed(2)} hrs
            </Typography>

            <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
              {weekDays.map((d) => {
                const k = toKey(d);
                const entries = schedules.filter(
                  (s) => toKey(s.starttime) === k
                );
                const hours = entries.reduce(
                  (sum, s) => sum + hoursBetween(s.starttime, s.endtime),
                  0
                );

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
                      {entries.length > 0
                        ? `${entries.length} shift(s) • ${hours.toFixed(2)}h`
                        : "Off"}
                    </span>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
}