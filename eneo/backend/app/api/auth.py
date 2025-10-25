"""
Authentication endpoints - OAuth2 integration with Nextcloud
"""

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import httpx
import logging

from app.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class TokenResponse(BaseModel):
    """OAuth2 token response"""
    access_token: str
    token_type: str
    expires_in: int
    refresh_token: str | None = None


class UserInfo(BaseModel):
    """User information from Nextcloud"""
    id: str
    email: str | None = None
    display_name: str | None = None


@router.get("/login")
async def login():
    """
    Initiate OAuth2 login flow with Nextcloud
    Redirects user to Nextcloud authorization page
    """
    if not settings.OAUTH2_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="OAuth2 not configured. Please set OAUTH2_CLIENT_ID in environment variables."
        )
    
    # Build authorization URL
    auth_url = (
        f"{settings.OAUTH2_AUTHORIZE_URL}"
        f"?client_id={settings.OAUTH2_CLIENT_ID}"
        f"&redirect_uri={settings.OAUTH2_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope=openid profile email"
    )
    
    logger.info(f"Redirecting to Nextcloud OAuth2: {auth_url}")
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def oauth_callback(
    code: str = Query(..., description="Authorization code from Nextcloud"),
    error: str | None = Query(None, description="Error from OAuth2 provider")
):
    """
    OAuth2 callback endpoint
    Exchanges authorization code for access token
    """
    if error:
        logger.error(f"OAuth2 error: {error}")
        raise HTTPException(status_code=400, detail=f"OAuth2 error: {error}")
    
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")
    
    # Exchange code for token
    try:
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                settings.OAUTH2_TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": settings.OAUTH2_REDIRECT_URI,
                    "client_id": settings.OAUTH2_CLIENT_ID,
                    "client_secret": settings.OAUTH2_CLIENT_SECRET,
                }
            )
            
            if token_response.status_code != 200:
                logger.error(f"Token exchange failed: {token_response.text}")
                raise HTTPException(
                    status_code=token_response.status_code,
                    detail="Failed to exchange authorization code for token"
                )
            
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            # Get user info from Nextcloud
            user_response = await client.get(
                settings.OAUTH2_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
                params={"format": "json"}
            )
            
            if user_response.status_code != 200:
                logger.error(f"Failed to get user info: {user_response.text}")
                raise HTTPException(
                    status_code=user_response.status_code,
                    detail="Failed to get user information"
                )
            
            user_data = user_response.json()
            
            # TODO: Create or update user in database
            # TODO: Create session
            # TODO: Set session cookie
            
            logger.info(f"User logged in: {user_data}")
            
            # Redirect to frontend
            return RedirectResponse(url="/eneo/")
            
    except httpx.RequestError as e:
        logger.error(f"HTTP request failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to communicate with OAuth2 provider")


@router.post("/logout")
async def logout(request: Request):
    """
    Logout endpoint
    Invalidates session and clears cookies
    """
    # TODO: Invalidate session in database
    # TODO: Clear session cookie
    
    logger.info("User logged out")
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_current_user(request: Request):
    """
    Get current authenticated user information
    """
    # TODO: Get user from session
    # TODO: Return user info
    
    # Placeholder response
    return {
        "id": "user123",
        "email": "user@example.com",
        "display_name": "Test User",
        "authenticated": True
    }


@router.post("/refresh")
async def refresh_token(refresh_token: str):
    """
    Refresh access token using refresh token
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                settings.OAUTH2_TOKEN_URL,
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": settings.OAUTH2_CLIENT_ID,
                    "client_secret": settings.OAUTH2_CLIENT_SECRET,
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail="Failed to refresh token"
                )
            
            return response.json()
            
    except httpx.RequestError as e:
        logger.error(f"Token refresh failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to refresh token")

