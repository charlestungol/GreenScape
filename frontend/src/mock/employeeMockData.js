export const mockEmployeeSchedule = {
  "2026-04-22": [
    {
      id: 1,
      service: "Irrigation Inspection",
      start: "09:00",
      end: "10:00",
      hours: 1,
    },
    {
      id: 2,
      service: "Lighting Repair",
      start: "13:00",
      end: "15:00",
      hours: 2,
    },
  ],
  "2026-04-23": [
    {
      id: 3,
      service: "System Installation",
      start: "10:00",
      end: "13:00",
      hours: 3,
    },
  ],
};

export const mockBookingRequests = [
  {
    id: 1,
    client: "John Smith",
    email: "john@example.com",
    service: "Irrigation Inspection",
    date: "2026-04-25",
    time: "10:00 AM",
    status: "Pending",
  },
  {
    id: 2,
    client: "Sarah Lee",
    email: "sarah@example.com",
    service: "Landscape Lighting",
    date: "2026-04-26",
    time: "2:30 PM",
    status: "Pending",
  },
];

export const mockServiceSchedule = [
  {
    id: 101,
    date: "2026-04-22",
    time: "09:00 AM",
    client: "John Smith",
    contact: "403-555-1234",
    service: "Irrigation Inspection",
    employee: "Test Employee",
    location: "123 Evergreen Terrace",
    status: "Confirmed",
  },
  {
    id: 102,
    date: "2026-04-23",
    time: "01:00 PM",
    client: "Sarah Lee",
    contact: "403-555-5678",
    service: "Lighting Repair",
    employee: "Test Employee",
    location: "456 Aspen Ridge",
    status: "Scheduled",
  },
];

export const mockEmployeeAvailability = [
  {
    id: 1,
    starttime: "2026-04-22T09:00:00",
    endtime: "2026-04-22T12:00:00",
  },
  {
    id: 2,
    starttime: "2026-04-22T13:00:00",
    endtime: "2026-04-22T15:00:00",
  },
  {
    id: 3,
    starttime: "2026-04-23T10:00:00",
    endtime: "2026-04-23T14:00:00",
  },
  {
    id: 4,
    starttime: "2026-04-24T08:30:00",
    endtime: "2026-04-24T11:30:00",
  },
  {
    id: 5,
    starttime: "2026-04-25T09:00:00",
    endtime: "2026-04-25T13:00:00",
  },
];

export const mockServiceSchedules = [
  {
    scheduleid: 1,
    starttime: "2026-04-22T09:00:00",
    endtime: "2026-04-22T10:00:00",
    status: "Scheduled",
    employee: {
      firstname: "Test",
      lastname: "Employee",
    },
    booking: {
      bookingid: 101,
      service: { title: "Irrigation Inspection" },
      customer: {
        firstname: "John",
        lastname: "Smith",
        phonenumber: "403-555-1111",
        email: "john@example.com",
      },
    },
  },
  {
    scheduleid: 2,
    starttime: "2026-04-23T13:00:00",
    endtime: "2026-04-23T15:00:00",
    status: "Pending",
    employee: {
      firstname: "Test",
      lastname: "Employee",
    },
    booking: {
      bookingid: 102,
      service: { title: "Lighting Repair" },
      customer: {
        firstname: "Sarah",
        lastname: "Lee",
        phonenumber: "403-555-2222",
        email: "sarah@example.com",
      },
    },
  },
  {
    scheduleid: 3,
    starttime: "2026-04-24T08:30:00",
    endtime: "2026-04-24T11:30:00",
    status: "Completed",
    employee: {
      firstname: "Alex",
      lastname: "Brown",
    },
    booking: {
      bookingid: 103,
      service: { title: "System Installation" },
      customer: {
        firstname: "Mike",
        lastname: "Johnson",
        phonenumber: "403-555-3333",
        email: "mike@example.com",
      },
    },
  },
];