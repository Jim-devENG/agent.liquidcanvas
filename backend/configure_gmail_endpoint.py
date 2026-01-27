@router.post("/configure-gmail")
async def configure_gmail(
    request: dict,
    current_user: Optional[str] = Depends(get_current_user_optional)
):
    """
    Configure Gmail API credentials
    This endpoint sets the Gmail OAuth credentials for sending emails
    """
    try:
        import os
        from dotenv import load_dotenv
        
        # Get credentials from request
        client_id = request.get('client_id')
        client_secret = request.get('client_secret')
        access_token = request.get('access_token')
        refresh_token = request.get('refresh_token')
        
        if not client_id or not client_secret:
            raise HTTPException(
                status_code=400,
                detail="client_id and client_secret are required"
            )
        
        if not access_token and not refresh_token:
            raise HTTPException(
                status_code=400,
                detail="Either access_token or refresh_token is required"
            )
        
        # Set environment variables (in production, these should be set via Render dashboard)
        os.environ["GMAIL_CLIENT_ID"] = client_id
        os.environ["GMAIL_CLIENT_SECRET"] = client_secret
        if access_token:
            os.environ["GMAIL_ACCESS_TOKEN"] = access_token
        if refresh_token:
            os.environ["GMAIL_REFRESH_TOKEN"] = refresh_token
        
        return {
            "success": True,
            "message": "Gmail credentials configured successfully",
            "configured": {
                "client_id": bool(client_id),
                "client_secret": bool(client_secret),
                "access_token": bool(access_token),
                "refresh_token": bool(refresh_token)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to configure Gmail: {str(e)}"
        )
