"""
Background tasks module - processes jobs directly in backend
Free tier compatible - no separate worker service needed
"""
from app.tasks.discovery import process_discovery_job, discover_websites_async

__all__ = ["process_discovery_job", "discover_websites_async"]

