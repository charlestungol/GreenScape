from django.http import Http404, HttpResponse
from django.utils.encoding import smart_str
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404

from .models import (
    Address,
    Customer,
    Employee,
    Service,
    Customerservice,
    Serviceimage,
    Roles,
    Site,
    Zone,
    Servicetype,
    Booking,
    Invoice,
    Quotes,
    Schedule,
);
from .serializers import (
    AddressSerializer,
    CustomerSerializer,
    EmployeeSerializer,
    ServiceSerializer,
    CustomerServiceSerializer,
    ServiceImageSerializer,
    RoleSerializer,
    SiteSerializer,
    ZoneSerializer,
    ServiceTypeSerializer,
    BookingSerializer,
    InvoiceSerializer,
    QuoteSerializer,
    ScheduleSerializer,
);

# Security -- Methods for permissions of roles.
from .permissions import (
    IsOwnerOrAdmin,
    isAdmin,
    IsAuthenticatedOrReadOnly
)


# -----------------------------------------------------------------------------
# Simple CRUD ViewSets
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Address views -- Allows for CRUD --
# -----------------------------------------------------------------------------
class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    permission_classes = [IsOwnerOrAdmin, DjangoModelPermissions]

    def get_queryset(self):
        user = self.request.user
        # If the user is not authenticated, data get, is denied.
        if not (user and user.is_authenticated):
            # No data given
            return Address.objects.none()
        # If user is staff return all data
        if user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            return Address.objects.all()
        
        # If user is a customer return the users data .
        # Filters customers data
        customer = Customer.objects.filter(user_id=user.id).first()
        if customer:
            return Address.objects.filter(customerid=customer)
        
        # If user is an employee return the users data .
        employee = Employee.objects.filter(user_id=user.id).first()
        if employee:
            return Address.objects.filter(employeeid=employee)
        
        # Last fall back

        # Uses users email instead to get customer data.
        return Address.objects.filter(customer__email=user.email)



# -----------------------------------------------------------------------------
# Customer views -- Allows for CRUD --
# -----------------------------------------------------------------------------
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.select_related("addressid").all()
    serializer_class = CustomerSerializer

    # Sets it that only owner of the data, admin, or employee can edit. 
    permission_classes = [IsOwnerOrAdmin, DjangoModelPermissions]

    # Getting data
    def get_queryset(self):
        user = self.request.user
        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            return Customer.objects.none()
        
        # If its a staff return all customer
        if user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            return Customer.objects.select_related("addressid").all()
        
        # If its a customer, return customers data.
        customer = Customer.objects.filter(user_id=user.id).first()
        if customer:
            return Customer.objects.select_related("addressid").filter(user_id=user.id)
        
        # If customer return his data using email
        return Customer.objects.none()
    
    # Allows user to retrieve or update their own data using /me endpoint.
    @action(detail = False, methods = ['get', 'patch', 'delete'])
    def me(self, request):
        instance = get_object_or_404(Customer, user=request.user)

        # Getting customer data.
        if request.method.lower() == 'get':
            data = self.get_serializer(instance).data
            return Response(data)
        
        # Patch customer data
        serializers = self.get_serializer(instance, data=request.data, partial=True)

        serializers.is_valid(raise_exception = True)

        serializers.save(user=request.user)

        return Response(serializers.data, status=status.HTTP_200_OK)


