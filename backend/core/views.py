
# ---------------------------------------------------
# Standard Library
# ---------------------------------------------------
import mimetypes
import os
import uuid

# ---------------------------------------------------
# Django
# ---------------------------------------------------
from django.contrib.auth.models import Group
from django.db import transaction
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404

# ---------------------------------------------------
# Django REST Framework
# ---------------------------------------------------
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated
from rest_framework.response import Response

# ---------------------------------------------------
# Third-Party / Services
# ---------------------------------------------------
from core.supabase_client import supabase

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SERVICE_IMAGES_BUCKET = os.getenv("SUPABASE_BUCKET_SERVICE_IMAGES", "service-images")
USER_IMAGES_BUCKET    = os.getenv("SUPABASE_BUCKET_USER_IMAGES", "profiles")



# ---------------------------------------------------
# Project: Models
# ---------------------------------------------------
from .models import (
    Address,
    Booking,
    Customer,
    Customerservice,
    Employee,
    Invoice,
    Quotes,
    Schedule,
    Service,
    ServiceImage,
    Servicetype,
    Site,
    Zone,
    UserImage
)

# ---------------------------------------------------
# Project: Serializers
# ---------------------------------------------------
from .serializers import (
    AddressSerializer,
    BookingSerializer,
    CustomerSerializer,
    CustomerServiceSerializer,
    EmployeeSerializer,
    InvoiceSerializer,
    QuoteSerializer,
    ScheduleSerializer,
    ServiceImageSerializer,
    ServiceSerializer,
    ServiceTypeSerializer,
    SiteSerializer,
    ZoneSerializer,
    UserImageSerializer
)

