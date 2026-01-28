from rest_framework import viewsets, permissions, views, status
from rest_framework.response import Response 
from .serializers import *
from .models import *
from django.contrib.auth import get_user_model
from allauth.account.models import EmailAddress
from knox.models import AuthToken

User = get_user_model()

class ClientLoginViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = ClientLoginSerializer

    def create(self, request):
        serializer = self.serializer_class(data=request.data, context = {"request" : request})
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
                "role": user.role   
            }
        })

    
class ClientRegisterViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    serializer_class = ClientRegisterSerializer

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
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
    permission_classes = [permissions.AllowAny]
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
    permission_classes = [permissions.AllowAny]  # <- correct attribute name

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        user = User.objects.filter(email__iexact=email).first()

        if user:
            EmailAddress.objects.add_email(
                request, user, user.email, confirm=True
            )
        return Response(
            {"detail": "If an account exists, a verification email has been sent."},
            status=status.HTTP_200_OK
        )
