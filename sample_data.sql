USE [GreenScape];
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRAN;

--------------------------------------------------------------------------------
-- (Optional) If you prefer longer Service Type names than NCHAR(10)
-- ALTER TABLE dbo.ServiceType ALTER COLUMN TypeName NVARCHAR(50) NOT NULL;
-- Then replace 'TreeSvc' with 'Tree Service' in the insert below.
--------------------------------------------------------------------------------

/* 1) USERS (parents for many FKs) */
-- Alice
IF NOT EXISTS (SELECT 1 FROM dbo.users_customuser WHERE email = 'alice.smith@email.com')
BEGIN
  INSERT INTO dbo.users_customuser
  (password, last_login, is_superuser, username, first_name, last_name, is_staff, is_active, date_joined, email, birthday, employee_number, role)
  VALUES
  ('hashedpw1', '2026-02-10', 1, 'alice', 'Alice', 'Smith', 1, 1, '2026-01-01', 'alice.smith@email.com', '1990-05-10', 'EMP1001', 'Manager');
END;

-- Bob
IF NOT EXISTS (SELECT 1 FROM dbo.users_customuser WHERE email = 'bob.johnson@email.com')
BEGIN
  INSERT INTO dbo.users_customuser
  (password, last_login, is_superuser, username, first_name, last_name, is_staff, is_active, date_joined, email, birthday, employee_number, role)
  VALUES
  ('hashedpw2', '2026-02-10', 0, 'bob', 'Bob', 'Johnson', 1, 1, '2026-01-02', 'bob.johnson@email.com', '1985-08-20', 'EMP1002', 'Worker');
END;

-- Carol
IF NOT EXISTS (SELECT 1 FROM dbo.users_customuser WHERE email = 'carol.lee@email.com')
BEGIN
  INSERT INTO dbo.users_customuser
  (password, last_login, is_superuser, username, first_name, last_name, is_staff, is_active, date_joined, email, birthday, employee_number, role)
  VALUES
  ('hashedpw3', '2026-02-10', 0, 'carol', 'Carol', 'Lee', 0, 1, '2026-01-03', 'carol.lee@email.com', '1992-12-15', 'EMP1003', 'Admin');
END;
-- (users_customuser schema and unique email constraint per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 2) ADDRESS (parent for Customer/Site) */
IF NOT EXISTS (SELECT 1 FROM dbo.Address WHERE Street='123 Maple Ave' AND City='Calgary' AND PostalCode='T2P1A1')
INSERT INTO dbo.Address (Street, City, Province, PostalCode)
VALUES ('123 Maple Ave', 'Calgary', 'AB', 'T2P1A1');

IF NOT EXISTS (SELECT 1 FROM dbo.Address WHERE Street='456 Oak St' AND City='Edmonton' AND PostalCode='T5J2N3')
INSERT INTO dbo.Address (Street, City, Province, PostalCode)
VALUES ('456 Oak St', 'Edmonton', 'AB', 'T5J2N3');

IF NOT EXISTS (SELECT 1 FROM dbo.Address WHERE Street='789 Pine Rd' AND City='Red Deer' AND PostalCode='T4N5E1')
INSERT INTO dbo.Address (Street, City, Province, PostalCode)
VALUES ('789 Pine Rd', 'Red Deer', 'AB', 'T4N5E1');
-- (Address columns/PK per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 3) CUSTOMER (FK to Address, users_customuser via FK_Customer_User ON DELETE SET NULL) */
IF NOT EXISTS (SELECT 1 FROM dbo.Customer WHERE Email='alice.smith@email.com')
INSERT INTO dbo.Customer (AddressId, FirstName, LastName, Email, PhoneNumber, UserId)
SELECT a.AddressId, 'Alice', 'Smith', 'alice.smith@email.com', '4031234567', u.id
FROM dbo.Address a
JOIN dbo.users_customuser u ON u.email='alice.smith@email.com'
WHERE a.Street='123 Maple Ave' AND a.City='Calgary' AND a.PostalCode='T2P1A1';

IF NOT EXISTS (SELECT 1 FROM dbo.Customer WHERE Email='bob.johnson@email.com')
INSERT INTO dbo.Customer (AddressId, FirstName, LastName, Email, PhoneNumber, UserId)
SELECT a.AddressId, 'Bob', 'Johnson', 'bob.johnson@email.com', '7809876543', u.id
FROM dbo.Address a
JOIN dbo.users_customuser u ON u.email='bob.johnson@email.com'
WHERE a.Street='456 Oak St' AND a.City='Edmonton' AND a.PostalCode='T5J2N3';

IF NOT EXISTS (SELECT 1 FROM dbo.Customer WHERE Email='carol.lee@email.com')
INSERT INTO dbo.Customer (AddressId, FirstName, LastName, Email, PhoneNumber, UserId)
SELECT a.AddressId, 'Carol', 'Lee', 'carol.lee@email.com', '5875551234', u.id
FROM dbo.Address a
JOIN dbo.users_customuser u ON u.email='carol.lee@email.com'
WHERE a.Street='789 Pine Rd' AND a.City='Red Deer' AND a.PostalCode='T4N5E1';
-- (FK_Customer_User and columns per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 4) ROLES (independent) */
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName='Manager')
INSERT INTO dbo.Roles (RoleName, Description, EarnPerHour) VALUES ('Manager', N'Oversees operations', 35.00);

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName='Worker')
INSERT INTO dbo.Roles (RoleName, Description, EarnPerHour) VALUES ('Worker',  N'Performs services',   20.00);

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName='Admin')
INSERT INTO dbo.Roles (RoleName, Description, EarnPerHour) VALUES ('Admin',   N'Handles admin tasks', 25.00);
-- (Roles schema per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 5) EMPLOYEE (FK to Roles, Address, users_customuser via FK_Employee_User) */
IF NOT EXISTS (SELECT 1 FROM dbo.Employee WHERE EmployeeNumber=1001)
INSERT INTO dbo.Employee (RoleId, AddressId, EmployeeNumber, FirstName, LastName, PhoneNumber, StaffStatus, UserId)
SELECT r.RoleId, a.AddressId, 1001, 'David', 'Brown', '4031112222', 'Active', u.id
FROM dbo.Roles r, dbo.Address a, dbo.users_customuser u
WHERE r.RoleName='Manager'
  AND a.Street='123 Maple Ave' AND a.City='Calgary' AND a.PostalCode='T2P1A1'
  AND u.email='alice.smith@email.com';

