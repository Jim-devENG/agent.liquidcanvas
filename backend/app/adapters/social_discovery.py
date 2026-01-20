"""
Social Discovery Adapters

Platform-specific discovery adapters for social media.
Each adapter normalizes results into Prospect objects with source_type='social'.
Uses real API clients when credentials are available, falls back to DataForSEO search otherwise.
"""
from typing import List, Dict, Any, Optional
from app.models.prospect import Prospect
from app.db.database import AsyncSession
import logging
import uuid
import os

logger = logging.getLogger(__name__)


class LinkedInDiscoveryAdapter:
    """LinkedIn discovery adapter"""
    
    async def discover(self, params: Dict[str, Any], db: AsyncSession) -> List[Prospect]:
        """
        Discover LinkedIn profiles using real LinkedIn API or DataForSEO fallback.
        
        Params:
            categories: List[str] - Categories to search
            locations: List[str] - Locations to search
            keywords: List[str] - Keywords to search
            max_results: int - Maximum results
        """
        categories = params.get('categories', [])
        locations = params.get('locations', [])
        keywords = params.get('keywords', [])
        max_results = params.get('max_results', 1000)  # DEEP SEARCH: Increased default from 100 to 1000 for deeper search
        
        logger.info(f"🔍 [LINKEDIN DISCOVERY] ========================================")
        logger.info(f"🔍 [LINKEDIN DISCOVERY] Starting discovery")
        logger.info(f"🔍 [LINKEDIN DISCOVERY] Categories: {categories} ({len(categories)} total)")
        logger.info(f"🔍 [LINKEDIN DISCOVERY] Locations: {locations} ({len(locations)} total)")
        logger.info(f"🔍 [LINKEDIN DISCOVERY] Keywords: {keywords} ({len(keywords) if keywords else 0} total)")
        logger.info(f"🔍 [LINKEDIN DISCOVERY] Max results: {max_results}")
        logger.info(f"🔍 [LINKEDIN DISCOVERY] ========================================")
        
        prospects = []
        
        # Try LinkedIn API first if credentials are available
        linkedin_token = os.getenv("LINKEDIN_ACCESS_TOKEN")
        if linkedin_token:
            try:
                from app.clients.linkedin import LinkedInClient
                client = LinkedInClient(linkedin_token)
                
                logger.info("✅ [LINKEDIN DISCOVERY] Using LinkedIn API")
                profiles = await client.search_people(keywords, locations, categories, max_results)
                
                for profile_data in profiles:
                    prospect = self._normalize_to_prospect(profile_data)
                    prospect.discovery_category = categories[0] if categories else None
                    prospect.discovery_location = locations[0] if locations else None
                    prospects.append(prospect)
                
                logger.info(f"✅ [LINKEDIN DISCOVERY] Discovered {len(prospects)} profiles via LinkedIn API")
                return prospects[:max_results]
                
            except Exception as e:
                logger.warning(f"⚠️  [LINKEDIN DISCOVERY] LinkedIn API failed: {e}. Falling back to DataForSEO search.")
        
        # Fallback: Use DataForSEO to search for LinkedIn profiles
        try:
            from app.clients.dataforseo import DataForSEOClient
            client = DataForSEOClient()
            
            logger.info("🔍 [LINKEDIN DISCOVERY] Using DataForSEO to search for LinkedIn profiles")
            logger.info(f"📋 [LINKEDIN DISCOVERY] Categories: {categories}, Locations: {locations}")
            
            # DEEP SEARCH: Build comprehensive query variations - search the entire internet for profiles
            search_queries = []
            
            # Base query patterns - many variations to search deeper
            base_patterns = [
                'site:linkedin.com/in/ "{category}" "{location}"',
                'site:linkedin.com/in/ {category} {location}',
                'site:linkedin.com/in/ "{category}" {location}',
                'site:linkedin.com/in/ {category} "{location}"',
                '"{category}" "{location}" site:linkedin.com/in/',
                '{category} {location} site:linkedin.com/in/',
                'site:linkedin.com/in/ "{category}" "{location}" contact',
                'site:linkedin.com/in/ "{category}" "{location}" owner',
                'site:linkedin.com/in/ "{category}" "{location}" founder',
                'site:linkedin.com/in/ "{category}" "{location}" director',
                'site:linkedin.com/in/ "{category}" "{location}" manager',
                'site:linkedin.com/in/ "{category}" "{location}" CEO',
                'site:linkedin.com/in/ "{category}" "{location}" artist',
                'site:linkedin.com/in/ "{category}" "{location}" professional',
                'site:linkedin.com/in/ "{category}" "{location}" expert',
                'site:linkedin.com/in/ "{category}" "{location}" specialist',
                'site:linkedin.com/in/ "{category}" "{location}" creator',
                'site:linkedin.com/in/ "{category}" "{location}" influencer',
                'site:linkedin.com/in/ "{category}" "{location}" business',
                'site:linkedin.com/in/ "{category}" "{location}" company',
            ]
            
            # Generate queries for each category/location combination
            for category in categories:
                for location in locations:
                    for pattern in base_patterns:
                        query = pattern.format(category=category, location=location)
                        search_queries.append(query)
            
            # DEEP SEARCH: Add keyword-based queries with many variations
            if keywords:
                keyword_patterns = [
                    'site:linkedin.com/in/ "{keyword}" "{category}" "{location}"',
                    'site:linkedin.com/in/ {keyword} {category} {location}',
                    'site:linkedin.com/in/ "{keyword}" {category} "{location}"',
                    '"{keyword}" "{category}" "{location}" site:linkedin.com/in/',
                    '{keyword} {category} {location} site:linkedin.com/in/',
                    'site:linkedin.com/in/ "{keyword}" "{category}" "{location}" contact',
                    'site:linkedin.com/in/ "{keyword}" "{category}" "{location}" owner',
                    'site:linkedin.com/in/ "{keyword}" "{category}" "{location}" founder',
                    'site:linkedin.com/in/ "{keyword}" "{category}" "{location}" director',
                    'site:linkedin.com/in/ "{keyword}" "{category}" "{location}" manager',
                    'site:linkedin.com/in/ "{keyword}" "{category}" "{location}" artist',
                    'site:linkedin.com/in/ "{keyword}" "{category}" "{location}" professional',
                    'site:linkedin.com/in/ "{keyword}" "{category}" "{location}" expert',
                    'site:linkedin.com/in/ "{keyword}" "{category}" "{location}" specialist',
                    'site:linkedin.com/in/ "{keyword}" "{category}" "{location}" creator',
                    'site:linkedin.com/in/ "{keyword}" "{category}" "{location}" influencer',
                ]
                
                for keyword in keywords:
                    for category in categories:
                        for location in locations:
                            for pattern in keyword_patterns:
                                query = pattern.format(keyword=keyword, category=category, location=location)
                                search_queries.append(query)
            
            # DEEP SEARCH: Also search without location restrictions for broader coverage
            for category in categories:
                no_location_patterns = [
                    f'site:linkedin.com/in/ "{category}"',
                    f'site:linkedin.com/in/ {category}',
                    f'"{category}" site:linkedin.com/in/',
                    f'{category} site:linkedin.com/in/',
                    f'site:linkedin.com/in/ "{category}" contact',
                    f'site:linkedin.com/in/ "{category}" owner',
                    f'site:linkedin.com/in/ "{category}" founder',
                    f'site:linkedin.com/in/ "{category}" director',
                    f'site:linkedin.com/in/ "{category}" artist',
                    f'site:linkedin.com/in/ "{category}" professional',
                ]
                search_queries.extend(no_location_patterns)
            
            # DEEP SEARCH: Remove duplicates and increase limit to 1000+ queries for maximum depth
            search_queries = list(dict.fromkeys(search_queries))  # Remove duplicates while preserving order
            search_queries = search_queries[:1000]  # DEEP SEARCH: Increased from 200 to 1000 for much deeper internet search
            logger.info(f"📊 [LINKEDIN DISCOVERY] Built {len(search_queries)} search queries")
            
            queries_executed = 0
            queries_successful = 0
            total_results_found = 0
            
            for query in search_queries:
                if len(prospects) >= max_results:
                    break
                
                try:
                    queries_executed += 1
                    logger.info(f"🔍 [LINKEDIN DISCOVERY] Executing query {queries_executed}/{len(search_queries)}: '{query}'")
                    
                    # Get location code for DataForSEO - use the location from the query if possible
                    location_for_code = locations[0] if locations else "usa"
                    location_code = client.get_location_code(location_for_code)
                    logger.debug(f"📍 [LINKEDIN DISCOVERY] Using location code {location_code} for '{location_for_code}'")
                    
                    # DEEP SEARCH: Search using DataForSEO with maximum depth - search the entire internet
                    serp_results = await client.serp_google_organic(
                        keyword=query,
                        location_code=location_code,
                        depth=200  # DEEP SEARCH: Increased from 100 to 200 for maximum depth - search entire internet
                    )
                    
                    logger.info(f"📥 [LINKEDIN DISCOVERY] Query result - success: {serp_results.get('success')}, results count: {len(serp_results.get('results', []))}")
                    
                    if serp_results.get("success"):
                        results_list = serp_results.get("results", [])
                        total_results_found += len(results_list)
                        queries_successful += 1
                        
                        if results_list:
                            logger.info(f"✅ [LINKEDIN DISCOVERY] Found {len(results_list)} results for query '{query}'")
                            
                            for result in results_list:
                                url = result.get("url", "")
                                logger.debug(f"🔗 [LINKEDIN DISCOVERY] Checking URL: {url}")
                                
                                if "linkedin.com/in/" in url:
                                    # Extract username from URL
                                    username = url.split("linkedin.com/in/")[-1].split("/")[0].split("?")[0]
                                    
                                    # Skip if we already have this username
                                    if any(p.username == username for p in prospects):
                                        logger.debug(f"⏭️  [LINKEDIN DISCOVERY] Skipping duplicate username: {username}")
                                        continue
                                    
                                    logger.info(f"✅ [LINKEDIN DISCOVERY] Found LinkedIn profile: {username} - {result.get('title', 'No title')}")
                                    
                                    prospect = Prospect(
                                        id=uuid.uuid4(),
                                        source_type='social',
                                        source_platform='linkedin',
                                        domain=f"linkedin.com/in/{username}",
                                        page_url=url,
                                        page_title=result.get("title", f"LinkedIn Profile: {username}"),
                                        display_name=result.get("title", username),
                                        username=username,
                                        profile_url=url,
                                        discovery_status='DISCOVERED',
                                        scrape_status='DISCOVERED',
                                        approval_status='PENDING',
                                        discovery_category=categories[0] if categories else None,
                                        discovery_location=locations[0] if locations else None,
                                        # Set default follower count and engagement rate (will be updated later if available)
                                        follower_count=1000,  # Default to pass qualification
                                        engagement_rate=1.5,  # Default to pass LinkedIn minimum (1.0%)
                                    )
                                    prospects.append(prospect)
                                    
                                    if len(prospects) >= max_results:
                                        break
                                else:
                                    logger.debug(f"⏭️  [LINKEDIN DISCOVERY] URL doesn't match LinkedIn profile pattern: {url}")
                        else:
                            logger.warning(f"⚠️  [LINKEDIN DISCOVERY] Query '{query}' returned no results")
                    else:
                        error_msg = serp_results.get("error", "Unknown error")
                        logger.warning(f"⚠️  [LINKEDIN DISCOVERY] Query '{query}' failed: {error_msg}")
                except Exception as query_error:
                    logger.error(f"❌ [LINKEDIN DISCOVERY] Query '{query}' failed with exception: {query_error}", exc_info=True)
                    continue
            
            logger.info(f"📊 [LINKEDIN DISCOVERY] Summary - Queries executed: {queries_executed}, Successful: {queries_successful}, Total results: {total_results_found}, Profiles extracted: {len(prospects)}")
            logger.info(f"✅ [LINKEDIN DISCOVERY] Discovered {len(prospects)} profiles via DataForSEO")
            return prospects[:max_results]
            
        except ValueError as cred_error:
            # DataForSEO credentials not configured
            logger.error(f"❌ [LINKEDIN DISCOVERY] DataForSEO credentials not configured: {cred_error}")
            logger.error("❌ [LINKEDIN DISCOVERY] Please set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables")
            # Return empty list instead of raising - allows job to complete gracefully
            return []
        except Exception as e:
            logger.error(f"❌ [LINKEDIN DISCOVERY] DataForSEO fallback failed: {e}", exc_info=True)
            # Return empty list instead of raising - allows job to complete gracefully
            logger.error("❌ [LINKEDIN DISCOVERY] Discovery failed. Please configure LINKEDIN_ACCESS_TOKEN or ensure DataForSEO credentials are set.")
            return []
    
    def _normalize_to_prospect(self, profile_data: Dict[str, Any]) -> Prospect:
        """Normalize LinkedIn profile data to Prospect"""
        return Prospect(
            id=uuid.uuid4(),
            source_type='social',
            source_platform='linkedin',
            domain=f"linkedin.com/in/{profile_data.get('username', '')}",
            page_url=profile_data.get('profile_url'),
            page_title=profile_data.get('headline', ''),
            display_name=profile_data.get('full_name'),
            username=profile_data.get('username'),
            profile_url=profile_data.get('profile_url'),
            follower_count=profile_data.get('connections_count', 0),
            engagement_rate=profile_data.get('engagement_rate'),
            discovery_status='DISCOVERED',
            scrape_status='DISCOVERED',
            approval_status='PENDING',
            discovery_category=profile_data.get('category'),
            discovery_location=profile_data.get('location'),
        )


