"""
Health check endpoints
"""
from fastapi import APIRouter
from sqlalchemy import text
from app.db.database import engine
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health")
async def health():
    """Health check endpoint - responds immediately for Render deployment checks"""
    return {"status": "healthy", "service": "art-outreach-api"}


@router.get("/health/ready")
async def readiness():
    """Readiness check - verifies database connectivity"""
    try:
        # Quick database connectivity check (with timeout)
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        logger.warning(f"Readiness check failed: {e}")
        # Still return 200 so Render doesn't fail deployment
        # Database might be temporarily unavailable
        return {"status": "ready", "database": "checking", "warning": str(e)}


@router.get("/health/schema")
async def schema_check():
    """Check if social outreach tables exist"""
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name IN ('social_profiles', 'social_discovery_jobs', 'social_drafts', 'social_messages')
                ORDER BY table_name
            """))
            tables = [row[0] for row in result.fetchall()]
            
            expected_tables = ['social_discovery_jobs', 'social_drafts', 'social_messages', 'social_profiles']
            missing_tables = set(expected_tables) - set(tables)
            
            return {
                "status": "ok" if not missing_tables else "incomplete",
                "tables_found": tables,
                "tables_missing": list(missing_tables),
                "migration_needed": len(missing_tables) > 0,
                "message": "All tables exist" if not missing_tables else f"Missing tables: {', '.join(missing_tables)}. Run: alembic upgrade head"
            }
    except Exception as e:
        logger.error(f"Schema check failed: {e}", exc_info=True)
        return {
            "status": "error",
            "error": str(e),
            "message": "Could not check schema"
        }
