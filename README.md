# Autonomous Art Outreach Scraper

A production-grade Python web application for scraping art-related websites, extracting contact information, and automating personalized outreach emails.

## Features

- **Web Scraping**: Scrape art websites, galleries, portfolios, and social media platforms (Instagram, TikTok, Behance, Dribbble, Pinterest)
  - Automatic JS-rendered content detection with Playwright fallback
  - Art-related content detection using keyword heuristics
  - Rate limiting and error handling
  - Stores raw HTML, metadata, and links
- **Contact Extraction**: Automatically extract emails, social links, and contact pages
- **AI-Powered Emails**: Generate personalized outreach emails using OpenAI or Google Gemini
- **Email Sending**: Send emails via Gmail API or SMTP
- **Background Jobs**: Automated scraping and email sending using Celery or APScheduler
- **REST API**: FastAPI-based REST endpoints for all operations

## Project Structure

```
.
├── api/              # REST API endpoints
├── ai/               # LLM integrations (OpenAI, Gemini)
├── db/               # Database models and SQLAlchemy setup
├── emailer/          # Email sending logic (Gmail API, SMTP)
├── extractor/        # Email and social link extraction
├── jobs/             # Background schedulers (Celery, APScheduler)
├── scraper/          # Web crawling scripts
├── utils/            # Helper utilities and configuration
├── main.py           # FastAPI application entry point
├── requirements.txt  # Python dependencies
└── .env.example      # Environment variables template
```

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Install Playwright Browsers

