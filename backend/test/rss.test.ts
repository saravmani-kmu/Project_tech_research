import { normalizeRssItem, fetchOneFeed, fetchAllRssFeeds } from '../src/fetchers/rss';
import { ArxivParser } from '../src/fetchers/arxiv';
import { FeedConfig } from '../src/config/feeds';

const feed: FeedConfig = {
  url: 'https://example.com/blog/rss.xml',
  sourceLabel: 'Example AI',
  tags: ['genai'],
};

const sampleItem = {
  link: 'https://example.com/blog/post-1',
  title: 'Announcing our new agent framework',
  contentSnippet: 'We are launching a new framework for building AI agents.',
  isoDate: '2026-09-26T00:00:00.000Z',
};

describe('rss fetcher', () => {
  describe('normalizeRssItem', () => {
    it('tags items with the feed tags plus a slugified source label', () => {
      const item = normalizeRssItem(sampleItem, feed);

      expect(item.source).toBe('rss');
      expect(item.tags).toEqual(['genai', 'example-ai']);
      expect(item.url).toBe('https://example.com/blog/post-1');
      expect(item.id).toMatch(/^rss-Example AI-/);
    });
  });

  describe('fetchOneFeed', () => {
    it('parses a single feed with the injected parser', async () => {
      const mockParser: ArxivParser = {
        parseURL: jest.fn().mockResolvedValue({ items: [sampleItem] }),
      };

      const items = await fetchOneFeed(feed, mockParser);
      expect(mockParser.parseURL).toHaveBeenCalledWith(feed.url);
      expect(items).toHaveLength(1);
    });
  });

  describe('fetchAllRssFeeds', () => {
    it('merges items across feeds and tolerates one feed failing', async () => {
      const feeds: FeedConfig[] = [
        feed,
        { url: 'https://broken.example.com/rss.xml', sourceLabel: 'Broken', tags: [] },
      ];
      const mockParser: ArxivParser = {
        parseURL: jest.fn().mockImplementation(async (url: string) => {
          if (url.includes('broken')) throw new Error('network error');
          return { items: [sampleItem] };
        }),
      };

      const items = await fetchAllRssFeeds(mockParser, feeds);

      expect(mockParser.parseURL).toHaveBeenCalledTimes(2);
      expect(items).toHaveLength(1);
    });
  });
});
