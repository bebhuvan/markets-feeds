#!/usr/bin/env python3
"""
RSS Feed Aggregator for Finance Links
Robust, async implementation with error handling and deduplication
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
import yaml
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
            'stats': {
                'total_processed': 0,
                'total_new': 0,
                'total_duplicates': 0
            }
        }
    
    def save_state(self):
        """Save aggregator state to file"""
        try:
            self.state_file.parent.mkdir(exist_ok=True)
            with open(self.state_file, 'w') as f:
                json.dump(self.state, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Failed to save state: {e}")
    
    def load_config(self):
        """Load RSS sources with expanded major finance feeds"""
        self.sources = [
            # Major International Sources (Working & Validated)
            {'id': 'bloomberg-markets', 'name': 'Bloomberg Markets', 'url': 'https://feeds.bloomberg.com/markets/news.rss', 'category': 'markets'},
            {'id': 'bloomberg-economics', 'name': 'Bloomberg Economics', 'url': 'https://feeds.bloomberg.com/economics/news.rss', 'category': 'macro'},
            {'id': 'ft-markets', 'name': 'Financial Times', 'url': 'https://www.ft.com/markets?format=rss', 'category': 'markets'},
            {'id': 'ft-economics', 'name': 'FT Economics', 'url': 'https://www.ft.com/global-economy?format=rss', 'category': 'macro'},
            {'id': 'ft-technology', 'name': 'FT Technology', 'url': 'https://www.ft.com/technology?format=rss', 'category': 'technology'},
            {'id': 'reuters-main', 'name': 'Reuters', 'url': 'https://www.reuters.com/arc/outboundfeeds/rss/?outputType=xml', 'category': 'news'},
            {'id': 'rest-of-world', 'name': 'Rest of World', 'url': 'https://restofworld.org/feed/latest/', 'category': 'news'},
            {'id': 'bbc-business', 'name': 'BBC Business', 'url': 'https://feeds.bbci.co.uk/news/business/rss.xml', 'category': 'markets'},
            {'id': 'nikkei-asia', 'name': 'Nikkei Asia', 'url': 'https://asia.nikkei.com/rss/feed/nar', 'category': 'markets'},
            {'id': 'handelsblatt', 'name': 'Handelsblatt', 'url': 'https://www.handelsblatt.com/contentexport/feed/schlagzeilen', 'category': 'markets'},
            {'id': 'wsj-markets', 'name': 'Wall Street Journal', 'url': 'https://feeds.a.dj.com/rss/RSSMarketsMain.xml', 'category': 'markets'},
            {'id': 'wsj-economy', 'name': 'WSJ Economy', 'url': 'https://feeds.a.dj.com/rss/RSSWorldNews.xml', 'category': 'macro'},
            {'id': 'economist-finance', 'name': 'The Economist', 'url': 'https://www.economist.com/finance-and-economics/rss.xml', 'category': 'macro'},
            {'id': 'economist-business', 'name': 'Economist Business', 'url': 'https://www.economist.com/business/rss.xml', 'category': 'markets'},
            {'id': 'cnbc-markets', 'name': 'CNBC Markets', 'url': 'https://www.cnbc.com/id/10000664/device/rss/rss.html', 'category': 'markets'},
            {'id': 'cnbc-economy', 'name': 'CNBC Economy', 'url': 'https://www.cnbc.com/id/20910258/device/rss/rss.html', 'category': 'macro'},
            
            # Indian Sources (Working)
            {'id': 'et-markets', 'name': 'Economic Times', 'url': 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms', 'category': 'markets'},
            {'id': 'thehindubusinessline', 'name': 'Hindu BusinessLine', 'url': 'https://www.thehindubusinessline.com/markets/?service=rss', 'category': 'markets'},
            
            # Central Banks & Policy (Working)
            {'id': 'fed-news', 'name': 'Federal Reserve', 'url': 'https://www.federalreserve.gov/feeds/press_all.xml', 'category': 'policy'},
            {'id': 'ecb-press', 'name': 'European Central Bank', 'url': 'https://www.ecb.europa.eu/rss/press.html', 'category': 'policy'},
            {'id': 'fed-working-papers', 'name': 'Federal Reserve Working Papers', 'url': 'https://www.federalreserve.gov/feeds/working_papers.xml', 'category': 'research'},
            
            # Research & Analysis
            {'id': 'imf-news', 'name': 'IMF', 'url': 'https://www.imf.org/en/News/RSS', 'category': 'research'},
            {'id': 'bis-papers', 'name': 'BIS Papers', 'url': 'https://www.bis.org/doclist/rss_all_categories.rss', 'category': 'research'},
            {'id': 'cepr-discussion-papers', 'name': 'CEPR Discussion Papers', 'url': 'https://cepr.org/rss/discussion-paper', 'category': 'research'},
            {'id': 'cepr-news', 'name': 'CEPR News', 'url': 'https://cepr.org/rss/news', 'category': 'research'},
            {'id': 'imf-publications', 'name': 'IMF Publications', 'url': 'https://www.imf.org/en/Publications/RSS?language=eng', 'category': 'research'},
            {'id': 'imf-country-reports', 'name': 'IMF Staff Country Reports', 'url': 'https://www.imf.org/en/Publications/RSS?language=eng&series=IMF%20Staff%20Country%20Reports', 'category': 'research'},
            {'id': 'imf-discussion-notes', 'name': 'IMF Staff Discussion Notes', 'url': 'https://www.imf.org/en/Publications/RSS?language=eng&series=Staff%20Discussion%20Notes', 'category': 'research'},
            {'id': 'imf-news-special', 'name': 'IMF News Special', 'url': 'https://www.imf.org/en/News/RSS?TemplateID=%7B2FA3421A-F179-46B6-B8D9-5C65CB4A6584%7D', 'category': 'research'},
            
            # CFA Institute Research (Working)
            {'id': 'cfa-enterprising-investor', 'name': 'CFA Enterprising Investor', 'url': 'https://blogs.cfainstitute.org/investor/feed/', 'category': 'research'},
            {'id': 'cfa-inside-investing', 'name': 'CFA Inside Investing', 'url': 'https://blogs.cfainstitute.org/insideinvesting/feed/', 'category': 'research'},
            {'id': 'financial-analysts-journal', 'name': 'Financial Analysts Journal', 'url': 'https://www.tandfonline.com/feed/rss/ufaj20', 'category': 'research'},
            
            # Additional Quality Sources (Working)
            {'id': 'seeking-alpha', 'name': 'Seeking Alpha', 'url': 'https://seekingalpha.com/feed.xml', 'category': 'markets'},
            {'id': 'marketwatch', 'name': 'MarketWatch', 'url': 'https://feeds.marketwatch.com/marketwatch/topstories', 'category': 'markets'},
            {'id': 'investing-com', 'name': 'Investing.com', 'url': 'https://www.investing.com/rss/news.rss', 'category': 'markets'},
            
            # Premium Business Media (Working)
            {'id': 'barrons', 'name': "Barron's", 'url': 'https://feeds.a.dj.com/rss/RSSOpinion.xml', 'category': 'markets'},
            {'id': 'zerohedge', 'name': 'ZeroHedge', 'url': 'https://feeds.feedburner.com/zerohedge/feed', 'category': 'markets'},
            {'id': 'yahoo-finance', 'name': 'Yahoo Finance', 'url': 'https://finance.yahoo.com/news/rssindex', 'category': 'markets'},
            {'id': 'business-insider', 'name': 'Business Insider', 'url': 'https://feeds.businessinsider.com/custom/all', 'category': 'markets'},
            {'id': 'fortune', 'name': 'Fortune', 'url': 'https://fortune.com/feed/', 'category': 'markets'},
            
            # Asian Markets (Working)
            {'id': 'scmp-business', 'name': 'SCMP Business', 'url': 'https://www.scmp.com/rss/91/feed', 'category': 'markets'},
            
            # Economics Blogs & Major Substacks
            {'id': 'marginal-revolution', 'name': 'Marginal Revolution', 'url': 'https://marginalrevolution.com/feed', 'category': 'research'},
            {'id': 'noahpinion', 'name': 'Noah Smith', 'url': 'https://noahpinion.substack.com/feed', 'category': 'research'},
            {'id': 'construction-physics', 'name': 'Construction Physics', 'url': 'https://www.construction-physics.com/feed', 'category': 'research'},
            {'id': 'dave-nadig', 'name': 'Dave Nadig', 'url': 'https://davenadig.substack.com/feed', 'category': 'research'},
            {'id': 'calculated-risk', 'name': 'Calculated Risk', 'url': 'https://www.calculatedriskblog.com/feeds/posts/default', 'category': 'research'},
            {'id': 'econbrowser', 'name': 'Econbrowser', 'url': 'https://econbrowser.com/feed', 'category': 'research'},
            {'id': 'matt-levine', 'name': 'Matt Levine Money Stuff', 'url': 'https://www.bloomberg.com/opinion/authors/ARbTQlRLRjE/matthew-s-levine.rss', 'category': 'research'},
            {'id': 'net-interest', 'name': 'Net Interest (Marc Rubinstein)', 'url': 'https://netinterest.substack.com/feed', 'category': 'research'},
            {'id': 'the-acquirers-fund', 'name': 'The Acquirer\'s Multiple', 'url': 'https://acquirersmultiple.com/feed/', 'category': 'research'},
            {'id': 'doomberg', 'name': 'Doomberg', 'url': 'https://doomberg.substack.com/feed', 'category': 'research'},
            {'id': 'liberty-rpf', 'name': 'Liberty\'s Highlights', 'url': 'https://libertyrpf.substack.com/feed', 'category': 'research'},
            {'id': 'macro-compass', 'name': 'The Macro Compass', 'url': 'https://themacrocompass.substack.com/feed', 'category': 'macro'},
            {'id': 'investing-city', 'name': 'Investing City', 'url': 'https://investingcity.substack.com/feed', 'category': 'research'},
            
            # Specialized & Research (Working)
            {'id': 'oil-price', 'name': 'OilPrice.com', 'url': 'https://oilprice.com/rss/main', 'category': 'markets'},
            {'id': 'esg-today', 'name': 'ESG Today', 'url': 'https://www.esgtoday.com/feed/', 'category': 'research'},
            
            # Exchange Filings & Regulatory (Working)
            {'id': 'sec-press-releases', 'name': 'SEC Press Releases', 'url': 'https://www.sec.gov/news/pressreleases.rss', 'category': 'filings'},
            {'id': 'bse-notices', 'name': 'BSE Notices', 'url': 'https://www.bseindia.com/data/xml/notices.xml', 'category': 'filings'},
            {'id': 'nse-announcements', 'name': 'NSE Announcements', 'url': 'https://nsearchives.nseindia.com/content/RSS/Online_announcements.xml', 'category': 'filings'},
            
            # Academic Journals & Research (Working)
            {'id': 'brookings-economic-studies', 'name': 'Brookings Economic Studies', 'url': 'https://www.brookings.edu/feed/?post_type=research&programs_projects=economic-studies', 'category': 'research'},
            
            # Premium Sources & Newsletters (Working)
            
            # Technology & Innovation (Working)
            {'id': 'techmeme', 'name': 'Techmeme', 'url': 'https://www.techmeme.com/feed.xml', 'category': 'technology'},
            {'id': 'stratechery', 'name': 'Stratechery', 'url': 'https://stratechery.com/feed/', 'category': 'technology'},
            {'id': 'semianalysis', 'name': 'SemiAnalysis', 'url': 'https://www.semianalysis.com/feed', 'category': 'technology'},
            {'id': 'the-verge', 'name': 'The Verge', 'url': 'https://www.theverge.com/rss/index.xml', 'category': 'technology'},
            {'id': 'wired', 'name': 'Wired', 'url': 'https://www.wired.com/feed/rss', 'category': 'technology'},
            
            # Aggregators & Curated Feeds (Working)
            {'id': 'abnormal-returns', 'name': 'Abnormal Returns', 'url': 'https://abnormalreturns.com/feed/', 'category': 'research'},
            {'id': 'weekend-reads', 'name': 'Weekend Reads', 'url': 'https://weekendreads.substack.com/feed', 'category': 'research'},
            
            # Premium Newsletters & Analysis (Working)
            {'id': 'larry-swedroe', 'name': 'Larry Swedroe', 'url': 'https://larryswedroe.substack.com/feed', 'category': 'research'},
            {'id': 'nadig-etf', 'name': 'Dave Nadig (ETF)', 'url': 'https://www.nadig.com/feed', 'category': 'research'},
            {'id': 'adam-tooze', 'name': 'Adam Tooze', 'url': 'https://adamtooze.substack.com/feed', 'category': 'research'},
            {'id': 'brad-delong', 'name': 'Brad DeLong', 'url': 'https://braddelong.substack.com/feed', 'category': 'research'},
            {'id': 'venkatesh-rao', 'name': 'Venkatesh Rao', 'url': 'https://contraptions.venkateshrao.com/feed', 'category': 'research'},
            {'id': 'chip-letter', 'name': 'The Chip Letter', 'url': 'https://thechipletter.substack.com/feed', 'category': 'research'},
            {'id': 'china-talk', 'name': 'ChinaTalk', 'url': 'https://www.chinatalk.media/feed', 'category': 'research'},
            {'id': 'dwarkesh-podcast', 'name': 'Dwarkesh Podcast', 'url': 'https://www.dwarkesh.com/feed', 'category': 'research'},
            {'id': 'viks-newsletter', 'name': 'Viks Newsletter', 'url': 'https://www.viksnewsletter.com/feed', 'category': 'research'},
            {'id': 'gary-marcus', 'name': 'Gary Marcus', 'url': 'https://garymarcus.substack.com/feed', 'category': 'research'},
            {'id': 'platformer', 'name': 'Platformer', 'url': 'https://www.platformer.news/rss/', 'category': 'research'},
            {'id': 'the-zvi', 'name': 'The Zvi', 'url': 'https://thezvi.substack.com/feed', 'category': 'research'},
            {'id': 'paul-krugman', 'name': 'Paul Krugman', 'url': 'https://paulkrugman.substack.com/feed', 'category': 'research'},
            {'id': 'apricitas-economics', 'name': 'Apricitas Economics', 'url': 'http://www.apricitas.io/feed', 'category': 'research'},
            {'id': 'commodity-context', 'name': 'Commodity Context', 'url': 'https://www.commoditycontext.com/feed', 'category': 'research'},
            {'id': 'kyla-scanlon', 'name': 'Kyla Scanlon', 'url': 'https://kyla.substack.com/feed', 'category': 'research'},
            {'id': 'moontower-meta', 'name': 'Moontower Meta', 'url': 'https://moontower.substack.com/feed', 'category': 'research'},
            {'id': 'best-of-econ-twitter', 'name': 'Best of Econ Twitter', 'url': 'https://www.bestofecontwitter.com/feed', 'category': 'research'},
            
            # Non-Money Feeds & General Interest (Working)
            {'id': 'gaby-delvalle', 'name': 'Gaby Delvalle', 'url': 'https://gabydelvalle.substack.com/feed', 'category': 'non-money'},
            {'id': 'way-of-work', 'name': 'The Way of Work', 'url': 'https://newsletter.thewayofwork.com/feed', 'category': 'non-money'},
            {'id': 'benthams', 'name': 'Benthams', 'url': 'https://benthams.substack.com/feed', 'category': 'non-money'},
            {'id': 'leading-edge', 'name': 'The Leading Edge', 'url': 'https://newsletter.theleading-edge.org/feed', 'category': 'non-money'},
            {'id': 'astral-codex-ten', 'name': 'Astral Codex Ten', 'url': 'https://www.astralcodexten.com/feed', 'category': 'non-money'},
            {'id': 'freddie-deboer', 'name': 'Freddie deBoer', 'url': 'https://freddiedeboer.substack.com/feed', 'category': 'non-money'},
            {'id': 'res-obscura', 'name': 'Res Obscura', 'url': 'https://resobscura.substack.com/feed', 'category': 'non-money'},
            {'id': 'nicholas-decker', 'name': 'Nicholas Decker', 'url': 'https://nicholasdecker.substack.com/feed', 'category': 'non-money'},
            {'id': 'max-read', 'name': 'Max Read', 'url': 'https://maxread.substack.com/feed', 'category': 'non-money'},
            {'id': 'henrik-karlsson', 'name': 'Henrik Karlsson', 'url': 'https://www.henrikkarlsson.xyz/feed', 'category': 'non-money'},
            {'id': 'visakan-veerasamy', 'name': 'Visakan Veerasamy', 'url': 'https://visakanv.substack.com/feed', 'category': 'non-money'},
            {'id': 'simon-sarris', 'name': 'Simon Sarris', 'url': 'https://map.simonsarris.com/feed', 'category': 'non-money'},
            {'id': 'ai-log-blog', 'name': 'AI Log Blog', 'url': 'https://ailogblog.substack.com/feed', 'category': 'non-money'},
            {'id': 'unhappy-man', 'name': 'The Unhappy Man', 'url': 'https://theunhappyman.substack.com/feed', 'category': 'non-money'},
            {'id': 'experimental-history', 'name': 'Experimental History', 'url': 'https://www.experimental-history.com/feed', 'category': 'non-money'},
            {'id': 'age-of-invention', 'name': 'Age of Invention', 'url': 'https://www.ageofinvention.xyz/feed', 'category': 'non-money'},
            {'id': 'not-boring', 'name': 'Not Boring', 'url': 'https://www.notboring.co/feed', 'category': 'non-money'},
            {'id': 'roots-of-progress', 'name': 'Roots of Progress', 'url': 'https://newsletter.rootsofprogress.org/feed', 'category': 'non-money'},
            {'id': 'nate-silver', 'name': 'Nate Silver', 'url': 'https://www.natesilver.net/feed', 'category': 'non-money'},
            {'id': 'public-policy-ss', 'name': 'Public Policy', 'url': 'https://publicpolicy.substack.com/feed', 'category': 'non-money'},
            {'id': 'branko-milanovic', 'name': 'Branko Milanovic', 'url': 'https://branko2f7.substack.com/feed', 'category': 'non-money'},
            {'id': 'aeon-magazine', 'name': 'Aeon', 'url': 'https://aeon.co/feed.rss', 'category': 'non-money'},
            {'id': 'psyche-magazine', 'name': 'Psyche', 'url': 'https://psyche.co/feed.rss', 'category': 'non-money'},
            {'id': 'common-reader', 'name': 'Common Reader', 'url': 'https://www.commonreader.co.uk/feed', 'category': 'non-money'},
            {'id': 'summer-of-protocols', 'name': 'Summer of Protocols', 'url': 'https://protocolized.summerofprotocols.com/feed', 'category': 'non-money'},
            {'id': 'nautilus-magazine', 'name': 'Nautilus', 'url': 'https://nautil.us/feed/?_sp=b0840929-e993-4908-b182-0a086cc42588.1739703703525', 'category': 'non-money'},
            {'id': 'noema-magazine', 'name': 'Noema', 'url': 'https://www.noemamag.com/?feed=noemarss', 'category': 'non-money'},
            {'id': 'n-plus-one', 'name': 'n+1', 'url': 'https://www.nplusonemag.com/feed/', 'category': 'non-money'},
            {'id': 'quanta-magazine', 'name': 'Quanta Magazine', 'url': 'https://www.quantamagazine.org/feed/', 'category': 'non-money'},
            {'id': 'programmable-mutter', 'name': 'Programmable Mutter', 'url': 'https://www.programmablemutter.com/feed', 'category': 'non-money'},
            {'id': 'back-of-mind', 'name': 'Back of Mind', 'url': 'https://backofmind.substack.com/feed', 'category': 'non-money'},
            {'id': 'marginal-revolution', 'name': 'Marginal Revolution', 'url': 'https://marginalrevolution.com/feed', 'category': 'non-money'},
            {'id': 'dave-karpf', 'name': 'Dave Karpf', 'url': 'https://davekarpf.substack.com/feed', 'category': 'non-money'},
            {'id': 'woman-of-letters', 'name': 'Woman of Letters', 'url': 'https://www.woman-of-letters.com/feed', 'category': 'non-money'},
            {'id': 'school-unconformed', 'name': 'School of the Unconformed', 'url': 'https://schooloftheunconformed.substack.com/feed', 'category': 'non-money'},
            {'id': 'honest-broker', 'name': 'The Honest Broker', 'url': 'https://www.honest-broker.com/feed', 'category': 'non-money'},
            {'id': 'works-in-progress', 'name': 'Works in Progress', 'url': 'https://www.worksinprogress.news/feed', 'category': 'non-money'},
            {'id': 'construction-physics', 'name': 'Construction Physics', 'url': 'https://www.construction-physics.com/feed', 'category': 'non-money'},
            {'id': 'rotten-and-good', 'name': 'Rotten and Good', 'url': 'https://rottenandgood.substack.com/feed', 'category': 'non-money'},
            {'id': 'over-the-field', 'name': 'Over the Field', 'url': 'https://overthefield.substack.com/feed', 'category': 'non-money'},
            {'id': 'nils-gilman', 'name': 'Nils Gilman', 'url': 'https://nilsgilman.substack.com/feed', 'category': 'non-money'},
            {'id': 'pens-and-poison', 'name': 'Pens and Poison', 'url': 'https://www.pensandpoison.org/feed', 'category': 'non-money'},
            {'id': 'noah-smith', 'name': 'Noah Smith', 'url': 'https://www.noahpinion.blog/feed', 'category': 'non-money'},
            {'id': 'jacobin', 'name': 'Jacobin', 'url': 'https://jacobin.com/feed/', 'category': 'non-money'},
            {'id': 'new-left-review', 'name': 'New Left Review', 'url': 'https://newleftreview.org/feed', 'category': 'non-money'},
            {'id': 'small-potatoes', 'name': 'Small Potatoes', 'url': 'https://smallpotatoes.paulbloom.net/feed', 'category': 'non-money'},
            {'id': 'shruti-rajagopalan', 'name': 'Shruti Rajagopalan', 'url': 'https://srajagopalan.substack.com/feed', 'category': 'non-money'},
            {'id': 'rohan-venkat', 'name': 'Rohan Venkat', 'url': 'https://rohanvenkat.substack.com/feed', 'category': 'non-money'},
            {'id': 'africanist-perspective', 'name': 'Africanist Perspective', 'url': 'https://www.africanistperspective.com/feed', 'category': 'non-money'},
            {'id': 'sustainability-by-numbers', 'name': 'Sustainability by Numbers', 'url': 'https://www.sustainabilitybynumbers.com/feed', 'category': 'non-money'},
            {'id': 'grumpy-economist', 'name': 'Grumpy Economist', 'url': 'https://www.grumpy-economist.com/feed', 'category': 'research'},
        ]
        
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
        soup = BeautifulSoup(html, 'lxml')
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
        text = soup.get_text()
        # Clean up whitespace
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = ' '.join(chunk for chunk in chunks if chunk)
        return text[:1000]  # Limit summary length
    
    def extract_tags(self, title: str, content: str, category: str) -> List[str]:
        """Extract relevant tags from content"""
        text = f"{title} {content}".lower()
        tags = []
        
        # Category tag
        tags.append(category.title())
        
        # Common finance tags
        tag_patterns = {
            'Earnings': r'\b(earnings|results|profit|revenue|quarter)\b',
            'M&A': r'\b(merger|acquisition|deal|takeover|buyout)\b',
            'IPO': r'\b(ipo|listing|public offering)\b',
            'Crypto': r'\b(bitcoin|crypto|ethereum|blockchain)\b',
            'AI': r'\b(artificial intelligence|ai|machine learning|chatgpt)\b',
            'ESG': r'\b(esg|sustainable|climate|green)\b',
            'Debt': r'\b(bond|debt|yield|treasury)\b',
            'Currency': r'\b(dollar|euro|yen|rupee|forex|fx)\b',
            'Commodities': r'\b(oil|gold|silver|commodity)\b',
            'Tech': r'\b(tech|software|silicon valley|startup)\b'
        }
        
        for tag, pattern in tag_patterns.items():
            if re.search(pattern, text):
                tags.append(tag)
        
        return list(set(tags))[:5]  # Limit to 5 tags
    
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
    
    async def fetch_feed(self, source: Dict) -> List[Dict]:
        """Fetch and parse RSS feed with error handling"""
        items = []
        try:
            # Special handling for NSE feeds with extra rate limiting
            if 'nseindia.com' in source['url'] or 'nsearchives.nseindia.com' in source['url']:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'application/rss+xml, application/xml, text/xml',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Referer': 'https://www.nseindia.com/'
                }
                timeout = aiohttp.ClientTimeout(total=60)
                # Add longer delay for NSE to avoid rate limiting
                await asyncio.sleep(3)
                # Limit NSE announcements to fewer items to be respectful
                max_items = 10 if source['id'] == 'nse-announcements' else self.config['max_items_per_source']
            else:
                headers = {'User-Agent': 'FinanceAggregator/1.0'}
                timeout = aiohttp.ClientTimeout(total=30)
                max_items = self.config['max_items_per_source']
            
            async with self.session.get(
                source['url'],
                timeout=timeout,
                headers=headers
            ) as response:
                if response.status != 200:
                    raise Exception(f"HTTP {response.status}")
                
                content = await response.text()
                
                # Handle NSE JSON API responses
                if 'nseindia.com/api' in source['url']:
                    try:
                        import json
                        data = json.loads(content)
                        # Convert NSE JSON to RSS-like structure
                        if isinstance(data, list):
                            for item in data[:self.config['max_items_per_source']]:
                                try:
                                    # Map NSE API fields to our structure
                                    entry_dict = {
                                        'title': item.get('subject', item.get('description', 'NSE Update')),
                                        'link': f"https://www.nseindia.com{item.get('link', '')}",
                                        'summary': item.get('description', item.get('subject', '')),
                                        'published_parsed': None  # Will use current time
                                    }
                                    
                                    # Create a mock entry object
                                    class MockEntry:
                                        def __init__(self, data):
                                            for k, v in data.items():
                                                setattr(self, k, v)
                                    
                                    entry = MockEntry(entry_dict)
                                    
                                    # Process like normal RSS entry
                                    pub_date = datetime.now(timezone.utc)
                                    title = entry.title
                                    url = entry.link
                                    summary = entry.summary
                                    
                                    # Generate hash
                                    content_hash = self.generate_content_hash(title, url, summary)
                                    
                                    # Skip duplicates
                                    if content_hash in self.state['processed_hashes']:
                                        self.state['stats']['total_duplicates'] += 1
                                        continue
                                    
                                    # Extract metadata
                                    tags = self.extract_tags(title, summary, source['category'])
                                    priority = self.determine_priority(title, summary)
                                    
                                    item_data = {
                                        'id': f"{source['id']}-{content_hash}",
                                        'sourceId': source['id'],
                                        'sourceName': source['name'],
                                        'title': title,
                                        'url': url,
                                        'summary': summary,
                                        'publishedAt': pub_date.isoformat(),
                                        'fetchedAt': datetime.now(timezone.utc).isoformat(),
                                        'category': source['category'],
                                        'tags': tags,
                                        'priority': priority,
                                        'contentHash': content_hash
                                    }
                                    
                                    items.append(item_data)
                                    self.state['processed_hashes'].append(content_hash)
                                    self.state['stats']['total_new'] += 1
                                    
                                except Exception as e:
                                    logger.error(f"Error processing NSE item from {source['name']}: {e}")
                                    continue
                        
                        # Clear error count on success
                        if source['id'] in self.state['source_errors']:
                            del self.state['source_errors'][source['id']]
                        
                        return items
                        
                    except json.JSONDecodeError:
                        logger.error(f"Invalid JSON from NSE API {source['name']}")
                        raise Exception("Invalid JSON response")
                
                # Normal RSS parsing
                feed = feedparser.parse(content)
                
                if feed.bozo:
                    logger.warning(f"Feed parsing issues for {source['name']}: {feed.bozo_exception}")
                
                for entry in feed.entries[:max_items]:
                    try:
                        # Parse date
                        pub_date = None
                        if hasattr(entry, 'published_parsed') and entry.published_parsed:
                            pub_date = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
                        elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                            pub_date = datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
                        else:
                            pub_date = datetime.now(timezone.utc)
                        
                        # Skip old items
                        if pub_date < datetime.now(timezone.utc) - timedelta(days=self.config['max_item_age']):
                            continue
                        
                        # Extract content
                        title = entry.get('title', 'Untitled')
                        url = entry.get('link', '')
                        summary = entry.get('summary', '')
                        content = entry.get('content', [{}])[0].get('value', '') if hasattr(entry, 'content') else summary
                        
                        # Clean content
                        summary = self.clean_html(summary)
                        if not summary and content:
                            summary = self.clean_html(content)[:500]
                        
                        # Generate hash
                        content_hash = self.generate_content_hash(title, url, summary)
                        
                        # Skip duplicates
                        if content_hash in self.state['processed_hashes']:
                            self.state['stats']['total_duplicates'] += 1
                            continue
                        
                        # Extract metadata
                        tags = self.extract_tags(title, summary, source['category'])
                        priority = self.determine_priority(title, summary)
                        
                        item = {
                            'id': f"{source['id']}-{content_hash}",
                            'sourceId': source['id'],
                            'sourceName': source['name'],
                            'title': title,
                            'url': url,
                            'summary': summary,
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
                
                # Clear error count on success
                if source['id'] in self.state['source_errors']:
                    del self.state['source_errors'][source['id']]
                    
        except Exception as e:
            logger.error(f"Failed to fetch {source['name']}: {e}")
            self.state['source_errors'][source['id']] = self.state['source_errors'].get(source['id'], 0) + 1
            
        return items
    
    async def aggregate_all_feeds(self):
        """Aggregate all RSS feeds concurrently"""
        logger.info("Starting feed aggregation")
        
        async with aiohttp.ClientSession() as self.session:
            tasks = [self.fetch_feed(source) for source in self.sources]
            results = await asyncio.gather(*tasks)
            
            all_items = []
            for items in results:
                all_items.extend(items)
            
            # Sort by published date
            all_items.sort(key=lambda x: x['publishedAt'], reverse=True)
            
            # Save items
            self.save_items(all_items)
            
            # Update state
            self.state['last_run'] = datetime.now(timezone.utc).isoformat()
            self.state['stats']['total_processed'] += len(all_items)
            
            # Cleanup old hashes (keep last 10000)
            if len(self.state['processed_hashes']) > 10000:
                self.state['processed_hashes'] = self.state['processed_hashes'][-10000:]
            
            self.save_state()
            
            logger.info(f"Aggregation complete. New items: {self.state['stats']['total_new']}, "
                       f"Duplicates: {self.state['stats']['total_duplicates']}")
    
    def save_items(self, items: List[Dict]):
        """Save items as JSON files for Astro"""
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
                    logger.error(f"Failed to load existing items: {e}")
            
            # Merge and deduplicate
            all_hashes = {item['contentHash'] for item in existing_items}
            for item in date_items:
                if item['contentHash'] not in all_hashes:
                    existing_items.append(item)
            
            # Sort by published date
            existing_items.sort(key=lambda x: x['publishedAt'], reverse=True)
            
            # Save
            try:
                with open(file_path, 'w') as f:
                    json.dump(existing_items, f, indent=2)
                logger.info(f"Saved {len(existing_items)} items to {file_path}")
            except Exception as e:
                logger.error(f"Failed to save items: {e}")
    
    async def run(self):
        """Main entry point"""
        self.load_config()
        await self.aggregate_all_feeds()

if __name__ == "__main__":
    aggregator = FeedAggregator()
    asyncio.run(aggregator.run())