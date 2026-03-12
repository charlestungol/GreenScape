import React, { useState, useMemo } from "react";
import { Box, Paper, Typography, TextField, Select, MenuItem, InputLabel, FormControl, List, ListItem, ListItemText, Divider } from "@mui/material";

const GREEN = "#1c3d37";

// Placeholder client data 
const clientsData = [
  { id: 1, name: "John Doe", email: "john@example.com", status: "Active" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", status: "Inactive" },
  { id: 3, name: "Alice Johnson", email: "alice@example.com", status: "Active" },
  { id: 4, name: "Bob Brown", email: "bob@example.com", status: "Active" },
];

export default function EmployeeClientList() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  const filteredClients = useMemo(() => {
    return clientsData.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filterStatus === "All" || c.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [search, filterStatus]);

  return (
    <Box sx={{ display: "flex", height: "100%" }}>

      <Box sx={{ flex: 1, p: 3, overflowY: "auto" }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: GREEN, mb: 2 }}>
          Client List
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            label="Search clients"
            variant="outlined"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <FormControl variant="outlined" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              label="Status"
            >
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Paper elevation={1} sx={{ borderRadius: 2 }}>
          <List>
            {filteredClients.length === 0 && (
              <ListItem>
                <ListItemText primary="No clients found." />
              </ListItem>
            )}

            {filteredClients.map((client) => (
              <React.Fragment key={client.id}>
                <ListItem>
                  <ListItemText
                    primary={client.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.secondary">
                          {client.email} • {client.status}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Box>
    </Box>
  );
}