IF NOT EXISTS (SELECT 1 FROM dbo.Employee WHERE EmployeeNumber=1002)
INSERT INTO dbo.Employee (RoleId, AddressId, EmployeeNumber, FirstName, LastName, PhoneNumber, StaffStatus, UserId)
SELECT r.RoleId, a.AddressId, 1002, 'Eve', 'White', '7802223333', 'Active', u.id
FROM dbo.Roles r, dbo.Address a, dbo.users_customuser u
WHERE r.RoleName='Worker'
  AND a.Street='456 Oak St' AND a.City='Edmonton' AND a.PostalCode='T5J2N3'
  AND u.email='bob.johnson@email.com';

IF NOT EXISTS (SELECT 1 FROM dbo.Employee WHERE EmployeeNumber=1003)
INSERT INTO dbo.Employee (RoleId, AddressId, EmployeeNumber, FirstName, LastName, PhoneNumber, StaffStatus, UserId)
SELECT r.RoleId, a.AddressId, 1003, 'Frank', 'Black', '5873334444', 'Inactive', u.id
FROM dbo.Roles r, dbo.Address a, dbo.users_customuser u
WHERE r.RoleName='Admin'
  AND a.Street='789 Pine Rd' AND a.City='Red Deer' AND a.PostalCode='T4N5E1'
  AND u.email='carol.lee@email.com';
-- (FK_Employee_User and columns per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 6) SERVICETYPE (TypeName is NCHAR(10) => keep ≤ 10 chars) */
IF NOT EXISTS (SELECT 1 FROM dbo.ServiceType WHERE TypeCode='LAWN')
INSERT INTO dbo.ServiceType (TypeCode, TypeName) VALUES ('LAWN', 'Lawn Care');

IF NOT EXISTS (SELECT 1 FROM dbo.ServiceType WHERE TypeCode='TREE')
INSERT INTO dbo.ServiceType (TypeCode, TypeName) VALUES ('TREE', 'TreeSvc');

IF NOT EXISTS (SELECT 1 FROM dbo.ServiceType WHERE TypeCode='GARD')
INSERT INTO dbo.ServiceType (TypeCode, TypeName) VALUES ('GARD', 'Gardening');
-- (ServiceType schema per DDL; TypeName NCHAR(10)) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 7) SERVICE (FK to ServiceType) */
IF NOT EXISTS (SELECT 1 FROM dbo.Service WHERE Title='Lawn Mowing')
INSERT INTO dbo.Service (ServiceTypeId, Title, Description, BasePrice)
SELECT st.ServiceTypeId, 'Lawn Mowing', 'Weekly lawn mowing service', 50.00
FROM dbo.ServiceType st WHERE st.TypeCode='LAWN';

IF NOT EXISTS (SELECT 1 FROM dbo.Service WHERE Title='Tree Trimming')
INSERT INTO dbo.Service (ServiceTypeId, Title, Description, BasePrice)
SELECT st.ServiceTypeId, 'Tree Trimming', 'Professional tree trimming', 120.00
FROM dbo.ServiceType st WHERE st.TypeCode='TREE';

IF NOT EXISTS (SELECT 1 FROM dbo.Service WHERE Title='Garden Cleanup')
INSERT INTO dbo.Service (ServiceTypeId, Title, Description, BasePrice)
SELECT st.ServiceTypeId, 'Garden Cleanup', 'Seasonal garden cleanup', 80.00
FROM dbo.ServiceType st WHERE st.TypeCode='GARD';
-- (Service schema/FKs per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 8) SITE (FK to Address, Customer) */
IF NOT EXISTS (
    SELECT 1 FROM dbo.Site s
    JOIN dbo.Address a ON s.AddressId=a.AddressId
    JOIN dbo.Customer c ON s.CustomerId=c.CustomerId
    WHERE a.Street='123 Maple Ave' AND a.City='Calgary' AND a.PostalCode='T2P1A1' AND c.Email='alice.smith@email.com'
)
INSERT INTO dbo.Site (AddressId, CustomerId, MainLineSize, DoorCode, BrandOfHeads, Remarks)
SELECT a.AddressId, c.CustomerId, '1 inch', '1234', 'RainBird', 'Front yard only'
FROM dbo.Address a JOIN dbo.Customer c ON c.Email='alice.smith@email.com'
WHERE a.Street='123 Maple Ave' AND a.City='Calgary' AND a.PostalCode='T2P1A1';

IF NOT EXISTS (
    SELECT 1 FROM dbo.Site s
    JOIN dbo.Address a ON s.AddressId=a.AddressId
    JOIN dbo.Customer c ON s.CustomerId=c.CustomerId
    WHERE a.Street='456 Oak St' AND a.City='Edmonton' AND a.PostalCode='T5J2N3' AND c.Email='bob.johnson@email.com'
)
INSERT INTO dbo.Site (AddressId, CustomerId, MainLineSize, DoorCode, BrandOfHeads, Remarks)
SELECT a.AddressId, c.CustomerId, '3/4 inch', '5678', 'Hunter', 'Back yard only'
FROM dbo.Address a JOIN dbo.Customer c ON c.Email='bob.johnson@email.com'
WHERE a.Street='456 Oak St' AND a.City='Edmonton' AND a.PostalCode='T5J2N3';