# -----------------------------------------------------------------------------
# Role view -- Allows for CRUD
# -----------------------------------------------------------------------------
class RoleViewSet(viewsets.ModelViewSet):
    queryset = Roles.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [isAdmin, DjangoModelPermissions]

    # Only admin can view or edit role data.
    def get_queryset(self):
        user = self.request.user
        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            return Roles.objects.none()
        
        # If its a admin return all role
        if user.groups.filter(name__in=["Admin"]).exists():
            return Roles.objects.all()

    # Only admin can create, update, or delete role data.   
    def perform_create(self, serializer):
        user = self.request.user
        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        
        if not user.groups.filter(name__in=["Admin"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")

        serializer.save()
    
    # Only admin can update or delete role data.
    def perform_update(self, serializer):
        user = self.request.user
        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        
        if not user.groups.filter(name__in=["Admin"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")

        serializer.save()
    
    # Only admin can update or delete role data.
    def perform_destroy(self, instance):
        user = self.request.user
        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        
        if not user.groups.filter(name__in=["Admin"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        
        return super().perform_destroy(instance)

# -----------------------------------------------------------------------------
# Employee View -- Allows for CRUD --
# -----------------------------------------------------------------------------
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related("addressid").all()
    serializer_class = EmployeeSerializer
    permission_classes = [isAdmin, DjangoModelPermissions]

    # Only admin and supervisors can view or edit employee data.
    def get_queryset(self):
        user = self.request.user
        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            return Employee.objects.none()
        
        # If its a staff return all employee -- Only admin and supervisor can see all employee data.
        if user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            return Employee.objects.select_related("addressid").all()
        
        # If its an employee, return employees data.
        return Employee.objects.select_related("addressid").filter(user_id = user.id)

    # Only admin and supervisors can create employee data.
    def perform_create(self, serializer):
        user = self.request.user
        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        
        if not user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")

        serializer.save()
    
    # Only admin and supervisors can update employee data.
    def perform_update(self, serializer):
        user = self.request.user
        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        
        if not user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")

        serializer.save()
    
    # Only admin and supervisors can delete employee data.
    def perform_destroy(self, instance):
        user = self.request.user
        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        
        if not user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        
        return super().perform_destroy(instance)
    
# -----------------------------------------------------------------------------
# Service type view -- allows for CRUD
# -----------------------------------------------------------------------------
class ServiceTypeViewSet(viewsets.ModelViewSet):
    queryset = Servicetype.objects.all()
    serializer_class = ServiceTypeSerializer
    permission_classes = [isAdmin, DjangoModelPermissions]

    # Only admin and supervisors can view or edit service type data.
    def get_queryset(self):
        user = self.request.user
        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            return Servicetype.objects.none()
        
        # If its a staff return all service type -- Only admin and supervisor can see all service type data.
        if user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            return Servicetype.objects.all()
        
        # If its a customer return no data.
        return Servicetype.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        
        if not user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")

        serializer.save()
    
    def perform_update(self, serializer):
        user = self.request.user
        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        
        if not user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")

        serializer.save()
    
    def perform_destroy(self, instance):
        user = self.request.user
        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        
        if not user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        
        return super().perform_destroy(instance)

# -----------------------------------------------------------------------------
# Service view -- allows for CRUD
# -----------------------------------------------------------------------------
class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

    # Permission
    def get_permissions(self):

        # Allows authenticated user to view services
        if self.request.method in permissions.SAFE_METHODS:
            return [IsAuthenticatedOrReadOnly(), DjangoModelPermissions()]
        
        # Allows admin to view or edit data.
        return [isAdmin(), DjangoModelPermissions()]
    



# -----------------------------------------------------------------------------
# Customer's service view -- Allows for CRUD
# -----------------------------------------------------------------------------
class CustomerServiceViewSet(viewsets.ModelViewSet):
    queryset = Customerservice.objects.select_related("customerid", "serviceid").all()
    serializer_class = CustomerServiceSerializer
    permission_classes = [IsOwnerOrAdmin, DjangoModelPermissions]

    #Secure perform_create
    def perform_create(self, serializer):
        
        user = self.request.user
        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        
        # If user is staff allow them to create data for any customer.
        if self.request.user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            serializer.save()
            return
        
        # If user is a customer, allow them to create data for themselves only.
        customer = Customer.objects.filter(user_id=user.id).first()
        if not customer:
            raise PermissionDenied("You do not have permission to perform this action.")
        
        serializer.save(customerid=customer)

    # Secure perform_update
    def perform_update(self, serializer):
        instance = self.get_object()

        user = self.request.user

        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        
        # If user is staff allow them to update data for any customer.
        if self.request.user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            serializer.save()
            return

        # If user is a customer, allow them to update data for themselves only.
        customer = Customer.objects.filter(user_id=user.id).first()
        if not customer or instance.customerid != customer:
            raise PermissionDenied("You do not have permission to perform this action.")
        
        serializer.save(customerid=customer)

    # Getting data
    def get_queryset(self):
        # Get the person trying to view or edit data.
        user = self.request.user
        # If the user is not authenticated, data get, is denied.
        if not (user and user.is_authenticated):
            # No data given
            return Customerservice.objects.none()
        
        # If user is staff return all data
        if user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            return self.queryset
        
        # If user is a customer return the users data .
        # Filters customers data
        customer = Customer.objects.filter(user_id=user.id).first()
        if customer:
            return self.queryset.filter(customerid=customer)
        
        #Return no data if user is not a customer or staff (Security measure).
        return Customerservice.objects.none()

# -----------------------------------------------------------------------------
# Booking service view -- Allows for CRUD
# -----------------------------------------------------------------------------
class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related("customerid", "serviceid").all()
    serializer_class = BookingSerializer
    permission_classes = [IsOwnerOrAdmin, DjangoModelPermissions]

    # Getting data
    def get_queryset(self):
        user = self.request.user
        # If the user is not authenticated, data get, is denied.
        if not (user and user.is_authenticated):
            # No data given
            return Booking.objects.none()
        
        # If user is staff return all data
        if user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            return self.queryset
        
        # If user is a customer return the users data .
        # Filters customers data
        customer = Customer.objects.filter(user_id=user.id).first()
        if customer:
            return self.queryset.filter(customerid=customer)
        # Uses users email instead to get customer data.
        return Booking.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user

        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        
        # If user is staff allow them to create data for any customer.
        if self.request.user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            serializer.save()
            return
        
        # If user is a customer, allow them to create data for themselves only.
        customer = Customer.objects.filter(user_id=user.id).first()
        if not customer:
            raise PermissionDenied("You do not have permission to perform this action.")
        serializer.save(customerid=customer)

    def perform_update(self, serializer):
        instance = self.get_object()
        user = self.request.user

        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        
        # If user is staff allow them to update data for any customer.
        if self.request.user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            serializer.save()
            return

        # If user is a customer, allow them to update data for themselves only.
        customer = Customer.objects.filter(user_id=user.id).first()
        if not customer or instance.customerid != customer:
            raise PermissionDenied("You do not have permission to perform this action.")
        
        serializer.save(customerid=customer)
    
# -----------------------------------------------------------------------------
# Invoice view -- Allows for CRUD
# -----------------------------------------------------------------------------
class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related("customerid").all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    # Getting data
    def get_queryset(self):

        user = self.request.user
        # If the user is not authenticated, data get, is denied.
        if not (user and user.is_authenticated):
            # No data given
            return Invoice.objects.none()
        
        # If user is staff return all data
        if user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            return self.queryset
        
        # If user is a customer return the users data .
        # Filters customers data
        customer = Customer.objects.filter(user_id=user.id).first()
        # If customer return his data using user id
        if customer:
            return self.queryset.filter(customerid=customer)
        
        # Uses users email instead to get customer data.
        return Invoice.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user

        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        if not user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        
        # If user is staff allow them to create data for any customer.
        if self.request.user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            serializer.save()
            return
    
    def perform_update(self, serializer):
        user = self.request.user

        if not user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if not user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        
        return super().perform_destroy(instance)

# -----------------------------------------------------------------------------
# Quote view -- Allows for CRUD
# -----------------------------------------------------------------------------
class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quotes.objects.select_related("customerid").all()
    serializer_class = QuoteSerializer
    permission_classes = [IsOwnerOrAdmin, DjangoModelPermissions]

    # Getting data
    def get_queryset(self):
        user = self.request.user
        # If the user is not authenticated, data get, is denied.
        if not (user and user.is_authenticated):
            # No data given
            return Quotes.objects.none()
        # If user is staff return all data
        if user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            return self.queryset
        
        # If user is a customer return the users data .
        # Filters customers data
        customer = Customer.objects.filter(user_id=user.id).first()
        if customer:
            return self.queryset.filter(customerid=customer)
        # Uses users email instead to get customer data.
        return self.queryset.filter(customer_email=user.email)
    
    # Secure perform_create only employee can do.
    def perform_create(self, serializer):
        user = self.request.user

        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        
        if not user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")

        serializer.save()
    
    # Secure perform_update only employee can do.
    def perform_update(self, serializer):
        user = self.request.user
        if not user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        serializer.save()

    # Secure perform_destroy only employee can do.
    def perform_destroy(self, instance):
        user = self.request.user
        # Only Admin can delete a quote.
        if not user.groups.filter(name__in=["Admin"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        return super().perform_destroy(instance)
    
# -----------------------------------------------------------------------------
# Schedule view -- Allows for CRUD
# -----------------------------------------------------------------------------
class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.select_related("employeeid").all()
    serializer_class = ScheduleSerializer
    permission_classes = [IsOwnerOrAdmin, DjangoModelPermissions]

    # Getting data
    def get_queryset(self):
        user = self.request.user
        # If the user is not authenticated, data get, is denied.
        if not (user and user.is_authenticated):
            # No data given
            return Schedule.objects.none()
        # If user is staff return all data
        if user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            return self.queryset.filter(employeeid__user_id=user.id)
        
        # If user is a customer return the users data .
        # Filters customers data
        if user.groups.filter(name__in=["Staff"]).exists():
            return self.queryset.filter(employeeid__user_id=user.id)

        # If user is an employee return the users data .
        return Schedule.objects.none()
    
    # Only admin and supervisors can create schedule data.
    def perform_create(self, serializer):
        user = self.request.user

        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        
        if not user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        
        serializer.save()
    
    # Only admin and supervisors can update schedule data.
    def perform_update(self, serializer):
        user = self.request.user
        if not user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        serializer.save()

## -----------------------------------------------------------------------------
# Site view -- Allows for CRUD
# -----------------------------------------------------------------------------
class SiteViewSet(viewsets.ModelViewSet):
    queryset = Site.objects.all()
    serializer_class = SiteSerializer
    permission_classes = [IsOwnerOrAdmin, DjangoModelPermissions]

    def get_queryset(self):
        user = self.request.user
        # If the user is not authenticated, data get, is denied.
        if not (user and user.is_authenticated):
            # No data given
            return Site.objects.none()
        # If user is staff return all data
        if user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            return self.queryset
        
        # Un-comment if customer should be able to see site data. Currently, customers cannot see any site data for security measures.

        # customer = Customer.objects.filter(user_id=user.id).first()
        # if customer:
        #     return self.queryset.filter(customerid=customer)
        
        return Site.objects.none()
    
    # Only employees can create site data.
    def perform_create(self, serializer):
        user = self.request.user

        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        
        if not user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        
        serializer.save()
    
    # Only employees can update site data.
    def perform_update(self, serializer):
        user = self.request.user
        if not user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        serializer.save()
    
    # Only Admin and supervisors can delete site data.
    def perform_destroy(self, instance):
        user = self.request.user
        if not user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        return super().perform_destroy(instance)
    
# -----------------------------------------------------------------------------
# Zone view -- Allows for CRUD
# -----------------------------------------------------------------------------
class ZoneViewSet(viewsets.ModelViewSet):
    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer
    permission_classes = [IsOwnerOrAdmin, DjangoModelPermissions]

    def get_queryset(self):
        user = self.request.user
        # If the user is not authenticated, data get, is denied.
        if not (user and user.is_authenticated):
            # No data given
            return Zone.objects.none()
        # If user is staff return all data
        if user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            return self.queryset
        
        # Un-comment if customer should be able to see zone data. Currently, customers cannot see any zone data for security measures.

        # customer = Customer.objects.filter(user_id=user.id).first()
        # if customer:
        #     return self.queryset.filter(customerid=customer)
        
        return Zone.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user

        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        
        if not user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        
        serializer.save()

    def perform_update(self, serializer):
        user = self.request.user
        if not user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        serializer.save()
    
    def perform_destroy(self, instance):
        user = self.request.user
        if not user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        return super().perform_destroy(instance)

# -----------------------------------------------------------------------------
#Service Image ViewSet
# - list/retrieve give metadata (no raw bytes)
# - POST /upload to attach a file to a service
# - GET  /{id}/bytes to stream the image inline (no download dialog)
# -----------------------------------------------------------------------------
class ServiceImageViewSet(viewsets.ModelViewSet):
    queryset = Serviceimage.objects.select_related("serviceid").all()
    serializer_class = ServiceImageSerializer
    parser_classes = [MultiPartParser, FormParser]  # for upload
    permission_classes = [DjangoModelPermissions]

    # Check users permission
    def get_permissions(self):
        # Allows view for authenticated user only
        if self.request.method in permissions.SAFE_METHODS:
            return [IsAuthenticatedOrReadOnly()]
        # Allows admin to view or edit data.
        return [isAdmin()]
    
    # Get data
    def get_queryset(self):
        # Use super meaning admin to get a query set as qs
        qs = super().get_queryset()
        # Get service Id from the service image db
        service_id = self.request.query_params.get("serviceid")
        # Filter from the service the service for that image
        if service_id:
            qs = qs.filter(serviceid_id=service_id)
        # Return the query.
        return qs

    # To upload an image to a service.
    @action(detail=False, methods=["post"], url_path="upload")
    def upload(self, request):

        # Multipart upload:
        #   - image: the file
        #   - serviceid: FK to Service
        #   - optional: filename, contenttype (will infer if not provided)

        # Reduce upload of image to only 5mb
        MAX_BYTES = 5 * 1024 * 1024 
        # Only allows this type of uploads
        ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

        # The image object
        file_obj = request.FILES.get("image") #The actual image data
        service_id = request.data.get("serviceid") #The service which the image is for
        filename = request.data.get("filename") #The setted name for the image
        contenttype = request.data.get("contenttype") #The type of contant -- jpeg, png

        # Check if there is an image
        if not file_obj:
            return Response({"detail": "Missing file field 'image'."},
                            status=status.HTTP_400_BAD_REQUEST)
        # Check if there is a service
        if not service_id:
            return Response({"detail": "Missing 'serviceid'."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Infer filename/content type if not provided
        if not filename:
            filename = getattr(file_obj, "name", "image")
        if not contenttype:
            contenttype = getattr(file_obj, "content_type", "application/octet-stream")

        # Read bytes (BinaryField accepts bytes)
        raw_bytes = file_obj.read() #Set the image data to an attribute
        # Check the size of the file
        if len(raw_bytes) > MAX_BYTES:
            return Response({"details" : "File too large (max 5 MB)"}, status=413)

        # Check if the uploaded file is an image or not
        ctype = getattr(file_obj, "content_type", None) or "application/octet-stream"
        # Check if the image is allowed
        if ctype not in ALLOWED_TYPES:
            return Response({"detail" : f"Unsupported content type: {ctype}" }, status = 415)

        # Create the image itself.
        img = Serviceimage.objects.create(
            serviceid_id=int(service_id),
            contenttype=contenttype,
            filename=filename,
            imagedata=raw_bytes,
            # createdat -> Added automatically from DB
        )

        # Serialize the image
        data = ServiceImageSerializer(img, context={"request": request}).data
        # Return the data.
        return Response(data, status=status.HTTP_201_CREATED)

    # Get the image from db as bytes so machine can read it. --Gets all image
    @action(detail=True, methods=["get"], url_path="bytes")
    def bytes(self, request, pk=None):
        
        # Streams raw image bytes with Content-Disposition: inline
        # so browsers/apps render it rather than prompting a download.

        # Try getting query
        try:
            img = self.get_queryset().get(pk=pk)
        except Serviceimage.DoesNotExist:
            raise Http404("Image not found")

        # Check image type
        content_type = img.contenttype or "application/octet-stream"
        # Get image name
        disp_name = img.filename or "image"

        # Get image link
        resp = HttpResponse(img.imagedata, content_type=content_type)
        # 
        resp["Content-Disposition"] = f'inline; filename="{smart_str(disp_name)}"'
        # Adjust caching policy as needed
        resp["Cache-Control"] = "private, max-age=0, no-store"
        return resp

    #Get the latest image for that service. --  Get the most recent image for a service.
    @action(detail=False, methods=["get"], url_path=r"service/(?P<service_id>\d+)/latest/bytes")
    def latest_bytes(self, request, service_id: int):
        
        # Streams the most recent image for a service (inline).
        img = (
            self.get_queryset() #Get all image
            .filter(serviceid_id=service_id) #Get service image with service selected
            .order_by("-serviceimageid")  #Filter image by the most recent image by that service.
            .first() 
        )
        #If there is no image raise error.
        if not img:
            raise Http404("No image for this service")

        # Check type of the image -- jpeg, png.
        content_type = img.contenttype or "application/octet-stream"
        #Get image name
        disp_name = img.filename or "image"
        #Create response with image.
        resp = HttpResponse(img.imagedata, content_type=content_type)
        resp["Content-Disposition"] = f'inline; filename="{smart_str(disp_name)}"'
        resp["Cache-Control"] = "private, max-age=0, no-store"
        #Return the image as HTTPs
        return resp
