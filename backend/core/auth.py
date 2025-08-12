"""
Core authentication module for flightbook API using existing Clerk authentication
"""
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Optional, Dict, Any
import jwt
import requests
from functools import lru_cache
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# Clerk Configuration
CLERK_JWKS_URL = os.getenv("CLERK_JWKS_URL")
CLERK_ISSUER = os.getenv("CLERK_ISSUER")

if not CLERK_JWKS_URL or not CLERK_ISSUER:
    raise ValueError("CLERK_JWKS_URL and CLERK_ISSUER environment variables are required")

# HTTP Bearer security scheme
security = HTTPBearer()

@lru_cache(maxsize=1)
def get_clerk_jwks():
    """Fetch and cache Clerk's JSON Web Key Set"""
    try:
        response = requests.get(CLERK_JWKS_URL, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching JWKS: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unavailable"
        )

def validate_clerk_token(token: str) -> Dict[str, Any]:
    """Validate JWT token against Clerk's public keys"""
    try:
        # Get unverified header to extract kid
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        
        if not kid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token format"
            )
        
        # Get JWKS and find matching key
        jwks = get_clerk_jwks()
        key = None
        
        for jwk in jwks.get("keys", []):
            if jwk.get("kid") == kid:
                key = jwt.algorithms.RSAAlgorithm.from_jwk(jwk)
                break
        
        if not key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token key"
            )
        
        # Verify and decode token
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER,
            options={"verify_aud": False}
        )
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}"
        )

def get_session_claims(token: str) -> Dict[str, Any]:
    """Extract session claims from Clerk token"""
    try:
        payload = validate_clerk_token(token)
        return payload
    except HTTPException:
        raise

def get_current_user_clerk(token: str) -> Dict[str, Any]:
    """Get current user from Clerk token"""
    claims = get_session_claims(token)
    return {
        'user_id': claims.get('sub'),
        'session_id': claims.get('sid'),
        'email': claims.get('email', ''),
        'first_name': claims.get('given_name', ''),
        'last_name': claims.get('family_name', ''),
        'full_name': f"{claims.get('given_name', '')} {claims.get('family_name', '')}".strip(),
        'claims': claims
    }

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[Dict[str, Any]]:
    """Get current user from JWT token (optional)"""
    if not credentials:
        return None
    
    try:
        return get_current_user_clerk(credentials.credentials)
    except HTTPException:
        return None

async def require_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """Require authentication for protected endpoints"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    try:
        return get_current_user_clerk(credentials.credentials)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )