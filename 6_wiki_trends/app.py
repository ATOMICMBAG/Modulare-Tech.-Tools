from flask import Blueprint, render_template, request, jsonify
import feedparser
import requests
from datetime import datetime

wiki_bp = Blueprint('wiki_trends', __name__, template_folder='../templates')

@wiki_bp.route('/')
def index():
    feeds = ['https://news.google.com/rss/search?q=medical+technology&hl=en-US&gl=US&ceid=US:en', 'https://www.ncbi.nlm.nih.gov/feed/rss/html?term=medical.tech']
    items = []
    for url in feeds:
        try:
            feed = feedparser.parse(url)
            for item in feed.entries[-10:]:  # last 10
                items.append({
                    'title': item.title,
                    'link': item.link,
                    'summary': getattr(item, 'summary', '')[:35],
                    'date': getattr(item, 'published', 'Unknown'),
                    'source': feed.feed.title if hasattr(feed.feed, 'title') else 'RSS'
                })
        except:
            pass
    return render_template('wiki_index.html', items=items)
