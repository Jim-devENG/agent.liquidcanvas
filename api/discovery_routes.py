"""
API routes for website discovery and manual job triggers
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict
from db.database import get_db
from jobs.automation_jobs import fetch_new_art_websites
from jobs.website_discovery import WebsiteDiscovery
from utils.auth import get_current_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/discovery/search-now")
async def trigger_website_discovery(
    background_tasks: BackgroundTasks,
    location: str = None,
    categories: str = None,
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Manually trigger website discovery and scraping
    
    Query params:
    - location: Optional location filter (usa, canada, uk_london, germany, france, europe)
    - categories: Optional comma-separated category list (home_decor, holiday, parenting, etc.)
    
    This will:
    1. Search DuckDuckGo for websites in specified location/categories
    2. Load URLs from seed_websites.txt
    3. Scrape discovered websites
    4. Extract contacts
    
    Returns immediately, runs in background
    """
    try:
        # Save location and categories to settings for the job
        from utils.app_settings import AppSettingsManager
        settings_manager = AppSettingsManager(db)
        if location:
            settings_manager.set("search_location", location)
        if categories:
            settings_manager.set("search_categories", categories)
        
        # Run in background
        background_tasks.add_task(fetch_new_art_websites)
        
        return {
            "message": "Website discovery started in background",
            "status": "running",
            "location": location or "all",
            "categories": categories or "all",
            "note": "Check the Activity Feed for progress updates"
        }
    except Exception as e:
        logger.error(f"Error triggering discovery: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start discovery: {str(e)}"
        )


@router.get("/discovery/test-search")
async def test_search(
    query: str = "home decor blog",
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Test search functionality without scraping
    
    Query params:
    - query: Search query to test
    """
    try:
        discovery = WebsiteDiscovery()
        
        # Test DuckDuckGo search
        results = discovery.search_duckduckgo(query, num_results=5)
        
        # Test seed file
        seed_urls = discovery.fetch_from_seed_list()
        
        return {
            "query": query,
            "duckduckgo_results": results,
            "seed_file_urls": seed_urls,
            "total_found": len(results) + len(seed_urls)
        }
    except Exception as e:
        logger.error(f"Error testing search: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Search test failed: {str(e)}"
        )


@router.get("/discovery/locations")
async def get_locations(
    current_user: str = Depends(get_current_user)
):
    """Get all available search locations"""
    from utils.location_search import get_all_locations
    return {"locations": get_all_locations()}


@router.get("/discovery/categories")
async def get_categories(
    current_user: str = Depends(get_current_user)
):
    """Get all available search categories"""
    from utils.location_search import get_all_categories
    return {"categories": get_all_categories()}


@router.get("/discovery/status")
async def get_discovery_status(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    """
    Get status of website discovery
    """
    from db.models import ScrapingJob
    
    # Get latest discovery job
    latest_job = db.query(ScrapingJob).filter(
        ScrapingJob.job_type == "fetch_new_art_websites"
    ).order_by(ScrapingJob.created_at.desc()).first()
    
    if not latest_job:
        return {
            "status": "never_run",
            "message": "Discovery has never been run",
            "last_run": None
        }
    
    return {
        "status": latest_job.status,
        "last_run": latest_job.created_at.isoformat() if latest_job.created_at else None,
        "result": latest_job.result,
        "error": latest_job.error_message,
        "started_at": latest_job.started_at.isoformat() if latest_job.started_at else None,
        "completed_at": latest_job.completed_at.isoformat() if latest_job.completed_at else None
    }

