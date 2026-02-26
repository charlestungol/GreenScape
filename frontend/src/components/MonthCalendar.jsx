import React, { useMemo, useState } from "react";
import { Box, Typography, Paper, IconButton, Tooltip } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const pad2 = (n) => String(n).padStart(2, "0");
const toKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}
function startOfWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun - 6 Sat
  const diff = (day + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function MonthCalendar({
  title = "Calendar",
  eventsByDate = {}, // { "YYYY-MM-DD": [{ label, sublabel, type }] }
  onSelectDate,
}) {
  const [viewDate, setViewDate] = useState(() => new Date());

  const gridDays = useMemo(() => {
    const start = startOfMonth(viewDate);
    const end = endOfMonth(viewDate);

    const gridStart = startOfWeekMonday(start);
    const gridEnd = new Date(end);
    // go to end of week (Sunday)
    const endDay = gridEnd.getDay();
    const toAdd = (7 - ((endDay + 6) % 7) - 1 + 7) % 7; // convert to Monday-based then to Sunday end
    gridEnd.setDate(gridEnd.getDate() + (6 - ((endDay + 6) % 7)));
    gridEnd.setHours(0, 0, 0, 0);

    const days = [];
    const cur = new Date(gridStart);
    while (cur <= gridEnd) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }, [viewDate]);

  const monthLabel = viewDate.toLocaleString(undefined, { month: "long", year: "numeric" });
  const dow = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#06632b" }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            {monthLabel}
          </Typography>
        </Box>

        <Box>
          <Tooltip title="Previous month">
            <IconButton onClick={() => setViewDate((d) => addMonths(d, -1))}>
              <ChevronLeftIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Next month">
            <IconButton onClick={() => setViewDate((d) => addMonths(d, 1))}>
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Day headers */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, mb: 1 }}>
        {dow.map((d) => (
          <Typography key={d} variant="caption" sx={{ fontWeight: 700, textAlign: "center", opacity: 0.8 }}>
            {d}
          </Typography>
        ))}
      </Box>

      {/* Day cells */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
        {gridDays.map((d) => {
          const key = toKey(d);
          const inMonth = d.getMonth() === viewDate.getMonth();
          const ev = eventsByDate[key] || [];
          const isToday = toKey(new Date()) === key;

          return (
            <Box
              key={key}
              onClick={() => onSelectDate?.(key)}
              sx={{
                cursor: onSelectDate ? "pointer" : "default",
                minHeight: 82,
                p: 1,
                borderRadius: 2,
                border: "1px solid rgba(0,0,0,0.08)",
                bgcolor: isToday ? "rgba(6, 99, 43, 0.08)" : inMonth ? "#fff" : "rgba(0,0,0,0.03)",
                opacity: inMonth ? 1 : 0.6,
                overflow: "hidden",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                {d.getDate()}
              </Typography>

              <Box sx={{ mt: 0.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
                {ev.slice(0, 2).map((e, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      px: 0.8,
                      py: 0.3,
                      borderRadius: 1,
                      fontSize: 11,
                      lineHeight: 1.2,
                      bgcolor: e.type === "off" ? "rgba(211,47,47,0.12)" : "rgba(25,118,210,0.12)",
                    }}
                    title={`${e.label}${e.sublabel ? " • " + e.sublabel : ""}`}
                  >
                    <Box sx={{ fontWeight: 700 }}>{e.label}</Box>
                    {e.sublabel ? <Box style={{ opacity: 0.8 }}>{e.sublabel}</Box> : null}
                  </Box>
                ))}
                {ev.length > 2 ? (
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    +{ev.length - 2} more
                  </Typography>
                ) : null}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
