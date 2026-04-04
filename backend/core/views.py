# ---------------------------------------------------
# Standard Library
# ---------------------------------------------------
import mimetypes
import os
import uuid
from decimal import Decimal

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
from rest_framework.permissions import DjangoModelPermissions, IsAuthenticated, IsAuthenticatedOrReadOnly, AllowAny
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
    Budget,
    Expense
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
    BudgetSerializer,
    ExpenseSerializer,
    LocationServiceSerializer
)

# ---------------------------------------------------
# Project: Permissions
# ---------------------------------------------------
from .permissions import (
    IsAdminOnly,
    IsAdminOrSuperAdmin,
    IsOwner,
    IsOwnerOrStaffReadOnly,
    IsStaff,
    IsSuperAdminOnly,
    IsSupervisorOrAdmin,
    EmployeeAccessPermission,
    ClientAccessPermission,
    IsOwnerOrAdminOrStaffReadOnly,
    IsOwnerOrSuperAdmin,
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
    permission_classes = [IsAuthenticated]

    # Permission, allow delete only if owner or Super Admin
    def get_permissions(self):
        if self.request.method == "DELETE":
            return [IsSuperAdminOnly()]
        return [IsOwnerOrAdminOrStaffReadOnly()]

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Address.objects.none()

        # Admin / Supervisor / SuperAdmin → see all addresses
        if user.groups.filter(name__in=["Admin", "Supervisor", "SuperAdmin"]).exists():
            return Address.objects.all()

        # Staff → see ALL customer addresses + own employee address
        if user.groups.filter(name="Staff").exists():
            # Get all customer address IDs
            customer_address_ids = Customer.objects.exclude(
                addressid__isnull=True
            ).values_list("addressid_id", flat=True)

            # Get this staff member's own employee address
            employee = Employee.objects.filter(user_id=user.id).select_related("addressid").first()
            employee_address_id = employee.addressid_id if employee and employee.addressid else None

            address_ids = list(customer_address_ids)
            if employee_address_id:
                address_ids.append(employee_address_id)

            return Address.objects.filter(pk__in=address_ids)

        # Customer → see own address only
        customer = Customer.objects.filter(user_id=user.id).select_related("addressid").first()
        if customer and customer.addressid:
            return Address.objects.filter(pk=customer.addressid_id)

        return Address.objects.none()

# -----------------------------------------------------------------------------
# Customer views -- Allows for CRUD --
# -----------------------------------------------------------------------------
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.select_related("addressid").all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    # Delete is only Super Admin
    def get_permissions(self):
        if self.request.method == "DELETE":
            return [IsSuperAdminOnly()]
        return [IsOwnerOrAdminOrStaffReadOnly()]
    
    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Customer.objects.none()

        # Employees and admins see all customers
        if user.groups.filter(
            name__in=["Staff", "Supervisor", "Admin", "SuperAdmin"]
        ).exists():
            return Customer.objects.select_related("addressid")

        # Customer sees only their own record
        customer = Customer.objects.filter(user_id=user.id).first()
        if customer:
            return Customer.objects.filter(pk=customer.pk).select_related("addressid")

        return Customer.objects.none()
    
    # Allow a user to create themselves
    def perform_create(self, serializer):
        user = self.request.user

        # Admin / SuperAdmin can create arbitrary customers
        if user.groups.filter(name__in=["Admin", "SuperAdmin"]).exists():
            serializer.save()
            return

        # Regular user: allow self-creation ONLY ONCE
        if Customer.objects.filter(user_id=user.id).exists():
            raise PermissionDenied("Customer profile already exists.")

        serializer.save(user=user)

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
    permission_classes = [IsAuthenticated]

    # Delete is only Super Admin, Create/Update is Admin and Supervisor
    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Employee.objects.none()

        # Admins & SuperAdmins see all employees
        if user.groups.filter(name__in=["Admin", "SuperAdmin"]).exists():
            return Employee.objects.select_related("addressid").all()

        #Regular employees see only themselves
        return Employee.objects.select_related("addressid").filter(user_id=user.id)


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

    # Only admin and SuperAdmin can delete employee data.
    def perform_destroy(self, instance):
        user = self.request.user
        if not (user and user.is_authenticated):
            raise PermissionDenied("You do not have permission to perform this action.")
        if not user.groups.filter(name__in=["SuperAdmin"]).exists():
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
    @action(
        detail=True,
        methods=["patch"],
        url_path="role",
        permission_classes=[IsAdminOrSuperAdmin],
    )
    def change_role(self, request, pk=None):
        user = request.user
        employee = self.get_object()

        new_role = request.data.get("role")

        if new_role not in ["Staff", "Supervisor", "Admin", "SuperAdmin"]:
            return Response({"detail": "Invalid role."}, status=400)

        #ADMIN RULES
        if user.groups.filter(name="Admin").exists():
            # Admin can only assign Staff or Supervisor
            if new_role not in ["Staff", "Supervisor"]:
                return Response(
                    {"detail": "Admins cannot assign this role."},
                    status=status.HTTP_403_FORBIDDEN
                )

        #SUPERADMIN RULES
        elif user.groups.filter(name="SuperAdmin").exists():
            # SuperAdmin can assign anything
            pass
        # Apply role
        try:
            group = Group.objects.get(name=new_role)
        except Group.DoesNotExist:
            return Response({"detail": "Role not found."}, status=400)

        employee.user.groups.clear()
        employee.user.groups.add(group)

        # Sync Employee.roleid if present
        if hasattr(employee, "roleid"):
            employee.roleid = group
            employee.save(update_fields=["roleid"])

        return Response(
            {"detail": f"Role updated to {new_role}."},
            status=status.HTTP_200_OK
        )

# -----------------------------------------------------------------------------
# Service type view -- allows for CRUD
# -----------------------------------------------------------------------------
class ServiceTypeViewSet(viewsets.ModelViewSet):
    queryset = Servicetype.objects.all()
    serializer_class = ServiceTypeSerializer
    permission_classes = [AllowAny]

    # Set permission so delete is only allowed for Super Admin, while other actions are allowed for Admin and Supervisors.
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [AllowAny()]
        if self.request.method == "DELETE":
            return [IsSuperAdminOnly()]
        return [IsSupervisorOrAdmin()]

# -----------------------------------------------------------------------------
# Service view -- allows for CRUD
# -----------------------------------------------------------------------------
class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        # Public read
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.AllowAny()]

        # SuperAdmin only delete
        if self.request.method == "DELETE":
            return [IsSuperAdminOnly()]

        # POST (create) → Admin or SuperAdmin only
        if self.request.method == "POST":
            return [IsAdminOrSuperAdmin()]

        # PATCH / PUT → Supervisor and above
        return [IsSupervisorOrAdmin()]
    
    def get_queryset(self):
        return Service.objects.all()

