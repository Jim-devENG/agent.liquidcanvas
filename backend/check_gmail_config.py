@router.get("/check-gmail-config")
async def check_gmail_config():
    """
    Check Gmail API configuration status
    """
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    config = {
        "gmail_access_token": bool(os.getenv("GMAIL_ACCESS_TOKEN")),
        "gmail_refresh_token": bool(os.getenv("GMAIL_REFRESH_TOKEN")),
        "gmail_client_id": bool(os.getenv("GMAIL_CLIENT_ID")),
        "gmail_client_secret": bool(os.getenv("GMAIL_CLIENT_SECRET")),
    }
    
    is_configured = bool(
        os.getenv("GMAIL_ACCESS_TOKEN") or 
        (os.getenv("GMAIL_REFRESH_TOKEN") and os.getenv("GMAIL_CLIENT_ID") and os.getenv("GMAIL_CLIENT_SECRET"))
    )
    
    return {
        "configured": is_configured,
        "config": config,
        "message": "Gmail API is configured for sending emails" if is_configured else "Gmail API is not configured - emails cannot be sent"
    }
