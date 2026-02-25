from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .jwt_views import LogoutView, LogoutAllView
from .views import (
    ClientRegisterViewSet,
    ClientLoginViewSet,
    EmployeeRegisterViewSet,
    EmployeeLoginViewSet,
    ChangePasswordViewSet,
    ResendVerificationView,
    EmailVerifiedRedirectView,

)

router = DefaultRouter()
router.register('register/client', ClientRegisterViewSet, basename='client-register')
router.register('register/employee', EmployeeRegisterViewSet, basename='employee-register')
router.register('login/client', ClientLoginViewSet, basename='client-login')
router.register('login/employee', EmployeeLoginViewSet, basename='employee-login')

urlpatterns = [
    path('change-password/', ChangePasswordViewSet.as_view({'post': 'create'}), name='change-password'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('logout-all/', LogoutAllView.as_view(), name='logout-all'),
    path('accounts/', include("allauth.urls")),
    path('resend-verification/', ResendVerificationView.as_view(), name = 'resend-verification'),
    path("email-verified/", EmailVerifiedRedirectView, name="email_verified"),
]

urlpatterns += router.urls
