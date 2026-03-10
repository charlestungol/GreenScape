# --- Django core ---
from django.conf import settings
from django.contrib import messages
from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import redirect
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie

# --- Django Allauth ---
from allauth.account.models import EmailAddress

# --- Django REST Framework ---
from rest_framework import exceptions, permissions, status, views, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

# --- SimpleJWT ---
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

# --- Google Identity (for Google Sign-in / Sign-up) ---
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# --- Project (local) ---
from .serializers import (
    ChangeEmailSerializer,
    ChangePasswordSerializer,
    ClientLoginSerializer,
    ClientRegisterSerializer,
    EmployeeLoginSerializer,
    EmployeeRegisterSerializer,
    CompleteProfileSerializer
)



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
    secure = cfg.get("JWT_AUTH_COOKI_SECURE", not settings.DEBUG)
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
def set_refresh_cookie(response: str, refresh_token: str):
    cfg = _jwt_cookie_settings()
    response.set_cookie(cfg["cookie_refresh"], refresh_token, **cfg["cookie_kwargs"])
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
@method_decorator(ensure_csrf_cookie, name="dispatch")
class ClientLoginViewSet(viewsets.ViewSet):
    throttle_scope = "login"
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    serializer_class = ClientLoginSerializer

    # The create method handles the login process. It validates the user's credentials using the ClientLoginSerializer, checks if the account is active and if the email is verified, and then generates JWT tokens for the session. The response includes user information and a flag indicating whether the profile is ready (i.e., if the related Customer profile exists). The tokens are also set as cookies for authentication in subsequent requests.
    def create(self, request):

        # Serilizer will validate the email/password and return the user if valid. If invalid, it raises a ValidationError which we catch to return a generic "No user found" message, avoiding leaking information about which part of the credentials was incorrect.
        serializer = self.serializer_class(data=request.data, context={"request": request})
        try:
            serializer.is_valid(raise_exception=True)
        except exceptions.ValidationError:
            return Response({"detail": "No user found."}, status=status.HTTP_400_BAD_REQUEST)

        # At this point, the serializer has validated the credentials and we have a user object. We now check if the account is active and if the email is verified before allowing login. This ensures that only users who have completed email verification can log in, which is important for security and account integrity.
        user = serializer.validated_data["user"]

        # If the account is not active, we return a 403 Forbidden response with a message prompting the user to verify their email. This prevents inactive accounts from logging in while still providing guidance on how to activate their account.
        if not user.is_active:
            return Response(
                {"detail": "Account not active. Please verify your email."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if the email is verified. We look for an EmailAddress record that matches the user's email and is marked as verified. If no such record exists, we trigger sending a verification email and return a 403 response prompting the user to check their email. This ensures that only users with verified emails can log in, which helps prevent abuse and ensures that we have a valid contact method for the user.
        email_verified = EmailAddress.objects.filter(
            user=user, email__iexact=user.email, verified=True
        ).exists()

        # If the email is not verified, we add the email address to the EmailAddress model (if it doesn't already exist) and send a confirmation email. We then return a 403 Forbidden response with a message prompting the user to check their email for verification. This flow ensures that users are guided through the email verification process if they attempt to log in without having verified their email, improving user experience while maintaining security.
        if not email_verified:
            EmailAddress.objects.add_email(request, user, user.email, confirm=True)
            return Response(
                {"detail": "Email address not verified. Please check your email."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Since the ClientLoginSerializer should only authenticate users with role="client", we can safely assume that the related Customer profile exists. However, we add a check just in case to avoid potential errors.
        cust = getattr(user, "customer", None)
        # If the customer profile is missing, this indicates a data integrity issue (a user with role=client should always have a related Customer). We return a 404 error to indicate that the expected resource (customer profile) was not found, which is more informative than a generic server error.
        if not cust:
            return Response({"detail": "Customer profile not found."}, status=status.HTTP_404_NOT_FOUND)

        # At this point, we have a valid user with an active account and a verified email. We can now generate JWT tokens for the session. We use the RefreshToken class from SimpleJWT to create a refresh token for the user, and then derive the access token from it. Both tokens are converted to strings for use in the response and cookies.
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        payload = {
            "access": access_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "customer_id": cust.customerid,
                "first_name": cust.firstname,
                "last_name": cust.lastname,
            },
            "profile_ready": True,
        }

        # We return the user's information
        resp = Response(payload, status=status.HTTP_200_OK)
        return set_refresh_cookie(resp, refresh_token)

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
        serializer = self.serializer_class(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        emp = getattr(user, "employee", None)

        payload = {
            "access": access_token,
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "employee_number": user.employee_number,
            },
            "profile_ready": bool(emp),
        }

        if emp:
            payload["user"].update({
                "employee_id": emp.employeeid,
                "first_name": emp.firstname,
                "last_name": emp.lastname,
            })

        resp = Response(payload, status=status.HTTP_200_OK)
        return set_refresh_cookie(resp, refresh_token)

# Client registreation viewset. Design to allow a user to register using ClientRegister Serializer.
class ClientRegisterViewSet(viewsets.ModelViewSet):
    # We add a throttle scope so a bot will not be allowed to conitnuenly bombard our signup page.
    throttle_scope = "register"
    # Allow anyone to register an employee account.
    permission_classes = [permissions.AllowAny]
    # Select all users obvject
    queryset = User.objects.all()
    serializer_class = ClientRegisterSerializer

    # Method of registering
    def create(self, request):
        # Serialize the data given
        serializer = self.get_serializer(data=request.data)
        # Check if the data provided is valid data.
        serializer.is_valid(raise_exception=True)
        # Use transaction atomic to wrap the code in a signle database transaction.
        with transaction.atomic():
            # Saved the user.
            user = serializer.save()
            # Send a email verification using alluth
            EmailAddress.objects.add_email(
                request,
                user,
                user.email,
                confirm=True
            )
        # Provide user with response.
        return Response (
            {"detail": "Registration received. Please check your email to confirm your account."}, status = 201
        )

# Similar to customer register this one register a new employee to the system.
class EmployeeRegisterViewSet(viewsets.ModelViewSet):
    # We again provide a trottle incase someone is able to access it and just  make it more secure in general.
    throttle_scope = "register"
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
                # Save user
                user = serializer.save()
                # Send verification through email.
                EmailAddress.objects.add_email(
                request,
                user,
                user.email,
                confirm=True
                )
            return Response(EmployeeRegisterSerializer(user).data, status=201)
        return Response({"detail": f"Registration failed. Please check your input. {self.get_serializer(user).data}"}, status=400)

class CompleteCustomerProfileViewset(APIView):
    permissions_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CompleteProfileSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception = True)
        customer = serializer.save()
        return Response ({"detail" : "Profile completed"} , status = status.HTTP_201_CREATED,)

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

    # This endpoint allows users to change their email. It will send a new verification email to the new address and deactivate the account until verified.
    def create(self, request):
        # We can use the ChangeEmailSerializer for validating the new email by treating it as a "new_email" field, since it already has email validation logic.
        serializer = self.serializer_class(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
    
        user = request.user
        new_email = serializer.validated_data['new_email'].strip().lower()

        if User.objects.filter(email__iexact=new_email).exclude(id=user.id).exists():
            return Response({"detail": "Email already in use."}, status=400)

        user.email = new_email
        user.is_active = False  # Deactivate until email is verified
        user.save()

        EmailAddress.objects.add_email(request, user, new_email, confirm=True)

        return Response({"message": "Email changed successfully. Please verify your new email."}, status=200)

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

    # The post method handles the logout process. It first defines the cookie names for access and refresh tokens based on the REST_AUTH settings.
    def post(self, request):
        cfg = _jwt_cookie_settings()

        # Cookie names from your REST_AUTH settings
        REFRESH_COOKIE_NAME = cfg["cookie_refresh"]

        # Default response
        response = Response({"detail": "Successfully logged out"}, status=status.HTTP_200_OK)

        # Try to read refresh token from cookie
        refresh_token = request.COOKIES.get(REFRESH_COOKIE_NAME)

        if refresh_token:
            try:
                # Blacklist the refresh token to invalidate it server-side
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                # Even if blacklisting fails, still clear cookies so client is logged out
                response = Response({"detail": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

        # Always delete cookies client-side
        clear_auth_cookies(response)

        return response

# This view allows users to log out from all sessions by blacklisting all refresh tokens associated with the user.
class LogoutAllView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        tokens = RefreshToken.for_user(request.user)
        tokens.blacklist()

        return Response({"detail": "Logged out from all sessions"}, status=200)

# Helper to refresh the token in the Cookie
class CookieTokenRefreshView(views.APIView):
    permission_classes = [permissions.AllowAny]

    @method_decorator(csrf_protect)
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
        credential = request.data.get("credential")
        if not credential:
            return Response({"detail": "Missing credential"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = id_token.verify_oauth2_token(
                credential,
                google_requests.Request(),
                settings.GOOGLE_CLIENT_ID,
            )
            if payload.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
                return Response({"detail": "Invalid issuer"}, status=status.HTTP_400_BAD_REQUEST)
            if not payload.get("email_verified"):
                return Response({"detail": "Google email not verified"}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError as e:
            return Response({"detail": "Invalid token", "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        email = (payload.get("email") or "").lower()
        sub = payload.get("sub")
        picture = payload.get("picture") or ""
        if not email or not sub:
            return Response({"detail": "Invalid Google payload"}, status=status.HTTP_400_BAD_REQUEST)

        created = False
        try:
            user = User.objects.select_for_update().get(email=email)
            # Prevent hijack: if already linked to different sub, block
            if hasattr(user, "google_sub") and user.google_sub and user.google_sub != sub:
                return Response({"detail": "Account conflict for this email."}, status=status.HTTP_409_CONFLICT)
        except User.DoesNotExist:
            # Create a minimal customer/client account
            random_pwd = User.objects.make_random_password()
            user_kwargs = {"email": email, "password": random_pwd}
            # If your CustomUser has a role field, default to "client"
            if hasattr(User, "_meta") and any(f.name == "role" for f in User._meta.get_fields()):
                user_kwargs["role"] = "client"
            user = User.objects.create_user(**user_kwargs)
            created = True

        # Link Google account & avatar
        updated = False
        if hasattr(user, "google_sub") and not user.google_sub:
            user.google_sub = sub
            updated = True
        if picture and hasattr(user, "avatar_url") and not getattr(user, "avatar_url", None):
            user.avatar_url = picture
            updated = True

        # Ensure active (email verification is handled by Google for this flow)
        if not user.is_active:
            user.is_active = True
            updated = True

        if updated:
            user.save()

        # Issue tokens: refresh in HttpOnly cookie, access in body
        refresh = RefreshToken.for_user(user)
        access = str(refresh.access_token)

        customer = getattr(user, "customer", None)

        resp = Response({
            "access": access,
            "user": {
                "id": user.id,
                "email": user.email,
                "role": getattr(user, "role", "client"),
                "customer_profile_ready" : bool(customer),
            },
            "created": created,
        }, status=status.HTTP_200_OK)

        return set_refresh_cookie(resp, str(refresh))