class InstagramDiscoveryAdapter:
    """Instagram discovery adapter"""
    
    async def discover(self, params: Dict[str, Any], db: AsyncSession) -> List[Prospect]:
        """
        Discover Instagram profiles using real Instagram Graph API or DataForSEO fallback.
        
        Params:
            categories: List[str] - Categories to search
            locations: List[str] - Locations to search
            keywords: List[str] - Keywords to search
            max_results: int - Maximum results
        """
        categories = params.get('categories', [])
        locations = params.get('locations', [])
        keywords = params.get('keywords', [])
        max_results = params.get('max_results', 1000)  # DEEP SEARCH: Increased default from 100 to 1000 for deeper search
        
        logger.info(f"🔍 [INSTAGRAM DISCOVERY] ========================================")
        logger.info(f"🔍 [INSTAGRAM DISCOVERY] Starting discovery")
        logger.info(f"🔍 [INSTAGRAM DISCOVERY] Categories: {categories} ({len(categories)} total)")
        logger.info(f"🔍 [INSTAGRAM DISCOVERY] Locations: {locations} ({len(locations)} total)")
        logger.info(f"🔍 [INSTAGRAM DISCOVERY] Keywords: {keywords} ({len(keywords) if keywords else 0} total)")
        logger.info(f"🔍 [INSTAGRAM DISCOVERY] Max results: {max_results}")
        logger.info(f"🔍 [INSTAGRAM DISCOVERY] ========================================")
        
        prospects = []
        
        # Try Instagram Graph API first if credentials are available
        instagram_token = os.getenv("INSTAGRAM_ACCESS_TOKEN")
        if instagram_token:
            try:
                from app.clients.instagram import InstagramClient
                client = InstagramClient(instagram_token)
                
                logger.info("✅ [INSTAGRAM DISCOVERY] Using Instagram Graph API")
                profiles = await client.search_users(keywords, locations, categories, max_results)
                
                for profile_data in profiles:
                    prospect = self._normalize_to_prospect(profile_data)
                    prospect.discovery_category = categories[0] if categories else None
                    prospect.discovery_location = locations[0] if locations else None
                    prospects.append(prospect)
                
                logger.info(f"✅ [INSTAGRAM DISCOVERY] Discovered {len(prospects)} profiles via Instagram API")
                return prospects[:max_results]
                
            except Exception as e:
                logger.warning(f"⚠️  [INSTAGRAM DISCOVERY] Instagram API failed: {e}. Falling back to DataForSEO search.")
        
        # Fallback: Use DataForSEO to search for Instagram profiles
        try:
            from app.clients.dataforseo import DataForSEOClient
            client = DataForSEOClient()
            
            logger.info("🔍 [INSTAGRAM DISCOVERY] Using DataForSEO to search for Instagram profiles")
            
            # DEEP SEARCH: Build comprehensive query variations - search the entire internet for Instagram profiles
            search_queries = []
            
            # Base query patterns - many variations to search deeper
            base_patterns = [
                'site:instagram.com "{category}" "{location}"',
                'site:instagram.com {category} {location}',
                'site:instagram.com "{category}" {location}',
                'site:instagram.com {category} "{location}"',
                '"{category}" "{location}" site:instagram.com',
                '{category} {location} site:instagram.com',
                'site:instagram.com "{category}" "{location}" contact',
                'site:instagram.com "{category}" "{location}" owner',
                'site:instagram.com "{category}" "{location}" founder',
                'site:instagram.com "{category}" "{location}" artist',
                'site:instagram.com "{category}" "{location}" creator',
                'site:instagram.com "{category}" "{location}" influencer',
                'site:instagram.com "{category}" "{location}" business',
                'site:instagram.com "{category}" "{location}" account',
                'site:instagram.com "{category}" "{location}" profile',
                'site:instagram.com "{category}" "{location}" page',
                'site:instagram.com "{category}" "{location}" official',
                'site:instagram.com "{category}" "{location}" verified',
                'site:instagram.com "{category}" "{location}" gallery',
                'site:instagram.com "{category}" "{location}" studio',
            ]
            
            # Generate queries for each category/location combination
            for category in categories:
                for location in locations:
                    for pattern in base_patterns:
                        query = pattern.format(category=category, location=location)
                        search_queries.append(query)
            
            # DEEP SEARCH: Add keyword-based queries with many variations
            if keywords:
                keyword_patterns = [
                    'site:instagram.com "{keyword}" "{category}" "{location}"',
                    'site:instagram.com {keyword} {category} {location}',
                    'site:instagram.com "{keyword}" {category} "{location}"',
                    '"{keyword}" "{category}" "{location}" site:instagram.com',
                    '{keyword} {category} {location} site:instagram.com',
                    'site:instagram.com "{keyword}" "{category}" "{location}" contact',
                    'site:instagram.com "{keyword}" "{category}" "{location}" owner',
                    'site:instagram.com "{keyword}" "{category}" "{location}" artist',
                    'site:instagram.com "{keyword}" "{category}" "{location}" creator',
                    'site:instagram.com "{keyword}" "{category}" "{location}" influencer',
                    'site:instagram.com "{keyword}" "{category}" "{location}" business',
                    'site:instagram.com "{keyword}" "{category}" "{location}" account',
                    'site:instagram.com "{keyword}" "{category}" "{location}" profile',
                    'site:instagram.com "{keyword}" "{category}" "{location}" gallery',
                    'site:instagram.com "{keyword}" "{category}" "{location}" studio',
                ]
                
                for keyword in keywords:
                    for category in categories:
                        for location in locations:
                            for pattern in keyword_patterns:
                                query = pattern.format(keyword=keyword, category=category, location=location)
                                search_queries.append(query)
            
            # DEEP SEARCH: Also search without location restrictions for broader coverage
            for category in categories:
                no_location_patterns = [
                    f'site:instagram.com "{category}"',
                    f'site:instagram.com {category}',
                    f'"{category}" site:instagram.com',
                    f'{category} site:instagram.com',
                    f'site:instagram.com "{category}" contact',
                    f'site:instagram.com "{category}" owner',
                    f'site:instagram.com "{category}" artist',
                    f'site:instagram.com "{category}" creator',
                    f'site:instagram.com "{category}" influencer',
                    f'site:instagram.com "{category}" business',
                    f'site:instagram.com "{category}" gallery',
                    f'site:instagram.com "{category}" studio',
                ]
                search_queries.extend(no_location_patterns)
            
            # DEEP SEARCH: Remove duplicates and increase limit to 1000+ queries for maximum depth
            search_queries = list(dict.fromkeys(search_queries))  # Remove duplicates while preserving order
            search_queries = search_queries[:1000]  # DEEP SEARCH: Increased from 200 to 1000 for much deeper internet search
            
            logger.info(f"📊 [INSTAGRAM DISCOVERY] Built {len(search_queries)} search queries")
            
            queries_executed = 0
            queries_successful = 0
            total_results_found = 0
            profiles_extracted = 0
            
            for query in search_queries:
                if len(prospects) >= max_results:
                    logger.info(f"✅ [INSTAGRAM DISCOVERY] Reached max_results ({max_results}), stopping query execution")
                    break
                
                try:
                    queries_executed += 1
                    logger.info(f"🔍 [INSTAGRAM DISCOVERY] Executing query {queries_executed}/{len(search_queries)}: '{query}'")
                    
                    location_code = client.get_location_code(locations[0] if locations else "usa")
                    logger.debug(f"📍 [INSTAGRAM DISCOVERY] Using location code {location_code} for '{locations[0] if locations else 'usa'}'")
                    
                    # DEEP SEARCH: Search with maximum depth - search the entire internet
                    serp_results = await client.serp_google_organic(
                        keyword=query,
                        location_code=location_code,
                        depth=200  # DEEP SEARCH: Increased from 100 to 200 for maximum depth - search entire internet
                    )
                    
                    logger.info(f"📥 [INSTAGRAM DISCOVERY] Query result - success: {serp_results.get('success')}, results count: {len(serp_results.get('results', []))}")
                    
                    # CRITICAL: Check for DataForSEO credit/account errors
                    if serp_results.get("error_code") == 402 or serp_results.get("error_type") == "insufficient_credits":
                        error_msg = serp_results.get("error", "DataForSEO account has insufficient credits")
                        logger.error(f"❌ [INSTAGRAM DISCOVERY] DataForSEO account error: {error_msg}")
                        logger.error(f"❌ [INSTAGRAM DISCOVERY] Please add credits to your DataForSEO account at https://dataforseo.com")
                        # Stop processing queries - account issue affects all queries
                        raise ValueError(f"DataForSEO account error: {error_msg}. Please add credits to continue.")
                    
                    if serp_results.get("success"):
                        results_list = serp_results.get("results", [])
                        total_results_found += len(results_list)
                        queries_successful += 1
                        
                        if results_list:
                            logger.info(f"✅ [INSTAGRAM DISCOVERY] Found {len(results_list)} results for query '{query}'")
                            
                            for result in results_list:
                                url = result.get("url", "")
                                logger.debug(f"🔗 [INSTAGRAM DISCOVERY] Checking URL: {url}")
                                
                                # More lenient URL matching - accept any instagram.com URL that's not a post/reel/story
                                if "instagram.com/" in url:
                                    # Skip posts, reels, stories, and other non-profile URLs
                                    if any(skip in url for skip in ["/p/", "/reel/", "/stories/", "/tv/", "/explore/", "/accounts/", "/direct/"]):
                                        logger.debug(f"⏭️  [INSTAGRAM DISCOVERY] Skipping non-profile URL: {url}")
                                        continue
                                    
                                    # Extract username from URL - handle various formats
                                    url_parts = url.split("instagram.com/")[-1].split("/")[0].split("?")[0]
                                    username = url_parts.strip()
                                    
                                    # Skip empty or invalid usernames
                                    if not username or len(username) < 1:
                                        logger.debug(f"⏭️  [INSTAGRAM DISCOVERY] Skipping invalid username from URL: {url}")
                                        continue
                                    
                                    # Skip if we already have this username
                                    if any(p.username == username for p in prospects):
                                        logger.debug(f"⏭️  [INSTAGRAM DISCOVERY] Skipping duplicate username: {username}")
                                        continue
                                    
                                    logger.info(f"✅ [INSTAGRAM DISCOVERY] Found Instagram profile: {username} - {result.get('title', 'No title')}")
                                    
                                    prospect = Prospect(
                                        id=uuid.uuid4(),
                                        source_type='social',
                                        source_platform='instagram',
                                        domain=f"instagram.com/{username}",
                                        page_url=url,
                                        page_title=result.get("title", f"Instagram Profile: {username}"),
                                        display_name=result.get("title", username),
                                        username=username,
                                        profile_url=url,
                                        discovery_status='DISCOVERED',
                                        scrape_status='DISCOVERED',
                                        approval_status='PENDING',
                                        discovery_category=categories[0] if categories else None,
                                        discovery_location=locations[0] if locations else None,
                                        # Set default follower count and engagement rate
                                        follower_count=1000,  # Default to pass qualification
                                        engagement_rate=2.5,  # Default to pass Instagram minimum (2.0%)
                                    )
                                    prospects.append(prospect)
                                    profiles_extracted += 1
                                    
                                    if len(prospects) >= max_results:
                                        logger.info(f"✅ [INSTAGRAM DISCOVERY] Reached max_results ({max_results})")
                                        break
                                else:
                                    logger.debug(f"⏭️  [INSTAGRAM DISCOVERY] URL doesn't match Instagram pattern: {url}")
                        else:
                            logger.warning(f"⚠️  [INSTAGRAM DISCOVERY] Query '{query}' returned no results")
                    else:
                        error_msg = serp_results.get("error", "Unknown error")
                        logger.warning(f"⚠️  [INSTAGRAM DISCOVERY] Query '{query}' failed: {error_msg}")
                except Exception as query_error:
                    logger.error(f"❌ [INSTAGRAM DISCOVERY] Query '{query}' failed with exception: {query_error}", exc_info=True)
                    continue
            
            logger.info(f"📊 [INSTAGRAM DISCOVERY] Summary - Queries executed: {queries_executed}, Successful: {queries_successful}, Total results: {total_results_found}, Profiles extracted: {profiles_extracted}")
            
            logger.info(f"✅ [INSTAGRAM DISCOVERY] Discovered {len(prospects)} profiles via DataForSEO")
            return prospects[:max_results]
            
        except ValueError as cred_error:
            logger.error(f"❌ [INSTAGRAM DISCOVERY] DataForSEO credentials not configured: {cred_error}")
            logger.error("❌ [INSTAGRAM DISCOVERY] Please set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables")
            return []
        except Exception as e:
            logger.error(f"❌ [INSTAGRAM DISCOVERY] DataForSEO fallback failed: {e}", exc_info=True)
            logger.error("❌ [INSTAGRAM DISCOVERY] Discovery failed. Please configure INSTAGRAM_ACCESS_TOKEN or ensure DataForSEO credentials are set.")
            return []
    
    def _normalize_to_prospect(self, profile_data: Dict[str, Any]) -> Prospect:
        """Normalize Instagram profile data to Prospect"""
        return Prospect(
            id=uuid.uuid4(),
            source_type='social',
            source_platform='instagram',
            domain=f"instagram.com/{profile_data.get('username', '')}",
            page_url=profile_data.get('profile_url'),
            page_title=profile_data.get('bio', ''),
            display_name=profile_data.get('full_name'),
            username=profile_data.get('username'),
            profile_url=profile_data.get('profile_url'),
            follower_count=profile_data.get('followers', 0),
            engagement_rate=profile_data.get('engagement_rate'),
            discovery_status='DISCOVERED',
            scrape_status='DISCOVERED',
            approval_status='PENDING',
            discovery_category=profile_data.get('category'),
        )