# -----------------------------------------------------------------------------
# Customer's service view -- Allows for CRUD
# -----------------------------------------------------------------------------
class CustomerServiceViewSet(viewsets.ModelViewSet):
    queryset = Customerservice.objects.select_related("customerid", "serviceid").all()
    serializer_class = CustomerServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # DELETE → SuperAdmin only
        if self.request.method == "DELETE":
            return [IsSuperAdminOnly()]

        # ALL other methods → Owner OR Staff/Admin permissions
        return [IsOwnerOrAdminOrStaffReadOnly()]
    
    def perform_create(self, serializer):
        user = self.request.user
        print(f"Creating customer service for user: {user.email}")
        
        # Check if user is staff/admin - they can create for any customer?
        if user.groups.filter(name__in=["Staff", "Supervisor", "Admin", "SuperAdmin"]).exists():
            # If customerid is provided in request, use that
            customer_id = self.request.data.get('customerid')
            if customer_id:
                try:
                    customer = Customer.objects.get(customerid=customer_id)
                    print(f"Staff creating service for customer: {customer.customerid}")
                    serializer.save(customerid=customer)
                    return
                except Customer.DoesNotExist:
                    pass
        
        # Try to get customer from the authenticated user
        customer = Customer.objects.filter(user=user).first()
        if customer:
            print(f"Using customer from user: {customer.customerid}")
            serializer.save(customerid=customer)
            return
        
        print("No customer found for user")
        raise PermissionDenied("Customer profile not found. Please complete your profile.")

