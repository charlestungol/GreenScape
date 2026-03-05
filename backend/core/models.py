from django.db import models
from django.conf import settings
from django.contrib.auth.models import Group

# ---------------------------------------
# Models
# ---------------------------------------

# -------------------------------
# Address
# -------------------------------
class Address(models.Model):
    addressid = models.AutoField(db_column='AddressId', primary_key=True)  # Field name made lowercase.
    street = models.CharField(db_column='Street', max_length=120, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    city = models.CharField(db_column='City', max_length=50, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    province = models.CharField(db_column='Province', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    postalcode = models.CharField(db_column='PostalCode', max_length=7, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.

    class Meta:
        managed = True
        db_table = 'Address'


# -------------------------------
# Customer and Customer related models.
# -------------------------------
class Customer(models.Model):
    customerid = models.AutoField(db_column='CustomerId', primary_key=True)  # Field name made lowercase.
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank = True,
        db_column="UserId"
    )

    addressid = models.ForeignKey(Address, models.DO_NOTHING, db_column='AddressId')  # Field name made lowercase.
    firstname = models.CharField(db_column='FirstName', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    lastname = models.CharField(db_column='LastName', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    phonenumber = models.CharField(db_column='PhoneNumber', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.

    class Meta:
        managed = True
        db_table = 'Customer'

# ---------------------------------------
# Services and related models
# ---------------------------------------

# Service Type model
class Servicetype(models.Model):
    servicetypeid = models.AutoField(db_column='ServiceTypeId', primary_key=True)  
    typecode = models.CharField(db_column='TypeCode', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AS') 
    typename = models.CharField(db_column='TypeName', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AS') 

    class Meta:
        managed = True
        db_table = 'ServiceType'

# Service model
class Service(models.Model):
    serviceid = models.AutoField(db_column='ServiceId', primary_key=True) 
    servicetypeid = models.IntegerField(db_column='ServiceTypeId') 
    title = models.CharField(db_column='Title', max_length=15, db_collation='SQL_Latin1_General_CP1_CI_AS')
    description = models.CharField(db_column='Description', max_length=50, db_collation='SQL_Latin1_General_CP1_CI_AS')
    baseprice = models.DecimalField(db_column='BasePrice', max_digits=10, decimal_places=2)

    class Meta:
        managed = True
        db_table = 'Service'

class ServiceImage(models.Model):
    service = models.ForeignKey(
        Service,
        db_column="ServiceId",
        on_delete=models.CASCADE,
        related_name="images",
        null=False,
        blank=False,
    )
    bucket = models.CharField(max_length=100, default="service-images")
    storage_path = models.CharField(max_length=400)
    content_type = models.CharField(max_length=100)
    filename = models.CharField(max_length=100)
    size_bytes = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        managed = True
        db_table = "ServiceImage"

# Old Service image model

# class Serviceimage(models.Model):
#     serviceimageid = models.AutoField(db_column='ServiceImageId', primary_key=True)  # Field name made lowercase.
#     serviceid = models.ForeignKey(Service, models.DO_NOTHING, db_column='ServiceId')  # Field name made lowercase.
#     contenttype = models.CharField(db_column='ContentType', max_length=100, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
#     filename = models.CharField(db_column='FileName', max_length=50, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
#     imagedata = models.BinaryField(db_column='ImageData')  # Field name made lowercase.
#     createdat = models.DateTimeField(db_column='CreatedAt')  # Field name made lowercase.

#     class Meta:
#         managed = False
#         db_table = 'ServiceImage'

# ---------------------------------------
# Customer Service
# ---------------------------------------
class Customerservice(models.Model):
    customerserviceid = models.AutoField(db_column='CustomerServiceId', primary_key=True)  # Field name made lowercase.
    customerid = models.ForeignKey(Customer, models.DO_NOTHING, db_column='CustomerId')  # Field name made lowercase.
    serviceid = models.ForeignKey('Service', models.DO_NOTHING, db_column='ServiceId')  # Field name made lowercase.
    createdat = models.DateTimeField(db_column='createdAt')  # Field name made lowercase.
    reqdate = models.DateField(db_column='reqDate')  # Field name made lowercase.
    redyear = models.CharField(db_column='redYear', max_length=4, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    completed = models.BooleanField()

    class Meta:
        managed = True
        db_table = 'CustomerService'

# ---------------------------------------
# Employee model and related models
# ---------------------------------------

# Employee model
class Employee(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        db_column="UserId",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="employee",
    )
    employeeid = models.AutoField(db_column="EmployeeId", primary_key=True)
    addressid = models.OneToOneField(Address, db_column="AddressId", null=True, blank=True, on_delete=models.DO_NOTHING)
    firstname = models.CharField(db_column="FirstName", max_length=20)
    lastname = models.CharField(db_column="LastName", max_length=20)
    phonenumber = models.CharField(db_column="PhoneNumber", max_length=10)
    staffstatus = models.CharField(db_column="StaffStatus", max_length=20)
    roleid = models.ForeignKey(Group, models.DO_NOTHING, db_column='RoleId')  # Field name made lowercase.
    class Meta:
        managed = True
        db_table = "Employee"

# ---------------------------------------
# Booking model
# ---------------------------------------
class Booking(models.Model):
    bookingid = models.AutoField(db_column='BookingId', primary_key=True)  # Field name made lowercase.
    customerid = models.ForeignKey('Customer', models.DO_NOTHING, db_column='CustomerId')  # Field name made lowercase.
    serviceid = models.ForeignKey('Service', models.DO_NOTHING, db_column='ServiceId')  # Field name made lowercase.
    siteid = models.ForeignKey('Site', models.DO_NOTHING, db_column='SiteId')  # Field name made lowercase.
    appointmenttime = models.DateTimeField(db_column='AppointmentTime')  # Field name made lowercase.
    status = models.CharField(db_column='Status', max_length=15, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.

    class Meta:
        managed = True
        db_table = 'Booking'

# ---------------------------------------
# Invoice model
# ---------------------------------------
class Invoice(models.Model):
    invoiceid = models.AutoField(db_column='InvoiceId', primary_key=True)  # Field name made lowercase.
    quoteid = models.ForeignKey('Quotes', models.DO_NOTHING, db_column='QuoteId', blank=True, null=True)  # Field name made lowercase.
    customerid = models.ForeignKey(Customer, models.DO_NOTHING, db_column='CustomerId', blank=True, null=True)  # Field name made lowercase.
    amount = models.IntegerField(db_column='Amount', blank=True, null=True)  # Field name made lowercase.
    transactionref = models.IntegerField(db_column='TransactionRef', blank=True, null=True)  # Field name made lowercase.
    issuedate = models.DateTimeField(db_column='IssueDate', blank=True, null=True)  # Field name made lowercase.

    class Meta:
        managed = True
        db_table = 'Invoice'

# ---------------------------------------
# Quotes model
# ---------------------------------------
class Quotes(models.Model):
    quotesid = models.AutoField(db_column='QuotesId', primary_key=True)  # Field name made lowercase.
    customerid = models.ForeignKey(Customer, models.DO_NOTHING, db_column='CustomerId')  # Field name made lowercase.
    serviceid = models.ForeignKey('Service', models.DO_NOTHING, db_column='ServiceId')  # Field name made lowercase.
    additionalserviceid = models.IntegerField(db_column='AdditionalServiceId')  # Field name made lowercase.
    zoneid = models.ForeignKey('Zone', models.DO_NOTHING, db_column='ZoneId')  # Field name made lowercase.
    taxamount = models.DecimalField(db_column='TaxAmount', max_digits=10, decimal_places=2)  # Field name made lowercase.
    totalamount = models.DecimalField(db_column='TotalAmount', max_digits=10, decimal_places=2)  # Field name made lowercase.
    currency = models.CharField(db_column='Currency', max_length=3, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    status = models.CharField(db_column='Status', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.

    class Meta:
        managed = True
        db_table = 'Quotes'

# ---------------------------------------
# schedule model
# ---------------------------------------
class Schedule(models.Model):
    scheduleid = models.AutoField(db_column='ScheduleId', primary_key=True)  # Field name made lowercase.
    bookingid = models.ForeignKey(Booking, models.DO_NOTHING, db_column='BookingId')  # Field name made lowercase.
    customerserviceid = models.ForeignKey('Customerservice', models.DO_NOTHING, db_column='CustomerServiceId')  # Field name made lowercase.
    employeeid = models.ForeignKey(Employee, models.DO_NOTHING, db_column='EmployeeId')  # Field name made lowercase.
    starttime = models.DateTimeField(db_column='StartTime')  # Field name made lowercase.
    endtime = models.DateTimeField(db_column='EndTime')  # Field name made lowercase.
    status = models.CharField(db_column='Status', max_length=15, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.

    class Meta:
        managed = True
        db_table = 'Schedule'

# ---------------------------------------
# Site model
# ---------------------------------------
class Site(models.Model):
    siteid = models.AutoField(db_column='SiteId', primary_key=True)  # Field name made lowercase.
    addressid = models.ForeignKey(Address, models.DO_NOTHING, db_column='AddressId')  # Field name made lowercase.
    customerid = models.ForeignKey(Customer, models.DO_NOTHING, db_column='CustomerId')  # Field name made lowercase.
    mainlinesize = models.CharField(db_column='MainLineSize', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    doorcode = models.CharField(db_column='DoorCode', max_length=15, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    brandofheads = models.CharField(db_column='BrandOfHeads', max_length=30, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    remarks = models.CharField(db_column='Remarks', max_length=30, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.

    class Meta:
        managed = True
        db_table = 'Site'

# ---------------------------------------
# Site model
# ---------------------------------------
class Zone(models.Model):
    zoneid = models.AutoField(db_column='ZoneId', primary_key=True)  # Field name made lowercase.
    siteid = models.ForeignKey(Site, models.DO_NOTHING, db_column='SiteId')  # Field name made lowercase.
    zonename = models.CharField(db_column='ZoneName', max_length=15, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    zonearea = models.CharField(db_column='ZoneArea', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    zonetype = models.CharField(db_column='ZoneType', max_length=15, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    baserate = models.DecimalField(db_column='BaseRate', max_digits=10, decimal_places=2)  # Field name made lowercase.

    class Meta:
        managed = True
        db_table = 'Zone'