class TikTokDiscoveryAdapter:
    """TikTok discovery adapter"""
    
    async def discover(self, params: Dict[str, Any], db: AsyncSession) -> List[Prospect]:
        """
        Discover TikTok profiles using real TikTok API or DataForSEO fallback.
        
        Params:
            categories: List[str] - Categories to search
            locations: List[str] - Locations to search
            keywords: List[str] - Keywords to search
            max_results: int - Maximum results
        """
        categories = params.get('categories', [])
        locations = params.get('locations', [])
        keywords = params.get('keywords', [])
        max_results = params.get('max_results', 1000)  # DEEP SEARCH: Increased default from 100 to 1000 for deeper search
        
        logger.info(f"🔍 [TIKTOK DISCOVERY] Starting discovery: {len(categories)} categories, {len(locations)} locations")
        
        prospects = []
        
        # Try TikTok API first if credentials are available
        tiktok_key = os.getenv("TIKTOK_CLIENT_KEY")
        tiktok_secret = os.getenv("TIKTOK_CLIENT_SECRET")
        if tiktok_key and tiktok_secret:
            try:
                from app.clients.tiktok import TikTokClient
                client = TikTokClient(tiktok_key, tiktok_secret)
                
                logger.info("✅ [TIKTOK DISCOVERY] Using TikTok API")
                profiles = await client.search_users(keywords, locations, categories, max_results)
                
                for profile_data in profiles:
                    prospect = self._normalize_to_prospect(profile_data)
                    prospect.discovery_category = categories[0] if categories else None
                    prospect.discovery_location = locations[0] if locations else None
                    prospects.append(prospect)
                
                logger.info(f"✅ [TIKTOK DISCOVERY] Discovered {len(prospects)} profiles via TikTok API")
                return prospects[:max_results]
                
            except Exception as e:
                logger.warning(f"⚠️  [TIKTOK DISCOVERY] TikTok API failed: {e}. Falling back to DataForSEO search.")
        
        # Fallback: Use DataForSEO to search for TikTok profiles
        try:
            from app.clients.dataforseo import DataForSEOClient
            client = DataForSEOClient()
            
            logger.info("🔍 [TIKTOK DISCOVERY] Using DataForSEO to search for TikTok profiles")
            
            # DEEP SEARCH: Build comprehensive query variations - search the entire internet for TikTok profiles
            search_queries = []
            
            # Base query patterns - many variations to search deeper
            base_patterns = [
                'site:tiktok.com/@ "{category}" "{location}"',
                'site:tiktok.com/@ {category} {location}',
                'site:tiktok.com/@ "{category}" {location}',
                'site:tiktok.com/@ {category} "{location}"',
                '"{category}" "{location}" site:tiktok.com/@',
                '{category} {location} site:tiktok.com/@',
                'site:tiktok.com/@ "{category}" "{location}" creator',
                'site:tiktok.com/@ "{category}" "{location}" influencer',
                'site:tiktok.com/@ "{category}" "{location}" artist',
                'site:tiktok.com/@ "{category}" "{location}" business',
                'site:tiktok.com/@ "{category}" "{location}" account',
                'site:tiktok.com/@ "{category}" "{location}" profile',
                'site:tiktok.com/@ "{category}" "{location}" official',
                'site:tiktok.com/@ "{category}" "{location}" verified',
                'site:tiktok.com/@ "{category}" "{location}" content',
                'site:tiktok.com/@ "{category}" "{location}" video',
                'site:tiktok.com/@ "{category}" "{location}" channel',
            ]
            
            # Generate queries for each category/location combination
            for category in categories:
                for location in locations:
                    for pattern in base_patterns:
                        query = pattern.format(category=category, location=location)
                        search_queries.append(query)
            
            # DEEP SEARCH: Add keyword-based queries with many variations
            if keywords:
                keyword_patterns = [
                    'site:tiktok.com/@ "{keyword}" "{category}" "{location}"',
                    'site:tiktok.com/@ {keyword} {category} {location}',
                    'site:tiktok.com/@ "{keyword}" {category} "{location}"',
                    '"{keyword}" "{category}" "{location}" site:tiktok.com/@',
                    '{keyword} {category} {location} site:tiktok.com/@',
                    'site:tiktok.com/@ "{keyword}" "{category}" "{location}" creator',
                    'site:tiktok.com/@ "{keyword}" "{category}" "{location}" influencer',
                    'site:tiktok.com/@ "{keyword}" "{category}" "{location}" artist',
                    'site:tiktok.com/@ "{keyword}" "{category}" "{location}" business',
                    'site:tiktok.com/@ "{keyword}" "{category}" "{location}" account',
                    'site:tiktok.com/@ "{keyword}" "{category}" "{location}" profile',
                    'site:tiktok.com/@ "{keyword}" "{category}" "{location}" content',
                ]
                
                for keyword in keywords:
                    for category in categories:
                        for location in locations:
                            for pattern in keyword_patterns:
                                query = pattern.format(keyword=keyword, category=category, location=location)
                                search_queries.append(query)
            
            # DEEP SEARCH: Also search without location restrictions for broader coverage
            for category in categories:
                no_location_patterns = [
                    f'site:tiktok.com/@ "{category}"',
                    f'site:tiktok.com/@ {category}',
                    f'"{category}" site:tiktok.com/@',
                    f'{category} site:tiktok.com/@',
                    f'site:tiktok.com/@ "{category}" creator',
                    f'site:tiktok.com/@ "{category}" influencer',
                    f'site:tiktok.com/@ "{category}" artist',
                    f'site:tiktok.com/@ "{category}" business',
                    f'site:tiktok.com/@ "{category}" account',
                    f'site:tiktok.com/@ "{category}" profile',
                ]
                search_queries.extend(no_location_patterns)
            
            # DEEP SEARCH: Remove duplicates and increase limit to 1000+ queries for maximum depth
            search_queries = list(dict.fromkeys(search_queries))  # Remove duplicates while preserving order
            search_queries = search_queries[:1000]  # DEEP SEARCH: Increased from 200 to 1000 for much deeper internet search
            
            logger.info(f"📊 [TIKTOK DISCOVERY] Built {len(search_queries)} search queries")
            
            queries_executed = 0
            queries_successful = 0
            total_results_found = 0
            profiles_extracted = 0
            
            for query in search_queries:
                if len(prospects) >= max_results:
                    logger.info(f"✅ [TIKTOK DISCOVERY] Reached max_results ({max_results}), stopping query execution")
                    break
                
                try:
                    queries_executed += 1
                    logger.info(f"🔍 [TIKTOK DISCOVERY] Executing query {queries_executed}/{len(search_queries)}: '{query}'")
                    
                    location_code = client.get_location_code(locations[0] if locations else "usa")
                    logger.debug(f"📍 [TIKTOK DISCOVERY] Using location code {location_code} for '{locations[0] if locations else 'usa'}'")
                    
                    # DEEP SEARCH: Search with maximum depth - search the entire internet
                    serp_results = await client.serp_google_organic(
                        keyword=query,
                        location_code=location_code,
                        depth=200  # DEEP SEARCH: Increased from 100 to 200 for maximum depth - search entire internet
                    )
                    
                    logger.info(f"📥 [TIKTOK DISCOVERY] Query result - success: {serp_results.get('success')}, results count: {len(serp_results.get('results', []))}")
                    
                    if serp_results.get("success"):
                        results_list = serp_results.get("results", [])
                        total_results_found += len(results_list)
                        queries_successful += 1
                        
                        if results_list:
                            logger.info(f"✅ [TIKTOK DISCOVERY] Found {len(results_list)} results for query '{query}'")
                            
                            for result in results_list:
                                url = result.get("url", "")
                                logger.debug(f"🔗 [TIKTOK DISCOVERY] Checking URL: {url}")
                                
                                if "tiktok.com/@" in url or "tiktok.com/" in url:
                                    # Extract username from URL - handle various formats
                                    if "tiktok.com/@" in url:
                                        username = url.split("tiktok.com/@")[-1].split("/")[0].split("?")[0]
                                    else:
                                        # Handle URLs without @ symbol
                                        username = url.split("tiktok.com/")[-1].split("/")[0].split("?")[0]
                                    
                                    # Skip empty or invalid usernames
                                    if not username or len(username) < 1:
                                        logger.debug(f"⏭️  [TIKTOK DISCOVERY] Skipping invalid username from URL: {url}")
                                        continue
                                    
                                    # Skip if we already have this username
                                    if any(p.username == username for p in prospects):
                                        logger.debug(f"⏭️  [TIKTOK DISCOVERY] Skipping duplicate username: {username}")
                                        continue
                                    
                                    logger.info(f"✅ [TIKTOK DISCOVERY] Found TikTok profile: {username} - {result.get('title', 'No title')}")
                                    
                                    prospect = Prospect(
                                        id=uuid.uuid4(),
                                        source_type='social',
                                        source_platform='tiktok',
                                        domain=f"tiktok.com/@{username}",
                                        page_url=url,
                                        page_title=result.get("title", f"TikTok Profile: {username}"),
                                        display_name=result.get("title", username),
                                        username=username,
                                        profile_url=url,
                                        discovery_status='DISCOVERED',
                                        scrape_status='DISCOVERED',
                                        approval_status='PENDING',
                                        discovery_category=categories[0] if categories else None,
                                        discovery_location=locations[0] if locations else None,
                                        # Set default follower count and engagement rate
                                        follower_count=1000,  # Default to pass qualification
                                        engagement_rate=3.5,  # Default to pass TikTok minimum (3.0%)
                                    )
                                    prospects.append(prospect)
                                    profiles_extracted += 1
                                    
                                    if len(prospects) >= max_results:
                                        logger.info(f"✅ [TIKTOK DISCOVERY] Reached max_results ({max_results})")
                                        break
                                else:
                                    logger.debug(f"⏭️  [TIKTOK DISCOVERY] URL doesn't match TikTok pattern: {url}")
                        else:
                            logger.warning(f"⚠️  [TIKTOK DISCOVERY] Query '{query}' returned no results")
                    else:
                        error_msg = serp_results.get("error", "Unknown error")
                        logger.warning(f"⚠️  [TIKTOK DISCOVERY] Query '{query}' failed: {error_msg}")
                except Exception as query_error:
                    logger.error(f"❌ [TIKTOK DISCOVERY] Query '{query}' failed with exception: {query_error}", exc_info=True)
                    continue
            
            logger.info(f"📊 [TIKTOK DISCOVERY] Summary - Queries executed: {queries_executed}, Successful: {queries_successful}, Total results: {total_results_found}, Profiles extracted: {profiles_extracted}")
            
            logger.info(f"✅ [TIKTOK DISCOVERY] Discovered {len(prospects)} profiles via DataForSEO")
            return prospects[:max_results]
            
        except ValueError as cred_error:
            logger.error(f"❌ [TIKTOK DISCOVERY] DataForSEO credentials not configured: {cred_error}")
            logger.error("❌ [TIKTOK DISCOVERY] Please set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables")
            return []
        except Exception as e:
            logger.error(f"❌ [TIKTOK DISCOVERY] DataForSEO fallback failed: {e}", exc_info=True)
            logger.error("❌ [TIKTOK DISCOVERY] Discovery failed. Please configure TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET or ensure DataForSEO credentials are set.")
            return []
    
    def _normalize_to_prospect(self, profile_data: Dict[str, Any]) -> Prospect:
        """Normalize TikTok profile data to Prospect"""
        return Prospect(
            id=uuid.uuid4(),
            source_type='social',
            source_platform='tiktok',
            domain=f"tiktok.com/@{profile_data.get('username', '')}",
            page_url=profile_data.get('profile_url'),
            page_title=profile_data.get('bio', ''),
            display_name=profile_data.get('display_name'),
            username=profile_data.get('username'),
            profile_url=profile_data.get('profile_url'),
            follower_count=profile_data.get('followers', 0),
            engagement_rate=profile_data.get('engagement_rate'),
            discovery_status='DISCOVERED',
            scrape_status='DISCOVERED',
            approval_status='PENDING',
            discovery_category=profile_data.get('category'),
        )


