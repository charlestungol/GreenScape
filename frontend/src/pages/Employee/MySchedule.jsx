import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  Button,
} from "@mui/material";
import MonthCalendar from "../../components/MonthCalendar";
import AxiosInstance from "../../components/AxiosInstance";
import { mockServiceSchedules } from "../../mock/employeeMockData";

const GREEN = "#1c3d37";
const USE_MOCK_SCHEDULE = true;

/* -------------------- Date Helpers -------------------- */

const toKey = (d) => {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // shift to Monday
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
  return Math.max(
    0,
    (new Date(end) - new Date(start)) / (1000 * 60 * 60)
  );
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ===================== COMPONENT ===================== */

export default function MySchedule() {
  const [schedules, setSchedules] = useState([]);
  const [selectedDateKey, setSelectedDateKey] = useState(
    toKey(new Date())
  );
  const [weekAnchor, setWeekAnchor] = useState(() =>
    mondayOf(new Date())
  );
  const [loading, setLoading] = useState(true);

  /* -------------------- Load Data -------------------- */

  useEffect(() => {
    const loadSchedules = async () => {
      try {
        if (USE_MOCK_SCHEDULE) {
          setSchedules(mockEmployeeAvailability);
          return;
        }

        const res = await AxiosInstance.get(
          "core/employee-availability/"
        );
        setSchedules(res.data?.results || res.data || []);
      } catch (err) {
        console.error("Failed to load schedule", err);
      } finally {
        setLoading(false);
      }
    };

    loadSchedules();
  }, []);

  /* -------------------- Memoized Maps -------------------- */

  const schedulesByDate = useMemo(() => {
    const map = {};
    schedules.forEach((s) => {
      const key = toKey(s.starttime);
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [schedules]);

  const eventsByDate = useMemo(() => {
    const out = {};
    Object.entries(schedulesByDate).forEach(([k, list]) => {
      out[k] = list.map((s) => ({
        label: "Scheduled",
        sublabel: `${formatTime(s.starttime)} – ${formatTime(
          s.endtime
        )}`,
        type: "work",
      }));
    });
    return out;
  }, [schedulesByDate]);

  const selectedEvents = schedulesByDate[selectedDateKey] || [];

  const selectedHours = useMemo(() => {
    return selectedEvents.reduce(
      (sum, s) => sum + hoursBetween(s.starttime, s.endtime),
      0
    );
  }, [selectedEvents]);

  /* -------------------- Weekly Logic -------------------- */

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i)),
    [weekAnchor]
  );

  const weeklyHours = useMemo(() => {
    const start = new Date(weekAnchor);
    const end = addDays(weekAnchor, 6);
    end.setHours(23, 59, 59, 999);

    return schedules.reduce((sum, s) => {
      const shiftStart = new Date(s.starttime);
      const shiftEnd = new Date(s.endtime);

      const overlapStart =
        shiftStart < start ? start : shiftStart;
      const overlapEnd = shiftEnd > end ? end : shiftEnd;

      if (overlapEnd > overlapStart) {
        return sum + hoursBetween(overlapStart, overlapEnd);
      }
      return sum;
    }, 0);
  }, [schedules, weekAnchor]);

  /* -------------------- Render -------------------- */

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        sx={{ fontWeight: 800, color: GREEN, mb: 2 }}
      >
        My Schedule
      </Typography>

      {loading ? (
        <Typography>Loading schedule…</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 2,
          }}
        >
          {/* -------- Calendar -------- */}
          <MonthCalendar
            title="My Calendar"
            eventsByDate={eventsByDate}
            onSelectDate={setSelectedDateKey}
          />

          {/* -------- Details -------- */}
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: GREEN }}
            >
              Day Details
            </Typography>

            <Typography
              variant="body2"
              sx={{ opacity: 0.75, mb: 1 }}
            >
              {selectedDateKey}
            </Typography>

            <Divider sx={{ my: 1 }} />

            {selectedEvents.length === 0 ? (
              <Typography>No schedule for this date.</Typography>
            ) : (
              selectedEvents.map((s) => (
                <Box key={s.id} sx={{ mb: 1.5 }}>
                  <Typography>
                    <b>Start:</b> {formatTime(s.starttime)}
                  </Typography>
                  <Typography>
                    <b>End:</b> {formatTime(s.endtime)}
                  </Typography>
                </Box>
              ))
            )}

            <Typography sx={{ mt: 1, fontWeight: 700 }}>
              Total Day Hours: {selectedHours.toFixed(2)}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography
              variant="h6"
              sx={{ fontWeight: 800, color: GREEN }}
            >
              Weekly Hours
            </Typography>

            <Box sx={{ display: "flex", gap: 1, my: 1 }}>
              <Button
                variant="outlined"
                onClick={() =>
                  setWeekAnchor((d) => addDays(d, -7))
                }
              >
                Prev Week
              </Button>
              <Button
                variant="outlined"
                onClick={() =>
                  setWeekAnchor((d) => addDays(d, 7))
                }
              >
                Next Week
              </Button>
            </Box>

            <Typography sx={{ fontWeight: 800 }}>
              Total (Mon–Sun): {weeklyHours.toFixed(2)} hrs
            </Typography>

            <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
              {weekDays.map((d) => {
                const k = toKey(d);
                const entries = schedulesByDate[k] || [];
                const hours = entries.reduce(
                  (sum, s) =>
                    sum + hoursBetween(s.starttime, s.endtime),
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
                      {d.toLocaleDateString(undefined, {
                        weekday: "short",
                      })}{" "}
                      • {k}
                    </span>
                    <span style={{ fontWeight: 700 }}>
                      {entries.length
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