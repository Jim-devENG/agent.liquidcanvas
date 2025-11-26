"""
Website discovery via search engines and seed lists
"""
import requests
from typing import List, Dict, Optional
from urllib.parse import quote_plus, urlparse
from utils.config import settings
import logging

logger = logging.getLogger(__name__)


class WebsiteDiscovery:
    """Discover new art websites via search engines and seed lists"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": settings.SCRAPER_USER_AGENT
        })
    
    def search_google(self, query: str, num_results: int = 10) -> List[str]:
        """
        Search Google for websites (using custom search API or scraping)
        
        Note: For production, use Google Custom Search API
        For now, returns empty list - implement with API key
        
        Args:
            query: Search query
            num_results: Number of results to return
            
        Returns:
            List of URLs
        """
        # TODO: Implement with Google Custom Search API
        # Requires: GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID
        # For now, return empty list
        logger.info(f"Google search for: {query} (not implemented - requires API key)")
        return []
    
    def search_bing(self, query: str, num_results: int = 10) -> List[str]:
        """
        Search Bing for websites (using Bing Search API or scraping)
        
        Note: For production, use Bing Search API
        For now, returns empty list - implement with API key
        
        Args:
            query: Search query
            num_results: Number of results to return
            
        Returns:
            List of URLs
        """
        # TODO: Implement with Bing Search API
        # Requires: BING_SEARCH_API_KEY
        # For now, return empty list
        logger.info(f"Bing search for: {query} (not implemented - requires API key)")
        return []
    
    def search_duckduckgo(self, query: str, num_results: int = 10) -> List[str]:
        """
        Search DuckDuckGo using duckduckgo-search library (no API key required)
        
        Args:
            query: Search query
            num_results: Number of results to return
            
        Returns:
            List of URLs
        """
        try:
            # Try using duckduckgo_search library if available
            try:
                from duckduckgo_search import DDGS
                logger.info(f"Attempting DuckDuckGo search for: {query}")
                with DDGS() as ddgs:
                    results = list(ddgs.text(query, max_results=num_results))
                    urls = [r.get('href', '') for r in results if r.get('href', '').startswith('http')]
                    logger.info(f"DuckDuckGo search found {len(urls)} results for: {query}")
                    if len(urls) == 0:
                        logger.warning(f"No URLs found for query: {query}. Results: {results[:2] if results else 'None'}")
                    return urls[:num_results]
            except ImportError as e:
                # Fallback to HTML scraping
                logger.warning(f"duckduckgo_search library not installed ({str(e)}), using HTML scraping fallback")
                url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
                logger.info(f"Fetching: {url}")
                response = self.session.get(url, timeout=15)
                
                if response.status_code == 200:
                    from bs4 import BeautifulSoup
                    soup = BeautifulSoup(response.content, "html.parser")
                    urls = []
                    
                    # Try multiple selectors for DuckDuckGo results
                    selectors = [
                        ("a", {"class": "result__url"}),
                        ("a", {"class": "result-link"}),
                        ("a", {"class": "web-result"}),
                    ]
                    
                    for selector, attrs in selectors:
                        for link in soup.find_all(selector, attrs):
                            href = link.get("href", "")
                            if href and href.startswith("http") and href not in urls:
                                urls.append(href)
                                if len(urls) >= num_results:
                                    break
                        if len(urls) >= num_results:
                            break
                    
                    logger.info(f"DuckDuckGo HTML search found {len(urls)} results for: {query}")
                    return urls
        except Exception as e:
            logger.error(f"Error searching DuckDuckGo for '{query}': {str(e)}", exc_info=True)
            import traceback
            logger.error(traceback.format_exc())
        
        logger.warning(f"Returning empty list for query: {query}")
        return []
    
    def fetch_from_seed_list(self, seed_file: str = "seed_websites.txt") -> List[str]:
        """
        Fetch websites from seed list file
        
        Args:
            seed_file: Path to seed file (one URL per line)
            
        Returns:
            List of URLs from seed file
        """
        urls = []
        try:
            import os
            seed_path = os.path.join(os.getcwd(), seed_file)
            
            if os.path.exists(seed_path):
                with open(seed_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        url = line.strip()
                        if url and url.startswith(("http://", "https://")):
                            urls.append(url)
                
                logger.info(f"Loaded {len(urls)} URLs from seed file: {seed_file}")
            else:
                logger.warning(f"Seed file not found: {seed_file}")
        except Exception as e:
            logger.error(f"Error reading seed file: {str(e)}")
        
        return urls
    
    def discover_art_websites(self, db_session: Optional[object] = None) -> List[Dict]:
        """
        Discover new art websites using multiple sources
        
        Args:
            db_session: Optional database session to save discovered websites
            
        Returns:
            List of dictionaries with discovered website info: {url, title, snippet, source, search_query, category}
        """
        all_discoveries = {}  # Use dict to track unique URLs with metadata
        
        # Expanded search queries for comprehensive internet search
        search_queries = [
            # Art Galleries
            ("art gallery website", "art_gallery"),
            ("contemporary art gallery", "art_gallery"),
            ("modern art gallery", "art_gallery"),
            ("online art gallery", "art_gallery"),
            ("art exhibition space", "art_gallery"),
            # Interior Design
            ("interior design blog", "interior_decor"),
            ("interior decorator website", "interior_decor"),
            ("home design blog", "interior_decor"),
            ("interior design portfolio", "interior_decor"),
            ("home decor blog", "interior_decor"),
            # Home Tech
            ("home tech blog", "home_tech"),
            ("smart home blog", "home_tech"),
            ("home automation blog", "home_tech"),
            ("tech for home", "home_tech"),
            ("home technology review", "home_tech"),
            # Mom Blogs
            ("mom blog", "mom_blogs"),
            ("parenting blog", "mom_blogs"),
            ("family lifestyle blog", "mom_blogs"),
            ("mommy blog", "mom_blogs"),
            ("family blog", "mom_blogs"),
            # NFT & Tech
            ("NFT art platform", "nft_tech"),
            ("NFT marketplace", "nft_tech"),
            ("digital art platform", "nft_tech"),
            ("crypto art gallery", "nft_tech"),
            ("blockchain art", "nft_tech"),
            # Editorial Media
            ("editorial media house", "editorial_media"),
            ("lifestyle magazine", "editorial_media"),
            ("design magazine", "editorial_media"),
            ("art publication", "editorial_media"),
            ("creative magazine", "editorial_media"),
            # Holiday/Family
            ("holiday family website", "holiday_family"),
            ("family travel blog", "holiday_family"),
            ("holiday planning blog", "holiday_family"),
            ("family activities blog", "holiday_family"),
            ("seasonal decor blog", "holiday_family")
        ]
        
        # Search DuckDuckGo (no API key required)
        import random
        shuffled_queries = search_queries.copy()
        random.shuffle(shuffled_queries)
        
        # Limit to 10 queries per run to avoid overwhelming
        queries_to_search = shuffled_queries[:10]
        
        for query, category in queries_to_search:
            try:
                # Get detailed results from DuckDuckGo
                results = self.search_duckduckgo_detailed(query, num_results=5)
                for result in results:
                    url = result.get('url', '')
                    if url and url.startswith('http'):
                        if url not in all_discoveries:
                            all_discoveries[url] = {
                                'url': url,
                                'title': result.get('title', ''),
                                'snippet': result.get('snippet', ''),
                                'source': 'duckduckgo',
                                'search_query': query,
                                'category': category
                            }
                # Rate limiting
                import time
                time.sleep(1)
            except Exception as e:
                logger.error(f"Error searching for '{query}': {str(e)}")
                continue
        
        # Fetch from seed list
        seed_urls = self.fetch_from_seed_list()
        for url in seed_urls:
            if url not in all_discoveries:
                parsed = urlparse(url)
                all_discoveries[url] = {
                    'url': url,
                    'title': '',
                    'snippet': '',
                    'source': 'seed_list',
                    'search_query': '',
                    'category': 'unknown'
                }
        
        # Save to database if session provided
        if db_session:
            from db.models import DiscoveredWebsite
            saved_count = 0
            for url, info in all_discoveries.items():
                try:
                    # Check if already exists
                    existing = db_session.query(DiscoveredWebsite).filter(
                        DiscoveredWebsite.url == url
                    ).first()
                    
                    if not existing:
                        parsed = urlparse(url)
                        discovered = DiscoveredWebsite(
                            url=info['url'],
                            domain=parsed.netloc,
                            title=info.get('title', ''),
                            snippet=info.get('snippet', ''),
                            source=info['source'],
                            search_query=info.get('search_query', ''),
                            category=info.get('category', 'unknown')
                        )
                        db_session.add(discovered)
                        saved_count += 1
                except Exception as e:
                    logger.error(f"Error saving discovered website {url}: {str(e)}")
                    continue
            
            try:
                db_session.commit()
                logger.info(f"Saved {saved_count} new discovered websites to database")
            except Exception as e:
                logger.error(f"Error committing discovered websites: {str(e)}")
                db_session.rollback()
        
        unique_discoveries = list(all_discoveries.values())
        logger.info(f"Discovered {len(unique_discoveries)} unique website URLs")
        
        return unique_discoveries
    
    def search_duckduckgo_detailed(self, query: str, num_results: int = 10) -> List[Dict]:
        """
        Search DuckDuckGo and return detailed results with title and snippet
        
        Args:
            query: Search query
            num_results: Number of results to return
            
        Returns:
            List of dicts with 'url', 'title', 'snippet'
        """
        try:
            from duckduckgo_search import DDGS
            logger.info(f"Attempting DuckDuckGo search for: {query}")
            with DDGS() as ddgs:
                results = list(ddgs.text(query, max_results=num_results))
                detailed_results = []
                for r in results:
                    if r.get('href', '').startswith('http'):
                        detailed_results.append({
                            'url': r.get('href', ''),
                            'title': r.get('title', ''),
                            'snippet': r.get('body', '')
                        })
                logger.info(f"DuckDuckGo search found {len(detailed_results)} results for: {query}")
                return detailed_results[:num_results]
        except ImportError:
            # Fallback: return basic URLs without details
            urls = self.search_duckduckgo(query, num_results)
            return [{'url': url, 'title': '', 'snippet': ''} for url in urls]
        except Exception as e:
            logger.error(f"Error in search_duckduckgo_detailed for '{query}': {str(e)}")
            return []

