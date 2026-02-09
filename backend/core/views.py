from django.http import Http404, HttpResponse
from django.utils.encoding import smart_str
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import *
from .serializers import *

# Security -- Methods for permissions of roles.
from .permissions import * 


# -----------------------------------------------------------------------------
# Simple CRUD ViewSets
# -----------------------------------------------------------------------------

# Address View - Allows for CRUD
class AddressViewSet(viewsets.ModelViewSet):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    permission_classes = [IsOwnerOrAdmin]

# Customer View - Allows for CRUD
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.select_related("addressid").all()
    serializer_class = CustomerSerializer

    # Sets it that only owner of the data, admin, or employee can edit. 
    permission_classes = [IsOwnerOrAdmin]

    # Getting data
    def get_queryset(self):
        user = self.request.user
        # If the user is not authenticated it will not allow access.
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
    
    @action(detail = False, methods = ['get', 'patch', 'delete'])
    def me(self, request):
        instance = get_object_or_404(Customer, user=request.user)

        # Getting customer data.
        if request.method.lower() == 'get':
            data = self.get_serializer(instance).data
            return Response(data)
        
        # Patch customer data
        serializers = self.get_serializer(instance, data=request.data, partial=True)

        serializers.is_valid(raise_exception = True)

        serializers.save(user=request.user)

        return Response(serializers.data, status=status.HTTP_200_OK)

# Employee View -- Allows for CRUD -- Needs update
class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related("addressid").all()
    serializer_class = EmployeeSerializer
    permission_classes = [isAdmin]

# Service view -- allows for CRUD
class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

    # Permission
    def get_permissions(self):
        # Allows authenticated user to view services
        if self.request.method in permissions.SAFE_METHODS:
            return [IsAuthenticatedOrReadOnly()]
        # Allow admin to add new services
        return [isAdmin()]

# Customer's service view -- Allows for CRUD
class CustomerServiceViewSet(viewsets.ModelViewSet):
    queryset = Customerservice.objects.select_related("customerid", "serviceid").all()
    serializer_class = CustomerServiceSerializer
    permission_classes = [IsOwnerOrAdmin]

    # Getting data
    def get_queryset(self):
        # Get the person trying to view or edit data.
        user = self.request.user
        # If the user is not authenticated, data get, is denied.
        if not (user and user.is_authenticated):
            # No data given
            return Customerservice.objects.none()
        # If user is staff return all data
        if user.is_staff:
            return self.queryset
        
        # If user is a customer return the users data .
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

    # Check users permission
    def get_permissions(self):
        # Allows view for authenticated user only
        if self.request.method in permissions.SAFE_METHODS:
            return [IsAuthenticatedOrReadOnly()]
        # Allows admin to view or edit data.
        return [isAdmin()]
    
    # Get data
    def get_queryset(self):
        # Use super meaning admin to get a query set as qs
        qs = super().get_queryset()
        # Get service Id from the service image db
        service_id = self.request.query_params.get("serviceid")
        # Filter from the service the service for that image
        if service_id:
            qs = qs.filter(serviceid_id=service_id)
        # Return the query.
        return qs

    # To upload an image to a service.
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
        file_obj = request.FILES.get("image") #The actual image data
        service_id = request.data.get("serviceid") #The service which the image is for
        filename = request.data.get("filename") #The setted name for the image
        contenttype = request.data.get("contenttype") #The type of contant -- jpeg, png

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
        raw_bytes = file_obj.read() #Set the image data to an attribute
        # Check the size of the file
        if len(raw_bytes) > MAX_BYTES:
            return Response({"details" : "File too large (max 5 MB)"}, status=413)

        # Check if the uploaded file is an image or not
        ctype = getattr(file_obj, "content_type", None) or "application/octet-stream"
        # Check if the image is allowed
        if ctype not in ALLOWED_TYPES:
            return Response({"detail" : f"Unsupported content type: {ctype}" }, status = 415)

        # Create the image itself.
        img = Serviceimage.objects.create(
            serviceid_id=int(service_id),
            contenttype=contenttype,
            filename=filename,
            imagedata=raw_bytes,
            # createdat -> Added automatically from DB
        )

        # Serialize the image
        data = ServiceImageSerializer(img, context={"request": request}).data
        # Return the data.
        return Response(data, status=status.HTTP_201_CREATED)

    # Get the image from db as bytes so machine can read it. --Gets all image
    @action(detail=True, methods=["get"], url_path="bytes")
    def bytes(self, request, pk=None):
        
        # Streams raw image bytes with Content-Disposition: inline
        # so browsers/apps render it rather than prompting a download.

        # Try getting query
        try:
            img = self.get_queryset().get(pk=pk)
        except Serviceimage.DoesNotExist:
            raise Http404("Image not found")

        # Check image type
        content_type = img.contenttype or "application/octet-stream"
        # Get image name
        disp_name = img.filename or "image"

        # Get image link
        resp = HttpResponse(img.imagedata, content_type=content_type)
        # 
        resp["Content-Disposition"] = f'inline; filename="{smart_str(disp_name)}"'
        # Adjust caching policy as needed
        resp["Cache-Control"] = "private, max-age=0, no-store"
        return resp

    #Get the latest image for that service. --  Get the most recent image for a service.
    @action(detail=False, methods=["get"], url_path=r"service/(?P<service_id>\d+)/latest/bytes")
    def latest_bytes(self, request, service_id: int):
        
        # Streams the most recent image for a service (inline).
        img = (
            self.get_queryset() #Get all image
            .filter(serviceid_id=service_id) #Get service image with service selected
            .order_by("-serviceimageid")  #Filter image by the most recent image by that service.
            .first() 
        )
        #If there is no image raise error.
        if not img:
            raise Http404("No image for this service")

        # Check type of the image -- jpeg, png.
        content_type = img.contenttype or "application/octet-stream"
        #Get image name
        disp_name = img.filename or "image"
        #Create response with image.
        resp = HttpResponse(img.imagedata, content_type=content_type)
        resp["Content-Disposition"] = f'inline; filename="{smart_str(disp_name)}"'
        resp["Cache-Control"] = "private, max-age=0, no-store"
        #Return the image as HTTPs
        return resp
