import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const ROLE_OPTIONS = ["office admin", "engineering", "technical", "field", "operations"];
const ACCESS_OPTIONS = ["full access", "limited access", "no access to technical panel"];

export default function EmployeeManagement() {
  const navigate = useNavigate();

  // Placeholder employees (replace with API later)
  const initial = useMemo(
    () => [
      {
        id: 1,
        employeeNo: "E-1001",
        name: "Alex Cruz",
        email: "alex@greenscape.com",
        contact: "403-000-1111",
        role: "field",
        access: "limited access",
      },
      {
        id: 2,
        employeeNo: "E-1002",
        name: "Jamie Santos",
        email: "jamie@greenscape.com",
        contact: "403-000-2222",
        role: "office admin",
        access: "full access",
      },
      {
        id: 3,
        employeeNo: "E-1003",
        name: "Morgan Lee",
        email: "morgan@greenscape.com",
        contact: "403-000-3333",
        role: "technical",
        access: "no access to technical panel",
      },
    ],
    []
  );

  const [employees, setEmployees] = useState(initial);

  const updateEmployee = (id, patch) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: "#06632b" }}>
          Employee Management
        </Typography>

        <Button variant="contained" onClick={() => navigate("/employee/employee-management/timesheets")}>
          View Timesheets
        </Button>
      </Box>

      <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Employee #</b></TableCell>
              <TableCell><b>Name</b></TableCell>
              <TableCell><b>Email</b></TableCell>
              <TableCell><b>Contact</b></TableCell>
              <TableCell><b>Role</b></TableCell>
              <TableCell><b>Access Level</b></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {employees.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.employeeNo}</TableCell>
                <TableCell>{e.name}</TableCell>
                <TableCell>{e.email}</TableCell>
                <TableCell>{e.contact}</TableCell>

                <TableCell>
                  <Select
                    size="small"
                    value={e.role}
                    onChange={(evt) => updateEmployee(e.id, { role: evt.target.value })}
                    sx={{ minWidth: 170 }}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <MenuItem key={r} value={r}>
                        {r}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>

                <TableCell>
                  <Select
                    size="small"
                    value={e.access}
                    onChange={(evt) => updateEmployee(e.id, { access: evt.target.value })}
                    sx={{ minWidth: 220 }}
                  >
                    {ACCESS_OPTIONS.map((a) => (
                      <MenuItem key={a} value={a}>
                        {a}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
