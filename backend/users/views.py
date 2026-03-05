from rest_framework import viewsets, permissions, views, status
from rest_framework.response import Response
from rest_framework import exceptions
from django.db import transaction
from django.conf import settings
from rest_framework.throttling import ScopedRateThrottle
from django.contrib import messages
from django.shortcuts import redirect
from .serializers import (
    ClientLoginSerializer,
    ClientRegisterSerializer,
    EmployeeLoginSerializer,
    EmployeeRegisterSerializer,
    ChangePasswordSerializer,
    ChangeEmailSerializer,
)
from .models import *
from core.models import Employee
from django.contrib.auth import get_user_model
from allauth.account.models import EmailAddress
from rest_framework_simplejwt.tokens import RefreshToken

throttle_classes = [ScopedRateThrottle]
User = get_user_model()

def _jwt_cookie_settings():
    # Centralized cookie settings so set_cookie/delete_cookie always match.
    
    httponly = settings.REST_AUTH.get("JWT_AUTH_HTTPONLY", True)
    cookie_access = settings.REST_AUTH.get("JWT_AUTH_COOKIE", "access")
    cookie_refresh = settings.REST_AUTH.get("JWT_AUTH_REFRESH_COOKIE", "refresh")

    # You added these in settings.py (good!)
    samesite = getattr(settings, "JWT_AUTH_COOKIE_SAMESITE", "Lax")
    secure = getattr(settings, "JWT_AUTH_COOKIE_SECURE", False)

    # Optional: domain. Usually None for localhost.
    domain = getattr(settings, "SESSION_COOKIE_DOMAIN", None)

    return {
        "cookie_access": cookie_access,
        "cookie_refresh": cookie_refresh,
        "cookie_kwargs": {
            "httponly": httponly,
            "secure": secure,
            "samesite": samesite,
            "path": "/",
            "domain": domain,
        }
    }


def set_jwt_cookies(response, access_token: str, refresh_token: str):
    cfg = _jwt_cookie_settings()
    response.set_cookie(cfg["cookie_access"], access_token, **cfg["cookie_kwargs"])
    response.set_cookie(cfg["cookie_refresh"], refresh_token, **cfg["cookie_kwargs"])
    return response


def clear_jwt_cookies(response):
    cfg = _jwt_cookie_settings()
    # delete_cookie must match path/domain/samesite/secure used to set cookie
    response.delete_cookie(cfg["cookie_access"], path=cfg["cookie_kwargs"]["path"], domain=cfg["cookie_kwargs"]["domain"])
    response.delete_cookie(cfg["cookie_refresh"], path=cfg["cookie_kwargs"]["path"], domain=cfg["cookie_kwargs"]["domain"])
    return response

class ClientLoginViewSet(viewsets.ViewSet):
    throttle_scope = "login"
    permission_classes = [permissions.AllowAny]
    serializer_class = ClientLoginSerializer

    def create(self, request):
        serializer = self.serializer_class(data=request.data, context={"request": request})
        try:
            serializer.is_valid(raise_exception=True)
        except exceptions.ValidationError:
            return Response({"detail": "No user found."}, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data["user"]

        if not user.is_active:
            return Response(
                {"detail": "Account not active. Please verify your email."},
                status=status.HTTP_403_FORBIDDEN
            )

        email_verified = EmailAddress.objects.filter(
            user=user, email__iexact=user.email, verified=True
        ).exists()

        if not email_verified:
            EmailAddress.objects.add_email(request, user, user.email, confirm=True)
            return Response(
                {"detail": "Email address not verified. Please check your email."},
                status=status.HTTP_403_FORBIDDEN
            )

        cust = getattr(user, "customer", None)
        if not cust:
            return Response({"detail": "Customer profile not found."}, status=status.HTTP_404_NOT_FOUND)

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        payload = {
            # Optional: you can remove these once cookies work everywhere
            "access": access_token,
            "refresh": refresh_token,
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

        resp = Response(payload, status=status.HTTP_200_OK)
        return set_jwt_cookies(resp, access_token, refresh_token)

    
class ClientRegisterViewSet(viewsets.ModelViewSet):
    throttle_scope = "register"
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    serializer_class = ClientRegisterSerializer

    def create(self, request):
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

        return Response (
            {"detail": "Registration recieved. Please check your email to confirm your account."}, status = 201
        )
    


class EmployeeLoginViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
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
            # Optional: you can remove these once cookies work everywhere
            "access": access_token,
            "refresh": refresh_token,
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
        return set_jwt_cookies(resp, access_token, refresh_token)


class EmployeeRegisterViewSet(viewsets.ModelViewSet):
    throttle_scope = "register"
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    serializer_class = EmployeeRegisterSerializer

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            with transaction.atomic():
                user = serializer.save()
                EmailAddress.objects.add_email(
                request,
                user,
                user.email,
                confirm=True
                )
            return Response(EmployeeRegisterSerializer(user).data, status=201)
        return Response({"detail": f"Registration failed. Please check your input. {self.get_serializer(user).data}"}, status=400)
    

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
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

def EmailVerifiedRedirectView(request):
    messages.success(request, "Email verified successfully. You can now log in.")
    return redirect("http://localhost:5173")