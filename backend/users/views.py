from rest_framework import viewsets, permissions, views, status
from rest_framework.response import Response
from rest_framework import exceptions
from django.db import transaction
from rest_framework.throttling import ScopedRateThrottle
from django.contrib import messages
from django.shortcuts import redirect
from .serializers import (
    ClientLoginSerializer,
    ClientRegisterSerializer,
    EmployeeLoginSerializer,
    EmployeeRegisterSerializer,
    ChangePasswordSerializer
)
from .models import *
from core.models import Employee
from django.contrib.auth import get_user_model
from allauth.account.models import EmailAddress
from rest_framework_simplejwt.tokens import RefreshToken

throttle_classes = [ScopedRateThrottle]
User = get_user_model()

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

        # Optional but recommended if you use activation gating
        if not user.is_active:
            return Response({"detail": "Account not active. Please verify your email."},
                            status=status.HTTP_403_FORBIDDEN)

        email_verified = EmailAddress.objects.filter(
            user=user, email__iexact=user.email, verified=True
        ).exists()

        if not email_verified:
            EmailAddress.objects.add_email(request, user, user.email, confirm=True)
            return Response({"detail": "Email address not verified. Please check your email."},
                            status=status.HTTP_403_FORBIDDEN)

        # Pull customer profile (OneToOne reverse accessor)
        cust = getattr(user, "customer", None)
        if not cust:
            return Response({"detail": "Customer profile not found."},
                            status=status.HTTP_404_NOT_FOUND)

        refresh = RefreshToken.for_user(user)

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "customer_id": cust.customerid,
                "first_name": cust.firstname,
                "last_name": cust.lastname,
            }
        }, status=status.HTTP_200_OK)

    
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

        emp = getattr(user, "employee", None)

        # ✅ IMPORTANT: do NOT block login if emp doesn't exist yet
        payload = {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "email": user.email,
                "role": user.role,
                "employee_number": user.employee_number,
            },
            "profile_ready": bool(emp)  # tells client if Employee row exists
        }

        # If employee profile exists, include it
        if emp:
            payload["user"].update({
                "employee_id": emp.employeeid,
                "first_name": emp.firstname,
                "last_name": emp.lastname,
            })

        return Response(payload, status=status.HTTP_200_OK)


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