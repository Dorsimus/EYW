"""
Authentication utilities extracted from server.py to avoid circular imports
"""

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import List, Dict, Any
import jwt
import requests
from functools import lru_cache
import logging
import os

# HTTP Bearer for token extraction
security = HTTPBearer()

# Get environment variables
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
CLERK_ISSUER = os.getenv("CLERK_ISSUER")

if not CLERK_JWKS_URL or not CLERK_ISSUER:
    logging.warning("CLERK_JWKS_URL and CLERK_ISSUER not configured - authentication will fail")

@lru_cache(maxsize=1)
def get_clerk_jwks():
    """Fetch and cache Clerk's JSON Web Key Set"""
    try:
        response = requests.get(CLERK_JWKS_URL, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logging.error(f"Failed to fetch JWKS: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to fetch authentication keys"
        )

def get_public_key(kid: str):
    """Get the public key for a specific Key ID from JWKS"""
    jwks = get_clerk_jwks()
    
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return jwt.algorithms.RSAAlgorithm.from_jwk(key)
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token key ID"
    )

def validate_clerk_token(token: str) -> Dict[str, Any]:
    """Validate and decode a Clerk JWT token"""
    try:
        # Decode the token header to get the Key ID
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        
        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing Key ID"
            )
        
        # Get the public key and validate the token
        public_key = get_public_key(kid)
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER,
            options={"verify_aud": False}
        )
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

# Authentication dependency
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """Authentication dependency that validates Clerk tokens"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    token = credentials.credentials
    user_data = validate_clerk_token(token)
    return user_data

# Role-based access control
def require_roles(required_roles: List[str]):
    """Decorator factory for role-based access control"""
    def dependency(current_user: Dict[str, Any] = Depends(get_current_user)):
        # Extract user roles from metadata
        user_metadata = current_user.get("metadata", {})
        user_roles = user_metadata.get("roles", [])
        
        # TEMPORARY FIX: If metadata is missing but we know this is an admin user
        # Check if this is Matt Williams (the admin user) by user ID
        user_id = current_user.get("sub", "")
        if user_id == "user_30vth9baPWjZZCkjLSUgOrW2Mvy":
            logging.info(f"Granting admin access to known admin user: {user_id}")
            user_roles = ["admin"]  # Temporarily grant admin role
        
        # Also check for public_metadata as fallback
        if not user_roles:
            public_metadata = current_user.get("public_metadata", {})
            if public_metadata:
                user_roles = public_metadata.get("roles", [])
        
        logging.info(f"User {user_id} roles check: metadata_roles={user_metadata.get('roles', [])}, checking_for={required_roles}, granted_roles={user_roles}")
        
        # Check if user has any of the required roles
        if not any(role in user_roles for role in required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. User roles: {user_roles}, Required: {required_roles}"
            )
        
        return current_user
    
    return dependency

# Convenience dependencies for common roles
require_admin = require_roles(["admin"])
require_admin_or_moderator = require_roles(["admin", "moderator"])