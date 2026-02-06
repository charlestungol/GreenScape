from django.urls import path, include
from rest_framework.routers import DefaultRouter
from knox.views import LogoutView, LogoutAllView
from .views import *

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
    path('resend-verification/', ResendVerificationView.as_view(), name = 'resend-verification')
]

urlpatterns += router.urls
