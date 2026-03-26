
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
    UserImage,
    RequestQuote,
    ServiceLocation,
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
    UserImageSerializer,
    RequestQuoteSerializer,
    ServiceLocationSerializer,
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
    premisssion_classes = [IsOwnerOrAdmin]
    # Don't set class-level permission_classes if you're overriding get_permissions()

    # Only admin can view ALL employee data; others see only their own.
    def get_queryset(self):
        user = self.request.user
        if not (user and user.is_authenticated):
            return Employee.objects.none()

        if user.groups.filter(name__in=["Admin"]).exists():
            return Employee.objects.select_related("addressid").all()

        # For Employees, return only their own record
        return Employee.objects.select_related("addressid").filter(user_id=user.id)

    # # Permit reads for any authenticated user; writes require admin via your custom permission.
    # def get_permissions(self):
    #     if getattr(self, "action", None) == "me":
    #         return [IsAuthenticated()]
    #     if self.request.method in permissions.SAFE_METHODS:
    #         return [IsAuthenticated()]
    #     return [DjangoModelPermissions()]  # and we’ll hard-check admin/supervisor in perform_*.

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
    
    # -------- helpers --------

    # Check if user is an employee
    def get_employee_for_user(self, user):
        return (Employee.objects
                .select_related("user", "addressid", "roleid")
                .filter(user_id=user.id)
                .first())

    # Get profile payload
    def _profile_payload(self, employee):
        u = employee.user
        addr = employee.addressid
        return {
            "email": u.email,
            "firstname": employee.firstname or "",
            "lastname": employee.lastname or "",
            "phonenumber": getattr(employee, "phonenumber", "") or "",
            "employee_number": getattr(u, "employee_number", "") or "",
            "address": ({
                "street": addr.street or "",
                "city": addr.city or "",
                "province": addr.province or "",
                "postalcode": addr.postalcode or "",
            } if addr else None),
        }

    # GET/PATCH /core/employees/me/
    @action(detail=False, methods=["get", "patch", "put"], url_path="me", permission_classes=[IsAuthenticated])
    def me(self, request):
        instance = get_object_or_404(Employee, user=request.user)
        # Get user data
        user = request.user
        # Check if user is in staff group 
        is_employee = (
            getattr(user, "role", "").lower() == "employee"
            or user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists()
        )
        # Check if if user is employee
        if not is_employee:
            return Response({"details" : "Only employees have access"}, status = status.HTTP_403_FORBIDDEN)
        # Get employee data instance
        employee = self.get_employee_for_user(user)
        # Create  employee instance if  none
        if employee is None:
            staff_group = Group.objects.filter(name__iexact="Staff").first()
            employee = Employee.objects.create(
                user=user,
                roleid=staff_group if staff_group else None,
            )

        if request.method == "GET":
            data = self.get_serializer(instance).data
            return Response(data, status=status.HTTP_200_OK)
        
        def _clean_str(v):
            return v.strip() if isinstance(v, str) else v

        # --- PATCH: partial profile + optional nested address ---
        if request.method == "PATCH":
            data = request.data or {}

            # Partial updates
            first = _clean_str(data.get("firstname"))
            last = _clean_str(data.get("lastname"))
            phone = _clean_str(data.get("phonenumber"))

            changed = []
            if first is not None and first != employee.firstname:
                employee.firstname = first; changed.append("firstname")
            if last is not None and last != employee.lastname:
                employee.lastname = last; changed.append("lastname")
            if phone is not None and getattr(employee, "phonenumber", None) != phone:
                employee.phonenumber = phone; changed.append("phonenumber")
            if changed:
                employee.save(update_fields=changed)

            addr_payload = data.get("address") or {}
            if addr_payload:
                pc = addr_payload.get("postalcode")
                if pc:
                    addr_payload["postalcode"] = pc.replace(" ", "").upper()

                if employee.addressid is None:
                    addr_ser = AddressSerializer(data=addr_payload)
                    addr_ser.is_valid(raise_exception=True)
                    employee.addressid = addr_ser.save()
                    employee.save(update_fields=["addressid"])
                else:
                    addr_ser = AddressSerializer(employee.addressid, data=addr_payload, partial=True)
                    addr_ser.is_valid(raise_exception=True)
                    addr_ser.save()

            return Response(self._profile_payload(employee), status=status.HTTP_200_OK)

        # Should not reach here
        return Response({"detail": "Method not allowed."}, status=status.HTTP_405_METHOD_NOT_ALLOWED)


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
    permission_classes = [IsAuthenticated]  # Only authenticated users can access

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
# User profile Image ViewSet (private bucket)
# - POST   /core/user-images/                -> upload (owner)
# - GET    /core/user-images/                -> list (owner; admins see all)
# - GET    /core/user-images/{id}/           -> retrieve metadata
# - GET    /core/user-images/{id}/bytes/     -> 302 redirect to signed URL (good for <img src>)
# - GET    /core/user-images/{id}/url/       -> JSON with signed_url (good for SPA)
# - POST   /core/user-images/{id}/replace/   -> replace file (keep metadata fresh)
# - DELETE /core/user-images/{id}/           -> delete file + row
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# User profile Image ViewSet (private bucket)
# - POST   /core/user-images/                -> upload (owner)
# - GET    /core/user-images/                -> list (owner; admins see all)
# - GET    /core/user-images/{id}/           -> retrieve metadata
# - GET    /core/user-images/{id}/bytes/     -> 302 redirect to signed URL (good for <img src>)
# - GET    /core/user-images/{id}/url/       -> JSON with signed_url (good for SPA)
# - POST   /core/user-images/{id}/replace/   -> replace file (keep metadata fresh)
# - DELETE /core/user-images/{id}/           -> delete file + row
# -----------------------------------------------------------------------------
class UserImageViewSet(viewsets.ModelViewSet):
    queryset = UserImage.objects.select_related("user").all()
    serializer_class = UserImageSerializer
    parser_classes = [MultiPartParser, FormParser]

    # Allow read for authenticated users (but queryset limits to owner/admin).
    # Writes require owner/admin.
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [IsAuthenticatedOrReadOnly()]
        return [IsOwnerOrAdmin()]

    def get_queryset(self):
        user = self.request.user
        qs = UserImage.objects.select_related("user").all()

        if not user or not user.is_authenticated:
            return qs.none()

        if user.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            return qs

        return qs.filter(user_id=user.id)

    # -----------------------------
    # Helpers
    # -----------------------------
    def _validate_and_extract_file(self, request):
        file_obj = request.FILES.get("image")
        filename = request.data.get("filename") or (file_obj.name if file_obj else "image")

        if not file_obj:
            raise PermissionDenied("No image file provided.")

        raw = file_obj.read()
        if len(raw) > 20 * 1024 * 1024:
            raise PermissionDenied("Image file is too large (Max 20MB)")

        content_type = (
            getattr(file_obj, "content_type", None)
            or mimetypes.guess_type(filename)[0]
            or "application/octet-stream"
        )
        if content_type not in ["image/jpeg", "image/png", "image/webp"]:
            raise PermissionDenied("Unsupported image type. Only JPEG, PNG, and WebP are allowed.")

        return raw, filename, content_type

    def _build_storage_path(self, user_id: int, filename: str) -> str:
        _, ext = os.path.splitext(filename or "")
        ext = ext.lower() or ".bin"
        return f"{user_id}/{uuid.uuid4().hex}{ext}"

    def _signed_url_for(self, path: str, expires: int = None) -> str:
        """Create a short-lived signed URL for a private object; returns the URL as string."""
        ttl = expires or int(os.getenv("SUPABASE_SIGNED_URL_TTL", "60"))  # default 60s
        try:
            # Supabase Python client response can differ by version/wrapper.
            res = supabase().storage.from_(USER_IMAGES_BUCKET).create_signed_url(path, ttl)
            # Common keys: 'signedURL', 'signed_url', or nested data
            if isinstance(res, dict):
                return res.get("signedURL") or res.get("signed_url") or res.get("data", {}).get("signedUrl") or res.get("data", {}).get("signedURL")
            # If your wrapper returns a string directly:
            if isinstance(res, str):
                return res
            raise RuntimeError("Unexpected response from create_signed_url")
        except Exception as e:
            raise RuntimeError(f"signed url failed: {str(e)}")

    # -----------------------------
    # Create (Upload)
    # -----------------------------
    def create(self, request, *args, **kwargs):
        if not request.user or not request.user.is_authenticated:
            return Response({"detail": "Authentication required."}, status=status.HTTP_401_UNAUTHORIZED)

        raw, filename, content_type = self._validate_and_extract_file(request)
        storage_path = self._build_storage_path(request.user.id, filename)

        try:
            supabase().storage.from_(USER_IMAGES_BUCKET).upload(
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

        obj = UserImage.objects.create(
            user=request.user,
            bucket=USER_IMAGES_BUCKET,
            storage_path=storage_path,
            content_type=content_type,
            filename=filename,
            size_bytes=len(raw),
        )

        return Response(self.get_serializer(obj).data, status=status.HTTP_201_CREATED)

    # -----------------------------
    # Replace (Upload new file, delete old)
    # -----------------------------
    @action(detail=True, methods=["post"], url_path="replace")
    def replace_file(self, request, pk=None):
        obj = self.get_object()

        # Additional check: owner or admin
        user = request.user
        is_admin = user and user.is_authenticated and user.groups.filter(name__in=["Admin", "Supervisor"]).exists()
        if not is_admin and (not user or not user.is_authenticated or obj.user_id != user.id):
            return Response({"detail": "You do not have permission to perform this action."},
                            status=status.HTTP_403_FORBIDDEN)

        raw, filename, content_type = self._validate_and_extract_file(request)
        new_path = self._build_storage_path(obj.user_id, filename)

        up = supabase().storage.from_(USER_IMAGES_BUCKET).upload(
            path=new_path,
            file=raw,
            file_options={
                "content-type": content_type,
                "cache-control": "86400",
                "upsert": "false",
            },
        )
        if isinstance(up, dict) and up.get("error"):
            return Response({"detail": f"upload failed: {up['error']}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Best-effort remove of old blob
        old_path = obj.storage_path
        try:
            # If your client requires a list: .remove([old_path])
            supabase().storage.from_(USER_IMAGES_BUCKET).remove(path=old_path)
        except Exception:
            pass

        obj.storage_path = new_path
        obj.content_type = content_type
        obj.size_bytes = len(raw)
        obj.filename = filename
        obj.save(update_fields=["storage_path", "content_type", "size_bytes", "filename"])

        return Response(self.get_serializer(obj).data, status=status.HTTP_200_OK)

    # -----------------------------
    # Delete (Remove DB row and blob)
    # -----------------------------
    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()

        user = request.user
        is_admin = user and user.is_authenticated and user.groups.filter(name__in=["Admin", "Supervisor"]).exists()
        if not is_admin and (not user or not user.is_authenticated or obj.user_id != user.id):
            return Response({"detail": "You do not have permission to perform this action."},
                            status=status.HTTP_403_FORBIDDEN)

        try:
            supabase().storage.from_(USER_IMAGES_BUCKET).remove(path=obj.storage_path)
        except Exception:
            pass

        return super().destroy(request, *args, **kwargs)

    # -----------------------------
    # Get image: 302 redirect to signed URL (best for <img src>)
    # -----------------------------
    @action(detail=True, methods=["get"], url_path="bytes")
    def get_bytes(self, request, pk=None):
        obj = self.get_object()

        # Enforce owner/admin to obtain a signed URL
        user = request.user
        is_admin = user and user.is_authenticated and user.groups.filter(name__in=["Admin", "Supervisor"]).exists()
        if not is_admin and (not user or not user.is_authenticated or obj.user_id != user.id):
            return Response({"detail": "You do not have permission to perform this action."},
                            status=status.HTTP_403_FORBIDDEN)

        try:
            signed = self._signed_url_for(obj.storage_path)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # 302 redirect to Supabase (bandwidth stays off your server)
        return HttpResponseRedirect(signed)

    # -----------------------------
    # Get image: JSON with signed URL (handy for SPA usage)
    # -----------------------------
    @action(detail=True, methods=["get"], url_path="url")
    def get_signed_url(self, request, pk=None):
        obj = self.get_object()

        user = request.user
        is_admin = user and user.is_authenticated and user.groups.filter(name__in=["Admin", "Supervisor"]).exists()
        if not is_admin and (not user or not user.is_authenticated or obj.user_id != user.id):
            return Response({"detail": "You do not have permission to perform this action."},
                            status=status.HTTP_403_FORBIDDEN)
        try:
            signed = self._signed_url_for(obj.storage_path)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Prevent caching stale URLs client-side
        return Response({"signed_url": signed, "expires_in": int(os.getenv("SUPABASE_SIGNED_URL_TTL", "60"))})
    

# ------------------------------
# Request Quote Viewset
# ------------------------------
class RequestQuoteViewSet(viewsets.ModelViewSet):
    queryset = RequestQuote.objects.all()
    serializer_class = RequestQuoteSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        
        # If user is not authenticated, return no quotes
        if not user.is_authenticated:
            return RequestQuote.objects.none()
        
        # Staff can see all quotes
        if user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            return RequestQuote.objects.all()
        
        # Customers can only see their own quotes
        customer = Customer.objects.filter(user=user).first()
        if customer:
            return RequestQuote.objects.filter(customerid=customer)
        
        return RequestQuote.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        
        # If user is authenticated, link to their customer account
        if user.is_authenticated:
            customer = Customer.objects.filter(user=user).first()
            if customer:
                serializer.save(customerid=customer)
            else:
                # Authenticated but no customer profile? Save without customer
                serializer.save()
        else:
            # Unauthenticated users can still submit quotes
            serializer.save()

# ------------------------------
# Service Location Viewset
# ------------------------------
class ServiceLocationViewSet(viewsets.ModelViewSet):
    queryset = ServiceLocation.objects.all()
    serializer_class = ServiceLocationSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        
        # If user is not authenticated, return no locations
        if not user.is_authenticated:
            return ServiceLocation.objects.none()
        
        # Staff can see all locations
        if user.groups.filter(name__in=["Admin", "Supervisor", "Staff"]).exists():
            return ServiceLocation.objects.all()
        
        # Customers can only see their own locations
        customer = Customer.objects.filter(user=user).first()
        if customer:
            return ServiceLocation.objects.filter(customerid=customer)
        
        return ServiceLocation.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        
        # Must be authenticated to create a service location
        if not user.is_authenticated:
            raise PermissionDenied("You must be logged in to save a service location.")
        
        # Automatically assign to the logged-in user's customer account
        customer = Customer.objects.filter(user=user).first()
        if customer:
            serializer.save(customerid=customer)
        else:
            raise PermissionDenied("No customer profile found. Please complete your profile first.")
    
    # Optional: Add custom action for getting user's locations
    @action(detail=False, methods=['get'])
    def my_locations(self, request):
        """Get all locations for the current user"""
        user = request.user
        if not user.is_authenticated:
            return Response({"detail": "Authentication required"}, status=401)
        
        customer = Customer.objects.filter(user=user).first()
        if not customer:
            return Response({"detail": "Customer profile not found"}, status=404)
        
        locations = self.get_queryset().filter(customerid=customer)
        serializer = self.get_serializer(locations, many=True)
        return Response(serializer.data)