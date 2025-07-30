#!/usr/bin/env python3
"""
Improved RSS Feed Aggregator for Finance Links
Enhanced reliability with retry logic, connection pooling, and better error handling
"""

import asyncio
import hashlib
import json
import logging
import os
import re
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple
from urllib.parse import urlparse

import aiohttp
import feedparser
from bs4 import BeautifulSoup
from dateutil import parser as date_parser

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('aggregation.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class FeedAggregator:
    def __init__(self, config_path: str = "src/config/sources.json"):
        self.config_path = Path(config_path)
        self.output_dir = Path("src/content/links")
        self.state_file = Path("scripts/aggregator_state.json")
        self.sources = []
        self.config = {}
        self.state = self.load_state()
        self.session = None
        
        # Enhanced configuration
        self.retry_config = {
            'max_retries': 3,
            'backoff_factor': 2,
            'timeout': 45,
            'batch_size': 8,  # Process feeds in smaller batches
            'delay_between_batches': 2
        }
        
    def load_state(self) -> Dict:
        """Load aggregator state from file"""
        if self.state_file.exists():
            try:
                with open(self.state_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load state: {e}")
        return {
            'last_run': None,
            'processed_hashes': [],
            'source_errors': {},
            'successful_runs': {},
            'stats': {
                'total_processed': 0,
                'total_new': 0,
                'total_duplicates': 0,
                'total_errors': 0
            }
        }
    
    def save_state(self):
        """Save aggregator state to file"""
        try:
            self.state_file.parent.mkdir(exist_ok=True)
            # Keep hash list size manageable
            if len(self.state['processed_hashes']) > 5000:
                self.state['processed_hashes'] = self.state['processed_hashes'][-5000:]
            
            with open(self.state_file, 'w') as f:
                json.dump(self.state, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save state: {e}")
    
    def load_config(self):
        """Load RSS sources - simplified list of most reliable sources"""
        self.sources = [
            # === MARKETS (Stocks, Trading, Corporate) ===
            {'id': 'bloomberg-markets', 'name': 'Bloomberg Markets', 'url': 'https://feeds.bloomberg.com/markets/news.rss', 'category': 'markets', 'priority': 1},
            {'id': 'reuters-business', 'name': 'Reuters Business', 'url': 'https://feeds.reuters.com/reuters/businessNews', 'category': 'markets', 'priority': 1},
            {'id': 'ft-markets', 'name': 'Financial Times', 'url': 'https://www.ft.com/markets?format=rss', 'category': 'markets', 'priority': 1},
            {'id': 'wsj-markets', 'name': 'Wall Street Journal', 'url': 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', 'category': 'markets', 'priority': 1},
            {'id': 'cnbc-markets', 'name': 'CNBC Markets', 'url': 'https://www.cnbc.com/id/10000664/device/rss/rss.html', 'category': 'markets', 'priority': 1},
            {'id': 'marketwatch', 'name': 'MarketWatch', 'url': 'https://feeds.marketwatch.com/marketwatch/topstories', 'category': 'markets', 'priority': 2},
            {'id': 'yahoo-finance', 'name': 'Yahoo Finance', 'url': 'https://finance.yahoo.com/news/rssindex', 'category': 'markets', 'priority': 2},
            {'id': 'business-insider', 'name': 'Business Insider', 'url': 'https://feeds.businessinsider.com/custom/all', 'category': 'markets', 'priority': 2},
            
            # === MACRO ECONOMICS ===
            {'id': 'bloomberg-economics', 'name': 'Bloomberg Economics', 'url': 'https://feeds.bloomberg.com/economics/news.rss', 'category': 'macro', 'priority': 1},
            {'id': 'economist-finance', 'name': 'The Economist', 'url': 'https://www.economist.com/finance-and-economics/rss.xml', 'category': 'macro', 'priority': 2},
            
            # Central Banks & Policy
            {'id': 'fed-news', 'name': 'Federal Reserve', 'url': 'https://www.federalreserve.gov/feeds/press_all.xml', 'category': 'policy', 'priority': 1},
            {'id': 'ecb-press', 'name': 'European Central Bank', 'url': 'https://www.ecb.europa.eu/rss/press.html', 'category': 'policy', 'priority': 1},
            {'id': 'imf-news', 'name': 'IMF News', 'url': 'https://www.imf.org/en/News/RSS', 'category': 'policy', 'priority': 2},
            
            # Research
            {'id': 'bis-papers', 'name': 'BIS Papers', 'url': 'https://www.bis.org/doclist/rss_all_categories.rss', 'category': 'research', 'priority': 2},
            {'id': 'marginal-revolution', 'name': 'Marginal Revolution', 'url': 'https://marginalrevolution.com/feed', 'category': 'non-money', 'priority': 2},
            {'id': 'calculated-risk', 'name': 'Calculated Risk', 'url': 'https://www.calculatedriskblog.com/feeds/posts/default', 'category': 'macro', 'priority': 2},
            
            # === INDIAN MARKETS ===
            {'id': 'et-markets', 'name': 'Economic Times', 'url': 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', 'category': 'markets', 'priority': 2},
            {'id': 'thehindubusinessline', 'name': 'Hindu BusinessLine', 'url': 'https://www.thehindubusinessline.com/markets/?service=rss', 'category': 'markets', 'priority': 2},
            
            # Technology
            {'id': 'techmeme', 'name': 'Techmeme', 'url': 'https://www.techmeme.com/feed.xml', 'category': 'technology', 'priority': 2},
            
            # Filings
            {'id': 'sec-press-releases', 'name': 'SEC Press Releases', 'url': 'https://www.sec.gov/news/pressreleases.rss', 'category': 'policy', 'priority': 2},
            
            # Indian Policy & Regulation
            {'id': 'rbi-press', 'name': 'RBI Press Releases', 'url': 'https://www.rbi.org.in/pressreleases_rss.xml', 'category': 'policy', 'priority': 1},
            {'id': 'sebi-news', 'name': 'SEBI', 'url': 'https://www.sebi.gov.in/sebirss.xml', 'category': 'policy', 'priority': 2},
            
            # Additional Research Sources
            {'id': 'nber-papers', 'name': 'NBER Working Papers', 'url': 'https://back.nber.org/rss/new.xml', 'category': 'research', 'priority': 2},
            {'id': 'fred-blog', 'name': 'FRED Blog', 'url': 'https://fredblog.stlouisfed.org/feed/', 'category': 'research', 'priority': 2},
            {'id': 'of-dollars-data', 'name': 'Of Dollars And Data', 'url': 'https://ofdollarsanddata.com/feed/', 'category': 'markets', 'priority': 2},
            {'id': 'our-world-data', 'name': 'Our World in Data', 'url': 'https://ourworldindata.org/feed', 'category': 'research', 'priority': 2},
            {'id': 'pew-research', 'name': 'Pew Research Center', 'url': 'https://www.pewresearch.org/feed', 'category': 'research', 'priority': 2},
            {'id': 'rmi-energy', 'name': 'RMI', 'url': 'https://rmi.org/feed/', 'category': 'technology', 'priority': 2},
            
            # Commentary & Opinion
            {'id': 'project-syndicate', 'name': 'Project Syndicate', 'url': 'https://www.project-syndicate.org/rss', 'category': 'blogs', 'priority': 2},
            
            # Asian Markets
            {'id': 'nikkei-asia', 'name': 'Nikkei Asia', 'url': 'https://asia.nikkei.com/rss/feed/nar', 'category': 'markets', 'priority': 2},
            
            # Technology & Global
            {'id': 'rest-of-world', 'name': 'Rest of World', 'url': 'https://restofworld.org/feed', 'category': 'technology', 'priority': 2},
            
            # Culture & Ideas
            {'id': 'lrb', 'name': 'London Review of Books', 'url': 'https://www.lrb.co.uk/feeds/rss', 'category': 'non-money', 'priority': 3},
            {'id': 'aeon', 'name': 'Aeon Magazine', 'url': 'https://aeon.co/feed.rss', 'category': 'non-money', 'priority': 3},
            {'id': 'yale-e360', 'name': 'Yale E360', 'url': 'https://e360.yale.edu/feed.xml', 'category': 'non-money', 'priority': 3},
            {'id': 'freakonomics', 'name': 'Freakonomics', 'url': 'http://freakonomics.com/feed/', 'category': 'non-money', 'priority': 2},
            
            # Additional Markets & Analysis
            {'id': 'google-bloomberg', 'name': 'Google News (Bloomberg)', 'url': 'https://news.google.com/rss/search?q=when:24h+allinurl:bloomberg.com&hl=en-US&gl=US&ceid=US:en', 'category': 'markets', 'priority': 2},
            {'id': 'damodaran', 'name': 'Aswath Damodaran', 'url': 'http://aswathdamodaran.blogspot.com/feeds/posts/default', 'category': 'markets', 'priority': 2},
            {'id': 'lyn-alden', 'name': 'Lyn Alden', 'url': 'https://www.lynalden.com/feed/', 'category': 'markets', 'priority': 2},
            {'id': 'advisor-perspectives', 'name': 'Advisor Perspectives', 'url': 'https://www.advisorperspectives.com/content.rss', 'category': 'markets', 'priority': 2},
            {'id': 'wealth-common-sense', 'name': 'A Wealth of Common Sense', 'url': 'https://awealthofcommonsense.com/2025/07/feed/', 'category': 'markets', 'priority': 2},
            {'id': 'big-picture', 'name': 'The Big Picture', 'url': 'https://ritholtz.com/feed/', 'category': 'markets', 'priority': 2},
            {'id': 'meb-faber', 'name': 'Meb Faber Research', 'url': 'https://mebfaber.com/feed/', 'category': 'markets', 'priority': 2},
            
            # Macro Analysis
            {'id': 'bonddad', 'name': 'The Bonddad Blog', 'url': 'https://bonddad.blogspot.com/feeds/posts/default', 'category': 'macro', 'priority': 2},
            {'id': 'rzepczynski', 'name': 'Disciplined Systematic Global Macro', 'url': 'https://mrzepczynski.blogspot.com/feeds/posts/default', 'category': 'macro', 'priority': 2},
            {'id': 'allison-schrager', 'name': 'Known Unknowns', 'url': 'https://allisonschrager.substack.com/feed', 'category': 'macro', 'priority': 2},
            {'id': 'econbrowser-new', 'name': 'Econbrowser', 'url': 'https://econbrowser.com/feed', 'category': 'macro', 'priority': 2},
            {'id': 'conversable-economist', 'name': 'Conversable Economist', 'url': 'https://conversableeconomist.com/feed/', 'category': 'macro', 'priority': 2},
            
            # Policy & Research
            {'id': 'apollo-academy', 'name': 'Apollo Academy', 'url': 'https://www.apolloacademy.com/feed/', 'category': 'markets', 'priority': 2},
            {'id': 'ecfr', 'name': 'European Council on Foreign Relations', 'url': 'https://ecfr.eu/feed/', 'category': 'policy', 'priority': 2},
            {'id': 'foreign-affairs', 'name': 'Foreign Affairs', 'url': 'https://www.foreignaffairs.com/rss.xml', 'category': 'policy', 'priority': 2},
            {'id': 'ft-markets-main', 'name': 'FT Markets', 'url': 'https://www.ft.com/markets?format=rss', 'category': 'markets', 'priority': 1},
            {'id': 'nyt-business', 'name': 'NYT Business', 'url': 'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml', 'category': 'markets', 'priority': 1},
            {'id': 'nyt-economy', 'name': 'NYT Economy', 'url': 'https://rss.nytimes.com/services/xml/rss/nyt/Economy.xml', 'category': 'macro', 'priority': 1},
            {'id': 'nyt-technology', 'name': 'NYT Technology', 'url': 'https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml', 'category': 'technology', 'priority': 1},
            
            # === YOUTUBE CHANNELS (Videos) ===
            {'id': 'cnbc-tv18-youtube', 'name': 'CNBC-TV18', 'url': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCPP3etACgdUWvizcES1dJ8Q', 'category': 'videos', 'priority': 2},
            {'id': 'ndtv-profit-youtube', 'name': 'NDTV Profit India', 'url': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCXBD5iG5cr4ZYZ99K-fmDHg', 'category': 'videos', 'priority': 2},
            {'id': 'bloomberg-business-youtube', 'name': 'Bloomberg Business', 'url': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCIALMKvObZNtJ6AmdCLP7Lg', 'category': 'videos', 'priority': 2},
            {'id': 'aswath-damodaran-youtube', 'name': 'Aswath Damodaran', 'url': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCLvnJL8htRR1T9cbSccaoVw', 'category': 'videos', 'priority': 2},
            {'id': 'ppfas-youtube', 'name': 'PPFAS Mutual Fund', 'url': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCmDkUXGj6xVXl4169HqeS1w', 'category': 'videos', 'priority': 2},
            {'id': 'dwarkesh-patel-youtube', 'name': 'Dwarkesh Patel', 'url': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCZa18YV7qayTh-MRIrBhDpA', 'category': 'videos', 'priority': 2},
            {'id': 'trendlyne-youtube', 'name': 'Trendlyne', 'url': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCznm57tnYpUpc2q2FmO3R3Q', 'category': 'videos', 'priority': 2},
            {'id': 'novara-media-youtube', 'name': 'Novara Media', 'url': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCaVeJErxKLqNi1osok9H7MQ', 'category': 'videos', 'priority': 2},
            {'id': 'wsj-youtube', 'name': 'Wall Street Journal', 'url': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCMliswJ7oukCeW35GSayhRA', 'category': 'videos', 'priority': 2},
            {'id': 'norges-bank-youtube', 'name': 'Norges Bank Investment Management', 'url': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCRhQsN8AVIfZuBNeRV1A37w', 'category': 'videos', 'priority': 2},
            {'id': 'harvard-hbs-youtube', 'name': 'Harvard Business School', 'url': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCFWULCY5B97CwS2VI-upZuA', 'category': 'videos', 'priority': 2},
            {'id': 'cfa-society-india-youtube', 'name': 'CFA Institute', 'url': 'https://www.youtube.com/feeds/videos.xml?channel_id=UC8Zy7crsNBL8NJCc_ueF-CA', 'category': 'videos', 'priority': 2},
            {'id': 'wocomo-docs-youtube', 'name': 'Wocomo Docs', 'url': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCymrhn6xwPcP_9vteK-zBeQ', 'category': 'videos', 'priority': 2},
            {'id': 'invest-with-marcellus-youtube', 'name': 'Invest with Marcellus', 'url': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCjK6_t5lCGl_cX7x7ToBfDQ', 'category': 'videos', 'priority': 2},
            {'id': 'microcap-club-youtube', 'name': 'MicroCap Club', 'url': 'https://www.youtube.com/feeds/videos.xml?channel_id=UCzX4HLkD7eXBgzVwHMZlhmg', 'category': 'videos', 'priority': 2},
        ]
        
        # Sort by priority (1 = highest priority)
        self.sources.sort(key=lambda x: x.get('priority', 3))
        
        self.config = {
            'max_item_age': 30,
            'max_items_per_source': 50,
            'duplicate_threshold': 0.85,
            'breaking_keywords': ['breaking', 'alert', 'flash', 'urgent', 'crisis'],
            'priority_keywords': {
                'high': ['fed', 'ecb', 'rbi', 'rate', 'policy', 'gdp', 'inflation'],
                'normal': [],
                'low': ['opinion', 'analysis', 'outlook']
            }
        }
    
    def generate_content_hash(self, title: str, url: str, content: str) -> str:
        """Generate unique hash for content deduplication"""
        combined = f"{title.lower().strip()}{url}{content[:500].lower().strip()}"
        return hashlib.sha256(combined.encode()).hexdigest()[:16]
    
    def clean_html(self, html: str) -> str:
        """Clean HTML and extract text"""
        if not html:
            return ""
        try:
            soup = BeautifulSoup(html, 'lxml')
            for script in soup(["script", "style"]):
                script.decompose()
            text = soup.get_text()
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            return text[:1000]
        except Exception as e:
            logger.warning(f"HTML cleaning failed: {e}")
            return html[:1000] if html else ""
    
    def extract_tags(self, title: str, content: str, category: str) -> List[str]:
        """Extract relevant tags from content"""
        text = f"{title} {content}".lower()
        tags = [category.title()]
        
        tag_patterns = {
            'Earnings': r'\b(earnings|results|profit|revenue|quarter)\b',
            'M&A': r'\b(merger|acquisition|deal|takeover|buyout)\b',
            'IPO': r'\b(ipo|listing|public offering)\b',
            'Crypto': r'\b(bitcoin|crypto|ethereum|blockchain)\b',
            'AI': r'\b(artificial intelligence|ai|machine learning)\b',
            'ESG': r'\b(esg|sustainable|climate|green)\b',
            'Debt': r'\b(bond|debt|yield|treasury)\b',
            'Currency': r'\b(dollar|euro|yen|rupee|forex|fx)\b',
            'Commodities': r'\b(oil|gold|silver|commodity)\b',
            'Tech': r'\b(tech|software|silicon valley|startup)\b'
        }
        
        for tag, pattern in tag_patterns.items():
            if re.search(pattern, text):
                tags.append(tag)
        
        return list(set(tags))[:5]
    
    def determine_priority(self, title: str, content: str) -> str:
        """Determine content priority based on keywords"""
        text = f"{title} {content}".lower()
        
        for keyword in self.config['breaking_keywords']:
            if keyword in text:
                return 'breaking'
        
        for keyword in self.config['priority_keywords']['high']:
            if keyword in text:
                return 'high'
        
        for keyword in self.config['priority_keywords']['low']:
            if keyword in text:
                return 'low'
        
        return 'normal'
    
    async def fetch_feed_with_retry(self, source: Dict) -> List[Dict]:
        """Fetch feed with exponential backoff retry"""
        for attempt in range(self.retry_config['max_retries']):
            try:
                return await self.fetch_feed(source)
            except Exception as e:
                if attempt == self.retry_config['max_retries'] - 1:
                    logger.error(f"Failed to fetch {source['name']} after {attempt + 1} attempts: {e}")
                    self.state['source_errors'][source['id']] = self.state['source_errors'].get(source['id'], 0) + 1
                    return []
                
                wait_time = self.retry_config['backoff_factor'] ** attempt
                logger.warning(f"Retrying {source['name']} in {wait_time}s (attempt {attempt + 1})")
                await asyncio.sleep(wait_time)
        
        return []
    
    async def fetch_feed(self, source: Dict) -> List[Dict]:
        """Fetch and parse RSS feed with error handling"""
        items = []
        
        try:
            # Enhanced headers for better compatibility
            headers = {
                'User-Agent': 'Mozilla/5.0 (compatible; FinanceAggregator/2.0)',
                'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
            
            timeout = aiohttp.ClientTimeout(total=self.retry_config['timeout'])
            
            async with self.session.get(
                source['url'],
                timeout=timeout,
                headers=headers,
                ssl=False  # More permissive SSL for compatibility
            ) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}")
                
                content = await response.text()
                feed = feedparser.parse(content)
                
                if feed.bozo and feed.bozo_exception:
                    logger.warning(f"Feed parsing issues for {source['name']}: {feed.bozo_exception}")
                
                max_items = min(len(feed.entries), self.config['max_items_per_source'])
                
                for entry in feed.entries[:max_items]:
                    try:
                        # Parse date with multiple fallbacks
                        pub_date = None
                        for date_field in ['published_parsed', 'updated_parsed', 'created_parsed']:
                            if hasattr(entry, date_field) and getattr(entry, date_field):
                                try:
                                    pub_date = datetime(*getattr(entry, date_field)[:6], tzinfo=timezone.utc)
                                    break
                                except:
                                    continue
                        
                        if not pub_date:
                            pub_date = datetime.now(timezone.utc)
                        
                        # Handle future dates and "coming soon" announcements
                        # If the date is more than 1 day in the future, it's likely an announcement
                        # Set it to current time minus 1 hour to keep it visible but not at the top
                        if pub_date > datetime.now(timezone.utc) + timedelta(days=1):
                            pub_date = datetime.now(timezone.utc) - timedelta(hours=1)
                        
                        # Skip old items
                        if pub_date < datetime.now(timezone.utc) - timedelta(days=self.config['max_item_age']):
                            continue
                        
                        # Extract content with fallbacks
                        title = entry.get('title', 'Untitled').strip()
                        url = entry.get('link', '').strip()
                        
                        if not title or not url:
                            continue
                        
                        # Get summary/content
                        raw_summary = entry.get('summary', '')
                        if hasattr(entry, 'content') and entry.content:
                            raw_content = entry.content[0].get('value', '') if isinstance(entry.content, list) else entry.content.get('value', '')
                        else:
                            raw_content = raw_summary
                        
                        # Clean both summary and full content
                        summary = self.clean_html(raw_summary)
                        full_content = self.clean_html(raw_content)
                        
                        # Fallback if summary is empty
                        if not summary and full_content:
                            summary = full_content[:500]
                        
                        # Limit full content to reasonable size (5k chars)
                        full_content = full_content[:5000] if full_content else summary
                        
                        # Generate hash for deduplication
                        content_hash = self.generate_content_hash(title, url, summary)
                        
                        # Skip duplicates
                        if content_hash in self.state['processed_hashes']:
                            self.state['stats']['total_duplicates'] += 1
                            continue
                        
                        # Extract metadata using full content for better analysis
                        tags = self.extract_tags(title, full_content, source['category'])
                        priority = self.determine_priority(title, full_content)
                        
                        item = {
                            'id': f"{source['id']}-{content_hash}",
                            'sourceId': source['id'],
                            'sourceName': source['name'],
                            'title': title,
                            'url': url,
                            'summary': summary,
                            'fullContent': full_content,
                            'publishedAt': pub_date.isoformat(),
                            'fetchedAt': datetime.now(timezone.utc).isoformat(),
                            'category': source['category'],
                            'tags': tags,
                            'priority': priority,
                            'contentHash': content_hash
                        }
                        
                        items.append(item)
                        self.state['processed_hashes'].append(content_hash)
                        self.state['stats']['total_new'] += 1
                        
                    except Exception as e:
                        logger.error(f"Error processing entry from {source['name']}: {e}")
                        continue
                
                # Mark successful fetch
                self.state['successful_runs'][source['id']] = datetime.now(timezone.utc).isoformat()
                if source['id'] in self.state['source_errors']:
                    del self.state['source_errors'][source['id']]
                    
                logger.info(f"Successfully fetched {len(items)} items from {source['name']}")
                
        except Exception as e:
            logger.error(f"Failed to fetch {source['name']}: {e}")
            self.state['stats']['total_errors'] += 1
            raise
        
        return items
    
    async def aggregate_all_feeds(self):
        """Aggregate all RSS feeds with batching and improved error handling"""
        logger.info("Starting enhanced feed aggregation")
        
        # Connection pooling with more conservative settings
        connector = aiohttp.TCPConnector(
            limit=20,
            limit_per_host=3,
            keepalive_timeout=30,
            enable_cleanup_closed=True
        )
        
        timeout = aiohttp.ClientTimeout(total=None, sock_read=self.retry_config['timeout'])
        
        async with aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={'User-Agent': 'FinanceAggregator/2.0'}
        ) as self.session:
            
            all_items = []
            batch_size = self.retry_config['batch_size']
            
            # Process sources in batches by priority
            for i in range(0, len(self.sources), batch_size):
                batch = self.sources[i:i + batch_size]
                logger.info(f"Processing batch {i//batch_size + 1}/{(len(self.sources)-1)//batch_size + 1}")
                
                # Process batch concurrently
                tasks = [self.fetch_feed_with_retry(source) for source in batch]
                batch_results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Collect results and handle exceptions
                for j, result in enumerate(batch_results):
                    if isinstance(result, Exception):
                        logger.error(f"Batch error for {batch[j]['name']}: {result}")
                    else:
                        all_items.extend(result)
                
                # Delay between batches to be respectful
                if i + batch_size < len(self.sources):
                    await asyncio.sleep(self.retry_config['delay_between_batches'])
            
            # Sort by published date (newest first)
            all_items.sort(key=lambda x: x['publishedAt'], reverse=True)
            
            # Save items
            self.save_items(all_items)
            
            # Update state
            self.state['last_run'] = datetime.now(timezone.utc).isoformat()
            self.state['stats']['total_processed'] += len(all_items)
            
            self.save_state()
            
            # Log comprehensive stats
            logger.info(f"Aggregation complete:")
            logger.info(f"  - New items: {self.state['stats']['total_new']}")
            logger.info(f"  - Duplicates: {self.state['stats']['total_duplicates']}")
            logger.info(f"  - Errors: {self.state['stats']['total_errors']}")
            logger.info(f"  - Sources with errors: {len(self.state['source_errors'])}")
    
    def save_items(self, items: List[Dict]):
        """Save items as JSON files for Astro with improved organization"""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Group by date
        items_by_date = {}
        for item in items:
            date_str = item['publishedAt'][:10]  # YYYY-MM-DD
            if date_str not in items_by_date:
                items_by_date[date_str] = []
            items_by_date[date_str].append(item)
        
        # Save each day's items
        for date_str, date_items in items_by_date.items():
            file_path = self.output_dir / f"{date_str}.json"
            
            # Load existing items if file exists
            existing_items = []
            if file_path.exists():
                try:
                    with open(file_path, 'r') as f:
                        existing_items = json.load(f)
                except Exception as e:
                    logger.error(f"Failed to load existing items for {date_str}: {e}")
            
            # Merge and deduplicate by content hash
            existing_hashes = {item['contentHash'] for item in existing_items}
            new_items = [item for item in date_items if item['contentHash'] not in existing_hashes]
            
            if new_items:
                all_items = existing_items + new_items
                all_items.sort(key=lambda x: x['publishedAt'], reverse=True)
                
                # Limit items per day to prevent files from getting too large
                all_items = all_items[:200]
                
                try:
                    with open(file_path, 'w') as f:
                        json.dump(all_items, f, indent=2, ensure_ascii=False)
                    logger.info(f"Saved {len(new_items)} new items to {file_path} (total: {len(all_items)})")
                except Exception as e:
                    logger.error(f"Failed to save items for {date_str}: {e}")
    
    async def run(self):
        """Main entry point with comprehensive error handling"""
        try:
            self.load_config()
            await self.aggregate_all_feeds()
            logger.info("Feed aggregation completed successfully")
        except Exception as e:
            logger.error(f"Feed aggregation failed: {e}")
            raise

if __name__ == "__main__":
    try:
        aggregator = FeedAggregator()
        asyncio.run(aggregator.run())
    except KeyboardInterrupt:
        logger.info("Aggregation interrupted by user")
    except Exception as e:
        logger.error(f"Aggregation failed with error: {e}")
        sys.exit(1)