IF NOT EXISTS (
    SELECT 1 FROM dbo.Site s
    JOIN dbo.Address a ON s.AddressId=a.AddressId
    JOIN dbo.Customer c ON s.CustomerId=c.CustomerId
    WHERE a.Street='789 Pine Rd' AND a.City='Red Deer' AND a.PostalCode='T4N5E1' AND c.Email='carol.lee@email.com'
)
INSERT INTO dbo.Site (AddressId, CustomerId, MainLineSize, DoorCode, BrandOfHeads, Remarks)
SELECT a.AddressId, c.CustomerId, '1/2 inch', '9101', 'Toro', 'Full property'
FROM dbo.Address a JOIN dbo.Customer c ON c.Email='carol.lee@email.com'
WHERE a.Street='789 Pine Rd' AND a.City='Red Deer' AND a.PostalCode='T4N5E1';
-- (FK_Site_Address, FK_Site_Customer per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 9) ZONE (FK to Site) */
IF NOT EXISTS (SELECT 1 FROM dbo.Zone WHERE ZoneName='Zone A')
INSERT INTO dbo.Zone (SiteId, ZoneName, ZoneArea, ZoneType, BaseRate)
SELECT s.SiteId, 'Zone A', '100 sqm', 'Lawn', 30.00
FROM dbo.Site s
JOIN dbo.Address a ON s.AddressId = a.AddressId
JOIN dbo.Customer c ON s.CustomerId = c.CustomerId AND c.Email='alice.smith@email.com'
WHERE a.Street='123 Maple Ave' AND a.City='Calgary' AND a.PostalCode='T2P1A1';

IF NOT EXISTS (SELECT 1 FROM dbo.Zone WHERE ZoneName='Zone B')
INSERT INTO dbo.Zone (SiteId, ZoneName, ZoneArea, ZoneType, BaseRate)
SELECT s.SiteId, 'Zone B', '50 sqm', 'Garden', 20.00
FROM dbo.Site s
JOIN dbo.Address a ON s.AddressId = a.AddressId
JOIN dbo.Customer c ON s.CustomerId = c.CustomerId AND c.Email='bob.johnson@email.com'
WHERE a.Street='456 Oak St' AND a.City='Edmonton' AND a.PostalCode='T5J2N3';

IF NOT EXISTS (SELECT 1 FROM dbo.Zone WHERE ZoneName='Zone C')
INSERT INTO dbo.Zone (SiteId, ZoneName, ZoneArea, ZoneType, BaseRate)
SELECT s.SiteId, 'Zone C', '75 sqm', 'Tree', 25.00
FROM dbo.Site s
JOIN dbo.Address a ON s.AddressId = a.AddressId
JOIN dbo.Customer c ON s.CustomerId = c.CustomerId AND c.Email='carol.lee@email.com'
WHERE a.Street='789 Pine Rd' AND a.City='Red Deer' AND a.PostalCode='T4N5E1';
-- (Zone schema per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 10) BOOKING (FK to Customer, Service, Site) */
IF NOT EXISTS (SELECT 1 FROM dbo.Booking WHERE Status='Scheduled' AND AppointmentTime='2026-02-15 09:00')
INSERT INTO dbo.Booking (CustomerId, ServiceId, SiteId, AppointmentTime, Status)
SELECT c.CustomerId,
       (SELECT ServiceId FROM dbo.Service WHERE Title='Lawn Mowing'),
       s.SiteId,
       '2026-02-15 09:00', 'Scheduled'
FROM dbo.Customer c
JOIN dbo.Site s ON s.CustomerId = c.CustomerId
WHERE c.Email='alice.smith@email.com';

IF NOT EXISTS (SELECT 1 FROM dbo.Booking WHERE Status='Completed' AND AppointmentTime='2026-02-16 10:00')
INSERT INTO dbo.Booking (CustomerId, ServiceId, SiteId, AppointmentTime, Status)
SELECT c.CustomerId,
       (SELECT ServiceId FROM dbo.Service WHERE Title='Tree Trimming'),
       s.SiteId,
       '2026-02-16 10:00', 'Completed'
FROM dbo.Customer c
JOIN dbo.Site s ON s.CustomerId = c.CustomerId
WHERE c.Email='bob.johnson@email.com';

IF NOT EXISTS (SELECT 1 FROM dbo.Booking WHERE Status='Cancelled' AND AppointmentTime='2026-02-17 11:00')
INSERT INTO dbo.Booking (CustomerId, ServiceId, SiteId, AppointmentTime, Status)
SELECT c.CustomerId,
       (SELECT ServiceId FROM dbo.Service WHERE Title='Garden Cleanup'),
       s.SiteId,
       '2026-02-17 11:00', 'Cancelled'
FROM dbo.Customer c
JOIN dbo.Site s ON s.CustomerId = c.CustomerId
WHERE c.Email='carol.lee@email.com';
-- (Booking schema/FKs per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 11) CUSTOMERSERVICE (FK to Customer, Service; unique(CustomerId,ServiceId,reqDate)) */
IF NOT EXISTS (SELECT 1 FROM dbo.CustomerService cs JOIN dbo.Customer c ON cs.CustomerId=c.CustomerId WHERE c.Email='alice.smith@email.com' AND cs.reqDate='2026-02-15')
INSERT INTO dbo.CustomerService (CustomerId, ServiceId, createdAt, reqDate, redYear, completed)
SELECT c.CustomerId,
       (SELECT ServiceId FROM dbo.Service WHERE Title='Lawn Mowing'),
       SYSUTCDATETIME(), '2026-02-15', '2026', 1
