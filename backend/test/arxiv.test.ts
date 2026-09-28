import { normalizeArxivEntry, fetchArxivPapers, ArxivParser } from '../src/fetchers/arxiv';

const sampleEntry = {
  id: 'http://arxiv.org/abs/2609.12345v1',
  title: 'Agentic  Reasoning\nin Large Language Models',
  contentSnippet: 'a'.repeat(300),
  content: 'Full abstract text about agentic reasoning.',
  isoDate: '2026-09-27T00:00:00.000Z',
  categories: ['cs.CL', 'cs.AI'],
};

describe('arxiv fetcher', () => {
  describe('normalizeArxivEntry', () => {
    it('collapses whitespace in the title and truncates long summaries', () => {
      const item = normalizeArxivEntry(sampleEntry);

      expect(item.title).toBe('Agentic Reasoning in Large Language Models');
      expect(item.id).toBe('arxiv-2609.12345v1');
      expect(item.summary.endsWith('…')).toBe(true);
      expect(item.summary.length).toBe(281);
      expect(item.tags).toEqual(['cs.CL', 'cs.AI']);
      expect(item.source).toBe('arxiv');
    });

    it('defaults tags to ["arxiv"] when no categories are present', () => {
      const item = normalizeArxivEntry({ ...sampleEntry, categories: undefined });
      expect(item.tags).toEqual(['arxiv']);
    });
  });

  describe('fetchArxivPapers', () => {
    it('parses the arXiv Atom feed via the injected parser', async () => {
      const mockParser: ArxivParser = {
        parseURL: jest.fn().mockResolvedValue({ items: [sampleEntry] }),
      };

      const items = await fetchArxivPapers(mockParser);

      expect(mockParser.parseURL).toHaveBeenCalledWith(expect.stringContaining('export.arxiv.org'));
      expect(items).toHaveLength(1);
      expect(items[0].source).toBe('arxiv');
    });
  });
});
