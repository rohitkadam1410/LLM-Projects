import requests
from bs4 import BeautifulSoup
import re

def fetch_job_description(url: str) -> str:
    """
    Fetches job description text from a given URL.
    Attempts to parse common sites like LinkedIn, Indeed, Naukri, or generic fallbacks.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        # Basic logic to strip scripts and styles
        for script in soup(["script", "style"]):
            script.decompose()

        # Site-specific extraction attempts could go here
        # For now, we'll do a generic "best effort" extraction of the main content
        
        # Try to find common job description containers
        potential_classes = [
            # LinkedIn
            "description__text", 
            "core-section-container__content",
            "show-more-less-html__markup",
            # Indeed
            "jobsearch-JobComponent-description",
            "jobsearch-JobComponent",
            # Naukri (often tough, dynamic classes)
            "job-desc", 
            "styles_job-desc-container__", 
            # Generic
            "job-description",
            "description"
        ]
        
        text_content = ""
        
        # 1. Try specific classes
        for cls in potential_classes:
            element = soup.find(class_=re.compile(cls))
            if element:
                text_content = element.get_text(separator="\n").strip()
                break
        
        # 2. If no specific class found, try generic body text but cleaned
        if not text_content:
            text_content = soup.body.get_text(separator="\n").strip()

        # Clean up excessive newlines
        cleaned_text = re.sub(r'\n\s*\n', '\n\n', text_content)
        return cleaned_text

    except Exception as e:
        return f"Error fetching JD: {str(e)}"
