# --- Helper ---
import datetime
import logging

# --- Django core ---
from django.conf import settings
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.db import transaction
from django.shortcuts import redirect
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie, csrf_exempt

logger = logging.getLogger(__name__)

# --- Models ---
from .models import CustomUser

# --- Django Allauth ---
from allauth.account.models import EmailAddress

# --- Django REST Framework ---
from rest_framework import exceptions, permissions, status, views, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied

# --- SimpleJWT ---
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

# --- Google Identity (for Google Sign-in / Sign-up) ---
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# --- Google Capcha helper ---

from .recaptcha import (
    verify_recaptcha,
)

# --- Project (local) ---
from .serializers import (
    ChangeEmailSerializer,
    ChangePasswordSerializer,
    ClientLoginSerializer,
    ClientRegisterSerializer,
    EmployeeAccountSerializer,
    EmployeeLoginSerializer,
    EmployeeRegisterSerializer,
    CompleteCustomerProfileSerializer,
    UserGroupUpdateSerializer,
    UserSerializer,

)

#permissions
from .permissions import IsSupervisorOrAdmin

ALLOWED_GROUPS = ["Staff", "Supervisor", "Admin"]

throttle_classes = [ScopedRateThrottle]
User = get_user_model()

# Helper functions for setting and clearing JWT cookies. 
# These ensure that the cookie settings (httponly, secure, samesite, domain) are consistent between setting and clearing cookies, which is crucial for them to work properly in browsers.
def _jwt_cookie_settings():
    # Centralized cookie settings so set_cookie/delete_cookie always match.
    cfg = getattr(settings, "REST_AUTH", {})
    #Cookie refresh
    cookie_refresh = cfg.get("JWT_AUTH_REFRESH_COOKIE", "refresh")
    #Check if the site of the refresh token.
    samesite = getattr(settings, "JWT_AUTH_COOKIE_SAMESITE", "Lax")
    #Check if the cookie is secured
    secure = cfg.get("JWT_AUTH_COOKIE_SECURE", not settings.DEBUG)
    #domain
    domain = getattr(settings, "SESSION_COOKIE_DOMAIN", None)

    return {
        "cookie_refresh": cookie_refresh,
        "cookie_kwargs": {
            "httponly": cfg.get("JWT_AUTH_HTTPONLY", True),
            "secure": secure,
            "samesite": samesite,
            "path": "/",
            "domain": domain,
        }
    }


# These functions are used in the login/logout views to set and clear the JWT tokens in cookies. 
# They ensure that the cookies are set with the correct attributes so that they work properly across different browsers and contexts.
def set_refresh_cookie(response, refresh_token):
    cfg = _jwt_cookie_settings()

    # Decode refresh token to extract exp
    token = RefreshToken(refresh_token)
    expires_at = datetime.datetime.fromtimestamp(token["exp"])

    response.set_cookie(
        cfg["cookie_refresh"],
        refresh_token,
        expires=expires_at,
        **cfg["cookie_kwargs"]
    )
    return response

# When logging out, we need to clear the JWT cookies. 
# This function deletes the cookies using the same path/domain/samesite/secure settings that were used to set them, which is necessary for the browser to properly remove them.
def clear_auth_cookies(response):
    cfg = _jwt_cookie_settings()
    # delete_cookie must match path/domain/samesite/secure used to set cookie
    response.delete_cookie(cfg["cookie_refresh"], path=cfg["cookie_kwargs"]["path"], domain=cfg["cookie_kwargs"]["domain"])
    return response

# The ClientLoginViewSet and EmployeeLoginViewSet handle the login process for clients and employees, respectively. 
# They validate the user's credentials, check if the email is verified, and then generate JWT tokens for authenticated sessions. 
# The tokens are returned in the response body and also set as cookies for convenience. 
# The ClientRegisterViewSet and EmployeeRegisterViewSet handle user registration, creating new user accounts and sending verification emails. 
# The ChangeEmailViewSet and ChangePasswordViewSet allow authenticated users to change their email or password, with appropriate validation and security checks. 
# The ResendVerificationView allows users to request a new verification email if they haven't received or acted on the original one.
from rest_framework import status
from rest_framework.response import Response
from rest_framework import permissions
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

