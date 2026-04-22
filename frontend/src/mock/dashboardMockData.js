export const USE_MOCK_DASHBOARD = true;

export const mockBudget = {
  amount: 5000,
};

export const mockExpenses = [
  { id: 1, name: "Irrigation", amount: 2650, date: "2025-09-12T10:00:00" },
  { id: 2, name: "Seasonal Cleanup", amount: 3120, date: "2025-10-08T13:30:00" },
  { id: 3, name: "Winterize", amount: 2840, date: "2025-11-03T09:15:00" },
  { id: 4, name: "Lighting", amount: 3580, date: "2025-12-10T14:00:00" },
  { id: 5, name: "Irrigation Repair", amount: 3310, date: "2026-01-14T11:00:00" },
  { id: 6, name: "Drainage Service", amount: 3745, date: "2026-02-06T15:00:00" },
  { id: 7, name: "Spring Startup", amount: 4025, date: "2026-03-09T09:45:00" },
  { id: 8, name: "Landscape Lighting", amount: 4210, date: "2026-04-10T14:00:00" },
];

export const mockBookings = [
  {
    bookingid: 101,
    status: "confirmed",
    appointmenttime: "2026-04-25T10:00:00",
    email: "JohnDoe@example.com",
    phonenum: "403-555-0192",
    service: {
      title: "Irrigation Inspection",
      baseprice: 180,
      duration: 60,
    },
  },
  {
    bookingid: 102,
    status: "confirmed",
    appointmenttime: "2026-04-27T14:30:00",
    email: "JohnDoe@example.com",
    phonenum: "403-555-0192",
    service: {
      title: "Landscape Lighting Repair",
      baseprice: 240,
      duration: 90,
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
];

export const mockLocationServices = {
  1: [
    {
      id: 11,
      title: "Irrigation Installation",
      description: "Full irrigation setup",
      base_price: 800,
      red_year: "2026",
      completed: false,
    },
  ],
  2: [
    {
      id: 12,
      title: "Landscape Lighting",
      description: "Accent lighting service",
      base_price: 450,
      red_year: "2026",
      completed: true,
    },
  ],
};

export const mockAnalyticsData = [
  { name: "Sep", budget: 4200, expenses: 2650 },
  { name: "Oct", budget: 4500, expenses: 3120 },
  { name: "Nov", budget: 4300, expenses: 2840 },
  { name: "Dec", budget: 4700, expenses: 3580 },
  { name: "Jan", budget: 4600, expenses: 3310 },
  { name: "Feb", budget: 4800, expenses: 3745 },
  { name: "Mar", budget: 5000, expenses: 4025 },
  { name: "Apr", budget: 5200, expenses: 4210 },
];