# -----------------------------------------------------------------------------
# Booking service view -- Allows for CRUD
# -----------------------------------------------------------------------------
class BookingViewSet(viewsets.ModelViewSet):
    queryset = Booking.objects.select_related("customerid", "serviceid").all()
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]  # Only authenticated users can access

    def get_permissions(self):
        if self.request.method == "DELETE":
            return [IsSuperAdminOnly()]
        return [IsOwnerOrAdminOrStaffReadOnly()]

    # Getting data
    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Booking.objects.none()

        # Staff / Supervisor / Admin / SuperAdmin → all bookings
        if user.groups.filter(
            name__in=["Staff", "Supervisor", "Admin", "SuperAdmin"]
        ).exists():
            return self.queryset

        # Customer → own bookings only
        customer = Customer.objects.filter(user_id=user.id).first()
        if customer:
            return self.queryset.filter(customerid=customer)

        return Booking.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user

        # Employees can create booking for any customer
        if user.groups.filter(
            name__in=["Staff", "Supervisor", "Admin", "SuperAdmin"]
        ).exists():
            serializer.save()
            return

        # Customer creates booking only for themselves
        customer = Customer.objects.filter(user_id=user.id).first()
        if not customer:
            raise PermissionDenied("You do not have permission to perform this action.")

        serializer.save(customerid=customer)
    
# -----------------------------------------------------------------------------
# Invoice view -- Allows for CRUD
# -----------------------------------------------------------------------------
class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related("customerid").all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # DELETE → SuperAdmin only
        if self.request.method == "DELETE":
            return [IsSuperAdminOnly()]

        # POST / PATCH / PUT → Employees only
        if self.request.method in ["POST", "PATCH", "PUT"]:
            return [IsStaff()]  # or a broader employee permission

        # GET → any authenticated user
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Invoice.objects.none()

        # Employees → all invoices
        if user.groups.filter(
            name__in=["Staff", "Supervisor", "Admin", "SuperAdmin"]
        ).exists():
            return self.queryset

        # Customer → own invoices only
        customer = Customer.objects.filter(user_id=user.id).first()
        if customer:
            return self.queryset.filter(customerid=customer)

        return Invoice.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user

        # Employees can create invoices
        if user.groups.filter(
            name__in=["Staff", "Supervisor", "Admin", "SuperAdmin"]
        ).exists():
            serializer.save()
            return

        raise PermissionDenied("You do not have permission to perform this action.")

# -----------------------------------------------------------------------------
# Quote view -- Allows for CRUD
# -----------------------------------------------------------------------------
class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quotes.objects.select_related("customerid").all()
    serializer_class = QuoteSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # DELETE → SuperAdmin only
        if self.request.method == "DELETE":
            return [IsSuperAdminOnly()]

        # POST / PATCH / PUT → Employees only
        if self.request.method in ["POST", "PATCH", "PUT"]:
            return [IsStaff()]

        # GET → any authenticated user
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Quotes.objects.none()

        # Employees → all quotes
        if user.groups.filter(
            name__in=["Staff", "Supervisor", "Admin", "SuperAdmin"]
        ).exists():
            return self.queryset

        # Customer → own quotes only
        customer = Customer.objects.filter(user_id=user.id).first()
        if customer:
            return self.queryset.filter(customerid=customer)

        return Quotes.objects.none()
    
    def perform_create(self, serializer):
        user = self.request.user

        # Employees create quotes for customers
        if user.groups.filter(
            name__in=["Staff", "Supervisor", "Admin", "SuperAdmin"]
        ).exists():
            serializer.save()
            return

        raise PermissionDenied("Customers cannot create quotes.")
    
