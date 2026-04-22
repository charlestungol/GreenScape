export const mockEmployeeAvailability = [
  { id: 1, starttime: "2026-04-22T09:00:00", endtime: "2026-04-22T12:00:00" },
  { id: 2, starttime: "2026-04-22T13:00:00", endtime: "2026-04-22T15:00:00" },
  { id: 3, starttime: "2026-04-23T10:00:00", endtime: "2026-04-23T14:00:00" },
  { id: 4, starttime: "2026-04-24T08:30:00", endtime: "2026-04-24T11:30:00" },
  { id: 5, starttime: "2026-04-25T09:00:00", endtime: "2026-04-25T13:00:00" },

  // next week (full coverage)
  { id: 6, starttime: "2026-04-27T08:00:00", endtime: "2026-04-27T12:00:00" },
  { id: 7, starttime: "2026-04-27T13:00:00", endtime: "2026-04-27T16:00:00" },
  { id: 8, starttime: "2026-04-28T09:00:00", endtime: "2026-04-28T12:00:00" },
  { id: 9, starttime: "2026-04-28T13:00:00", endtime: "2026-04-28T17:00:00" },
  { id: 10, starttime: "2026-04-29T08:30:00", endtime: "2026-04-29T11:30:00" },
  { id: 11, starttime: "2026-04-29T12:30:00", endtime: "2026-04-29T15:30:00" },
  { id: 12, starttime: "2026-04-30T10:00:00", endtime: "2026-04-30T14:00:00" },
  { id: 13, starttime: "2026-05-01T09:00:00", endtime: "2026-05-01T12:00:00" },
  { id: 14, starttime: "2026-05-01T13:00:00", endtime: "2026-05-01T16:00:00" },
  { id: 15, starttime: "2026-05-02T08:00:00", endtime: "2026-05-02T11:00:00" },
];

export const mockBookingRequests = [
  { id: 1, client: "John Smith", email: "john@example.com", service: "Irrigation Inspection", date: "2026-04-25", time: "10:00 AM", status: "Pending" },
  { id: 2, client: "Sarah Lee", email: "sarah@example.com", service: "Landscape Lighting", date: "2026-04-26", time: "2:30 PM", status: "Pending" },
  { id: 3, client: "Mike Johnson", email: "mike@example.com", service: "Spring Startup", date: "2026-04-27", time: "09:00 AM", status: "Pending" },
  { id: 4, client: "Emily Carter", email: "emily@example.com", service: "Drainage Repair", date: "2026-04-27", time: "01:30 PM", status: "Pending" },
  { id: 5, client: "David Brown", email: "david@example.com", service: "System Winterization", date: "2026-04-28", time: "11:00 AM", status: "Approved" },
  { id: 6, client: "Amanda Wilson", email: "amanda@example.com", service: "Valve Replacement", date: "2026-04-29", time: "03:00 PM", status: "Pending" },
  { id: 7, client: "Chris Adams", email: "chris@example.com", service: "Backflow Testing", date: "2026-04-30", time: "08:30 AM", status: "Disapproved" },
  { id: 8, client: "Natalie Green", email: "natalie@example.com", service: "Landscape Lighting Repair", date: "2026-05-01", time: "02:00 PM", status: "Pending" },
  { id: 9, client: "Paul Martinez", email: "paul@example.com", service: "Sprinkler Head Repair", date: "2026-05-02", time: "09:30 AM", status: "Pending" },
  { id: 10, client: "Lisa Turner", email: "lisa@example.com", service: "Seasonal Shutdown", date: "2026-05-03", time: "12:00 PM", status: "Approved" },
];

