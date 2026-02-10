# core/urls.py
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AddressViewSet,
    BookingViewSet,
    CustomerViewSet,
    EmployeeViewSet,
    ServiceTypeViewSet,
    ServiceViewSet,
    CustomerServiceViewSet,
    ServiceImageViewSet,
    RoleViewSet,
    SiteViewSet,
    ZoneViewSet,
    InvoiceViewSet,
    QuoteViewSet,
    ScheduleViewSet
);

router = DefaultRouter()
router.register(r"addresses", AddressViewSet, basename="address")
router.register(r"customers", CustomerViewSet, basename="customer")
router.register(r"employees", EmployeeViewSet, basename="employee")
router.register(r"services", ServiceViewSet, basename="service")
router.register(r"customer-services", CustomerServiceViewSet, basename="customerservice")
router.register(r"service-images", ServiceImageViewSet, basename="serviceimage")
router.register(r"roles", RoleViewSet, basename="role")
router.register(r"sites", SiteViewSet, basename="site")
router.register(r"zones", ZoneViewSet, basename="zone")
router.register(r"service-types", ServiceTypeViewSet, basename="servicetype")
router.register(r"bookings", BookingViewSet, basename="booking")
router.register(r"invoices", InvoiceViewSet, basename="invoice")
router.register(r"quotes", QuoteViewSet, basename="quote")
router.register(r"schedules", ScheduleViewSet, basename="schedule")

urlpatterns = [
    path("/", include(router.urls)),
] 