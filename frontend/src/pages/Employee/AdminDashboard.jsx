import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Paper } from "@mui/material";
import MonthCalendar from "../../components/MonthCalendar";
import AxiosInstance from "../../components/AxiosInstance";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const GREEN = "#1c3d37";

function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;

  const start = new Date(d);
  start.setDate(d.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function toDateKey(value) {
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatTime(value) {
  const d = new Date(value);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AdminDashboard() {
  const [employees, setEmployees] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [employeesRes, quotesRes, schedulesRes] = await Promise.all([
          AxiosInstance.get("core/employees/"),
          AxiosInstance.get("core/quotes/"),
          AxiosInstance.get("core/schedules/"),
        ]);

        setEmployees(employeesRes.data?.results || employeesRes.data || []);
        setQuotes(quotesRes.data?.results || quotesRes.data || []);
        setSchedules(schedulesRes.data?.results || schedulesRes.data || []);
      } catch (error) {
        console.error("Dashboard load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const metrics = useMemo(() => {
    const { start, end } = getWeekRange();

    const servicesThisWeek = schedules.filter((s) => {
      const startTime = new Date(s.starttime);
      return startTime >= start && startTime <= end;
    }).length;

    const activeContracts = quotes.filter((q) => {
      const status = String(q.status || "").toLowerCase();
      return status !== "cancelled" && status !== "rejected";
    }).length;

    const activeEmployees = employees.filter((e) => {
      const status = String(e.staffstatus || "").toLowerCase();
      return status !== "inactive";
    }).length;

    return [
      { label: "Active Contracts", value: activeContracts },
      { label: "Active Employees", value: activeEmployees },
      { label: "Services This Week", value: servicesThisWeek },
    ];
  }, [employees, quotes, schedules]);

  const analyticsData = useMemo(() => {
    const { start, end } = getWeekRange();
    const counts = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };

    schedules.forEach((s) => {
      const dt = new Date(s.starttime);
      if (dt >= start && dt <= end) {
        const dayLabel = dt.toLocaleDateString("en-US", { weekday: "short" });
        if (counts[dayLabel] !== undefined) counts[dayLabel] += 1;
      }
    });

    return Object.entries(counts).map(([name, jobs]) => ({ name, jobs }));
  }, [schedules]);

  const calendarEvents = useMemo(() => {
    const grouped = {};
    schedules.forEach((s) => {
      const key = toDateKey(s.starttime);
      const employeeName = s.employee
        ? `${s.employee.firstname || ""} ${s.employee.lastname || ""}`.trim()
        : "Assigned Staff";

      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        label: employeeName || "Schedule",
        sublabel: `${formatTime(s.starttime)}–${formatTime(s.endtime)}`,
        type: "work",
      });
    });
    return grouped;
  }, [schedules]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 800, color: GREEN, mb: 2 }}>
        Admin Dashboard
      </Typography>

      {loading ? (
        <Typography>Loading dashboard...</Typography>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 2,
              mb: 2,
            }}
          >
            {metrics.map((m) => (
              <Paper key={m.label} elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.7, color: GREEN }}>
                  {m.label}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: GREEN }}>
                  {m.value}
                </Typography>
              </Paper>
            ))}
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 2 }}>
            <MonthCalendar title="Company Calendar" eventsByDate={calendarEvents} />

            <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1, color: GREEN }}>
                Service Analytics
              </Typography>

              <Box sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData}>
                    <CartesianGrid stroke="rgba(28, 61, 55, 0.10)" />
                    <XAxis dataKey="name" tick={{ fill: GREEN }} />
                    <YAxis allowDecimals={false} tick={{ fill: GREEN }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(28, 61, 55, 0.15)",
                      }}
                      labelStyle={{ color: GREEN, fontWeight: 700 }}
                    />
                    <Bar dataKey="jobs" fill={GREEN} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Box>
        </>
      )}
    </Box>
  );
}