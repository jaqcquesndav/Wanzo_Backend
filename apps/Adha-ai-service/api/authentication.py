import requests
import jwt
from jwt import PyJWKClient
from django.conf import settings
from rest_framework import authentication, exceptions

class JWTAuth0Authentication(authentication.BaseAuthentication):
    """
    Authenticates against a JWT issued by Auth0 (ou autre provider compatible JWKS).
    Le token doit être passé dans le header Authorization: Bearer <token>
    """
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
        token = auth_header.split(' ')[1]
        try:
            jwks_url = getattr(settings, 'AUTH0_JWKS_URL', None)
            audience = getattr(settings, 'AUTH0_AUDIENCE', None)
            issuer = getattr(settings, 'AUTH0_ISSUER', None)
            if not jwks_url or not audience or not issuer:
                raise exceptions.AuthenticationFailed('Auth0 config missing')
            jwk_client = PyJWKClient(jwks_url)
            signing_key = jwk_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                audience=audience,
                issuer=issuer,
            )
            return (payload, token)
        except Exception as e:
            raise exceptions.AuthenticationFailed(f'Invalid JWT: {str(e)}')
