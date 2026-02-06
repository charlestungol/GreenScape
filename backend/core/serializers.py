from rest_framework import serializers
from .models import *

# Address
class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields =  ["addressid", "street", "city", "province", "postalcode"]
        read_only_fields=["addressid"]

# Customer
class CustomerSerializer(serializers.ModelSerializer):
    #View address data
    address = AddressSerializer(source="addressid", required = False)
    # Add an address to the customer
    addressid = serializers.PrimaryKeyRelatedField(
        queryset = Address.objects.all(),
        write_only=True,
        required = False
    )

    class Meta:
        model = Customer
        fields = ["customerid", "address", "addressid", "firstname", "lastname", "email", "phonenumber"]
        read_only_fields = ["customerid"]

    #own update method so user can update nested serializer fields.
    def update(self, instance, validated_data):
        # handles nested address update
        address_data = validated_data.pop("addressid", None)

        # handles switching address by id if provided.
        new_address_obj = validated_data.pop("addressid", None) if "addressid" in validated_data else None

        # Update fields on customer
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # If address data is manipulated
        if isinstance(address_data, dict):
            addr = instance.addressid
            for attr, value in address_data.items():
                setattr(addr, attr, value)
            addr.save()

        # If the address id is provided
        if new_address_obj is not None:
            instance.addressid = new_address_obj

        instance.save()
        return instance

# Service
class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["serviceid", "servicetypeid", "title", "description", "baseprice"]

# Service Image 
class ServiceImageSerializer(serializers.ModelSerializer):
    # Define URL
    url = serializers.SerializerMethodField()

    class Meta:
        model = Serviceimage
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
        write_only = True
    )

    # Have a service
    serviceid = serializers.PrimaryKeyRelatedField(
        queryset = Service.objects.all(),
        write_only = True
    )

    class Meta:
        model = Customerservice
        fields = ["customerid", "serviceid", "customer", "service", "createdat", "reqdate", "redyear", "completed"]


# Employee Serializer

class EmployeeSerializer(serializers.ModelSerializer):
    address = AddressSerializer(source="addressid", read_only = True)

    addressid = serializers.PrimaryKeyRelatedField(
        queryset = Address.objects.all(),
        write_only = True
    )

    class Meta:
        models : Employee
        fields = ["employeeid", "roleid", "address", "addressid", "employeenumber", "firstname", "lastname", "phonenumber", "staffstatus"]