export const mockServiceSchedules = [
  {
    scheduleid: 1,
    starttime: "2026-04-22T09:00:00",
    endtime: "2026-04-22T10:00:00",
    status: "Scheduled",
    employee: { firstname: "Test", lastname: "Employee" },
    booking: {
      bookingid: 101,
      service: { title: "Irrigation Inspection" },
      customer: { firstname: "John", lastname: "Smith", phonenumber: "403-555-1111", email: "john@example.com" },
    },
  },
  {
    scheduleid: 2,
    starttime: "2026-04-23T13:00:00",
    endtime: "2026-04-23T15:00:00",
    status: "Pending",
    employee: { firstname: "Test", lastname: "Employee" },
    booking: {
      bookingid: 102,
      service: { title: "Lighting Repair" },
      customer: { firstname: "Sarah", lastname: "Lee", phonenumber: "403-555-2222", email: "sarah@example.com" },
    },
  },
  {
    scheduleid: 3,
    starttime: "2026-04-24T08:30:00",
    endtime: "2026-04-24T11:30:00",
    status: "Completed",
    employee: { firstname: "Alex", lastname: "Brown" },
    booking: {
      bookingid: 103,
      service: { title: "System Installation" },
      customer: { firstname: "Mike", lastname: "Johnson", phonenumber: "403-555-3333", email: "mike@example.com" },
    },
  },
  {
    scheduleid: 4,
    starttime: "2026-04-27T08:00:00",
    endtime: "2026-04-27T10:00:00",
    status: "Scheduled",
    employee: { firstname: "Test", lastname: "Employee" },
    booking: {
      bookingid: 104,
      service: { title: "Spring Startup" },
      customer: { firstname: "Emily", lastname: "Carter", phonenumber: "403-555-4444", email: "emily@example.com" },
    },
  },
  {
    scheduleid: 5,
    starttime: "2026-04-27T13:00:00",
    endtime: "2026-04-27T16:00:00",
    status: "Scheduled",
    employee: { firstname: "Alex", lastname: "Brown" },
    booking: {
      bookingid: 105,
      service: { title: "Drainage Repair" },
      customer: { firstname: "David", lastname: "Brown", phonenumber: "403-555-5555", email: "david@example.com" },
    },
  },
  {
    scheduleid: 6,
    starttime: "2026-04-28T09:00:00",
    endtime: "2026-04-28T12:00:00",
    status: "Pending",
    employee: { firstname: "Test", lastname: "Employee" },
    booking: {
      bookingid: 106,
      service: { title: "Valve Replacement" },
      customer: { firstname: "Amanda", lastname: "Wilson", phonenumber: "403-555-6666", email: "amanda@example.com" },
    },
  },
  {
    scheduleid: 7,
    starttime: "2026-04-29T10:00:00",
    endtime: "2026-04-29T13:00:00", // FIXED
    status: "Cancelled",
    employee: { firstname: "Chris", lastname: "Adams" },
    booking: {
      bookingid: 107,
      service: { title: "Backflow Testing" },
      customer: { firstname: "Chris", lastname: "Adams", phonenumber: "403-555-7777", email: "chris@example.com" },
    },
  },
  {
    scheduleid: 8,
    starttime: "2026-04-30T08:30:00",
    endtime: "2026-04-30T11:30:00",
    status: "Completed",
    employee: { firstname: "Natalie", lastname: "Green" },
    booking: {
      bookingid: 108,
      service: { title: "Sprinkler Head Repair" },
      customer: { firstname: "Paul", lastname: "Martinez", phonenumber: "403-555-8888", email: "paul@example.com" },
    },
  },
  {
    scheduleid: 9,
    starttime: "2026-05-01T13:00:00", // FIXED
    endtime: "2026-05-01T16:00:00",   // FIXED
    status: "Scheduled",
    employee: { firstname: "Test", lastname: "Employee" },
    booking: {
      bookingid: 109,
      service: { title: "Landscape Lighting Repair" },
      customer: { firstname: "Lisa", lastname: "Turner", phonenumber: "403-555-9999", email: "lisa@example.com" },
    },
  },
  {
    scheduleid: 10,
    starttime: "2026-05-02T09:00:00",
    endtime: "2026-05-02T12:00:00",
    status: "Scheduled",
    employee: { firstname: "Alex", lastname: "Brown" },
    booking: {
      bookingid: 110,
      service: { title: "Seasonal Shutdown" },
      customer: { firstname: "Natalie", lastname: "Green", phonenumber: "403-555-1010", email: "natalie@example.com" },
    },
  },
];