# -----------------------------------------------------------------------------
# Schedule view -- Allows for CRUD
# -----------------------------------------------------------------------------
class ScheduleViewSet(viewsets.ModelViewSet):
    queryset = Schedule.objects.select_related("employeeid").all()
    serializer_class = ScheduleSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # DELETE → SuperAdmin only
        if self.request.method == "DELETE":
            return [IsSuperAdminOnly()]

        # POST / PATCH / PUT → Supervisor and above
        if self.request.method in ["POST", "PATCH", "PUT"]:
            return [IsSupervisorOrAdmin()]

        # GET → authenticated users (visibility limited in queryset)
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Schedule.objects.none()

        # Supervisor / Admin / SuperAdmin → all schedules
        if user.groups.filter(
            name__in=["Supervisor", "Admin", "SuperAdmin"]
        ).exists():
            return self.queryset

        # Staff → only their own schedule
        if user.groups.filter(name="Staff").exists():
            return self.queryset.filter(employeeid__user_id=user.id)

        return Schedule.objects.none()

## -----------------------------------------------------------------------------
# Site view -- Allows for CRUD
# -----------------------------------------------------------------------------

class SiteViewSet(viewsets.ModelViewSet):
    queryset = Site.objects.select_related("customerid", "addressid")
    serializer_class = SiteSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        # DELETE → SuperAdmin only
        if self.request.method == "DELETE":
            return [IsSuperAdminOnly()]

        # POST / PATCH / PUT → Employees only
        if self.request.method in ["POST", "PATCH", "PUT"]:
            return [IsStaff()]

        # GET → authenticated users (visibility controlled in queryset)
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Site.objects.none()

        # Employees → all Sites
        if user.groups.filter(
            name__in=["Staff", "Supervisor", "Admin", "SuperAdmin"]
        ).exists():
            return self.queryset

        # Customer → own Sites only
        customer = Customer.objects.filter(user_id=user.id).first()
        if customer:
            return self.queryset.filter(customerid=customer)

        return Site.objects.none()

    
# -----------------------------------------------------------------------------
# Zone view -- Allows for CRUD
# -----------------------------------------------------------------------------
class ZoneViewSet(viewsets.ModelViewSet):
    queryset = Zone.objects.select_related("siteid", "siteid__customerid")
    serializer_class = ZoneSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.request.method == "DELETE":
            return [IsSuperAdminOnly()]

        if self.request.method in ["POST", "PATCH", "PUT"]:
            return [IsStaff()]

        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user

        if not user.is_authenticated:
            return Zone.objects.none()

        if user.groups.filter(
            name__in=["Staff", "Supervisor", "Admin", "SuperAdmin"]
        ).exists():
            return self.queryset

        customer = Customer.objects.filter(user_id=user.id).first()
        if customer:
            return self.queryset.filter(siteid__customerid=customer)

        return Zone.objects.none()

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
    queryset = UserImage.objects.select_related("user")
    serializer_class = UserImageSerializer
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [IsAuthenticated]

    # -----------------------------
    # Permissions
    # -----------------------------
    def get_permissions(self):
        # DELETE → SuperAdmin only
        if self.request.method == "DELETE":
            return [IsSuperAdminOnly()]

        # WRITE (upload / replace) → Owner only
        if self.request.method not in permissions.SAFE_METHODS:
            return [IsOwner()]

        # READ → authenticated users (visibility limited in queryset)
        return [IsAuthenticated()]

    # -----------------------------
    # Visibility
    # -----------------------------
    def get_queryset(self):
        user = self.request.user

        # SuperAdmin / Admin / Supervisor → see all
        if user.groups.filter(name__in=["SuperAdmin", "Admin", "Supervisor"]).exists():
            return self.queryset

        # Regular user → only own images
        return self.queryset.filter(user=user)

    # -----------------------------
    # Create (Upload)
    # -----------------------------
    def create(self, request, *args, **kwargs):
        raw, filename, content_type = self._validate_and_extract_file(request)
        storage_path = self._build_storage_path(request.user.id, filename)

        supabase().storage.from_(USER_IMAGES_BUCKET).upload(
            path=storage_path,
            file=raw,
            file_options={
                "content-type": content_type,
                "cache-control": "86400",
                "upsert": "false",
            },
        )

        obj = UserImage.objects.create(
            user=request.user,
            bucket=USER_IMAGES_BUCKET,
            storage_path=storage_path,
            content_type=content_type,
            file_name=filename,
            size_byte=len(raw),
        )

        return Response(self.get_serializer(obj).data, status=status.HTTP_201_CREATED)

    # -----------------------------
    # Replace (Owner only)
    # -----------------------------
    @action(detail=True, methods=["post"], url_path="replace")
    def replace_file(self, request, pk=None):
        obj = self.get_object()

        if obj.user_id != request.user.id:
            raise PermissionDenied("You can only replace your own image.")

        raw, filename, content_type = self._validate_and_extract_file(request)
        new_path = self._build_storage_path(obj.user_id, filename)

        supabase().storage.from_(USER_IMAGES_BUCKET).upload(
            path=new_path,
            file=raw,
            file_options={
                "content-type": content_type,
                "cache-control": "86400",
                "upsert": "false",
            },
        )

        supabase().storage.from_(USER_IMAGES_BUCKET).remove(path=obj.storage_path)

        obj.storage_path = new_path
        obj.content_type = content_type
        obj.file_name = filename
        obj.size_byte = len(raw)
        obj.save()

        return Response(self.get_serializer(obj).data)

    # -----------------------------
    # Delete (SuperAdmin only)
    # -----------------------------
    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()

        supabase().storage.from_(USER_IMAGES_BUCKET).remove(path=obj.storage_path)
        return super().destroy(request, *args, **kwargs)

    # -----------------------------
    # Get signed image URL
    # -----------------------------
    @action(detail=True, methods=["get"], url_path="bytes")
    def get_bytes(self, request, pk=None):
        obj = self.get_object()

        if (
            obj.user_id != request.user.id
            and not request.user.groups.filter(
                name__in=["SuperAdmin", "Admin", "Supervisor"]
            ).exists()
        ):
            raise PermissionDenied("You do not have permission to view this image.")

        signed_url = self._signed_url_for(obj.storage_path)
        return HttpResponseRedirect(signed_url)

