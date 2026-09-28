import { normalizeHnHit, fetchHackerNewsTrending, HnSearchResponse } from '../src/fetchers/hackernews';
import fixture from './fixtures/hn-search.json';

describe('hackernews fetcher', () => {
  describe('normalizeHnHit', () => {
    it('uses the external url when present and strips the "story" tag', () => {
      const hit = (fixture as HnSearchResponse).hits[0];
      const item = normalizeHnHit(hit);

      expect(item.id).toBe('hackernews-999');
      expect(item.url).toBe('https://example.com/agentic-framework');
      expect(item.tags).toEqual(['show_hn', 'author_alice']);
      expect(item.score).toBe(340);
    });

    it('falls back to the HN discussion url when url is null', () => {
      const hit = (fixture as HnSearchResponse).hits[1];
      const item = normalizeHnHit(hit);

      expect(item.url).toBe('https://news.ycombinator.com/item?id=1000');
      expect(item.summary).toContain('Curious what people are using');
    });
  });

  describe('fetchHackerNewsTrending', () => {
    it('returns normalized items from a mocked response', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => fixture,
      });

      const items = await fetchHackerNewsTrending(mockFetch as unknown as typeof fetch);

      expect(items).toHaveLength(2);
      expect(items.every((i) => i.source === 'hackernews')).toBe(true);
    });

    it('throws a descriptive error on failure', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({}),
      });

      await expect(
        fetchHackerNewsTrending(mockFetch as unknown as typeof fetch)
      ).rejects.toThrow('Hacker News API error: 429 Too Many Requests');
    });
  });
});
