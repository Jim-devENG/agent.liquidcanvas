"""
Quick script to mark all scraped prospects as verified
"""
import asyncio
import sys
import os
from sqlalchemy import func

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import AsyncSessionLocal
from app.models.prospect import Prospect, VerificationStatus
from sqlalchemy import select, update, and_

async def mark_all_as_verified():
    """Mark all scraped prospects with emails as verified"""
    async with AsyncSessionLocal() as db:
        try:
            # Update all scraped prospects with emails to be verified
            stmt = (
                update(Prospect)
                .where(
                    and_(
                        Prospect.scrape_status.in_(['SCRAPED', 'ENRICHED']),
                        Prospect.contact_email.isnot(None),
                        Prospect.verification_status != VerificationStatus.VERIFIED.value
                    )
                )
                .values(verification_status=VerificationStatus.VERIFIED.value)
            )
            
            result = await db.execute(stmt)
            await db.commit()
            
            print(f"✅ Marked {result.rowcount} prospects as verified")
            
            # Verify the update
            count_stmt = select(func.count(Prospect.id)).where(
                and_(
                    Prospect.scrape_status.in_(['SCRAPED', 'ENRICHED']),
                    Prospect.contact_email.isnot(None),
                    Prospect.verification_status == VerificationStatus.VERIFIED.value
                )
            )
            
            verified_count = await db.execute(count_stmt)
            print(f"✅ Total verified prospects: {verified_count.scalar()}")
            
        except Exception as e:
            print(f"❌ Error: {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(mark_all_as_verified())
