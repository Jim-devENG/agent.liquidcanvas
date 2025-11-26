"""
Content detection using heuristics for target categories
"""
from typing import Dict, List
from bs4 import BeautifulSoup


class ArtDetector:
    """Detect if a website is in target categories using keyword heuristics"""
    
    # 1. Interior Decor sites
    INTERIOR_DECOR_KEYWORDS = [
        "interior decor", "interior decorating", "home decor", "decorating",
        "home decoration", "room decor", "decor ideas", "interior decorator",
        "decorative", "home styling", "interior styling", "decor tips",
        "furniture", "home accessories", "decorative arts", "home furnishings"
    ]
    
    # 2. Art Gallery sites
    ART_GALLERY_KEYWORDS = [
        "art gallery", "gallery", "art exhibition", "art show", "art fair",
        "contemporary art", "fine art", "art collection", "art museum",
        "art dealer", "art curator", "artwork", "art pieces", "art display",
        "painting", "sculpture", "artistic", "visual art", "art studio",
        "artist", "illustrator", "photography", "photographer", "art market"
    ]
    
    # 3. Home tech sites
    HOME_TECH_KEYWORDS = [
        "home tech", "smart home", "home automation", "home technology",
        "smart devices", "home gadgets", "home electronics", "iot home",
        "connected home", "home innovation", "home tech reviews",
        "smart appliances", "home tech solutions", "residential tech"
    ]
    
    # 4. Mom blogs sites
    MOM_BLOGS_KEYWORDS = [
        "mom blog", "mother blog", "mommy blog", "parenting blog",
        "mom lifestyle", "motherhood", "mom tips", "mom advice",
        "parenting tips", "family blog", "mommy lifestyle", "mom stories",
        "parenting advice", "mom community", "motherhood blog"
    ]
    
    # 5. Tech sites for NFTs display tech
    NFT_TECH_KEYWORDS = [
        "nft", "non-fungible token", "nft marketplace", "nft platform",
        "nft display", "nft gallery", "crypto art", "blockchain art",
        "nft technology", "nft tech", "digital collectibles", "nft collection",
        "web3", "metaverse", "nft art", "nft showcase", "nft exhibition",
        "nft display technology", "nft viewing", "nft presentation"
    ]
    
    # 6. Editorial media houses
    EDITORIAL_MEDIA_KEYWORDS = [
        "editorial", "media house", "publishing", "magazine", "journalism",
        "editorial content", "media company", "publisher", "editorial team",
        "newsroom", "editorial department", "media outlet", "editorial design",
        "editorial photography", "editorial style", "editorial coverage",
        "media publication", "editorial work", "content creation"
    ]
    
    # 7. Holiday/family oriented sites
    HOLIDAY_FAMILY_KEYWORDS = [
        "holiday", "family", "family holiday", "holiday planning",
        "family travel", "holiday travel", "family vacation", "holiday ideas",
        "family activities", "holiday activities", "family fun", "holiday fun",
        "family entertainment", "holiday entertainment", "family lifestyle",
        "holiday lifestyle", "family events", "holiday events", "family time",
        "holiday traditions", "family traditions", "holiday celebration"
    ]
    
    # All relevant keywords combined
    ALL_RELEVANT_KEYWORDS = (
        INTERIOR_DECOR_KEYWORDS +
        ART_GALLERY_KEYWORDS +
        HOME_TECH_KEYWORDS +
        MOM_BLOGS_KEYWORDS +
        NFT_TECH_KEYWORDS +
        EDITORIAL_MEDIA_KEYWORDS +
        HOLIDAY_FAMILY_KEYWORDS
    )
    
    def is_art_related(self, soup: BeautifulSoup, url: str, text_content: str = None) -> bool:
        """
        Detect if website is in target categories
        
        Categories: interior_decor, art_gallery, home_tech, mom_blogs, 
                   nft_tech, editorial_media, holiday_family
        
        Args:
            soup: BeautifulSoup object
            url: URL of the page
            text_content: Optional pre-extracted text content
            
        Returns:
            True if relevant, False otherwise
        """
        if not soup and not text_content:
            return False
        
        # Extract text content if not provided
        if not text_content:
            text_content = soup.get_text().lower() if soup else ""
        
        url_lower = url.lower()
        combined_text = f"{url_lower} {text_content}"
        
        # Check for all relevant keywords
        keyword_count = sum(
            1 for keyword in self.ALL_RELEVANT_KEYWORDS
            if keyword in combined_text
        )
        
        # Check meta tags
        meta_keywords = self._extract_meta_keywords(soup)
        meta_keyword_count = sum(
            1 for keyword in self.ALL_RELEVANT_KEYWORDS
            if any(kw in meta.lower() for meta in meta_keywords for kw in [keyword])
        )
        
        # Check title and description
        title = ""
        description = ""
        if soup:
            title_tag = soup.find("title")
            if title_tag:
                title = title_tag.get_text().lower()
            
            meta_desc = soup.find("meta", attrs={"name": "description"})
            if meta_desc:
                description = meta_desc.get("content", "").lower()
        
        title_desc_count = sum(
            1 for keyword in self.ALL_RELEVANT_KEYWORDS
            if keyword in title or keyword in description
        )
        
        # Heuristic: If 3+ keywords found, likely relevant
        total_score = keyword_count + meta_keyword_count + title_desc_count
        return total_score >= 3
    
    def get_category(self, soup: BeautifulSoup, url: str, text_content: str = None) -> str:
        """
        Determine the specific category of the website
        
        Returns:
            Category: interior_decor, art_gallery, home_tech, mom_blogs, 
                     nft_tech, editorial_media, holiday_family, or unknown
        """
        if not soup and not text_content:
            return "unknown"
        
        if not text_content:
            text_content = soup.get_text().lower() if soup else ""
        
        url_lower = url.lower()
        combined_text = f"{url_lower} {text_content}"
        
        # Count matches for each category
        interior_decor_score = sum(1 for kw in self.INTERIOR_DECOR_KEYWORDS if kw in combined_text)
        art_gallery_score = sum(1 for kw in self.ART_GALLERY_KEYWORDS if kw in combined_text)
        home_tech_score = sum(1 for kw in self.HOME_TECH_KEYWORDS if kw in combined_text)
        mom_blogs_score = sum(1 for kw in self.MOM_BLOGS_KEYWORDS if kw in combined_text)
        nft_tech_score = sum(1 for kw in self.NFT_TECH_KEYWORDS if kw in combined_text)
        editorial_media_score = sum(1 for kw in self.EDITORIAL_MEDIA_KEYWORDS if kw in combined_text)
        holiday_family_score = sum(1 for kw in self.HOLIDAY_FAMILY_KEYWORDS if kw in combined_text)
        
        # Return category with highest score
        scores = {
            "interior_decor": interior_decor_score,
            "art_gallery": art_gallery_score,
            "home_tech": home_tech_score,
            "mom_blogs": mom_blogs_score,
            "nft_tech": nft_tech_score,
            "editorial_media": editorial_media_score,
            "holiday_family": holiday_family_score
        }
        
        max_category = max(scores, key=scores.get)
        return max_category if scores[max_category] > 0 else "unknown"
    
    def _extract_meta_keywords(self, soup: BeautifulSoup) -> List[str]:
        """Extract keywords from meta tags"""
        keywords = []
        
        if soup:
            # Meta keywords tag
            meta_keywords = soup.find("meta", attrs={"name": "keywords"})
            if meta_keywords:
                keywords.extend(meta_keywords.get("content", "").split(","))
            
            # Open Graph tags
            og_tags = soup.find_all("meta", property=lambda x: x and x.startswith("og:"))
            for tag in og_tags:
                content = tag.get("content", "")
                if content:
                    keywords.append(content)
        
        return [k.strip().lower() for k in keywords if k.strip()]