FROM dbo.Customer c WHERE c.Email='alice.smith@email.com';

IF NOT EXISTS (SELECT 1 FROM dbo.CustomerService cs JOIN dbo.Customer c ON cs.CustomerId=c.CustomerId WHERE c.Email='bob.johnson@email.com' AND cs.reqDate='2026-02-16')
INSERT INTO dbo.CustomerService (CustomerId, ServiceId, createdAt, reqDate, redYear, completed)
SELECT c.CustomerId,
       (SELECT ServiceId FROM dbo.Service WHERE Title='Tree Trimming'),
       SYSUTCDATETIME(), '2026-02-16', '2026', 1
FROM dbo.Customer c WHERE c.Email='bob.johnson@email.com';

IF NOT EXISTS (SELECT 1 FROM dbo.CustomerService cs JOIN dbo.Customer c ON cs.CustomerId=c.CustomerId WHERE c.Email='carol.lee@email.com' AND cs.reqDate='2026-02-17')
INSERT INTO dbo.CustomerService (CustomerId, ServiceId, createdAt, reqDate, redYear, completed)
SELECT c.CustomerId,
       (SELECT ServiceId FROM dbo.Service WHERE Title='Garden Cleanup'),
       SYSUTCDATETIME(), '2026-02-17', '2026', 0
FROM dbo.Customer c WHERE c.Email='carol.lee@email.com';
-- (CustomerService schema/FKs/index per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 12) SCHEDULE (FK to Booking, Employee, CustomerService) */
-- Alice/David/Scheduled
IF NOT EXISTS (SELECT 1 FROM dbo.Schedule WHERE Status='Scheduled' AND StartTime='2026-02-15 09:00')
INSERT INTO dbo.Schedule (BookingId, EmployeeId, StartTime, EndTime, Status, CustomerServiceId)
SELECT
  b.BookingId,
  e.EmployeeId,
  '2026-02-15 09:00', '2026-02-15 10:00', 'Scheduled',
  cs.CustomerServiceId
FROM dbo.Booking b
JOIN dbo.Customer c ON b.CustomerId = c.CustomerId AND c.Email='alice.smith@email.com'
JOIN dbo.Employee e ON e.EmployeeNumber=1001
JOIN dbo.CustomerService cs ON cs.CustomerId=c.CustomerId AND cs.reqDate='2026-02-15';

-- Bob/Eve/Completed
IF NOT EXISTS (SELECT 1 FROM dbo.Schedule WHERE Status='Completed' AND StartTime='2026-02-16 10:00')
INSERT INTO dbo.Schedule (BookingId, EmployeeId, StartTime, EndTime, Status, CustomerServiceId)
SELECT
  b.BookingId,
  e.EmployeeId,
  '2026-02-16 10:00', '2026-02-16 11:30', 'Completed',
  cs.CustomerServiceId
FROM dbo.Booking b
JOIN dbo.Customer c ON b.CustomerId = c.CustomerId AND c.Email='bob.johnson@email.com'
JOIN dbo.Employee e ON e.EmployeeNumber=1002
JOIN dbo.CustomerService cs ON cs.CustomerId=c.CustomerId AND cs.reqDate='2026-02-16';

-- Carol/Frank/Cancelled
IF NOT EXISTS (SELECT 1 FROM dbo.Schedule WHERE Status='Cancelled' AND StartTime='2026-02-17 11:00')
INSERT INTO dbo.Schedule (BookingId, EmployeeId, StartTime, EndTime, Status, CustomerServiceId)
SELECT
  b.BookingId,
  e.EmployeeId,
  '2026-02-17 11:00', '2026-02-17 12:00', 'Cancelled',
  cs.CustomerServiceId
FROM dbo.Booking b
JOIN dbo.Customer c ON b.CustomerId = c.CustomerId AND c.Email='carol.lee@email.com'
JOIN dbo.Employee e ON e.EmployeeNumber=1003
JOIN dbo.CustomerService cs ON cs.CustomerId=c.CustomerId AND cs.reqDate='2026-02-17';
-- (Schedule schema/FKs per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 13) QUOTES (FK to Customer, Service, Zone) */
IF NOT EXISTS (SELECT 1 FROM dbo.Quotes q JOIN dbo.Customer c ON q.CustomerId=c.CustomerId WHERE c.Email='alice.smith@email.com' AND q.Status='Approved')
INSERT INTO dbo.Quotes (CustomerId, ServiceId, AdditionalServiceId, ZoneId, TaxAmount, TotalAmount, Currency, Status)
SELECT
  c.CustomerId,
  (SELECT ServiceId FROM dbo.Service WHERE Title='Lawn Mowing'),
  (SELECT ServiceId FROM dbo.Service WHERE Title='Tree Trimming'),
  (SELECT TOP(1) z.ZoneId FROM dbo.Zone z JOIN dbo.Site s ON z.SiteId=s.SiteId WHERE z.ZoneName='Zone A'),
  5.00, 55.00, 'CAD', 'Approved'
FROM dbo.Customer c WHERE c.Email='alice.smith@email.com';

