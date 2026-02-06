from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('',include('users.urls')),
    path('core',include('core.urls')),
    path('api/auth/',include('knox.urls')),
    path("accounts/", include("allauth.urls"))
]
