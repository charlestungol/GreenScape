import React, { useMemo, useState } from "react";
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Chip, Button } from "@mui/material";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

export default function FinancesBoard() {
  // ✅ Mock “finance” data
  const kpis = useMemo(
    () => ({
      contractsThisMonth: 36,
      monthlyRevenue: 84250,
      monthlyExpenses: 51340,
      payroll: 28900,
    }),
    []
  );

  const profit = kpis.monthlyRevenue - kpis.monthlyExpenses;

  const incomeBreakdown = useMemo(
    () => [
      { name: "Installations", value: 38000 },
      { name: "Repairs", value: 15600 },
      { name: "Winterization", value: 10200 },
      { name: "Maintenance", value: 20450 },
    ],
    []
  );

  const expenseTracking = useMemo(
    () => [
      { month: "Oct", amount: 46200 },
      { month: "Nov", amount: 49850 },
      { month: "Dec", amount: 52100 },
      { month: "Jan", amount: 50740 },
      { month: "Feb", amount: 51340 },
    ],
    []
  );

  const revenueTrend = useMemo(
    () => [
      { month: "Oct", amount: 73500 },
      { month: "Nov", amount: 79800 },
      { month: "Dec", amount: 82000 },
      { month: "Jan", amount: 81200 },
      { month: "Feb", amount: 84250 },
    ],
    []
  );

  const upcomingExpenses = useMemo(
    () => [
      { id: "EXP-3001", due: "2026-02-15", item: "Vehicle Maintenance", amount: 1200, status: "Upcoming" },
      { id: "EXP-3002", due: "2026-02-20", item: "Irrigation Parts Restock", amount: 3400, status: "Upcoming" },
      { id: "EXP-3003", due: "2026-02-28", item: "Software Subscriptions", amount: 480, status: "Upcoming" },
    ],
    []
  );

  const payrollRows = useMemo(
    () => [
      { employee: "Alex Cruz", hours: 38, rate: 28, gross: 1064 },
      { employee: "Jamie Santos", hours: 40, rate: 32, gross: 1280 },
      { employee: "Morgan Lee", hours: 36, rate: 30, gross: 1080 },
    ],
    []
  );

  const reports = useMemo(
    () => [
      { name: "Monthly P&L Report", period: "Feb 2026", status: "Ready" },
      { name: "Payroll Summary", period: "Week 6", status: "Draft" },
      { name: "Expense Detail Report", period: "Feb 2026", status: "Ready" },
    ],
    []
  );

  const forecast = useMemo(
    () => [
      { month: "Mar", amount: 88000 },
      { month: "Apr", amount: 93000 },
      { month: "May", amount: 99000 },
    ],
    []
  );

  const [selectedReport, setSelectedReport] = useState(null);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, color: "#06632b", mb: 2 }}>
        Finances Board
      </Typography>

      {/* KPI cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 2, mb: 2 }}>
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>Contracts (Month)</Typography>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>{kpis.contractsThisMonth}</Typography>
        </Paper>
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>Monthly Revenue</Typography>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>${kpis.monthlyRevenue.toLocaleString()}</Typography>
        </Paper>
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>Monthly Expenses</Typography>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>${kpis.monthlyExpenses.toLocaleString()}</Typography>
        </Paper>
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>Profit (Month)</Typography>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>${profit.toLocaleString()}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            Payroll included: ${kpis.payroll.toLocaleString()}
          </Typography>
        </Paper>
      </Box>

      {/* Charts row */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 2 }}>
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#06632b", mb: 1 }}>
            Income Breakdown
          </Typography>
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#06632b", mb: 1 }}>
            Revenue vs Expense Trend
          </Typography>
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" allowDuplicatedCategory={false} />
                <YAxis />
                <Tooltip />
                <Line data={revenueTrend} dataKey="amount" name="Revenue" />
                <Line data={expenseTracking} dataKey="amount" name="Expenses" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>

      {/* Tables row */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 2, mb: 2 }}>
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#06632b", mb: 1 }}>
            Upcoming Expenses
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><b>ID</b></TableCell>
                <TableCell><b>Due</b></TableCell>
                <TableCell><b>Item</b></TableCell>
                <TableCell align="right"><b>Amount</b></TableCell>
                <TableCell><b>Status</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {upcomingExpenses.map((x) => (
                <TableRow key={x.id} hover>
                  <TableCell>{x.id}</TableCell>
                  <TableCell>{x.due}</TableCell>
                  <TableCell>{x.item}</TableCell>
                  <TableCell align="right">${x.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip label={x.status} size="small" variant="outlined" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#06632b", mb: 1 }}>
            Financial Forecast (Next 3 Months)
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {forecast.map((f) => (
              <Box key={f.month} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700 }}>{f.month}</span>
                <span>${f.amount.toLocaleString()}</span>
              </Box>
            ))}
          </Box>
          <Typography variant="caption" sx={{ opacity: 0.7, mt: 1, display: "block" }}>
            (Forecast is mocked for frontend-only.)
          </Typography>
        </Paper>
      </Box>

      {/* Payroll + Reports */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#06632b", mb: 1 }}>
            Payroll
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><b>Employee</b></TableCell>
                <TableCell align="right"><b>Hours</b></TableCell>
                <TableCell align="right"><b>Rate</b></TableCell>
                <TableCell align="right"><b>Gross</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payrollRows.map((p) => (
                <TableRow key={p.employee}>
                  <TableCell>{p.employee}</TableCell>
                  <TableCell align="right">{p.hours}</TableCell>
                  <TableCell align="right">${p.rate}</TableCell>
                  <TableCell align="right">${p.gross.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} align="right" sx={{ fontWeight: 900 }}>
                  Total
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 900 }}>
                  ${payrollRows.reduce((s, r) => s + r.gross, 0).toLocaleString()}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>

        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: "#06632b", mb: 1 }}>
            Financial Reports
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {reports.map((r) => (
              <Box
                key={r.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(0,0,0,0.03)",
                }}
              >
                <Box>
                  <div style={{ fontWeight: 800 }}>{r.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{r.period}</div>
                </Box>
                <Box style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Chip label={r.status} size="small" variant="outlined" />
                  <Button size="small" variant="outlined" onClick={() => setSelectedReport(r)}>
                    Open
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>

          {selectedReport ? (
            <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: "rgba(6, 99, 43, 0.06)" }}>
              <Typography sx={{ fontWeight: 900 }}>Selected:</Typography>
              <Typography>{selectedReport.name}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                (Frontend-only preview panel.)
              </Typography>
            </Box>
          ) : null}
        </Paper>
      </Box>
    </Box>
  );
}
