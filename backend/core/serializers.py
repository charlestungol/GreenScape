from rest_framework import serializers
from .models import *

# Address
class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        models = Address
        fields =  ["addressid", "street", "city", "province", "postalcode"]

# Customer
class CustomerSerializer(serializers.ModelSerializer):
    #View address data
    address = AddressSerializer(source="addressid", read_only = True)
    # Add an address to the customer
    addressid = serializers.PrimaryKeyRelatedField(
        queryset = Address.objects.all(),
        source = "addressid",
        write_only=True
    )

    class Meta:
        models = Customer
        fields = ["customerid", "address", "addressid", "firstname", "lastname", "email", "phonenumber"]

# Service
class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        models = Service
        fields = ["serviceid", "servicetypeid", "title", "description", "baseprice"]

# Service Image 
class ServiceImageSerializer(serializers.ModelSerializer):
    # Define URL
    url = serializers.SerializerMethodField()

    class Meta:
        models = Serviceimage
        fields = ["serviceimageid", "serviceid", "contenttype", "filename", "imagedata", "createdat", "url"]

        # Method to get the image url from db
        def get_url(self, obj):
            request = self.context.get("request")
            if not request:
                return None
            return request.build_absolute_url(
                f"/core/services/{obj.serviceid_id}/images/{obj.serviceimageid}"
            )

# Customer Service
class CustomerServiceSerializer(serializers.ModelSerializer):

    # View customer data
    customer = CustomerSerializer(source = "customid", read_only = True)

    # View Service
    service = ServiceSerializer(source = "serviceid", read_only = True)

    # Have a customer
    customerid = serializers.PrimaryKeyRelatedField(
        queryset = Customer.objects.all(), 
        source = "customerid", 
        write_only = True
    )

    # Have a service
    serviceid = serializers.PrimaryKeyRelatedField(
        queryset = Service.objects.all(),
        source = "serviceid",
        write_only = True
    )

    class Meta:
        models = Customerservice
        fields = ["customerid", "serviceid", "customer", "service", "createdat", "reqdate", "redyear", "completed"]

class EmployeeSerializer(serializers.ModelSerializer):
    address = AddressSerializer(source="addressid", read_only = True)

    addressid = serializers.PrimaryKeyRelatedField(
        queryset = Address.objects.all(),
        source = "addressid",
        write_only = True
    )