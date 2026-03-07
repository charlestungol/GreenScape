from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

# This view handles user logout by blacklisting the refresh token and clearing the authentication cookies. 
# It checks for the presence of the refresh token in the cookies, attempts to blacklist it, and then deletes both the access and refresh tokens from the client's 
# cookies to ensure the user is logged out on the client side as well. 
# The view requires the user to be authenticated to access it.
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    # The post method handles the logout process. It first defines the cookie names for access and refresh tokens based on the REST_AUTH settings.
    def post(self, request):
        # Cookie names from your REST_AUTH settings
        ACCESS_COOKIE_NAME = "access"
        REFRESH_COOKIE_NAME = "refresh"

        # Default response
        response = Response({"detail": "Successfully logged out"}, status=status.HTTP_200_OK)

        # Try to read refresh token from cookie
        refresh_token = request.COOKIES.get(REFRESH_COOKIE_NAME)

        if refresh_token:
            try:
                # Blacklist the refresh token to invalidate it server-side
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                # Even if blacklisting fails, still clear cookies so client is logged out
                response = Response({"detail": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

        # Always delete cookies client-side
        # Match the same cookie attributes you used when setting them
        response.delete_cookie(
            ACCESS_COOKIE_NAME,
            path="/",
            samesite="Lax",
            secure=False,      # True in production
            httponly=True
        )
        response.delete_cookie(
            REFRESH_COOKIE_NAME,
            path="/",
            samesite="Lax",
            secure=False,      # True in production
            httponly=True
        )

        return response

# This view allows users to log out from all sessions by blacklisting all refresh tokens associated with the user.
class LogoutAllView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        tokens = RefreshToken.for_user(request.user)
        tokens.blacklist()

        return Response({"detail": "Logged out from all sessions"}, status=200)