IF NOT EXISTS (SELECT 1 FROM dbo.Quotes q JOIN dbo.Customer c ON q.CustomerId=c.CustomerId WHERE c.Email='bob.johnson@email.com' AND q.Status='Pending')
INSERT INTO dbo.Quotes (CustomerId, ServiceId, AdditionalServiceId, ZoneId, TaxAmount, TotalAmount, Currency, Status)
SELECT
  c.CustomerId,
  (SELECT ServiceId FROM dbo.Service WHERE Title='Tree Trimming'),
  (SELECT ServiceId FROM dbo.Service WHERE Title='Garden Cleanup'),
  (SELECT TOP(1) z.ZoneId FROM dbo.Zone z JOIN dbo.Site s ON z.SiteId=s.SiteId WHERE z.ZoneName='Zone B'),
  12.00, 132.00, 'CAD', 'Pending'
FROM dbo.Customer c WHERE c.Email='bob.johnson@email.com';

IF NOT EXISTS (SELECT 1 FROM dbo.Quotes q JOIN dbo.Customer c ON q.CustomerId=c.CustomerId WHERE c.Email='carol.lee@email.com' AND q.Status='Rejected')
INSERT INTO dbo.Quotes (CustomerId, ServiceId, AdditionalServiceId, ZoneId, TaxAmount, TotalAmount, Currency, Status)
SELECT
  c.CustomerId,
  (SELECT ServiceId FROM dbo.Service WHERE Title='Garden Cleanup'),
  (SELECT ServiceId FROM dbo.Service WHERE Title='Lawn Mowing'),
  (SELECT TOP(1) z.ZoneId FROM dbo.Zone z JOIN dbo.Site s ON z.SiteId=s.SiteId WHERE z.ZoneName='Zone C'),
  8.00, 88.00, 'CAD', 'Rejected'
FROM dbo.Customer c WHERE c.Email='carol.lee@email.com';
-- (Quotes schema/FKs per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 14) INVOICE (FK to Quotes, Customer) */
IF NOT EXISTS (SELECT 1 FROM dbo.Invoice i JOIN dbo.Quotes q ON i.QuoteId=q.QuotesId WHERE i.TransactionRef=10001)
INSERT INTO dbo.Invoice (QuoteId, CustomerId, Amount, TransactionRef, IssueDate)
SELECT q.QuotesId, q.CustomerId, 55, 10001, '2026-02-15'
FROM dbo.Quotes q
JOIN dbo.Customer c ON q.CustomerId=c.CustomerId AND c.Email='alice.smith@email.com'
WHERE q.Status='Approved';

IF NOT EXISTS (SELECT 1 FROM dbo.Invoice i WHERE i.TransactionRef=10002)
INSERT INTO dbo.Invoice (QuoteId, CustomerId, Amount, TransactionRef, IssueDate)
SELECT q.QuotesId, q.CustomerId, 132, 10002, '2026-02-16'
FROM dbo.Quotes q
JOIN dbo.Customer c ON q.CustomerId=c.CustomerId AND c.Email='bob.johnson@email.com'
WHERE q.Status='Pending';

IF NOT EXISTS (SELECT 1 FROM dbo.Invoice i WHERE i.TransactionRef=10003)
INSERT INTO dbo.Invoice (QuoteId, CustomerId, Amount, TransactionRef, IssueDate)
SELECT q.QuotesId, q.CustomerId, 88, 10003, '2026-02-17'
FROM dbo.Quotes q
JOIN dbo.Customer c ON q.CustomerId=c.CustomerId AND c.Email='carol.lee@email.com'
WHERE q.Status='Rejected';
-- (Invoice schema/FKs per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 15) SERVICE IMAGE (FK to Service; varbinary not null, default CreatedAt exists) */
-- Use small sentinel bytes (valid PNG/JPEG headers) just for seed
IF NOT EXISTS (SELECT 1 FROM dbo.ServiceImage WHERE FileName='lawn_mowing_1.jpg')
INSERT INTO dbo.ServiceImage (ServiceId, ContentType, FileName, ImageData, CreatedAt)
SELECT s.ServiceId, 'image/jpeg', 'lawn_mowing_1.jpg', 0xFFD8FFE0, SYSUTCDATETIME()
FROM dbo.Service s WHERE s.Title='Lawn Mowing';

IF NOT EXISTS (SELECT 1 FROM dbo.ServiceImage WHERE FileName='tree_trimming_1.png')
INSERT INTO dbo.ServiceImage (ServiceId, ContentType, FileName, ImageData, CreatedAt)
SELECT s.ServiceId, 'image/png', 'tree_trimming_1.png', 0x89504E47, SYSUTCDATETIME()
FROM dbo.Service s WHERE s.Title='Tree Trimming';

IF NOT EXISTS (SELECT 1 FROM dbo.ServiceImage WHERE FileName='garden_cleanup_1.jpg')
INSERT INTO dbo.ServiceImage (ServiceId, ContentType, FileName, ImageData, CreatedAt)
SELECT s.ServiceId, 'image/jpeg', 'garden_cleanup_1.jpg', 0xFFD8FFE0, SYSUTCDATETIME()
FROM dbo.Service s WHERE s.Title='Garden Cleanup';
-- (ServiceImage schema/FKs per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 16) SERVICE REPORT (FK to Booking, Customer, Employee) */
IF NOT EXISTS (SELECT 1 FROM dbo.ServiceReport WHERE ReportText='Lawn mowing completed successfully.')
INSERT INTO dbo.ServiceReport (BookingId, EmployeeId, CustomerId, ReportText, CreatedAt)
SELECT
  b.BookingId,
  (SELECT EmployeeId FROM dbo.Employee WHERE EmployeeNumber=1001),
  b.CustomerId,
  'Lawn mowing completed successfully.', '2026-02-15'
FROM dbo.Booking b
JOIN dbo.Customer c ON b.CustomerId=c.CustomerId AND c.Email='alice.smith@email.com'
WHERE b.Status='Scheduled';

