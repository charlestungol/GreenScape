from django.contrib import admin
from django.urls import path, include
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
    path("accounts/", include("allauth.urls")),
    path("api/", include("core.urls")),
]