# ---------------------------------------------------
# Project: Permissions
# ---------------------------------------------------
from .permissions import (
    IsAuthenticatedOrReadOnly,
    IsOwnerOrAdmin,
    IsOwnerOrStaff,
    isAdmin,  # if this is a function, consider renaming to `is_admin` for PEP8
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
        
        address_ids = []
        
        # If user is a customer return the users data.
                # Filters employees data
        if user.groups.filter(name__in=["Staff"]).exists():
            employee = Employee.objects.filter(user_id=user.id).first()
            if employee and employee.addressid:
                address_ids.append(employee.addressid)
        else:
            customer = Customer.objects.filter(user_id=user.id).first()
            if customer and customer.addressid:
                address_ids.append(customer.addressid)

        # Return addresses related to the user if they are a customer or employee.
        if address_ids:
            return Address.objects.filter(pk__in=address_ids)
            
        
        # Return no data if user is not a customer or staff (Security measure).
        return Address.objects.none()

    # Only admin and supervisors can create address data. If customer or employee they use def usurp_me to update or create their own data.
    def perform_create(self, serializer):
        user = self.request.user
        # If the user is not authenticated it will not allow access.
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        if not user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        serializer.save()

    # Allows user to add thier data.
    @action(detail=False, methods=['put'], url_path='me', permission_classes=[permissions.IsAuthenticated])
    @transaction.atomic
    def upsert_me(self, request):
        user = request.user
        is_staff_user = user.groups.filter(name__in=["Staff"]).exists()

        customer = None
        employee = None
        address = None

        if is_staff_user:
            employee = Employee.objects.filter(user_id=user.id).select_related("addressid").first()
            address = employee.addressid if employee else None
        else:
            customer = Customer.objects.filter(user_id=user.id).select_related("addressid").first()
            address = customer.addressid if customer else None

        # For non-staff users, ensure Customer exists; otherwise deny.
        if not is_staff_user and not customer:
            return Response(
                {"detail": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Create Address if none exists
        if address is None:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            address = serializer.save()

            if is_staff_user:
                # Create Employee profile if missing
                if not employee:
                    try:
                        staff_group = Group.objects.get(name="Staff")
                    except Group.DoesNotExist:
                        return Response(
                            {"detail": "Group 'Staff' does not exist. Ask admin to create it."},
                            status=status.HTTP_400_BAD_REQUEST,
                        )

                    employee = Employee.objects.create(
                        user=user,
                        addressid=address,
                        roleid=staff_group,     # ✅ assign Group instance directly
                        firstname="",
                        lastname="",
                        phonenumber="",
                        staffstatus="Active",
                    )
                else:
                    employee.addressid = address
                    employee.save(update_fields=["addressid"])
            else:
                # Customer flow: link address
                customer.addressid = address
                customer.save(update_fields=["addressid"])

            return Response(self.get_serializer(address).data, status=status.HTTP_201_CREATED)

        # Update existing address (partial)
        serializer = self.get_serializer(address, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(self.get_serializer(address).data, status=status.HTTP_200_OK)


# -----------------------------------------------------------------------------
# Customer views -- Allows for CRUD --
# -----------------------------------------------------------------------------
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.select_related("addressid").all()
    serializer_class = CustomerSerializer

    # Sets it that only owner of the data, admin, or employee can edit. 
    permission_classes = [IsOwnerOrStaff, DjangoModelPermissions]

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
    
    # Only admin and supervisors can create customer data. If customer they use def me to update or create their own data.
    def get_permissions(self):
        if getattr(self, 'action', None) == 'me':
            return [IsAuthenticated()]
        return [IsOwnerOrStaff(), DjangoModelPermissions()]

    # Allows user to retrieve or update their own data using /me endpoint.
    @action(detail=False, methods=['get', 'patch'], permission_classes=[IsAuthenticated])
    def me(self, request):
        instance = get_object_or_404(Customer, user=request.user)

        if request.method.lower() == 'get':
            data = self.get_serializer(instance).data
            return Response(data)

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()  # no need to pass user, since instance is fixed
        return Response(serializer.data, status=status.HTTP_200_OK)
# -----------------------------------------------------------------------------
# Employee View -- Allows for CRUD --
# -----------------------------------------------------------------------------

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related("addressid").all()
    serializer_class = EmployeeSerializer
    # Don't set class-level permission_classes if you're overriding get_permissions()

    # Only admin and supervisors can view ALL employee data; others see only their own.
    def get_queryset(self):
        user = self.request.user
        if not (user and user.is_authenticated):
            return Employee.objects.none()

        if user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            return Employee.objects.select_related("addressid").all()

        # For Employees, return only their own record
        return Employee.objects.select_related("addressid").filter(user_id=user.id)

    # Permit reads for any authenticated user; writes require admin via your custom permission.
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [IsAuthenticated()]
        # Write operations:
        # If you have a custom isAdmin, use it; otherwise enforce via perform_* below.
        # return [isAdmin(), DjangoModelPermissions()]
        return [DjangoModelPermissions()]  # and we’ll hard-check admin/supervisor in perform_*.

    # Only admin and supervisors can create employee data.
    def perform_create(self, serializer):
        user = self.request.user
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        if not user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        serializer.save()

    # Only admin and supervisors can update employee data.
    def perform_update(self, serializer):
        user = self.request.user
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        if not user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        serializer.save()

    # Only admin and supervisors can delete employee data.
    def perform_destroy(self, instance):
        user = self.request.user
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        if not user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            raise PermissionDenied("You do not have permission to perform this action.")
        return super().perform_destroy(instance)

    # GET/PATCH /core/employees/me/
    @action(detail=False, methods=["get", "patch"], url_path="me", permission_classes=[IsAuthenticated])
    def me(self, request):
        # Adjust if your FK name differs (assuming Employee.user -> CustomUser)
        instance = get_object_or_404(Employee, user=request.user)

        if request.method == "GET":
            data = self.get_serializer(instance).data
            return Response(data, status=status.HTTP_200_OK)

        # PATCH
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # PATCH /core/employees/{id}/role/
    @action(detail=True, methods=["patch"], url_path="role", permission_classes=[isAdmin])
    def change_role(self, request, pk=None):
        user = request.user
        employee = self.get_object()
        target_user = employee.user 

        is_admin = user.groups.filter(name="Admin").exists()

        if not is_admin:
            return Response(
                {"detail": "You do not have permission to change roles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        new_role = request.data.get("role")  # "Staff", "Supervisor", "Admin"
        if new_role not in ["Staff", "Supervisor", "Admin"]:
            return Response({"detail": "Invalid role."}, status=status.HTTP_400_BAD_REQUEST)

        # Apply role via auth_group
        try:
            group = Group.objects.get(name=new_role)
        except Group.DoesNotExist:
            return Response({"detail": f"Group '{new_role}' does not exist."},
                            status=status.HTTP_400_BAD_REQUEST)

        target_user.groups.clear()
        target_user.groups.add(group)

        # Keep Employee.roleid in sync if you have that FK to Group
        if hasattr(employee, "roleid"):
            employee.roleid = group
            employee.save(update_fields=["roleid"])

        return Response({"detail": f"Role updated to {new_role}."}, status=status.HTTP_200_OK)

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
            return [IsAuthenticatedOrReadOnly()]
        
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
        return self.queryset.none()
    
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
            return self.queryset
        
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
    queryset = ServiceImage.objects.select_related("service").all()
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
        service_id = self.request.query_params.get("service")
        # Filter from the service the service for that image
        if service_id:
            qs = qs.filter(serviceid_id=service_id)
        # Return the query.
        return qs

    # To upload an image to a service.
    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get("image")
        service_id = request.data.get("service")
        filename = request.data.get("filename", file_obj.name if file_obj else "image")

        if not file_obj:
            return Response({"detail": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)
        if not service_id:
            return Response({"detail": "Missing service."}, status=status.HTTP_400_BAD_REQUEST)

        raw = file_obj.read()
        if len(raw) > 20 * 1024 * 1024:
            return Response({"detail": "Image file is too large (Max 20MB)"}, status=status.HTTP_400_BAD_REQUEST)

        content_type = (
            getattr(file_obj, "content_type", None)
            or mimetypes.guess_type(filename)[0]
            or "application/octet-stream"
        )
        if content_type not in ["image/jpeg", "image/png", "image/webp"]:
            return Response({"detail": "Unsupported image type. Only JPEG, PNG, and WebP are allowed."},
                            status=status.HTTP_400_BAD_REQUEST)

        _, ext = os.path.splitext(filename)
        ext = ext.lower() or ".bin"
        storage_path = f"{service_id}/{uuid.uuid4().hex}{ext}"

        try:
            supabase().storage.from_(SERVICE_IMAGES_BUCKET).upload(
                path=storage_path,
                file=raw,
                file_options={
                    "content-type": content_type,
                    "cache-control": "86400",
                    "upsert": "false",
                },
            )
        except Exception as e:
            return Response({"detail": f"upload failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        obj = ServiceImage.objects.create(
            service_id=int(service_id),
            bucket=SERVICE_IMAGES_BUCKET,
            storage_path=storage_path,
            content_type=content_type,           
            filename=filename,
            size_bytes=len(raw),
            uploaded_by=request.user if request.user.is_authenticated else None,
        )

        return Response(self.get_serializer(obj, context={"request": request}).data,
                        status=status.HTTP_201_CREATED)

    # To replace an existing image with a new one, deletes the old one from storage and db, then uploads the new one.
    @action(detail=True, methods=["post"], url_name="replace")
    def replace_file(self, request, pk=None):
        obj = self.get_object()
        file_obj = request.FILES.get("image")
        if not file_obj:
            return Response({"detail": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)
        
        raw = file_obj.read()
        if len(raw) > 20 * 1024 * 1024:  # Limit to 20MB
            return Response({"detail": "Image file is too large (Max 20MB)"}, status=status.HTTP_400_BAD_REQUEST)
        
        content_type = getattr(file_obj, "content_type", None) or mimetypes.guess_type(file_obj.name)[0] or "application/octet-stream"
        if content_type not in ["image/jpeg", "image/png", "image/webp"]:
            return Response({"detail": "Unsupported image type. Only JPEG, PNG, and WebP are allowed."}, status=status.HTTP_400_BAD_REQUEST)
        _, ext = os.path.splitext(file_obj.name)
        ext = ext.lower() or ".bin"
        new_path = f"{obj.serviceid_id}/{uuid.uuid4().hex}{ext}"
        up = supabase().storage.from_(SERVICE_IMAGES_BUCKET).upload(
            path=new_path,
            file=raw,
            file_options={
                "content-type": content_type,
                "cache-control": "86400",
                "upsert": "false"
            },
        )
        if up.get("error"):
            return Response({"detail": f"upload failed: {up['error']}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        old_path = obj.storage_path
        obj.storage_path = new_path
        obj.content_type = content_type
        obj.size_bytes = len(raw)
        obj.filename = getattr(file_obj, "name", obj.filename)
        obj.save(update_fields=["storage_path", "content_type", "size_bytes", "filename"])
        supabase().storage.from_(SERVICE_IMAGES_BUCKET).remove(path=old_path)

        return Response(self.get_serializer(obj, context={"request": request}).data, status=status.HTTP_200_OK)
    
    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        supabase().storage.from_(SERVICE_IMAGES_BUCKET).remove(path=obj.storage_path)
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=True, methods=["get"], url_name="bytes")
    def get_bytes(self, request, pk=None):
        obj = self.get_object()
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SERVICE_IMAGES_BUCKET}/{obj.storage_path}"
        return HttpResponseRedirect(public_url)

# -----------------------------------------------------------------------------
#User profile Image ViewSet
# - list/retrieve give metadata (no raw bytes)
# - POST /upload to attach a file to a service
# - GET  /{id}/bytes to stream the image inline (no download dialog)
# -----------------------------------------------------------------------------
class UserImageViewSet(viewsets.ModelViewSet):
    serializer_class = UserImageSerializer
    parser_classes = [MultiPartParser, FormParser]  # for upload
    permission_classes = [IsAuthenticated, IsOwnerOrAdmin]

    # Check users permission
    def get_permissions(self):
        # Allows view for authenticated user only
        if self.request.method in permissions.SAFE_METHODS:
            return [IsAuthenticatedOrReadOnly()]
        # Allows owner/admin to view or edit data.
        return [IsOwnerOrAdmin]
    
    # Get data
    def get_queryset(self):
        user = self.request.user
        qs = UserImage.object.select_related("user").all()

        if not user or not user.is_authenticated:
            return qs.none()
        
        qs = qs.filter(user_id = user.id)

        return qs
    
    
    def perform_create(self, serializer):
        # Force the created image to belong to the authenticated user.
        # This prevents clients from forging another user's id in the payload.

        if not self.request.user or not self.request.user.is_authenticated:
            raise permissions.PermissionDenied("Authentication required.")
        serializer.save(user=self.request.user)

    # Upload image  to user
    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get("image")
        user_id = self.request.user
        filename = request.data.pop("filename", file_obj.name if file_obj else "image")
        
        if not file_obj:
            return Response({"detail": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)