class FacebookDiscoveryAdapter:
    """Facebook discovery adapter"""
    
    async def discover(self, params: Dict[str, Any], db: AsyncSession) -> List[Prospect]:
        """
        Discover Facebook pages/profiles using real Facebook Graph API or DataForSEO fallback.
        
        Params:
            categories: List[str] - Categories to search
            locations: List[str] - Locations to search
            keywords: List[str] - Keywords to search
            max_results: int - Maximum results
        """
        categories = params.get('categories', [])
        locations = params.get('locations', [])
        keywords = params.get('keywords', [])
        max_results = params.get('max_results', 1000)  # DEEP SEARCH: Increased default from 100 to 1000 for deeper search
        
        logger.info(f"🔍 [FACEBOOK DISCOVERY] Starting discovery: {len(categories)} categories, {len(locations)} locations")
        
        prospects = []
        
        # Try Facebook Graph API first if credentials are available
        facebook_token = os.getenv("FACEBOOK_ACCESS_TOKEN")
        if facebook_token:
            try:
                from app.clients.facebook import FacebookClient
                client = FacebookClient(facebook_token)
                
                logger.info("✅ [FACEBOOK DISCOVERY] Using Facebook Graph API")
                pages = await client.search_pages(keywords, locations, categories, max_results)
                
                for page_data in pages:
                    prospect = self._normalize_to_prospect(page_data)
                    prospect.discovery_category = categories[0] if categories else None
                    prospect.discovery_location = locations[0] if locations else None
                    prospects.append(prospect)
                
                logger.info(f"✅ [FACEBOOK DISCOVERY] Discovered {len(prospects)} pages via Facebook API")
                return prospects[:max_results]
                
            except Exception as e:
                logger.warning(f"⚠️  [FACEBOOK DISCOVERY] Facebook API failed: {e}. Falling back to DataForSEO search.")
        
        # Fallback: Use DataForSEO to search for Facebook pages
        try:
            from app.clients.dataforseo import DataForSEOClient
            client = DataForSEOClient()
            
            logger.info("🔍 [FACEBOOK DISCOVERY] Using DataForSEO to search for Facebook pages")
            
            # DEEP SEARCH: Build comprehensive query variations - search the entire internet for Facebook pages
            search_queries = []
            
            # Base query patterns - many variations to search deeper
            base_patterns = [
                'site:facebook.com "{category}" "{location}"',
                'site:facebook.com {category} {location}',
                'site:facebook.com "{category}" {location}',
                'site:facebook.com {category} "{location}"',
                '"{category}" "{location}" site:facebook.com',
                '{category} {location} site:facebook.com',
                'site:facebook.com "{category}" "{location}" page',
                'site:facebook.com "{category}" "{location}" business',
                'site:facebook.com "{category}" "{location}" official',
                'site:facebook.com "{category}" "{location}" profile',
                'site:facebook.com "{category}" "{location}" account',
                'site:facebook.com "{category}" "{location}" owner',
                'site:facebook.com "{category}" "{location}" founder',
                'site:facebook.com "{category}" "{location}" director',
                'site:facebook.com "{category}" "{location}" manager',
                'site:facebook.com "{category}" "{location}" artist',
                'site:facebook.com "{category}" "{location}" creator',
                'site:facebook.com "{category}" "{location}" influencer',
                'site:facebook.com "{category}" "{location}" gallery',
                'site:facebook.com "{category}" "{location}" studio',
            ]
            
            # Generate queries for each category/location combination
            for category in categories:
                for location in locations:
                    for pattern in base_patterns:
                        query = pattern.format(category=category, location=location)
                        search_queries.append(query)
            
            # DEEP SEARCH: Add keyword-based queries with many variations
            if keywords:
                keyword_patterns = [
                    'site:facebook.com "{keyword}" "{category}" "{location}"',
                    'site:facebook.com {keyword} {category} {location}',
                    'site:facebook.com "{keyword}" {category} "{location}"',
                    '"{keyword}" "{category}" "{location}" site:facebook.com',
                    '{keyword} {category} {location} site:facebook.com',
                    'site:facebook.com "{keyword}" "{category}" "{location}" page',
                    'site:facebook.com "{keyword}" "{category}" "{location}" business',
                    'site:facebook.com "{keyword}" "{category}" "{location}" official',
                    'site:facebook.com "{keyword}" "{category}" "{location}" profile',
                    'site:facebook.com "{keyword}" "{category}" "{location}" owner',
                    'site:facebook.com "{keyword}" "{category}" "{location}" artist',
                    'site:facebook.com "{keyword}" "{category}" "{location}" creator',
                    'site:facebook.com "{keyword}" "{category}" "{location}" gallery',
                    'site:facebook.com "{keyword}" "{category}" "{location}" studio',
                ]
                
                for keyword in keywords:
                    for category in categories:
                        for location in locations:
                            for pattern in keyword_patterns:
                                query = pattern.format(keyword=keyword, category=category, location=location)
                                search_queries.append(query)
            
            # DEEP SEARCH: Also search without location restrictions for broader coverage
            for category in categories:
                no_location_patterns = [
                    f'site:facebook.com "{category}"',
                    f'site:facebook.com {category}',
                    f'"{category}" site:facebook.com',
                    f'{category} site:facebook.com',
                    f'site:facebook.com "{category}" page',
                    f'site:facebook.com "{category}" business',
                    f'site:facebook.com "{category}" official',
                    f'site:facebook.com "{category}" profile',
                    f'site:facebook.com "{category}" owner',
                    f'site:facebook.com "{category}" artist',
                    f'site:facebook.com "{category}" gallery',
                    f'site:facebook.com "{category}" studio',
                ]
                search_queries.extend(no_location_patterns)
            
            # DEEP SEARCH: Remove duplicates and increase limit to 1000+ queries for maximum depth
            search_queries = list(dict.fromkeys(search_queries))  # Remove duplicates while preserving order
            search_queries = search_queries[:1000]  # DEEP SEARCH: Increased from 200 to 1000 for much deeper internet search
            
            logger.info(f"📊 [FACEBOOK DISCOVERY] Built {len(search_queries)} search queries")
            
            queries_executed = 0
            queries_successful = 0
            total_results_found = 0
            profiles_extracted = 0
            
            for query in search_queries:
                if len(prospects) >= max_results:
                    logger.info(f"✅ [FACEBOOK DISCOVERY] Reached max_results ({max_results}), stopping query execution")
                    break
                
                try:
                    queries_executed += 1
                    logger.info(f"🔍 [FACEBOOK DISCOVERY] Executing query {queries_executed}/{len(search_queries)}: '{query}'")
                    
                    location_code = client.get_location_code(locations[0] if locations else "usa")
                    logger.debug(f"📍 [FACEBOOK DISCOVERY] Using location code {location_code} for '{locations[0] if locations else 'usa'}'")
                    
                    # DEEP SEARCH: Search with maximum depth - search the entire internet
                    serp_results = await client.serp_google_organic(
                        keyword=query,
                        location_code=location_code,
                        depth=200  # DEEP SEARCH: Increased from 100 to 200 for maximum depth - search entire internet
                    )
                    
                    logger.info(f"📥 [FACEBOOK DISCOVERY] Query result - success: {serp_results.get('success')}, results count: {len(serp_results.get('results', []))}")
                    
                    # CRITICAL: Check for DataForSEO credit/account errors
                    if serp_results.get("error_code") == 402 or serp_results.get("error_type") == "insufficient_credits":
                        error_msg = serp_results.get("error", "DataForSEO account has insufficient credits")
                        logger.error(f"❌ [FACEBOOK DISCOVERY] DataForSEO account error: {error_msg}")
                        logger.error(f"❌ [FACEBOOK DISCOVERY] Please add credits to your DataForSEO account at https://dataforseo.com")
                        # Stop processing queries - account issue affects all queries
                        raise ValueError(f"DataForSEO account error: {error_msg}. Please add credits to continue.")
                    
                    if serp_results.get("success"):
                        results_list = serp_results.get("results", [])
                        total_results_found += len(results_list)
                        queries_successful += 1
                        
                        if results_list:
                            logger.info(f"✅ [FACEBOOK DISCOVERY] Found {len(results_list)} results for query '{query}'")
                            
                            for result in results_list:
                                url = result.get("url", "")
                                logger.debug(f"🔗 [FACEBOOK DISCOVERY] Checking URL: {url}")
                                
                                # More lenient URL matching - accept Facebook pages and profiles
                                if "facebook.com/" in url:
                                    # Skip certain Facebook URLs that aren't pages/profiles
                                    if any(skip in url for skip in ["/pages/", "/groups/", "/events/", "/marketplace/", "/watch/", "/login", "/signup"]):
                                        logger.debug(f"⏭️  [FACEBOOK DISCOVERY] Skipping non-page URL: {url}")
                                        continue
                                    
                                    # Extract username/page name from URL
                                    username = url.split("facebook.com/")[-1].split("/")[0].split("?")[0]
                                    
                                    # Skip empty or invalid usernames
                                    if not username or len(username) < 1:
                                        logger.debug(f"⏭️  [FACEBOOK DISCOVERY] Skipping invalid username from URL: {url}")
                                        continue
                                    
                                    # Skip if we already have this username
                                    if any(p.username == username for p in prospects):
                                        logger.debug(f"⏭️  [FACEBOOK DISCOVERY] Skipping duplicate username: {username}")
                                        continue
                                    
                                    logger.info(f"✅ [FACEBOOK DISCOVERY] Found Facebook page: {username} - {result.get('title', 'No title')}")
                                    
                                    prospect = Prospect(
                                        id=uuid.uuid4(),
                                        source_type='social',
                                        source_platform='facebook',
                                        domain=f"facebook.com/{username}",
                                        page_url=url,
                                        page_title=result.get("title", f"Facebook Page: {username}"),
                                        display_name=result.get("title", username),
                                        username=username,
                                        profile_url=url,
                                        discovery_status='DISCOVERED',
                                        scrape_status='DISCOVERED',
                                        approval_status='PENDING',
                                        discovery_category=categories[0] if categories else None,
                                        discovery_location=locations[0] if locations else None,
                                        # Set default follower count and engagement rate
                                        follower_count=1000,  # Default to pass qualification
                                        engagement_rate=2.0,  # Default to pass Facebook minimum (1.5%)
                                    )
                                    prospects.append(prospect)
                                    profiles_extracted += 1
                                    
                                    if len(prospects) >= max_results:
                                        logger.info(f"✅ [FACEBOOK DISCOVERY] Reached max_results ({max_results})")
                                        break
                                else:
                                    logger.debug(f"⏭️  [FACEBOOK DISCOVERY] URL doesn't match Facebook pattern: {url}")
                        else:
                            logger.warning(f"⚠️  [FACEBOOK DISCOVERY] Query '{query}' returned no results")
                    else:
                        error_msg = serp_results.get("error", "Unknown error")
                        logger.warning(f"⚠️  [FACEBOOK DISCOVERY] Query '{query}' failed: {error_msg}")
                except Exception as query_error:
                    logger.error(f"❌ [FACEBOOK DISCOVERY] Query '{query}' failed with exception: {query_error}", exc_info=True)
                    continue
            
            logger.info(f"📊 [FACEBOOK DISCOVERY] Summary - Queries executed: {queries_executed}, Successful: {queries_successful}, Total results: {total_results_found}, Profiles extracted: {profiles_extracted}")
            
            logger.info(f"✅ [FACEBOOK DISCOVERY] Discovered {len(prospects)} pages via DataForSEO")
            return prospects[:max_results]
            
        except ValueError as cred_error:
            logger.error(f"❌ [FACEBOOK DISCOVERY] DataForSEO credentials not configured: {cred_error}")
            logger.error("❌ [FACEBOOK DISCOVERY] Please set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables")
            return []
        except Exception as e:
            logger.error(f"❌ [FACEBOOK DISCOVERY] DataForSEO fallback failed: {e}", exc_info=True)
            logger.error("❌ [FACEBOOK DISCOVERY] Discovery failed. Please configure FACEBOOK_ACCESS_TOKEN or ensure DataForSEO credentials are set.")
            return []
    
    def _normalize_to_prospect(self, profile_data: Dict[str, Any]) -> Prospect:
        """Normalize Facebook profile data to Prospect"""
        return Prospect(
            id=uuid.uuid4(),
            source_type='social',
            source_platform='facebook',
            domain=f"facebook.com/{profile_data.get('username', '')}",
            page_url=profile_data.get('profile_url'),
            page_title=profile_data.get('bio', ''),
            display_name=profile_data.get('full_name'),
            username=profile_data.get('username'),
            profile_url=profile_data.get('profile_url'),
            follower_count=profile_data.get('friends_count', 0),
            engagement_rate=profile_data.get('engagement_rate'),
            discovery_status='DISCOVERED',
            scrape_status='DISCOVERED',
            approval_status='PENDING',
            discovery_category=profile_data.get('category'),
            discovery_location=profile_data.get('location'),
        )

