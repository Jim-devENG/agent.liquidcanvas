"""
Email extraction from web pages
"""
import re
from typing import List, Set
from bs4 import BeautifulSoup


class EmailExtractor:
    """Extract email addresses from web content"""
    
    # Email regex pattern
    EMAIL_PATTERN = re.compile(
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    )
    
    def extract_from_html(self, html_content: str) -> List[str]:
        """
        Extract emails from HTML content using regex + BeautifulSoup
        
        Args:
            html_content: HTML string
            
        Returns:
            List of unique email addresses
        """
        emails: Set[str] = set()
        
        soup = BeautifulSoup(html_content, "lxml")
        
        # Extract from text content
        text_content = soup.get_text()
        found_emails = self.EMAIL_PATTERN.findall(text_content)
        emails.update(found_emails)
        
        # Extract from mailto links
        for link in soup.find_all("a", href=True):
            href = link.get("href", "")
            if href.startswith("mailto:"):
                email = href.replace("mailto:", "").split("?")[0].strip()
                if self._is_valid_email(email):
                    emails.add(email)
        
        # Extract from data attributes
        for tag in soup.find_all(attrs={"data-email": True}):
            email = tag.get("data-email", "").strip()
            if self._is_valid_email(email):
                emails.add(email)
        
        # Extract from meta tags
        for meta in soup.find_all("meta"):
            content = meta.get("content", "")
            if "@" in content:
                found = self.EMAIL_PATTERN.findall(content)
                emails.update(found)
        
        # Extract from script tags (some sites embed emails in JS)
        for script in soup.find_all("script"):
            if script.string:
                found = self.EMAIL_PATTERN.findall(script.string)
                emails.update(found)
        
        # Filter out common false positives
        filtered_emails = [e.lower().strip() for e in emails if self._is_valid_email(e)]
        
        return list(set(filtered_emails))
    
    def extract_from_text(self, text: str) -> List[str]:
        """
        Extract emails from plain text
        
        Args:
            text: Plain text string
            
        Returns:
            List of unique email addresses
        """
        emails = self.EMAIL_PATTERN.findall(text)
        filtered_emails = [e for e in emails if self._is_valid_email(e)]
        return list(set(filtered_emails))
    
    def _is_valid_email(self, email: str) -> bool:
        """Validate email address and filter out common false positives"""
        if not email or len(email) < 5:
            return False
        
        # Filter out common false positives
        false_positives = [
            "example.com",
            "email.com",
            "domain.com",
            "your-email.com",
            "xxx@xxx",
            "test@test"
        ]
        
        email_lower = email.lower()
        for fp in false_positives:
            if fp in email_lower:
                return False
        
        return True