# ------------------------------
# Request Quote Viewset
# ------------------------------

class RequestQuoteViewSet(viewsets.ModelViewSet):
    queryset = RequestQuote.objects.all()
    serializer_class = RequestQuoteSerializer
    permission_classes = [AllowAny]  # public entry for leads

    # ---------------------------------
    # Permissions
    # ---------------------------------
    def get_permissions(self):
        # DELETE → SuperAdmin only
        if self.request.method == "DELETE":
            return [IsSuperAdminOnly()]

        # UPDATE → employees only
        if self.request.method in ["PATCH", "PUT"]:
            return [IsStaff()]

        # CREATE → anyone (even anonymous)
        if self.request.method == "POST":
            return [AllowAny()]

        # READ → authenticated users only
        return [IsAuthenticated()]

    # ---------------------------------
    # Visibility
    # ---------------------------------
    def get_queryset(self):
        user = self.request.user

        # Anonymous users never list or retrieve
        if not user.is_authenticated:
            return RequestQuote.objects.none()

        # Employees → all requests
        if user.groups.filter(
            name__in=["Staff", "Supervisor", "Admin", "SuperAdmin"]
        ).exists():
            return self.queryset

        # Customer → own requests only
        customer = Customer.objects.filter(user=user).first()
        if customer:
            return self.queryset.filter(customerid=customer)

        return RequestQuote.objects.none()

    # ---------------------------------
    # Create (Lead submission)
    # ---------------------------------
    def perform_create(self, serializer):
        user = self.request.user

        # Logged-in customer → attach ownership
        if user.is_authenticated:
            customer = Customer.objects.filter(user=user).first()
            if customer:
                serializer.save(customerid=customer)
                return

        # Anonymous lead → save without customer
        serializer.save()


