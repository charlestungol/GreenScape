from rest_framework.permissions import BasePermission, SAFE_METHODS
from django.contrib.auth.models import Group

# READ for everyone, WRITE for authenticated users.
class IsAuthenticatedOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated)


# Business "admin": Admin or Supervisor (group-based).
class isAdmin(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(
            u and u.is_authenticated and
            u.groups.filter(name__in=["Admin", "Supervisor"]).exists()
        )


# Owner OR Admin/Supervisor for object-level checks.
# Ownership is determined via your actual schema (Customer/Employee/Address).
class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        u = request.user
        if not (u and u.is_authenticated):
            return False
        # Admin/Supervisor always allowed
        if u.groups.filter(name__in=["Admin", "Supervisor"]).exists():
            return True

        # ----- Ownership checks by model -----
        # Address: caller owns it if their Customer/Employee points to this address.
        from core.models import Address, Customer, Employee
        if isinstance(obj, Address):
            owns_as_customer = Customer.objects.filter(user_id=u.id, addressid_id=obj.pk).exists()
            owns_as_employee = Employee.objects.filter(user_id=u.id, addressid_id=obj.pk).exists()
            return owns_as_customer or owns_as_employee

        # Customer: row belongs to the caller if user_id matches.
        from core.models import Customer as CustomerModel
        if obj.__class__.__name__ == CustomerModel.__name__:
            return getattr(obj, "user_id", None) == u.id

        # Employee: row belongs to the caller if user_id matches.
        from core.models import Employee as EmployeeModel
        if obj.__class__.__name__ == EmployeeModel.__name__:
            return getattr(obj, "user_id", None) == u.id

        # Fallback: if the object carries a user_id field, compare it
        if hasattr(obj, "user_id"):
            return obj.user_id == u.id

        return False


# Staff can READ any object (SAFE methods).
# For writes, require Admin/Supervisor or ownership (like IsOwnerOrAdmin semantics).
class IsOwnerOrStaff(BasePermission):
    def has_object_permission(self, request, view, obj):
        u = request.user
        if not (u and u.is_authenticated):
            return False

        # Staff can read any object
        if request.method in SAFE_METHODS and u.groups.filter(name="Staff").exists():
            return True

        # Delegate to IsOwnerOrAdmin for writes (and also for non-Staff reads)
        return isAdmin().has_object_permission(request, view, obj)