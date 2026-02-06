# core/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AddressViewSet, CustomerViewSet, EmployeeViewSet,
    ServiceViewSet, CustomerServiceViewSet, ServiceImageViewSet
)

router = DefaultRouter()
router.register(r"addresses", AddressViewSet, basename="address")
router.register(r"customers", CustomerViewSet, basename="customer")
router.register(r"employees", EmployeeViewSet, basename="employee")
router.register(r"services", ServiceViewSet, basename="service")
router.register(r"customer-services", CustomerServiceViewSet, basename="customerservice")
router.register(r"service-images", ServiceImageViewSet, basename="serviceimage")

urlpatterns = [
    path("/", include(router.urls)),
] 