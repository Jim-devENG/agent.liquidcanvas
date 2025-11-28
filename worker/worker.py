"""
RQ Worker entry point
"""
import os
import redis
from rq import Worker, Queue, Connection
from dotenv import load_dotenv
import logging

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Redis connection
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_conn = redis.from_url(redis_url)

# Queue names
discovery_queue = Queue("discovery", connection=redis_conn)
enrichment_queue = Queue("enrichment", connection=redis_conn)
scoring_queue = Queue("scoring", connection=redis_conn)
send_queue = Queue("send", connection=redis_conn)
followup_queue = Queue("followup", connection=redis_conn)

if __name__ == "__main__":
    logger.info("Starting RQ worker...")
    logger.info(f"Redis URL: {redis_url}")
    logger.info("Listening to queues: discovery, enrichment, scoring, send, followup")
    
    with Connection(redis_conn):
        worker = Worker([discovery_queue, enrichment_queue, scoring_queue, send_queue, followup_queue])
        worker.work()

