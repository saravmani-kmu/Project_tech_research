import Parser from 'rss-parser';
import { ContentItem } from '../types';
import { RSS_FEEDS, FeedConfig } from '../config/feeds';
import { ArxivParser, ArxivFeedItem } from './arxiv';

function makeId(feedLabel: string, entry: ArxivFeedItem): string {
  const raw = entry.link ?? entry.id ?? entry.title ?? Math.random().toString(36);
  return `rss-${feedLabel}-${Buffer.from(raw).toString('base64url').slice(0, 24)}`;
}

export function normalizeRssItem(entry: ArxivFeedItem, feed: FeedConfig): ContentItem {
  const summary = (entry.contentSnippet ?? entry.content ?? '').trim();
  return {
    id: makeId(feed.sourceLabel, entry),
    title: (entry.title ?? '').trim(),
    summary: summary.length > 280 ? `${summary.slice(0, 280)}…` : summary,
    details: (entry.content ?? summary).trim(),
    url: entry.link ?? '',
    source: 'rss',
    tags: [...feed.tags, feed.sourceLabel.toLowerCase().replace(/\s+/g, '-')],
    score: 0,
    publishedAt: entry.isoDate ?? entry.pubDate ?? new Date().toISOString(),
  };
}

export async function fetchOneFeed(
  feed: FeedConfig,
  parser: ArxivParser
): Promise<ContentItem[]> {
  const parsed = await parser.parseURL(feed.url);
  return parsed.items.map((item) => normalizeRssItem(item, feed));
}

export async function fetchAllRssFeeds(
  parser: ArxivParser = new Parser() as unknown as ArxivParser,
  feeds: FeedConfig[] = RSS_FEEDS
): Promise<ContentItem[]> {
  const results = await Promise.allSettled(feeds.map((feed) => fetchOneFeed(feed, parser)));
  const items: ContentItem[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      items.push(...result.value);
    }
  }
  return items;
}
