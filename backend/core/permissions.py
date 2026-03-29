from rest_framework.permissions import BasePermission, SAFE_METHODS, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from core.models import Address, Customer, Employee

# Allow Staff Only
class IsStaff(BasePermission):
    def has_permission(self, request, view):
        # Get user
        user = request.user
        # Check if employee is Staff only
        if user.groups.filter(name="Staff").exists() and user.is_authenticated:
            return True
        # Dont allow  permission when not a Staff
        return False

# Allow permissions above Staff
class IsSupervisorOrAdmin(BasePermission):
    def has_permission(self, request, view):
        # Get user
        user = request.user
        # Check if employee is Supervisor/Admin/SuperAdmin
        if user.is_authenticated and user.groups.filter(name__in=["Supervisor", "Admin", "SuperAdmin"]).exists():
            return True
        # Don't allow if user is not a supervisor, admin, or SuperAdmin
        return False

# Allow Admin only
class IsAdminOnly(BasePermission):
    def has_permission(self, request, view):
        # Get user
        user = request.user
        # Check if user is an admin using django checks
        if user.is_authenticated and user.groups.filter(name="Admin").exists():
            return True
        # Dont allow if user not a admin or super admin
        return False
    
# Allow Admin and Super Admin
class IsAdminOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        # Get user
        user = request.user
        # Check if user is admin and super admin
        if user.is_authenticated and user.groups.filter(name__in=["Admin", "SuperAdmin"]).exists():
            return True
        # Don't allow if user not an admin or super admin
        return False
    
# Allow super admin only
class IsSuperAdminOnly(BasePermission):
    def has_permission(self, request, view):
        # Get user
        user = request.user
        # Check if user is Super admin only
        if user.is_authenticated and user.groups.filter(name="SuperAdmin").exists():
            return True
        # Dont allow if user not a super admin
        return False
    
# Allow owner only
class IsOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Get the user
        user = request.user
        # Check if the user is authenticated, and the object is the users
        if user.is_authenticated and getattr(obj, "user_id", None) == user.id:
            return True
        # If not its owner deny access.
        return False

# Allow owner access and Staff read only
class IsOwnerOrStaffReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj ):
        # Get user
        user = request.user
        # Check if user is authentifcated first
        if not user.is_authenticated:
            return False
        # Check if user is authenticated and is staff, can view only
        if request.method in SAFE_METHODS and user.groups.filter(name="Staff").exists():
            return True
        # Check if user is owner
        if getattr(obj, "user_id", None) == user.id:
            return True
        # If not owner, or staff read only
        return False
    
# Allow owner access, and Staff View, and other employee to edit.
class IsOwnerOrAdminOrStaffReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Get user
        user = request.user
        # Check if user is authenticated
        if not user.is_authenticated:
            return False
        # Check if method is safe (View only)
        if user.groups.filter(name="Staff").exists():
            return request.method in SAFE_METHODS
        # Check if the user is a Supervisor or admin
        if user.groups.filter(name__in=["Supervisor", "Admin", "SuperAdmin"]).exists():
            return True
        # Check if the data belongs to user
        if getattr(obj, "user_id", None) == user.id:
            return True
        # If not above deny
        return False
    
# Is owner or Super Admin (Made for deleting Owner data but not other stuff)
class IsOwnerOrSuperAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        # Get user
        user = request.user
        # Check if user is authenticated
        if not user.is_authenticated:
            return False
        # Check if delete is from super admin or Owner
        if user.groups.filter(name="SuperAdmin").exists():
            return True
        # Check if the user owns the the data.
        return getattr(obj, "user_id", None) == user.id

#Client data permissions
class ClientAccessPermission(BasePermission):
    def has_permission(self, request, view):
        # Get user
        user = request.user
        # Check if user is authenticated first
        if not user.is_authenticated:
            return False
        # Allow delete if user is SuperAdmin.
        if request.method == "DELETE":
            return user.groups.filter(name="SuperAdmin").exists()
        # Return True if user is a Staff
        if user.groups.filter(name__in=["Staff", "Supervisor", "Admin", "SuperAdmin"]).exists():
            return True
        # If not any of the one above deny
        return False

#Employee data permission
class EmployeeAccessPermission(BasePermission):
    def has_permission(self, request, view):
        # Get user
        user = request.user
        # Check if user is authenticated
        if not user.is_authenticated:
            return False
        # Allow delete if user is Super Admin
        if request.method == "DELETE":
            return user.groups.filter(name="SuperAdmin").exists()
        # Return True if user is a staff
        if user.groups.filter(name__in=["Supervisor","Admin","SuperAdmin"]).exists():
            return True
        # If not any of the above deny
        return False

        

