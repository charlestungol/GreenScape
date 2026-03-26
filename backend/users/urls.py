from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClientRegisterViewSet,
    ClientLoginViewSet,
    EmployeeRegisterViewSet,
    EmployeeLoginViewSet,
    ChangePasswordViewSet,
    ChangeEmailViewSet,
    ResendVerificationView,
    EmailVerifiedRedirectView,
    LogoutView,
    LogoutAllView,
    GoogleSignInView,
    CompleteCustomerProfileViewset,
    CookieTokenRefreshView,
)

router = DefaultRouter()
router.register('register/client', ClientRegisterViewSet, basename='client-register')
router.register('register/employee', EmployeeRegisterViewSet, basename='employee-register')
router.register('login/client', ClientLoginViewSet, basename='client-login')
router.register('login/employee', EmployeeLoginViewSet, basename='employee-login')

urlpatterns = [
    path('change-password/', ChangePasswordViewSet.as_view({'post': 'create'}), name='change-password'),
    path('change-email/', ChangeEmailViewSet.as_view({'post': 'create'}), name='change-email'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('logout-all/', LogoutAllView.as_view(), name='logout-all'),
    path('accounts/', include("allauth.urls")),
    path('resend-verification/', ResendVerificationView.as_view(), name = 'resend-verification'),
    path("email-verified/", EmailVerifiedRedirectView, name="email_verified"),
    path("google/", GoogleSignInView.as_view(), name="google-signin"),
    path("customers/complete-profile/", CompleteCustomerProfileViewset.as_view(), name="complete-profile"),
    path("refresh/", CookieTokenRefreshView.as_view(), name = 'token-refresh')
]

urlpatterns += router.urls
