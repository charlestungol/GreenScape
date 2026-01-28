from django.http import Http404, HttpResponse
from django.utils.encoding import smart_str
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from .models import *
from .serializers import *

# Security
from .permissions import *


# -----------------------------------------------------------------------------
# Simple CRUD ViewSets
# -----------------------------------------------------------------------------
class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    permission_classes = [IsOwnerOrAdmin]


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.select_related("addressid").all()
    serializer_class = CustomerSerializer
    permission_classes = [IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if not (user and user.is_authenticated):
            return Customer.objects.none()
        # If its a staff return all customer
        if user.is_staff:
            return Customer.objects.select_related("addressid").all()
        # If its a customer, return customers data.
        if hasattr(Customer, "user_id"):
            return Customer.objects.select_related("addressid").filter(user_id = user.id)
        # If customer return his data using email
        return Customer.objects.select_related("addressid").filter(email=user.email)


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related("addressid").all()
    serializer_class = EmployeeSerializer
    permission_classes = [isAdmin]


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

    def get_permissions(self):
        # Allows authenticated user to view services
        if self.request.method in permissions.SAFE_METHODS:
            return [IsAuthenticatedOrReadOnly()]
        # Allow admin to add new services
        return [isAdmin()]


class CustomerServiceViewSet(viewsets.ModelViewSet):
    queryset = Customerservice.objects.select_related("customerid", "serviceid").all()
    serializer_class = CustomerServiceSerializer
    permission_classes = [IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if not (user and user.is_authenticated):
            return Customerservice.objects.none()
        if user.is_staff:
            return self.queryset
        
        # Filters customers data
        if hasattr(Customer, "user_id"):
            return self.queryset.filter(customerid_user_id=user.id)
        # Uses users email instead to get customer data.
        return self.queryset.filter(customer_email=user.email)


 
# -----------------------------------------------------------------------------
#Service Image ViewSet
# - list/retrieve give metadata (no raw bytes)
# - POST /upload to attach a file to a service
# - GET  /{id}/bytes to stream the image inline (no download dialog)
# -----------------------------------------------------------------------------
class ServiceImageViewSet(viewsets.ModelViewSet):
    queryset = Serviceimage.objects.select_related("serviceid").all()
    serializer_class = ServiceImageSerializer
    parser_classes = [MultiPartParser, FormParser]  # for upload

    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [IsAuthenticatedOrReadOnly()]
        return [isAdmin()]
    
    def get_queryset(self):
        qs = super().get_queryset()
        service_id = self.request.query_params.get("serviceid")
        if service_id:
            qs = qs.filter(serviceid_id=service_id)
        return qs

    @action(detail=False, methods=["post"], url_path="upload")
    def upload(self, request):

        # Multipart upload:
        #   - image: the file
        #   - serviceid: FK to Service
        #   - optional: filename, contenttype (will infer if not provided)

        # Reduce upload of image to only 5mb
        MAX_BYTES = 5 * 1024 * 1024 
        # Only allows this type of uploads
        ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}

        # The image object
        file_obj = request.FILES.get("image")
        service_id = request.data.get("serviceid")
        filename = request.data.get("filename")
        contenttype = request.data.get("contenttype")

        # Check if there is an image
        if not file_obj:
            return Response({"detail": "Missing file field 'image'."},
                            status=status.HTTP_400_BAD_REQUEST)
        # Check if there is a service
        if not service_id:
            return Response({"detail": "Missing 'serviceid'."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Infer filename/content type if not provided
        if not filename:
            filename = getattr(file_obj, "name", "image")
        if not contenttype:
            contenttype = getattr(file_obj, "content_type", "application/octet-stream")

        # Read bytes (BinaryField accepts bytes)
        raw_bytes = file_obj.read()
        if len(raw_bytes) > MAX_BYTES:
            return Response({"details" : "File too large (max 5 MB)"}, status=413)

        # Check if the uploaded file is an image or not
        ctype = getattr(file_obj, "content_type", None) or "application/octet-stream"
        if ctype not in ALLOWED_TYPES:
            return Response({"detail" : f"Unsupported content type: {ctype}" }, status = 415)

        # Create row
        img = Serviceimage.objects.create(
            serviceid_id=int(service_id),
            contenttype=contenttype,
            filename=filename,
            imagedata=raw_bytes,
            # createdat -> DB default or trigger; if not, you can set timezone.now()
        )

        data = ServiceImageSerializer(img, context={"request": request}).data
        return Response(data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="bytes")
    def bytes(self, request, pk=None):
        
        # Streams raw image bytes with Content-Disposition: inline
        # so browsers/apps render it rather than prompting a download.
        
        try:
            img = self.get_queryset().get(pk=pk)
        except Serviceimage.DoesNotExist:
            raise Http404("Image not found")

        content_type = img.contenttype or "application/octet-stream"
        disp_name = img.filename or "image"

        resp = HttpResponse(img.imagedata, content_type=content_type)
        resp["Content-Disposition"] = f'inline; filename="{smart_str(disp_name)}"'
        # Adjust caching policy as needed
        resp["Cache-Control"] = "private, max-age=0, no-store"
        return resp

    @action(detail=False, methods=["get"], url_path=r"service/(?P<service_id>\d+)/latest/bytes")
    def latest_bytes(self, request, service_id: int):
        
        # Streams the most recent image for a service (inline).
        
        img = (
            self.get_queryset()
            .filter(serviceid_id=service_id)
            .order_by("-serviceimageid")
            .first()
        )
        if not img:
            raise Http404("No image for this service")

        content_type = img.contenttype or "application/octet-stream"
        disp_name = img.filename or "image"

        resp = HttpResponse(img.imagedata, content_type=content_type)
        resp["Content-Disposition"] = f'inline; filename="{smart_str(disp_name)}"'
        resp["Cache-Control"] = "private, max-age=0, no-store"
        return resp