```bash
playwright install chromium
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your API keys and credentials:

```bash
cp .env.example .env
```

Required configurations:
- **AI Provider**: Set `OPENAI_API_KEY` or `GEMINI_API_KEY` (or both)
- **Email**: Configure either Gmail API (`GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`) or SMTP (`SMTP_USER`, `SMTP_PASSWORD`)
- **Quality Filtering** (optional): Adjust `MIN_QUALITY_SCORE`, `MIN_DOMAIN_AUTHORITY`, `MIN_TRAFFIC_TIER` to control scraping criteria
- **Celery** (optional): Set `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND` if using Celery

### 4. Initialize Database

The database will be automatically created on first run. SQLite is used by default.

### 5. Run the Application

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Scraping
- `POST /api/v1/scrape` - Scrape a website (with quality filtering)
  - Body: `{"url": "https://example.com", "website_type": "optional"}`
  - Query param: `skip_quality_check=true` to bypass quality filter
- `POST /api/v1/scrape/social` - Scrape a social media profile
  - Query params: `username`, `platform` (instagram, tiktok, behance, pinterest)
- `GET /api/v1/websites` - List all scraped websites
  - Returns quality metrics: domain_authority, quality_score, estimated_traffic, etc.
- `GET /api/v1/websites/{id}/contacts` - Get contacts for a website

### Contact Extraction
- `POST /api/v1/websites/{id}/extract-contacts` - Manually trigger contact extraction
- `GET /api/v1/websites/{id}/contacts` - Get all extracted contacts for a website

### Email
- `POST /api/v1/emails/generate` - Generate outreach email using AI
- `POST /api/v1/emails/send` - Send an email
- `GET /api/v1/emails` - List all sent emails

### Health
- `GET /` - Root endpoint
- `GET /health` - Health check

## Database Models

- **ScrapedWebsite**: Stores scraped website information
  - Fields: url, domain, title, description, website_type, category, raw_html, metadata, is_art_related, status, timestamps
  - Quality metrics: domain_authority, quality_score, estimated_traffic, ssl_valid, domain_age_days, has_valid_dns, meets_quality_threshold
- **Contact**: Stores extracted contact information
  - Fields: email, phone_number, social_platform, social_url, contact_page_url, name, role, metadata
- **ContactForm**: Stores detected contact forms
  - Fields: form_url, form_action, form_method, form_fields, is_contact_form, metadata
- **OutreachEmail**: Tracks generated and sent emails
- **ScrapingJob**: Tracks background scraping jobs

## Scraping Engine (Phase 2)

The scraping engine includes:

### Website Scraping (`scrape_website`)
- Downloads HTML using Requests
- Automatic fallback to Playwright for JS-rendered content
- Extracts: links, titles, descriptions, meta tags (Open Graph, Twitter Cards)
- Content detection using keyword heuristics for 7 target categories:
  1. **Interior Decor**: interior decor, home decor, decorating, furniture, home styling, decorative arts
  2. **Art Gallery**: art gallery, gallery, art exhibition, art show, contemporary art, fine art, artwork
  3. **Home Tech**: home tech, smart home, home automation, smart devices, IoT home, connected home
  4. **Mom Blogs**: mom blog, mother blog, parenting blog, motherhood, mom tips, parenting advice
  5. **NFT Tech**: nft, nft marketplace, nft platform, nft display, crypto art, blockchain art, web3, metaverse
  6. **Editorial Media**: editorial, media house, publishing, magazine, journalism, media company, newsroom
  7. **Holiday/Family**: holiday, family, family holiday, holiday planning, family travel, family activities
- Rate limiting (10 requests per minute per domain)
- Retry logic with exponential backoff

### Quality Filtering System

The scraper now includes comprehensive quality filtering to only harvest high-quality sites:

#### Domain Authority Analysis
- Estimates domain authority (0-100) based on:
  - Domain extension (.com, .org, .net = higher)
  - Domain length (shorter = higher)
  - Subdomain count
  - SSL availability
- Configurable minimum domain authority threshold

#### Traffic Estimation
- Estimates monthly visitors based on domain characteristics
- Traffic tiers: very_low, low, medium, high, very_high
- Configurable minimum traffic tier requirement

#### Domain Authentication
- **SSL Certificate**: Validates SSL/TLS certificates
- **DNS Validation**: Checks for valid DNS records
- **Domain Age**: Placeholder for WHOIS-based domain age (can integrate with WHOIS APIs)

#### Quality Score
- Calculated quality score (0-100) based on:
  - Domain authority (40% weight)
  - Traffic tier (30% weight)
  - SSL validity (15% weight)
  - DNS validity (15% weight)
- Configurable minimum quality score threshold

#### Configuration
Set quality thresholds in `.env`:
```env
MIN_QUALITY_SCORE=50          # Minimum quality score (0-100)
MIN_DOMAIN_AUTHORITY=30       # Minimum domain authority (0-100)
MIN_TRAFFIC_TIER=low          # Minimum traffic tier
REQUIRE_SSL=True              # Require valid SSL certificate
REQUIRE_VALID_DNS=True        # Require valid DNS records
```

### Social Media Scraping (`scrape_social_media`)
- **Instagram**: Profile scraping with bio and metadata
- **TikTok**: Profile information extraction
- **Behance**: Portfolio and project data
- **Pinterest**: Board and pin information
- All platforms use Playwright for JS-rendered content
- Quality filtering is optional for social media (trusted platforms)

### Features
- Automatic duplicate detection (won't re-scrape existing URLs)
- Comprehensive error handling and logging
- Stores raw HTML for later processing
- Content classification (art, tech_blog, nft, mothers_tech, interior_design)
- Quality metrics stored in database:
  - Domain authority
  - Quality score
  - Estimated traffic
  - SSL validity
  - DNS validity
  - Domain age (when available)

### API Integration Ready
The system is designed to integrate with professional APIs for enhanced metrics:
- **Moz API**: Domain Authority
- **Ahrefs API**: Domain Rating
- **SimilarWeb API**: Traffic data
- **WHOIS APIs**: Domain age and registration info

## Contact Extraction (Phase 3)

The contact extraction module provides comprehensive contact information harvesting:

### Email Extraction (`extract_emails`)
- Uses regex patterns + BeautifulSoup parsing
- Extracts from:
  - Text content
  - `mailto:` links
  - Data attributes (`data-email`)
  - Meta tags
  - Script tags (embedded emails in JavaScript)
- Filters out false positives

### Phone Number Extraction (`extract_phone_numbers`)
- Supports multiple formats:
  - US/Canada: (123) 456-7890, 123-456-7890, 123.456.7890
  - International: +1 123 456 7890, +44 20 1234 5678
  - With extensions: 123-456-7890 ext 123
  - Toll-free: 1-800-123-4567
- Extracts from:
  - Text content
  - `tel:` links
  - Data attributes (`data-phone`)
- Normalizes phone number formats

### Social Link Extraction (`extract_social_links`)
- Detects platforms:
  - Instagram, TikTok, Behance, Dribbble, Pinterest
  - Twitter/X, Facebook, LinkedIn, YouTube, Snapchat
- Extracts from:
  - Links (`<a>` tags)
  - Social icon classes (Font Awesome, etc.)
  - Text content
  - Meta tags (Open Graph, Twitter Cards)
- Returns full URLs and usernames

### Contact Form Detection (`extract_contact_forms`)
- Detects HTML forms that appear to be contact forms
- Extracts:
  - Form action URL
  - Form method (GET/POST)
  - Form fields (input, textarea, select)
  - Field labels and placeholders
  - Required field indicators
- Identifies contact forms using keyword matching

### Contact Page Crawler (`detect_contact_page`)
- Automatically crawls common contact page paths:
  - `/contact`, `/about`, `/support`, `/info`, `/team`
  - `/contact-us`, `/get-in-touch`, `/reach-us`, `/connect`
  - `/about-us`, `/contact.html`, `/about.html`
- Validates pages by checking for contact-related content
- Extracts contacts from all found contact pages

### Features
- **Automatic Extraction**: Runs automatically after website scraping
- **Manual Trigger**: Can be triggered via API endpoint
- **Comprehensive Coverage**: Extracts from main page + all contact pages
- **Database Storage**: All contacts saved with source page URL
- **Duplicate Prevention**: Won't save duplicate contacts

## Background Jobs

The application supports two job scheduling systems:

1. **APScheduler**: Lightweight, in-process scheduler (enabled by default)
2. **Celery**: Distributed task queue (requires Redis)

Jobs are configured to run:
- Daily scraping at 2 AM
- Hourly email sending

## Verification

Run the setup verification script:

```bash
python verify_setup.py
```

This will check:
- All imports are working
- Configuration is loaded
- Required files exist

## Development

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
black .
```

### API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Dashboard Integration

The API is ready for TypeScript/Next.js integration. See `API_DOCUMENTATION.md` for:
- Complete endpoint documentation
- TypeScript example functions
- Response schemas
- Integration guide

## Project Status

✅ **All 7 Phases Complete**

- Phase 1: Foundation & Structure
- Phase 2: Scraping Engine
- Phase 3: Contact Extraction
- Phase 4: LLM Integration
- Phase 5: Email Sender
- Phase 6: Automation Pipeline (24/7)
- Phase 7: Dashboard API

The system is production-ready and running 24/7 automation!

## License

MIT
