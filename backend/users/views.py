from rest_framework import viewsets, permissions, views, status
from rest_framework.response import Response
from rest_framework import exceptions
from .serializers import (
    ClientLoginSerializer,
    ClientRegisterSerializer,
    EmployeeLoginSerializer,
    EmployeeRegisterSerializer,
    ChangePasswordSerializer
)
from .models import *
from django.contrib.auth import get_user_model
from allauth.account.models import EmailAddress
from knox.models import AuthToken

User = get_user_model()

class ClientLoginViewSet(viewsets.ViewSet):
    throttle_classes = "login"
    permission_classes = [permissions.AllowAny]
    serializer_class = ClientLoginSerializer

    def create(self, request):
        serializer = self.serializer_class(data=request.data, context = {"request" : request})
        try:
            serializer.is_valid(raise_exception=True)

        except exceptions.ValidationError as e:
            return Response({"detail": e.detail[0]}, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data["user"]
        # Check if email is verified before issuing token
        email_verified = EmailAddress.objects.filter(user=user, email__iexact=user.email, verified=True).exists()
        # If email is not verified, send a new verification email and return an error response
        if not email_verified:
            EmailAddress.objects.add_email(
                request,
                user,
                user.email,
                confirm=True
            )
            return Response({"detail": "Email address not verified. Please check your email."}, status=status.HTTP_403_FORBIDDEN)

        _, token = AuthToken.objects.create(user)

        return Response({
            "token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role   
            }
        })

    
class ClientRegisterViewSet(viewsets.ModelViewSet):
    throttle_classes = "register"
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
    throttle_classes = "login"
    permission_classes = [permissions.AllowAny]
    serializer_class = EmployeeLoginSerializer

    def create(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        _, token = AuthToken.objects.create(user)

        return Response({
            "token": token,
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,               
                "employee_number": user.employee_number 
            }
        })


class EmployeeRegisterViewSet(viewsets.ModelViewSet):
    throttle_classes = "register"
    permission_classes = [permissions.DjangoModelPermissions]
    queryset = User.objects.all()
    serializer_class = EmployeeRegisterSerializer

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(EmployeeRegisterSerializer(user).data, status=201)
        return Response(serializer.errors, status=400)
    

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
