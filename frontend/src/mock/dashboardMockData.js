export const USE_MOCK_DASHBOARD =
  import.meta.env.VITE_USE_MOCK_DASHBOARD === "true";

export const mockBudget = {
  amount: 5000,
};

export const mockExpenses = [
  {
    id: 1,
    name: "Irrigation",
    category: "Irrigation",
    amount: 350,
    date: "2026-01-12T10:00:00",
    created_at: "2026-01-12T10:00:00",
  },
  {
    id: 2,
    name: "Seasonal",
    category: "Seasonal",
    amount: 220,
    date: "2026-02-08T13:30:00",
    created_at: "2026-02-08T13:30:00",
  },
  {
    id: 3,
    name: "Winterize",
    category: "Winterize",
    amount: 410,
    date: "2026-03-03T09:15:00",
    created_at: "2026-03-03T09:15:00",
  },
  {
    id: 4,
    name: "Landscape Lighting",
    category: "Landscape Lighting",
    amount: 575,
    date: "2026-04-10T14:00:00",
    created_at: "2026-04-10T14:00:00",
  },
  {
    id: 5,
    name: "Stormwater",
    category: "Stormwater",
    amount: 300,
    date: "2026-04-14T11:00:00",
    created_at: "2026-04-14T11:00:00",
  },
];

export const mockBookings = [
  {
    bookingid: 101,
    status: "confirmed",
    appointmenttime: "2026-04-20T10:00:00",
    email: "charles@example.com",
    phonenum: "403-555-0192",
    service: {
      title: "Irrigation Inspection",
      baseprice: 180,
      duration: 60,
    },
  },
  {
    bookingid: 102,
    status: "pending",
    appointmenttime: "2026-04-27T14:30:00",
    email: "charles@example.com",
    phonenum: "403-555-0192",
    service: {
      title: "Landscape Lighting Repair",
      baseprice: 240,
      duration: 90,
    },
  },
  {
    bookingid: 103,
    status: "confirmed",
    appointmenttime: "2026-05-02T09:00:00",
    email: "charles@example.com",
    phonenum: "403-555-0192",
    service: {
      title: "Spring System Start-Up",
      baseprice: 160,
      duration: 45,
    },
  },
];

export const mockAppointments = mockBookings.filter(
  (b) => b.status.toLowerCase() === "confirmed"
);

export const mockLocations = [
  {
    servicelocationid: 1,
    street: "123 Evergreen Terrace NW",
    city: "Calgary",
    province: "Alberta",
    postalcode: "T2N 1N4",
  },
  {
    servicelocationid: 2,
    street: "456 Aspen Ridge SW",
    city: "Calgary",
    province: "Alberta",
    postalcode: "T3H 2L1",
  },
  {
    servicelocationid: 3,
    street: "789 Lakeview Drive SE",
    city: "Calgary",
    province: "Alberta",
    postalcode: "T2J 3K2",
  },
];

export const mockLocationServices = {
  1: [
    {
      id: 11,
      title: "Irrigation Installation",
      description: "Full front yard irrigation zone setup",
      base_price: 800,
      red_year: "2026",
      completed: false,
    },
  ],
  2: [
    {
      id: 12,
      title: "Landscape Lighting",
      description: "Path and accent lighting service",
      base_price: 450,
      red_year: "2026",
      completed: true,
    },
  ],
  3: [
    {
      id: 13,
      title: "Stormwater Management",
      description: "Drainage and runoff inspection",
      base_price: 600,
      red_year: "2026",
      completed: false,
    },
  ],
};

export const mockAnalyticsData = [
  { name: "Jan", budget: 5000, expenses: 350 },
  { name: "Feb", budget: 5000, expenses: 220 },
  { name: "Mar", budget: 5000, expenses: 410 },
  { name: "Apr", budget: 5000, expenses: 875 },
];