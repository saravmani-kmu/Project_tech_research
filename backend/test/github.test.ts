import {
  normalizeGithubRepo,
  fetchGithubTrending,
  buildGithubSearchUrl,
  GithubSearchResponse,
} from '../src/fetchers/github';
import fixture from './fixtures/github-search.json';

describe('github fetcher', () => {
  describe('normalizeGithubRepo', () => {
    it('maps a repo with topics and description', () => {
      const repo = (fixture as GithubSearchResponse).items[0];
      const item = normalizeGithubRepo(repo);

      expect(item).toEqual({
        id: 'github-111',
        title: 'acme/agentic-framework',
        summary: 'A framework for building autonomous AI agents',
        details: 'A framework for building autonomous AI agents',
        url: 'https://github.com/acme/agentic-framework',
        source: 'github',
        tags: ['llm', 'agentic-ai', 'python'],
        score: 4200,
        publishedAt: '2026-09-20T12:00:00Z',
      });
    });

    it('falls back to empty summary/tags when description or topics are missing', () => {
      const repo = (fixture as GithubSearchResponse).items[1];
      const item = normalizeGithubRepo(repo);

      expect(item.summary).toBe('');
      expect(item.details).toBe('');
      expect(item.tags).toEqual([]);
    });
  });

  describe('buildGithubSearchUrl', () => {
    it('includes tracked topics and a created-after filter', () => {
      const url = buildGithubSearchUrl(new Date('2026-09-28T00:00:00Z'));
      expect(url).toContain('api.github.com/search/repositories');
      expect(url).toContain('sort=stars');
      expect(decodeURIComponent(url)).toContain('topic:llm');
      expect(decodeURIComponent(url)).toContain('topic:agentic-ai');
      expect(decodeURIComponent(url)).toContain('created:>2026-08-29');
    });
  });

  describe('fetchGithubTrending', () => {
    it('returns normalized items from a mocked HTTP response', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => fixture,
      });

      const items = await fetchGithubTrending(mockFetch as unknown as typeof fetch);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(items).toHaveLength(2);
      expect(items[0].source).toBe('github');
      expect(items.map((i) => i.id)).toEqual(['github-111', 'github-222']);
    });

    it('throws a descriptive error on a non-ok response', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({}),
      });

      await expect(fetchGithubTrending(mockFetch as unknown as typeof fetch)).rejects.toThrow(
        'GitHub API error: 403 Forbidden'
      );
    });
  });
});
