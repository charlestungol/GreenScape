from django.contrib import admin
from django.urls import path, include
from users.views import LogoutView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.views.decorators.csrf import ensure_csrf_cookie
from django.http import JsonResponse


@ensure_csrf_cookie
def get_csrf(request):
    return JsonResponse({"detail": "CSRF cookie set"})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('users.urls')),
    path('core/', include('core.urls')),
    path('csrf/', get_csrf),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/logout/', LogoutView.as_view(), name='api_logout'),
    path("accounts/", include("allauth.urls")),
]
