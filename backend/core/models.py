from django.db import models
from django.conf import settings

class Address(models.Model):
    addressid = models.AutoField(db_column='AddressId', primary_key=True)  # Field name made lowercase.
    street = models.CharField(db_column='Street', max_length=120, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    city = models.CharField(db_column='City', max_length=50, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    province = models.CharField(db_column='Province', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    postalcode = models.CharField(db_column='PostalCode', max_length=7, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'Address'


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
    email = models.CharField(db_column='Email', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    phonenumber = models.CharField(db_column='PhoneNumber', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'Customer'

class Service(models.Model):
    serviceid = models.AutoField(db_column='ServiceId', primary_key=True)  # Field name made lowercase.
    servicetypeid = models.IntegerField(db_column='ServiceTypeId')  # Field name made lowercase.
    title = models.CharField(db_column='Title', max_length=15, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    description = models.CharField(db_column='Description', max_length=50, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    baseprice = models.DecimalField(db_column='BasePrice', max_digits=10, decimal_places=2)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'Service'


class Serviceimage(models.Model):
    serviceimageid = models.AutoField(db_column='ServiceImageId', primary_key=True)  # Field name made lowercase.
    serviceid = models.ForeignKey(Service, models.DO_NOTHING, db_column='ServiceId')  # Field name made lowercase.
    contenttype = models.CharField(db_column='ContentType', max_length=100, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    filename = models.CharField(db_column='FileName', max_length=50, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    imagedata = models.BinaryField(db_column='ImageData')  # Field name made lowercase.
    createdat = models.DateTimeField(db_column='CreatedAt')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'ServiceImage'
        
class Customerservice(models.Model):
    customerid = models.ForeignKey(Customer, models.DO_NOTHING, db_column='CustomerId')  # Field name made lowercase.
    serviceid = models.ForeignKey('Service', models.DO_NOTHING, db_column='ServiceId')  # Field name made lowercase.
    createdat = models.DateTimeField(db_column='createdAt')  # Field name made lowercase.
    reqdate = models.DateField(db_column='reqDate')  # Field name made lowercase.
    redyear = models.CharField(db_column='redYear', max_length=4, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    completed = models.BooleanField()

    class Meta:
        managed = False
        db_table = 'CustomerService'


class Employee(models.Model):
    employeeid = models.AutoField(db_column='EmployeeId', primary_key=True)  # Field name made lowercase.
    roleid = models.IntegerField(db_column='RoleId')  # Field name made lowercase.
    addressid = models.OneToOneField(Address, models.DO_NOTHING, db_column='AddressId')  # Field name made lowercase.
    employeenumber = models.IntegerField(db_column='EmployeeNumber')  # Field name made lowercase.
    firstname = models.CharField(db_column='FirstName', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    lastname = models.CharField(db_column='LastName', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    phonenumber = models.CharField(db_column='PhoneNumber', max_length=10, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.
    staffstatus = models.CharField(db_column='StaffStatus', max_length=20, db_collation='SQL_Latin1_General_CP1_CI_AS')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'Employee'
