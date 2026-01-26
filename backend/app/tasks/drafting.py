"""
Drafting task - STEP 6 of strict pipeline
Generates email drafts using Gemini
"""
import asyncio
import logging
from typing import List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.db.database import AsyncSessionLocal
from app.models.prospect import Prospect
from app.models.job import Job
from app.clients.gemini import GeminiClient

logger = logging.getLogger(__name__)


async def draft_prospects_async(job_id: str):
    """
    Generate email drafts for verified prospects using Gemini
    
    BACKGROUND JOB MODE:
    - Queries prospects in background (eligibility check happens here)
    - Updates progress incrementally (drafts_created, total_targets)
    - Sets draft_status = "drafted" for each prospect
    """
    from sqlalchemy import and_, or_
    from app.models.prospect import VerificationStatus
    
    async with AsyncSessionLocal() as db:
        try:
            # Get job
            result = await db.execute(select(Job).where(Job.id == UUID(job_id)))
            job = result.scalar_one_or_none()
            
            if not job:
                logger.error(f"❌ [DRAFTING] Job {job_id} not found")
                return {"error": "Job not found"}
            
            # Transition to running
            job.status = "running"
            await db.commit()
            await db.refresh(job)
            
            # Query prospects in background (eligibility check happens here)
            prospect_ids = job.params.get("prospect_ids")
            auto_mode = job.params.get("auto_mode", False)
            
            if auto_mode or not prospect_ids:
                # Automatic mode: query all draft-ready WEBSITE prospects
                # WORKAROUND: Check if source_type column exists before filtering
                try:
                    # Try to query with source_type filter
                    website_filter = or_(
                        Prospect.source_type == 'website',
                        Prospect.source_type.is_(None)  # Legacy prospects
                    )
                    
                    result = await db.execute(
                        select(Prospect).where(
                            and_(
                                Prospect.verification_status == VerificationStatus.VERIFIED.value,
                                Prospect.contact_email.isnot(None),
                                website_filter
                            )
                        )
                    )
                    prospects = result.scalars().all()
                except Exception as e:
                    # If source_type column doesn't exist, query without it
                    if 'source_type' in str(e) or 'UndefinedColumn' in str(e):
                        logger.warning("⚠️  [DRAFTING] source_type column missing, querying all verified prospects")
                        result = await db.execute(
                            select(Prospect).where(
                                and_(
                                    Prospect.verification_status == VerificationStatus.VERIFIED.value,
                                    Prospect.contact_email.isnot(None)
                                )
                            )
                        )
                        prospects = result.scalars().all()
                    else:
                        raise
                
                if len(prospects) == 0:
                    logger.warning("⚠️  [DRAFTING] No prospects ready for drafting")
                    job.status = "failed"
                    job.error_message = "No prospects ready for drafting. Ensure prospects have verification_status='verified' and contact_email IS NOT NULL."
                    await db.commit()
                    return {"error": "No prospects ready for drafting"}
            else:
                # Manual mode: use provided prospect_ids
                result = await db.execute(
                    select(Prospect).where(
                        and_(
                            Prospect.id.in_([UUID(pid) for pid in prospect_ids]),
                            Prospect.verification_status == VerificationStatus.VERIFIED.value,
                            Prospect.contact_email.isnot(None)
                        )
                    )
                )
                )
                )
                prospects = result.scalars().all()
                
                if len(prospects) == 0:
                    logger.warning("⚠️  [DRAFTING] No valid prospects found for provided IDs")
                    job.status = "failed"
                    job.error_message = "No valid prospects found. Ensure they are verified and have emails."
                    await db.commit()
                    return {"error": "No valid prospects found"}
            
            # Set total_targets for progress tracking (if columns exist)
            # WORKAROUND: Use getattr/setattr to handle missing columns gracefully
            if hasattr(job, 'total_targets'):
                job.total_targets = len(prospects)
            if hasattr(job, 'drafts_created'):
                job.drafts_created = 0
            await db.commit()
            await db.refresh(job)
            
            logger.info(f"✍️  [DRAFTING] Starting drafting for {len(prospects)} prospects (job {job_id})")
            
            # Initialize Gemini client
            try:
                gemini_client = GeminiClient()
            except Exception as e:
                logger.error(f"❌ [DRAFTING] Failed to initialize Gemini client: {e}")
                job.status = "failed"
                job.error_message = f"Gemini not configured: {e}"
                await db.commit()
                return {"error": f"Gemini not configured: {e}"}
            
            drafted_count = 0
            failed_count = 0
            
            for idx, prospect in enumerate(prospects, 1):
                try:
                    logger.info(f"✍️  [DRAFTING] [{idx}/{len(prospects)}] Drafting email for {prospect.domain}...")
                    
                    # Determine email type
                    email_type = "generic"
                    if prospect.contact_email:
                        local_part = prospect.contact_email.split("@")[0].lower()
                        if local_part in ["info", "contact", "hello", "support"]:
                            email_type = "generic"
                        elif local_part in ["sales", "marketing", "business"]:
                            email_type = "role_based"
                        else:
                            email_type = "personal"
                    
                    # Compose email using Gemini
                    gemini_result = await gemini_client.compose_email(
                        domain=prospect.domain,
                        page_title=prospect.page_title,
                        page_url=prospect.page_url,
                        page_snippet=prospect.dataforseo_payload.get("description") if prospect.dataforseo_payload else None,
                        contact_name=None  # Could be extracted from email if personal
                    )
                    
                    if gemini_result.get("success"):
                        prospect.draft_subject = gemini_result.get("subject")
                        prospect.draft_body = gemini_result.get("body")
                        prospect.draft_status = "drafted"
                        drafted_count += 1
                        
                        # Update progress incrementally (if column exists)
                        if hasattr(job, 'drafts_created'):
                            job.drafts_created = drafted_count
                            await db.commit()
                            await db.refresh(job)
                        else:
                            # Columns don't exist - just commit the prospect update
                            await db.commit()
                        
                        logger.info(f"✅ [DRAFTING] [{drafted_count}/{len(prospects)}] Drafted email for {prospect.domain}: {prospect.draft_subject}")
                    else:
                        error = gemini_result.get("error", "Unknown error")
                        logger.error(f"❌ [DRAFTING] Gemini failed for {prospect.domain}: {error}")
                        prospect.draft_status = "failed"
                        failed_count += 1
                    
                    await db.commit()
                    await db.refresh(prospect)
                    
                    # Rate limiting
                    await asyncio.sleep(1)
                    
                except Exception as e:
                    logger.error(f"❌ [DRAFTING] Failed to draft {prospect.domain}: {e}", exc_info=True)
                    prospect.draft_status = "failed"
                    failed_count += 1
                    await db.commit()
                    continue
            
            # Update job status
            job.status = "completed"
            job.result = {
                "drafted": drafted_count,
                "failed": failed_count,
                "total": len(prospects)
            }
            await db.commit()
            
            logger.info(f"✅ [DRAFTING] Job {job_id} completed: {drafted_count} drafted, {failed_count} failed")
            
            return {
                "job_id": job_id,
                "status": "completed",
                "drafted": drafted_count,
                "failed": failed_count
            }
            
        except Exception as e:
            logger.error(f"❌ [DRAFTING] Job {job_id} failed: {e}", exc_info=True)
            try:
                result = await db.execute(select(Job).where(Job.id == UUID(job_id)))
                job = result.scalar_one_or_none()
                if job:
                    job.status = "failed"
                    job.error_message = str(e)
                    await db.commit()
            except Exception as commit_err:
                logger.error(f"❌ [DRAFTING] Failed to commit error status: {commit_err}", exc_info=True)
            return {"error": str(e)}