# ------------------------------
# Service Location Viewset
# ------------------------------
class ServiceLocationViewSet(viewsets.ModelViewSet):
    queryset = ServiceLocation.objects.select_related("customerid")
    serializer_class = ServiceLocationSerializer
    permission_classes = [IsAuthenticated]

    # ---------------------------------
    # Permissions
    # ---------------------------------
    def get_permissions(self):
        # Allow all POST actions (including link-service) for authenticated users
        if self.request.method == "POST":
            return [IsAuthenticated()]
        
        # DELETE → Custom permission check in destroy method
        if self.request.method == "DELETE":
            return [IsAuthenticated()]
        
        # GET → authenticated users
        return [IsAuthenticated()]

    # ---------------------------------
    # Visibility
    # ---------------------------------
    def get_queryset(self):
        user = self.request.user

        # Employees → all locations
        if user.groups.filter(
            name__in=["Staff", "Supervisor", "Admin", "SuperAdmin"]
        ).exists():
            return self.queryset

        # Customer → own locations only
        customer = Customer.objects.filter(user=user).first()
        if customer:
            return self.queryset.filter(customerid=customer)

        return ServiceLocation.objects.none()

    # ---------------------------------
    # Create (ownership assignment)
    # ---------------------------------
    def perform_create(self, serializer):
        user = self.request.user

        # Employees can create for any customer
        if user.groups.filter(
            name__in=["Staff", "Supervisor", "Admin", "SuperAdmin"]
        ).exists():
            serializer.save()
            return

        # Customer creates only for self
        customer = Customer.objects.filter(user=user).first()
        if not customer:
            raise PermissionDenied("Customer profile not found. Please complete your profile.")

        serializer.save(customerid=customer)

    # ---------------------------------
    # Custom Destroy - Allow owners to delete
    # ---------------------------------
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        user = request.user
        
        # SuperAdmin can delete anything
        if user.groups.filter(name="SuperAdmin").exists():
            return super().destroy(request, *args, **kwargs)
        
        # Staff/Admin/Supervisor can delete anything
        if user.groups.filter(name__in=["Staff", "Admin", "Supervisor"]).exists():
            return super().destroy(request, *args, **kwargs)
        
        # Check if user is the owner of this location
        if instance.customerid and instance.customerid.user == user:
            return super().destroy(request, *args, **kwargs)
        
        # No permission
        raise PermissionDenied("You do not have permission to delete this location.")

    # ---------------------------------
    # Get services for a location 
    # ---------------------------------
    @action(detail=True, methods=["get"], url_path="services")
    def get_location_services(self, request, pk=None):
        """Get all services specifically linked to this location"""
        location = self.get_object()
        
        # Get services linked to this location through LocationService
        from .models import LocationService
        
        location_services = LocationService.objects.filter(
            servicelocationid=location
        ).select_related(
            'customerserviceid__serviceid',
            'customerserviceid__customerid'
        ).order_by('-created_at')
        
        # Format the response with service details
        services_data = []
        for ls in location_services:
            cs = ls.customerserviceid
            service_data = {
                'id': cs.customerserviceid,
                'service_id': cs.serviceid.serviceid if cs.serviceid else None,
                'title': cs.serviceid.title if cs.serviceid else None,
                'description': cs.serviceid.description if cs.serviceid else None,
                'base_price': str(cs.serviceid.baseprice) if cs.serviceid and cs.serviceid.baseprice else None,
                'req_date': cs.reqdate,
                'completed': cs.completed,
                'created_at': cs.createdat,
                'red_year': cs.redyear,
                'linked_at': ls.created_at,
            }
            services_data.append(service_data)
        
        return Response(services_data, status=status.HTTP_200_OK)
    
    # ---------------------------------
    # Link service to location
    # ---------------------------------
    @action(detail=True, methods=["post"], url_path="link-service")
    def link_service_to_location(self, request, pk=None):
        """Link an existing customer service to this location"""
        print("=" * 50)
        print("LINK SERVICE TO LOCATION CALLED")
        
        location = self.get_object()
        customer_service_id = request.data.get('customerserviceid')
        
        print(f"Location ID: {location.servicelocationid}")
        print(f"Location Customer ID: {location.customerid_id}")
        print(f"Customer Service ID from request: {customer_service_id}")
        print(f"Request User: {request.user.email}")
        
        if not customer_service_id:
            return Response(
                {"error": "customerserviceid is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from .models import Customerservice, LocationService
        
        # Get the customer service - don't check customer ownership here
        try:
            customer_service = Customerservice.objects.get(
                customerserviceid=customer_service_id
            )
            print(f"Found customer service: {customer_service.customerserviceid}")
            print(f"Customer service belongs to customer: {customer_service.customerid_id}")
        except Customerservice.DoesNotExist:
            print(f"Customer service {customer_service_id} not found")
            return Response(
                {"error": "Customer service not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already linked
        existing_link = LocationService.objects.filter(
            servicelocationid=location,
            customerserviceid=customer_service
        ).first()
        
        if existing_link:
            print(f"Service already linked with ID: {existing_link.locationserviceid}")
            return Response(
                {"message": "Service already linked to this location", "id": existing_link.locationserviceid},
                status=status.HTTP_200_OK
            )
        
        # Create the link
        location_service = LocationService.objects.create(
            servicelocationid=location,
            customerserviceid=customer_service
        )
        print(f"Created link with ID: {location_service.locationserviceid}")
        print("=" * 50)
        
        return Response(
            {"message": "Service linked successfully", "id": location_service.locationserviceid},
            status=status.HTTP_201_CREATED
        )
# ------------------------------
# Location Service Viewset 
# ------------------------------
class LocationServiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing which services are linked to which locations
    """
    serializer_class = LocationServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        from .models import LocationService, Customer
        
        # Get the customer for this user
        customer = Customer.objects.filter(user=user).first()
        
        if not customer:
            return LocationService.objects.none()
        
        # Return only location services linked to locations owned by this customer
        return LocationService.objects.filter(
            servicelocationid__customerid=customer
        ).select_related(
            'servicelocationid',
            'customerserviceid__serviceid'
        ).order_by('-created_at')

    def get_permissions(self):
        if self.request.method == "DELETE":
            return [IsSuperAdminOnly()]
        if self.request.method in ["POST", "PATCH", "PUT"]:
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        from .models import Customer, Customerservice
        
        customer = Customer.objects.filter(user=user).first()
        servicelocationid = serializer.validated_data.get('servicelocationid')
        customerserviceid = serializer.validated_data.get('customerserviceid')
        
        # Verify that the service location belongs to this customer
        if servicelocationid.customerid != customer:
            raise PermissionDenied("You do not own this service location")
        
        # Verify that the customer service belongs to this customer
        if customerserviceid.customerid != customer:
            raise PermissionDenied("You do not own this customer service")
        
        # Check if already exists
        from .models import LocationService
        if LocationService.objects.filter(
            servicelocationid=servicelocationid,
            customerserviceid=customerserviceid
        ).exists():
            raise PermissionDenied("This service is already linked to this location")
        
        serializer.save()

# ------------------------------
#Budget & Expense 
# ------------------------------
class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        customer = Customer.objects.filter(user=user).first()
        if customer:
            return Budget.objects.filter(customerid=customer)
        return Budget.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        customer = Customer.objects.filter(user=user).first()
        if customer:
            serializer.save(customerid=customer)
        else:
            raise PermissionDenied("No customer profile found.")

    # Custom action to update budget amount
    @action(detail=False, methods=['patch'])
    def update_budget(self, request):
        user = request.user
        customer = Customer.objects.filter(user=user).first()
        if not customer:
            return Response({"detail": "Customer not found"}, status=404)

        budget, created = Budget.objects.get_or_create(customerid=customer)
        amount = request.data.get('amount')
        mode = request.data.get('mode', 'set')

        if mode == 'add':
            budget.amount += Decimal(amount)
        else:
            budget.amount = Decimal(amount)

        budget.save()
        serializer = BudgetSerializer(budget)
        return Response(serializer.data)


class ExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        customer = Customer.objects.filter(user=user).first()
        if customer:
            return Expense.objects.filter(customerid=customer).order_by('-date')
        return Expense.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        customer = Customer.objects.filter(user=user).first()
        if customer:
            serializer.save(customerid=customer)
        else:
            raise PermissionDenied("No customer profile found.")