IF NOT EXISTS (SELECT 1 FROM dbo.ServiceReport WHERE ReportText='Tree trimming completed. No issues.')
INSERT INTO dbo.ServiceReport (BookingId, EmployeeId, CustomerId, ReportText, CreatedAt)
SELECT
  b.BookingId,
  (SELECT EmployeeId FROM dbo.Employee WHERE EmployeeNumber=1002),
  b.CustomerId,
  'Tree trimming completed. No issues.', '2026-02-16'
FROM dbo.Booking b
JOIN dbo.Customer c ON b.CustomerId=c.CustomerId AND c.Email='bob.johnson@email.com'
WHERE b.Status='Completed';

IF NOT EXISTS (SELECT 1 FROM dbo.ServiceReport WHERE ReportText='Garden cleanup cancelled due to weather.')
INSERT INTO dbo.ServiceReport (BookingId, EmployeeId, CustomerId, ReportText, CreatedAt)
SELECT
  b.BookingId,
  (SELECT EmployeeId FROM dbo.Employee WHERE EmployeeNumber=1003),
  b.CustomerId,
  'Garden cleanup cancelled due to weather.', '2026-02-17'
FROM dbo.Booking b
JOIN dbo.Customer c ON b.CustomerId=c.CustomerId AND c.Email='carol.lee@email.com'
WHERE b.Status='Cancelled';
-- (ServiceReport schema/FKs per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 17) DJANGO / ALLAUTH SIDE TABLES */

