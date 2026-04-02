import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
} from "@mui/material";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import AxiosInstance from "../../components/AxiosInstance";

const GREEN = "#1c3d37";

function getMonthKey(dateValue) {
  const d = new Date(dateValue);
  return d.toLocaleString("en-US", { month: "short" });
}

function isCurrentMonth(dateValue) {
  const d = new Date(dateValue);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export default function FinancesBoard() {
  const [quotes, setQuotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFinance = async () => {
      try {
        const [quotesRes, invoicesRes] = await Promise.all([
          AxiosInstance.get("core/quotes/"),
          AxiosInstance.get("core/invoices/"),
        ]);

        setQuotes(quotesRes.data?.results || quotesRes.data || []);
        setInvoices(invoicesRes.data?.results || invoicesRes.data || []);
      } catch (error) {
        console.error("Finances load error:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFinance();
  }, []);

  const kpis = useMemo(() => {
    const contractsThisMonth = quotes.filter((q) => isCurrentMonth(q.quotedate)).length;
    const monthlyRevenue = invoices
      .filter((i) => isCurrentMonth(i.invoicedate))
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const monthlyExpenses = 0;
    const payroll = 0;

    return { contractsThisMonth, monthlyRevenue, monthlyExpenses, payroll };
  }, [quotes, invoices]);

  const profit = kpis.monthlyRevenue - kpis.monthlyExpenses;

  const incomeBreakdown = useMemo(() => {
    const grouped = {};
    quotes.forEach((q) => {
      const label = q.service?.title || "Unknown Service";
      grouped[label] = (grouped[label] || 0) + Number(q.amount || 0);
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [quotes]);

  const revenueTrend = useMemo(() => {
    const grouped = {};
    invoices.forEach((i) => {
      const month = getMonthKey(i.invoicedate);
      grouped[month] = (grouped[month] || 0) + Number(i.amount || 0);
    });
    return Object.entries(grouped).map(([month, amount]) => ({ month, amount }));
  }, [invoices]);

  const reports = useMemo(() => {
    const quoteReports = quotes.map((q) => ({
      name: `Quote #${q.quoteid}`,
      period: q.quotedate || "—",
      status: q.status || "Unknown",
    }));

    const invoiceReports = invoices.map((i) => ({
      name: `Invoice #${i.invoiceid}`,
      period: i.invoicedate || "—",
      status: "Posted",
    }));

    return [...quoteReports, ...invoiceReports];
  }, [quotes, invoices]);

  const cardSx = { p: 2, borderRadius: 2, height: "100%" };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, color: GREEN, mb: 2 }}>
        Finances Board
      </Typography>

      {loading ? (
        <Typography>Loading finances...</Typography>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 2,
              mb: 2,
              alignItems: "stretch",
            }}
          >
            <Paper elevation={1} sx={cardSx}>
              <Typography variant="body2" sx={{ opacity: 0.7, color: GREEN }}>
                Contracts (Month)
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: GREEN }}>
                {kpis.contractsThisMonth}
              </Typography>
            </Paper>

            <Paper elevation={1} sx={cardSx}>
              <Typography variant="body2" sx={{ opacity: 0.7, color: GREEN }}>
                Monthly Revenue
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: GREEN }}>
                ${kpis.monthlyRevenue.toLocaleString()}
              </Typography>
            </Paper>

            <Paper elevation={1} sx={cardSx}>
              <Typography variant="body2" sx={{ opacity: 0.7, color: GREEN }}>
                Monthly Expenses
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: GREEN }}>
                ${kpis.monthlyExpenses.toLocaleString()}
              </Typography>
            </Paper>

            <Paper elevation={1} sx={cardSx}>
              <Typography variant="body2" sx={{ opacity: 0.7, color: GREEN }}>
                Profit (Month)
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 900, color: GREEN }}>
                ${profit.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, color: GREEN }}>
                Payroll included: ${kpis.payroll.toLocaleString()}
              </Typography>
            </Paper>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 2,
              mb: 2,
              alignItems: "stretch",
            }}
          >
            <Paper elevation={1} sx={cardSx}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: GREEN, mb: 1 }}>
                Income Breakdown
              </Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeBreakdown}>
                    <CartesianGrid stroke="rgba(28, 61, 55, 0.10)" />
                    <XAxis dataKey="name" tick={{ fill: GREEN }} />
                    <YAxis tick={{ fill: GREEN }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(28, 61, 55, 0.15)",
                      }}
                      labelStyle={{ color: GREEN, fontWeight: 700 }}
                    />
                    <Bar dataKey="value" fill={GREEN} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>

            <Paper elevation={1} sx={cardSx}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: GREEN, mb: 1 }}>
                Revenue Trend
              </Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart>
                    <CartesianGrid stroke="rgba(28, 61, 55, 0.10)" />
                    <XAxis dataKey="month" allowDuplicatedCategory={false} tick={{ fill: GREEN }} />
                    <YAxis tick={{ fill: GREEN }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid rgba(28, 61, 55, 0.15)",
                      }}
                      labelStyle={{ color: GREEN, fontWeight: 700 }}
                    />
                    <Line
                      data={revenueTrend}
                      dataKey="amount"
                      name="Revenue"
                      stroke={GREEN}
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 2,
              mb: 2,
              alignItems: "stretch",
            }}
          >
            <Paper elevation={1} sx={cardSx}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: GREEN, mb: 1 }}>
                Expenses / Payroll
              </Typography>
              <Typography sx={{ color: GREEN }}>
                Your current backend does not yet have dedicated expense or payroll tables.
              </Typography>
            </Paper>

            <Paper elevation={1} sx={cardSx}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: GREEN, mb: 1 }}>
                Financial Forecast
              </Typography>
              <Typography sx={{ color: GREEN }}>
                Forecast requires more finance history in the database.
              </Typography>
            </Paper>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 2,
              alignItems: "stretch",
            }}
          >
            <Paper elevation={1} sx={cardSx}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: GREEN, mb: 1 }}>
                Reports
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {reports.length === 0 ? (
                  <Typography>No reports found.</Typography>
                ) : (
                  reports.map((r, index) => (
                    <Box
                      key={`${r.name}-${index}`}
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
                        <div style={{ fontWeight: 800, color: GREEN }}>{r.name}</div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>{r.period}</div>
                      </Box>
                      <Box style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Chip
                          label={r.status}
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: "rgba(28, 61, 55, 0.35)", color: GREEN }}
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setSelectedReport(r)}
                          sx={{ color: GREEN, borderColor: "rgba(28, 61, 55, 0.35)" }}
                        >
                          Open
                        </Button>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>

              {selectedReport ? (
                <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: "rgba(28, 61, 55, 0.06)" }}>
                  <Typography sx={{ fontWeight: 900, color: GREEN }}>Selected:</Typography>
                  <Typography sx={{ color: GREEN }}>{selectedReport.name}</Typography>
                </Box>
              ) : null}
            </Paper>

            <Paper elevation={1} sx={cardSx}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: GREEN, mb: 1 }}>
                Database Summary
              </Typography>
              <Typography sx={{ color: GREEN, mb: 1 }}>
                Quotes in DB: {quotes.length}
              </Typography>
              <Typography sx={{ color: GREEN }}>
                Invoices in DB: {invoices.length}
              </Typography>
            </Paper>
          </Box>
        </>
      )}
    </Box>
  );
}