# core/permissions.py
from rest_framework.permissions import BasePermission, SAFE_METHODS

# Allow clients only
class IsAuthenticatedOrReadOnly(BasePermission):
    #Check if the user has permission to view or edit.
    def has_permission(self, request, view):
        #If their method is safe
        if request.method in SAFE_METHODS:
            #If they are authenticated.
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_authenticated)

# Allow admins only 
class isAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_staff)
    
# Allow admin and owner
class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.is_staff:
            return True
        
        user = request.user
        if hasattr(obj, "user_id"):
            return obj.user_id == user.id
        
        if hasattr(obj, "customerid") and hasattr(obj.customerid, "user_id"):
            return obj.customerid.user_id == user.id

        return False        