-- django_site (unique domain)
IF NOT EXISTS (SELECT 1 FROM dbo.django_site WHERE domain='greenscape.ca')
INSERT INTO dbo.django_site (domain, name) VALUES ('greenscape.ca', 'GreenScape Main');
IF NOT EXISTS (SELECT 1 FROM dbo.django_site WHERE domain='demo.greenscape.ca')
INSERT INTO dbo.django_site (domain, name) VALUES ('demo.greenscape.ca', 'GreenScape Demo');
-- (django_site columns/index per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

-- django_content_type (app_label, model)
IF NOT EXISTS (SELECT 1 FROM dbo.django_content_type WHERE app_label='booking' AND model='Booking')
INSERT INTO dbo.django_content_type (app_label, model) VALUES ('booking','Booking');
IF NOT EXISTS (SELECT 1 FROM dbo.django_content_type WHERE app_label='service' AND model='Service')
INSERT INTO dbo.django_content_type (app_label, model) VALUES ('service','Service');
IF NOT EXISTS (SELECT 1 FROM dbo.django_content_type WHERE app_label='customer' AND model='Customer')
INSERT INTO dbo.django_content_type (app_label, model) VALUES ('customer','Customer');
-- (django_content_type schema/index per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

-- auth_permission (depends on content_type)
IF NOT EXISTS (SELECT 1 FROM dbo.auth_permission WHERE codename='view_booking')
INSERT INTO dbo.auth_permission (name, content_type_id, codename)
SELECT 'Can view booking', (SELECT id FROM dbo.django_content_type WHERE app_label='booking' AND model='Booking'), 'view_booking';

IF NOT EXISTS (SELECT 1 FROM dbo.auth_permission WHERE codename='edit_service')
INSERT INTO dbo.auth_permission (name, content_type_id, codename)
SELECT 'Can edit service', (SELECT id FROM dbo.django_content_type WHERE app_label='service' AND model='Service'), 'edit_service';

IF NOT EXISTS (SELECT 1 FROM dbo.auth_permission WHERE codename='delete_customer')
INSERT INTO dbo.auth_permission (name, content_type_id, codename)
SELECT 'Can delete customer', (SELECT id FROM dbo.django_content_type WHERE app_label='customer' AND model='Customer'), 'delete_customer';
-- (auth_permission schema/index per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

-- auth_group, auth_group_permissions
IF NOT EXISTS (SELECT 1 FROM dbo.auth_group WHERE name='Managers')
INSERT INTO dbo.auth_group (name) VALUES ('Managers');
IF NOT EXISTS (SELECT 1 FROM dbo.auth_group WHERE name='Workers')
INSERT INTO dbo.auth_group (name) VALUES ('Workers');
IF NOT EXISTS (SELECT 1 FROM dbo.auth_group WHERE name='Admins')
INSERT INTO dbo.auth_group (name) VALUES ('Admins');

-- map groups to permissions (unique constraints in place)
IF NOT EXISTS (SELECT 1 FROM dbo.auth_group_permissions agp JOIN dbo.auth_group g ON agp.group_id=g.id WHERE g.name='Managers')
INSERT INTO dbo.auth_group_permissions (group_id, permission_id)
SELECT g.id, p.id FROM dbo.auth_group g CROSS JOIN dbo.auth_permission p
WHERE g.name='Managers' AND p.codename IN ('view_booking');

IF NOT EXISTS (SELECT 1 FROM dbo.auth_group_permissions agp JOIN dbo.auth_group g ON agp.group_id=g.id WHERE g.name='Workers')
INSERT INTO dbo.auth_group_permissions (group_id, permission_id)
SELECT g.id, p.id FROM dbo.auth_group g CROSS JOIN dbo.auth_permission p
WHERE g.name='Workers' AND p.codename IN ('edit_service');

IF NOT EXISTS (SELECT 1 FROM dbo.auth_group_permissions agp JOIN dbo.auth_group g ON agp.group_id=g.id WHERE g.name='Admins')
INSERT INTO dbo.auth_group_permissions (group_id, permission_id)
SELECT g.id, p.id FROM dbo.auth_group g CROSS JOIN dbo.auth_permission p
WHERE g.name='Admins' AND p.codename IN ('delete_customer');
-- (auth_group/auth_group_permissions schema/index per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

-- account_emailaddress (FK to users_customuser; unique constraints present)
IF NOT EXISTS (SELECT 1 FROM dbo.account_emailaddress WHERE email='alice.smith@email.com')
INSERT INTO dbo.account_emailaddress (email, verified, [primary], user_id)
SELECT 'alice.smith@email.com', 1, 1, u.id
FROM dbo.users_customuser u WHERE u.email='alice.smith@email.com';

IF NOT EXISTS (SELECT 1 FROM dbo.account_emailaddress WHERE email='bob.johnson@email.com')
INSERT INTO dbo.account_emailaddress (email, verified, [primary], user_id)
SELECT 'bob.johnson@email.com', 1, 1, u.id
FROM dbo.users_customuser u WHERE u.email='bob.johnson@email.com';

IF NOT EXISTS (SELECT 1 FROM dbo.account_emailaddress WHERE email='carol.lee@email.com')
INSERT INTO dbo.account_emailaddress (email, verified, [primary], user_id)
SELECT 'carol.lee@email.com', 0, 0, u.id
FROM dbo.users_customuser u WHERE u.email='carol.lee@email.com';
-- (account_emailaddress FK/indexes per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

-- account_emailconfirmation (FK to account_emailaddress, unique key on [key])
IF NOT EXISTS (SELECT 1 FROM dbo.account_emailconfirmation WHERE [key]='CONFIRMKEY1')
INSERT INTO dbo.account_emailconfirmation (created, sent, [key], email_address_id)
SELECT '2026-02-10', '2026-02-10', 'CONFIRMKEY1', a.id
FROM dbo.account_emailaddress a WHERE a.email='alice.smith@email.com';

IF NOT EXISTS (SELECT 1 FROM dbo.account_emailconfirmation WHERE [key]='CONFIRMKEY2')
INSERT INTO dbo.account_emailconfirmation (created, sent, [key], email_address_id)
SELECT '2026-02-10', NULL, 'CONFIRMKEY2', a.id
FROM dbo.account_emailaddress a WHERE a.email='bob.johnson@email.com';

IF NOT EXISTS (SELECT 1 FROM dbo.account_emailconfirmation WHERE [key]='CONFIRMKEY3')
INSERT INTO dbo.account_emailconfirmation (created, sent, [key], email_address_id)
SELECT '2026-02-10', '2026-02-10', 'CONFIRMKEY3', a.id
FROM dbo.account_emailaddress a WHERE a.email='carol.lee@email.com';
-- (account_emailconfirmation schema/index per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 18) TOKENS (FK to users_customuser) */
IF NOT EXISTS (SELECT 1 FROM dbo.authtoken_token WHERE [key]='TOKENKEY1')
INSERT INTO dbo.authtoken_token ([key], [created], [user_id])
SELECT 'TOKENKEY1', '2026-02-10', u.id FROM dbo.users_customuser u WHERE u.email='alice.smith@email.com';

IF NOT EXISTS (SELECT 1 FROM dbo.authtoken_token WHERE [key]='TOKENKEY2')
INSERT INTO dbo.authtoken_token ([key], [created], [user_id])
SELECT 'TOKENKEY2', '2026-02-10', u.id FROM dbo.users_customuser u WHERE u.email='bob.johnson@email.com';

IF NOT EXISTS (SELECT 1 FROM dbo.authtoken_token WHERE [key]='TOKENKEY3')
INSERT INTO dbo.authtoken_token ([key], [created], [user_id])
SELECT 'TOKENKEY3', '2026-02-10', u.id FROM dbo.users_customuser u WHERE u.email='carol.lee@email.com';
-- (authtoken_token schema: key PK, unique user_id; FK present) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

IF NOT EXISTS (SELECT 1 FROM dbo.knox_authtoken WHERE token_key='TK1')
INSERT INTO dbo.knox_authtoken (digest, created, user_id, expiry, token_key)
SELECT 'DIGEST1', '2026-02-10', u.id, '2026-03-10', 'TK1' FROM dbo.users_customuser u WHERE u.email='alice.smith@email.com';

IF NOT EXISTS (SELECT 1 FROM dbo.knox_authtoken WHERE token_key='TK2')
INSERT INTO dbo.knox_authtoken (digest, created, user_id, expiry, token_key)
SELECT 'DIGEST2', '2026-02-10', u.id, '2026-03-10', 'TK2' FROM dbo.users_customuser u WHERE u.email='bob.johnson@email.com';

IF NOT EXISTS (SELECT 1 FROM dbo.knox_authtoken WHERE token_key='TK3')
INSERT INTO dbo.knox_authtoken (digest, created, user_id, expiry, token_key)
SELECT 'DIGEST3', '2026-02-10', u.id, '2026-03-10', 'TK3' FROM dbo.users_customuser u WHERE u.email='carol.lee@email.com';
-- (knox_authtoken schema/FK per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 19) DJANGO ADMIN LOG (FK to users_customuser, content_type nullable) */
IF NOT EXISTS (SELECT 1 FROM dbo.django_admin_log WHERE object_repr='Booking #1')
INSERT INTO dbo.django_admin_log (action_time, object_id, object_repr, action_flag, change_message, content_type_id, user_id)
SELECT '2026-02-10', '1', 'Booking #1', 1, 'Created booking',
       (SELECT TOP(1) id FROM dbo.django_content_type WHERE app_label='booking' AND model='Booking'),
       (SELECT id FROM dbo.users_customuser WHERE email='alice.smith@email.com');

IF NOT EXISTS (SELECT 1 FROM dbo.django_admin_log WHERE object_repr='Service #2')
INSERT INTO dbo.django_admin_log (action_time, object_id, object_repr, action_flag, change_message, content_type_id, user_id)
SELECT '2026-02-10', '2', 'Service #2', 2, 'Edited service',
       (SELECT TOP(1) id FROM dbo.django_content_type WHERE app_label='service' AND model='Service'),
       (SELECT id FROM dbo.users_customuser WHERE email='bob.johnson@email.com');

IF NOT EXISTS (SELECT 1 FROM dbo.django_admin_log WHERE object_repr='Customer #3')
INSERT INTO dbo.django_admin_log (action_time, object_id, object_repr, action_flag, change_message, content_type_id, user_id)
SELECT '2026-02-10', '3', 'Customer #3', 3, 'Deleted customer',
       (SELECT TOP(1) id FROM dbo.django_content_type WHERE app_label='customer' AND model='Customer'),
       (SELECT id FROM dbo.users_customuser WHERE email='carol.lee@email.com');
-- (django_admin_log schema/FKs/check constraint per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 20) django_session (simple demo sessions) */
IF NOT EXISTS (SELECT 1 FROM dbo.django_session WHERE session_key='SESSION1')
INSERT INTO dbo.django_session (session_key, session_data, expire_date) VALUES
('SESSION1', 'data1', '2026-03-10');

IF NOT EXISTS (SELECT 1 FROM dbo.django_session WHERE session_key='SESSION2')
INSERT INTO dbo.django_session (session_key, session_data, expire_date) VALUES
('SESSION2', 'data2', '2026-03-10');

IF NOT EXISTS (SELECT 1 FROM dbo.django_session WHERE session_key='SESSION3')
INSERT INTO dbo.django_session (session_key, session_data, expire_date) VALUES
('SESSION3', 'data3', '2026-03-10');
-- (django_session schema/index per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

/* 21) USER GROUPS & USER PERMISSIONS (through tables; FKs to users, groups, permission) */
-- Put Alice in Managers, Bob in Workers, Carol in Admins
IF NOT EXISTS (SELECT 1 FROM dbo.users_customuser_groups ug
               JOIN dbo.users_customuser u ON ug.customuser_id=u.id
               JOIN dbo.auth_group g ON ug.group_id=g.id
               WHERE u.email='alice.smith@email.com' AND g.name='Managers')
INSERT INTO dbo.users_customuser_groups (customuser_id, group_id)
SELECT u.id, g.id FROM dbo.users_customuser u, dbo.auth_group g
WHERE u.email='alice.smith@email.com' AND g.name='Managers';

IF NOT EXISTS (SELECT 1 FROM dbo.users_customuser_groups ug
               JOIN dbo.users_customuser u ON ug.customuser_id=u.id
               JOIN dbo.auth_group g ON ug.group_id=g.id
               WHERE u.email='bob.johnson@email.com' AND g.name='Workers')
INSERT INTO dbo.users_customuser_groups (customuser_id, group_id)
SELECT u.id, g.id FROM dbo.users_customuser u, dbo.auth_group g
WHERE u.email='bob.johnson@email.com' AND g.name='Workers';

IF NOT EXISTS (SELECT 1 FROM dbo.users_customuser_groups ug
               JOIN dbo.users_customuser u ON ug.customuser_id=u.id
               JOIN dbo.auth_group g ON ug.group_id=g.id
               WHERE u.email='carol.lee@email.com' AND g.name='Admins')
INSERT INTO dbo.users_customuser_groups (customuser_id, group_id)
SELECT u.id, g.id FROM dbo.users_customuser u, dbo.auth_group g
WHERE u.email='carol.lee@email.com' AND g.name='Admins';
-- (users_customuser_groups schema/FKs/index per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

-- Give Alice/Bob/Carol a direct permission each (demo)
IF NOT EXISTS (SELECT 1 FROM dbo.users_customuser_user_permissions up
               JOIN dbo.users_customuser u ON up.customuser_id=u.id
               JOIN dbo.auth_permission p ON up.permission_id=p.id
               WHERE u.email='alice.smith@email.com' AND p.codename='view_booking')
INSERT INTO dbo.users_customuser_user_permissions (customuser_id, permission_id)
SELECT u.id, p.id FROM dbo.users_customuser u, dbo.auth_permission p
WHERE u.email='alice.smith@email.com' AND p.codename='view_booking';

IF NOT EXISTS (SELECT 1 FROM dbo.users_customuser_user_permissions up
               JOIN dbo.users_customuser u ON up.customuser_id=u.id
               JOIN dbo.auth_permission p ON up.permission_id=p.id
               WHERE u.email='bob.johnson@email.com' AND p.codename='edit_service')
INSERT INTO dbo.users_customuser_user_permissions (customuser_id, permission_id)
SELECT u.id, p.id FROM dbo.users_customuser u, dbo.auth_permission p
WHERE u.email='bob.johnson@email.com' AND p.codename='edit_service';

IF NOT EXISTS (SELECT 1 FROM dbo.users_customuser_user_permissions up
               JOIN dbo.users_customuser u ON up.customuser_id=u.id
               JOIN dbo.auth_permission p ON up.permission_id=p.id
               WHERE u.email='carol.lee@email.com' AND p.codename='delete_customer')
INSERT INTO dbo.users_customuser_user_permissions (customuser_id, permission_id)
SELECT u.id, p.id FROM dbo.users_customuser u, dbo.auth_permission p
WHERE u.email='carol.lee@email.com' AND p.codename='delete_customer';
-- (users_customuser_user_permissions schema/FKs/index per DDL) -- [1](https://mysait-my.sharepoint.com/personal/leeabraham_valera_edu_sait_ca/Documents/Microsoft%20Copilot%20Chat%20Files/GreenScape.sql)

COMMIT TRAN;
GO