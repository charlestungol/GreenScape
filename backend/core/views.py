# ---------------------------------------------------
# Standard Library
# ---------------------------------------------------
import os

# ---------------------------------------------------
# Django
# ---------------------------------------------------
from django.contrib.auth.models import Group
from django.http import HttpResponseRedirect
from django.shortcuts import get_object_or_404

# ---------------------------------------------------
# Django REST Framework
# ---------------------------------------------------
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated, AllowAny
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
    @action(
        detail=False,
        methods=["get", "patch"],
        url_path="me",
        permission_classes=[IsAuthenticated],
    )
    def me(self, request):
        user = request.user

        # ✅ Only real employees
        if not user.groups.filter(name__in=["Staff", "Supervisor"]).exists():
            return Response(
                {"detail": "Only employees can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # ✅ Lazily create Employee record (NO roleid)
        employee, _ = Employee.objects.get_or_create(user=user)

        if request.method == "GET":
            serializer = self.get_serializer(employee)
            return Response(serializer.data, status=status.HTTP_200_OK)

        # ✅ PATCH (partial update only)
        serializer = self.get_serializer(employee, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)


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

        # Employees can create for any customer
        if user.groups.filter(
            name__in=["Staff", "Supervisor", "Admin", "SuperAdmin"]
        ).exists():
            serializer.save()
            return

        # Customer creates for themselves
        customer = Customer.objects.filter(user_id=user.id).first()
        if not customer:
            raise PermissionDenied("You do not have permission to perform this action.")

        serializer.save(customerid=customer)

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
        # DELETE → SuperAdmin only
        if self.request.method == "DELETE":
            return [IsSuperAdminOnly()]

        # POST / PATCH / PUT → Owner or employees
        if self.request.method in ["POST", "PATCH", "PUT"]:
            return [IsOwnerOrAdminOrStaffReadOnly()]

        # GET → authenticated users (visibility handled in queryset)
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