@method_decorator(ensure_csrf_cookie, name="dispatch")
class ClientLoginViewSet(viewsets.ViewSet):
    throttle_scope = "login"
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = ClientLoginSerializer

    def create(self, request):
        #reCaptcha verification
        recaptcha_token = request.data.get("recaptchaToken")
        if recaptcha_token:
            ok, _ = verify_recaptcha(
                recaptcha_token,
                request.META.get("REMOTE_ADDR", "")
            )
            if not ok:
                return Response(
                    {"detail": "reCAPTCHA verification failed."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        #Normal login flow
        serializer = self.serializer_class(
            data=request.data,
            context={"request": request}
        )

        try:
            serializer.is_valid(raise_exception=True)
        except exceptions.ValidationError:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.validated_data["user"]

        if not user.is_active:
            return Response(
                {"detail": "Account not active. Please verify your email."},
                status=status.HTTP_403_FORBIDDEN
            )

        email_verified = EmailAddress.objects.filter(
            user=user,
            email__iexact=user.email,
            verified=True
        ).exists()

        if not email_verified:
            EmailAddress.objects.add_email(
                request, user, user.email, confirm=True
            )
            return Response(
                {"detail": "Email not verified. Please check your email."},
                status=status.HTTP_403_FORBIDDEN
            )

        cust = getattr(user, "customer", None)
        profile_ready = bool(cust)

        refresh = RefreshToken.for_user(user)

        payload = {
            "access": str(refresh.access_token),
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role,
            },
            "profile_ready": profile_ready,
        }

        if cust:
            payload["user"].update({
                "customer_id": cust.customerid,
                "first_name": cust.firstname,
                "last_name": cust.lastname,
            })

        resp = Response(payload, status=status.HTTP_200_OK)
        return set_refresh_cookie(resp, str(refresh))


# The EmployeeLoginViewSet is similar to the ClientLoginViewSet but is designed for employee users. 
# It validates the credentials, checks if the account is active and if the email is verified, and then generates JWT tokens for authenticated sessions. 
# The response includes user information and a flag indicating whether the profile is ready (i.e., if the related Employee profile exists). 
# The tokens are also set as cookies for authentication in subsequent requests. 
# The main difference from the ClientLoginViewSet is that it looks for an Employee profile instead of a Customer profile, and it does not assume that the Employee profile must exist (since there may be cases where an employee account is created before the employee details are filled in).
@method_decorator(ensure_csrf_cookie, name="dispatch")
class EmployeeLoginViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = EmployeeLoginSerializer
    throttle_scope = "login"

    def create(self, request):
        serializer = self.serializer_class(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        #Resolve role from GROUPS or superuser
        group = user.groups.first()
        group_name = (
            "SuperAdmin"
            if user.is_superuser
            else group.name if group else None
        )

        payload = {
            "access": access_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "group": group_name,
                "employee_number": getattr(user, "employee_number", ""),
                "role": user.role,
            },
            "profile_ready": True,
        }

        resp = Response(payload, status=status.HTTP_200_OK)
        return set_refresh_cookie(resp, refresh_token)

# Client registreation viewset. Design to allow a user to register using ClientRegister Serializer.
class ClientRegisterViewSet(viewsets.ModelViewSet):
    throttle_scope = "register"
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    queryset = User.objects.all()
    serializer_class = ClientRegisterSerializer

    def create(self, request):
        #REQUIRED reCAPTCHA
        recaptcha_token = request.data.get("recaptchaToken")
        if not recaptcha_token:
            return Response(
                {"detail": "reCAPTCHA token is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        ok, _ = verify_recaptcha(
            recaptcha_token,
            request.META.get("REMOTE_ADDR", "")
        )
        if not ok:
            return Response(
                {"detail": "reCAPTCHA verification failed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            user = serializer.save()
            EmailAddress.objects.add_email(
                request,
                user,
                user.email,
                confirm=True
            )

        return Response(
            {"detail": "Registration successful. Please verify your email."},
            status=status.HTTP_201_CREATED
        )

# Similar to customer register this one register a new employee to the system.
class EmployeeRegisterViewSet(viewsets.ModelViewSet):
    # We again provide a trottle incase someone is able to access it and just  make it more secure in general.
    throttle_scope = "register"
    authentication_classes = []
    # We allow anyone for now but will change to allow to admin only.
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    serializer_class = EmployeeRegisterSerializer

    #Create the user
    def create(self, request):
        # Serialize the data given
        serializer = self.get_serializer(data=request.data)
        # Check if the data given is valid.
        if serializer.is_valid(raise_exception=True):
            # Wrap code with transaction.atomic to make it a signle database transaction.
            with transaction.atomic():
                user = serializer.save()

            try:
                EmailAddress.objects.add_email(
                    request,
                    user,
                    user.email,
                    confirm=True
                )
            except Exception as e:
                # Log it, but NEVER crash registration
                logger.error(f"Employee email failed: {e}")
            return Response(EmployeeRegisterSerializer(user).data, status=201)
        return Response({"detail": f"Registration failed. Please check your input. {self.get_serializer(user).data}"}, status=400)

class CompleteCustomerProfileViewSet(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # Only clients can complete a customer profile
        if user.role != "client":
            raise PermissionDenied("Only clients can complete a customer profile.")

        #Prevent duplicate profile creation
        if hasattr(user, "customer") and user.customer is not None:
            return Response(
                {"detail": "Customer profile already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = CompleteCustomerProfileSerializer(
            data=request.data,
            context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(
            {"detail": "Customer profile completed successfully."},
            status=status.HTTP_201_CREATED
        )


# Check all the account of both employee and customer.
class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAdminUser]
    queryset = User.objects.all()
    serializer_class = EmployeeRegisterSerializer

    def list(self, request):
        queryset = User.objects.all()
        serializers = self.serializer_class(queryset, many=True)
        return Response(serializers.data)

# Endpoints for changing email/password and resending verification email

class ChangeEmailViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangeEmailSerializer
    throttle_scope = "account_change"  

    def create(self, request):
        serializer = self.serializer_class(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        new_email = serializer.validated_data["new_email"].strip().lower()
        password = serializer.validated_data["password"]

        # 1) Password verification
        if not user.check_password(password):
            # Attach error to the 'password' field for consistent client handling
            return Response({"password": ["Incorrect password."]}, status=status.HTTP_400_BAD_REQUEST)

        # 2) Uniqueness check
        if User.objects.filter(email__iexact=new_email).exclude(id=user.id).exists():
            return Response({"new_email": ["Email already in use."]}, status=status.HTTP_400_BAD_REQUEST)

        # 3) Apply changes atomically
        with transaction.atomic():
            user.email = new_email
            user.is_active = False  # Deactivate until verified
            user.save(update_fields=["email", "is_active"])

            # Create the email
            email_addr, created = EmailAddress.objects.get_or_create( user=user, email=new_email, defaults={"verified": False, "primary": False},)
            # Make new email primary.
            EmailAddress.objects.filter(user = user).exclude(email__iexact=new_email).update(primary=False)
            
            if not email_addr.primary:
                email_addr.primary = True
                email_addr.save(update_fields=["primary"])
                        # Delete old email from 

            EmailAddress.objects.filter(user=user).exclude(email__iexact=new_email).delete()

            # Send confirmation email
            email_addr.send_confirmation(request)

        return Response(
            {"message": "Email changed successfully. Please verify your new email."},
            status=status.HTTP_200_OK,
        )


# This endpoint allows users to change their password. 
# It requires the user to provide their current password and the new password. 
# The serializer will validate the current password and ensure the new password meets any defined criteria. 
# If valid, it updates the user's password and saves the user object.
class ChangePasswordViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def create(self, request):
        serializer = self.serializer_class(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        return Response({"message": "Password changed successfully."}, status=200)

# This view allows users to request a new verification email if they haven't received or acted on the original one. 
# It accepts an email address, checks if a user with that email exists, and if so, sends a new verification email if the email is not already verified. 
# The response is always a generic message indicating that if an account with that email exists, a verification email has been sent, 
# to avoid leaking information about which emails are registered.
class ResendVerificationView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response({"detail": "If an account with that email exists, a verification email has been sent."}, status=200)
        
        addr = EmailAddress.objects.filter(user=user, email__iexact=email).first()
        if addr and not addr.verified:
            addr.send_confirmation(request)
        return Response({"detail": "If an account with that email exists, a verification email has been sent."}, status=200)

# This view is used as the redirect target after a user clicks the email verification link. 
# It displays a success message and redirects the user to the frontend application. 
# The URL for this view should be configured in the ACCOUNT_EMAIL_CONFIRMATION_ANONYMOUS_REDIRECT_URL setting in settings.py.
def EmailVerifiedRedirectView(request):
    messages.success(request, "Email verified successfully. You can now log in.")
    return redirect("http://localhost:5173")

# This view handles user logout by blacklisting the refresh token and clearing the authentication cookies. 
# It checks for the presence of the refresh token in the cookies, attempts to blacklist it, and then deletes both the access and refresh tokens from the client's 
# cookies to ensure the user is logged out on the client side as well. 
# The view requires the user to be authenticated to access it.
class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    # The post method handles the logout process.
    def post(self, request):
        # Default response
        response = Response({"detail": "Successfully logged out"}, status=status.HTTP_200_OK)
        # Always delete cookies client-side
        clear_auth_cookies(response)

        return response

# Helper to refresh the token in the Cookie
class CookieTokenRefreshView(views.APIView):
    permission_classes = [permissions.AllowAny]

    @method_decorator(csrf_exempt)
    def post(self, request):
        cfg = _jwt_cookie_settings()
        cookie_name = cfg["cookie_refresh"]
        refresh_cookie = request.COOKIES.get(cookie_name)
        if not refresh_cookie:
            return Response({"detail" : "No  refreesh cookie"}, status=401)
        
        serializer = TokenRefreshSerializer(data ={"refresh" : refresh_cookie})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response({"detail" : "Invalid refresh token"}, status=401)
        
        data = serializer.validated_data
        resp = Response(data, status=200)
        new_refresh = data.get("refresh")
        if new_refresh:
            set_refresh_cookie(resp, new_refresh)
            resp.data.pop("refresh", None)
        return resp
    

class GoogleSignInView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_scope = "login"
    throttle_classes = [ScopedRateThrottle]

    @transaction.atomic
    def post(self, request):
        try:
            credential = request.data.get("credential")
            if not credential:
                raise ValueError("Missing credential")

            payload = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )

            if payload.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
                raise ValueError("Invalid issuer")

            if not payload.get("email_verified"):
                raise ValueError("Google email not verified")

            email = (payload.get("email") or "").lower()
            sub = payload.get("sub")
            picture = payload.get("picture") or ""

            if not email or not sub:
                raise ValueError("Invalid Google payload")

            created = False
            try:
                user = User.objects.select_for_update().get(email=email)
            except User.DoesNotExist:
                user = User.objects.create_user(
                    email=email,
                    role="client",
                )
                created = True

            if hasattr(user, "google_sub") and not user.google_sub:
                user.google_sub = sub

            if picture and hasattr(user, "avatar_url") and not user.avatar_url:
                user.avatar_url = picture

            if not user.is_active:
                user.is_active = True

            user.save()

            refresh = RefreshToken.for_user(user)
            access = str(refresh.access_token)

            customer = getattr(user, "customer", None)

            resp = Response(
                {
                    "access": access,
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "role": getattr(user, "role", "client"),
                    },
                    "profile_ready": bool(customer),
                    "created": created,
                },
                status=200,
            )

            return set_refresh_cookie(resp, str(refresh))

        except Exception:
            return Response(
                {"detail": "Internal server error during Google sign‑in"},
                status=500,
            )

@method_decorator(csrf_exempt, name='dispatch')
class RecaptchaGateAPIView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request, *args, **kwargs):
        # 1) reCAPTCHA gate — must pass
        recaptcha_token = request.data.get("recaptchaToken")
        ok, google_payload = verify_recaptcha(recaptcha_token, request.META.get("REMOTE_ADDR", ""))

        if not ok:
            return Response({
                "ok" : False, "reason" : "recaptcha-failed", "google" : google_payload
            }, status.status.HTTP_400_BAD_REQUEST)
        
        # 2) Proceed with JWT to validate credentials
        sjwt_resp = super().post(request, *args, **kwargs)
        if sjwt_resp.status_code != 200:
            return sjwt_resp
        
        # Get access key
        access = sjwt_resp.data.get("access")
        # Get the refresh token
        refresh = sjwt_resp.data.get("refresh")

        # 3) Place refresh into cookie, and access into body.
        final = Response({"ok" : True, "access": access}, status=200)

        set_refresh_cookie(final, refresh)

        return final


# For user management by admin, allow admin to view all users and change their group/role.
class UserManagementViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsAdminUser]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by("id")

    @action(detail=True, methods=["patch"], url_path="group")
    def set_group(self, request, pk=None):
        target_user = User.objects.get(pk=pk)
        serializer = UserGroupUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_role = serializer.validated_data["group"]
        actor = request.user

        # ─── PERMISSION RULES ─────────────────────────

        if actor.groups.filter(name="SuperAdmin").exists():
            if new_role not in ["Staff", "Supervisor", "Admin"]:
                return Response(
                    {"detail": "Admins cannot assign this role."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        elif actor.groups.filter(name="SuperAdmin").exists():
            pass  # SuperAdmin can assign everything

        else:
            return Response(
                {"detail": "You do not have permission to change roles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # ─── APPLY GROUP CHANGE ───────────────────────

        role_groups = Group.objects.filter(
            name__in=["Staff", "Supervisor", "Admin", "SuperAdmin"]
        )
        target_user.groups.remove(*role_groups)

        new_group = Group.objects.get(name=new_role)
        target_user.groups.add(new_group)

        return Response(
            {"detail": f"User role updated to {new_role}."},
            status=status.HTTP_200_OK,
        )

# This viewset allows admin users to view all employee accounts. It filters the CustomUser model to only include users with the role of "employee" and prefetches related group information for efficiency. The serializer used is EmployeeAccountSerializer, which should include fields relevant to employee accounts such as employee_number and group/role information.
class EmployeeAccountViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = EmployeeAccountSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        return [IsSupervisorOrAdmin()]

    def get_queryset(self):
        return (
            CustomUser.objects
            .filter(role="employee")
            .prefetch_related("groups")
            .order_by("id")
        )
    
    
    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        user = self.get_object()
        # Prevent admin from deactivating their own account to avoid locking themselves out.
        if user == request.user:
            return Response(
                {"detail": "You cannot deactivate your own account."},
                status=status.HTTP_400_BAD_REQUEST,
        )
        if not user.is_active:
            return Response(
                {"detail": "User is already deactivated."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = False
        user.save(update_fields=["is_active"])

        return Response(
            {"detail": "Employee account deactivated successfully."},
            status=status.HTTP_200_OK,
        )
    
    
    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        user = self.get_object()

        if user.is_active:
            return Response(
                {"detail": "User is already active."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.is_active = True
        user.save(update_fields=["is_active"])

        return Response(
            {"detail": "Employee account activated successfully."},
            status=status.HTTP_200_OK,
        )


    @action(detail=True, methods=["post"], url_path="set-group")
    def set_group(self, request, pk=None):
        user = self.get_object()

        # Prevent changing your own permissions
        if user == request.user:
            return Response(
                {"detail": "You cannot change your own group."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        group_name = request.data.get("group")

        if group_name not in ALLOWED_GROUPS:
            return Response(
                {"detail": "Invalid group."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            new_group = Group.objects.get(name=group_name)
        except Group.DoesNotExist:
            return Response(
                {"detail": "Group does not exist."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Remove existing role groups
        user.groups.clear()
        user.groups.add(new_group)

        return Response(
            {"detail": f"Employee group updated to {group_name}."},
            status=status.HTTP_200_OK,
        )



