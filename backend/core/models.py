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
        ordering = ['customerid']

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
        ordering = ['servicetypeid']

# Service model
class Service(models.Model):
    serviceid = models.AutoField(db_column='ServiceId', primary_key=True) 
    servicetype = models.ForeignKey(Servicetype, db_column='ServiceTypeId', on_delete=models.PROTECT, null=True, blank=True) 
    title = models.CharField(db_column='Title', max_length=15, db_collation='SQL_Latin1_General_CP1_CI_AS')
    description = models.CharField(db_column='Description', max_length=50, db_collation='SQL_Latin1_General_CP1_CI_AS')
    baseprice = models.DecimalField(db_column='BasePrice', max_digits=10, decimal_places=2)

    class Meta:
        managed = True
        db_table = 'Service'
        ordering = ['serviceid']
        constraints = [
                    models.UniqueConstraint(fields=['servicetype', 'title'], name='uq_service_type_title'),
                ]


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
        ordering = ['created_at']
        db_table = "ServiceImage"

class UserImage(models.Model):
    userimageid = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null = True,
        blank = False,
        related_name="images",
    )
    bucket = models.CharField(max_length=100, default="profiles")
    storage_path =  models.CharField(max_length=512)
    content_type = models.CharField(max_length=100)
    file_name =  models.CharField(max_length=100)
    size_byte = models.PositiveBigIntegerField(null=True, blank = True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = True
        db_table = "users_userimage"
        ordering = ['created_at']
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["bucket", "storage_path"])
        ]
    
    def __str__(self):
        base = self.file_name or self.storage_path
        return f"UserImage#{self.userimageid} for {self.user_id} → {base}"

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
        ordering = ['createdat']
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
    firstname = models.CharField(db_column="FirstName", max_length=20, null=True, blank=True)
    lastname = models.CharField(db_column="LastName", max_length=20,null=True, blank=True)
    phonenumber = models.CharField(db_column="PhoneNumber", max_length=10, null=True, blank=True)
    staffstatus = models.CharField(db_column="StaffStatus", max_length=20, null=True, blank=True)
    roleid = models.ForeignKey(Group, models.DO_NOTHING, db_column='RoleId')

    class Meta:
        managed = True
        ordering = ['employeeid']
# ---------------------------------------
# Booking model
# ---------------------------------------
class Booking(models.Model):
    bookingid = models.AutoField(db_column='BookingId', primary_key=True)  # Field name made lowercase.
    customerid = models.ForeignKey('Customer', models.DO_NOTHING, db_column='CustomerId')  # Field name made lowercase.
    serviceid = models.ForeignKey('Service', models.DO_NOTHING, db_column='ServiceId')  # Field name made lowercase.
    siteid = models.ForeignKey('Site', models.DO_NOTHING, db_column='SiteId', null=True, blank=True)  # Field name made lowercase.
    appointmenttime = models.DateTimeField(db_column='AppointmentTime')  # Field name made lowercase.
    status = models.CharField(db_column='Status', max_length=15, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    email = models.EmailField(db_column='Email', max_length=30,null=False, blank=False, db_collation='SQL_Latin1_General_CP1_CI_AS')
    phonenum = models.CharField(db_column='PhoneNum', max_length=30, null=False, blank=False,db_collation='SQL_Latin1_General_CP1_CI_AS' )

    class Meta:
        managed = True
        ordering = ['appointmenttime']
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
        ordering = ['issuedate']
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
        ordering = ['quotesid']
        db_table = 'Quotes'


# ---------------------------------------
# RequestQuote model
# ---------------------------------------
class RequestQuote(models.Model):
    requestquoteid = models.AutoField(db_column='RequestQuoteId', primary_key=True)
    fullname = models.CharField(db_column='FullName', max_length=50, db_collation='SQL_Latin1_General_CP1_CI_AS')
    phonenumber = models.CharField(db_column='PhoneNumber', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AS')
    email = models.EmailField(db_column='Email', max_length=100, db_collation='SQL_Latin1_General_CP1_CI_AS')
    street = models.CharField(db_column='Street', max_length=100, db_collation='SQL_Latin1_General_CP1_CI_AS')
    city = models.CharField(db_column='City', max_length=100, db_collation='SQL_Latin1_General_CP1_CI_AS')
    province = models.CharField(db_column='Province', max_length=50, db_collation='SQL_Latin1_General_CP1_CI_AS')
    postalcode = models.CharField(db_column='PostalCode', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AS')
    producttype = models.CharField(db_column='ProductType', max_length=100, blank=True, null=True, db_collation='SQL_Latin1_General_CP1_CI_AS')
    plumbing = models.CharField(db_column='Plumbing', max_length=255, blank=True, null=True, db_collation='SQL_Latin1_General_CP1_CI_AS')
    zones = models.IntegerField(db_column='Zones', blank=True, null=True)
    lighting = models.CharField(db_column='Lighting', max_length=10, blank=True, null=True, db_collation='SQL_Latin1_General_CP1_CI_AS')
    system = models.CharField(db_column='System', max_length=10, blank=True, null=True, db_collation='SQL_Latin1_General_CP1_CI_AS')
    wifi = models.CharField(db_column='WiFi', max_length=10, blank=True, null=True, db_collation='SQL_Latin1_General_CP1_CI_AS')
    sensor = models.CharField(db_column='Sensor', max_length=10, blank=True, null=True, db_collation='SQL_Latin1_General_CP1_CI_AS')
    status = models.CharField(db_column='Status', max_length=20, default='pending', db_collation='SQL_Latin1_General_CP1_CI_AS')
    customerid = models.ForeignKey('Customer', models.DO_NOTHING, db_column='CustomerId', blank=True, null=True)

    def __str__(self):
        return f"Quote {self.requestquoteid} - {self.fullname}"

    class Meta:
        managed = True
        ordering = ['requestquoteid']
        db_table = 'RequestQuote'

# ---------------------------------------
# ServiceLocation model
# ---------------------------------------
class ServiceLocation(models.Model):
    servicelocationid = models.AutoField(db_column='ServiceLocationId', primary_key=True)
    street = models.CharField(db_column='Street', max_length=100, blank=True, null=True, db_collation='SQL_Latin1_General_CP1_CI_AS')
    city = models.CharField(db_column='City', max_length=100, blank=True, null=True, db_collation='SQL_Latin1_General_CP1_CI_AS')
    province = models.CharField(db_column='Province', max_length=50, blank=True, null=True, db_collation='SQL_Latin1_General_CP1_CI_AS')
    postalcode = models.CharField(db_column='PostalCode', max_length=20, blank=True, null=True, db_collation='SQL_Latin1_General_CP1_CI_AS')
    customerid = models.ForeignKey('Customer', models.DO_NOTHING, db_column='CustomerId', blank=True, null=True)

    def __str__(self):
        return f"{self.street}, {self.city}" or f"Location {self.servicelocationid}"

    class Meta:
        managed = True
        ordering = ['servicelocationid']
        db_table = 'ServiceLocation'


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
        ordering = ['starttime', 'endtime']
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
        ordering = ['siteid']
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
        ordering = ['zoneid']
        db_table = 'Zone'

