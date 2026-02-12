import React, { useMemo } from "react";
import { Box, Typography, Paper } from "@mui/material";
import MonthCalendar from "../../components/MonthCalendar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AdminDashboard() {
  // Placeholder metrics (replace with API later)
  const metrics = [
    { label: "Active Contracts", value: 42 },
    { label: "Active Employees", value: 18 },
    { label: "Services This Week", value: 27 },
  ];

  const analyticsData = [
    { name: "Mon", jobs: 4 },
    { name: "Tue", jobs: 6 },
    { name: "Wed", jobs: 5 },
    { name: "Thu", jobs: 7 },
    { name: "Fri", jobs: 5 },
    { name: "Sat", jobs: 0 },
    { name: "Sun", jobs: 0 },
  ];

  const calendarEvents = useMemo(() => {
    // Sample “service” events
    return {
      "2026-02-12": [{ label: "Service", sublabel: "09:00–11:00", type: "work" }],
      "2026-02-14": [{ label: "Service", sublabel: "13:00–15:00", type: "work" }],
      "2026-02-17": [{ label: "Inspection", sublabel: "10:00–11:00", type: "work" }],
    };
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: "#06632b", mb: 2 }}>
        Admin Dashboard
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 2, mb: 2 }}>
        {metrics.map((m) => (
          <Paper key={m.label} elevation={1} sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              {m.label}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {m.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 2 }}>
        <MonthCalendar title="Company Calendar" eventsByDate={calendarEvents} />

        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: "#06632b" }}>
            Service Analytics
          </Typography>
          <Box sx={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="jobs" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
