import { normalizeHfItem, fetchHuggingFaceTrending, HfModelApiItem } from '../src/fetchers/huggingface';
import modelsFixture from './fixtures/hf-models.json';
import spacesFixture from './fixtures/hf-spaces.json';

describe('huggingface fetcher', () => {
  describe('normalizeHfItem', () => {
    it('maps a model item', () => {
      const model = (modelsFixture as HfModelApiItem[])[0];
      const item = normalizeHfItem(model, 'model');

      expect(item.id).toBe('huggingface-model-acme/llama-agent-7b');
      expect(item.url).toBe('https://huggingface.co/acme/llama-agent-7b');
      expect(item.source).toBe('huggingface');
      expect(item.tags).toEqual(['text-generation', 'agentic-ai', 'pytorch']);
      expect(item.score).toBe(512);
    });

    it('maps a space item with the /spaces/ url prefix', () => {
      const space = (spacesFixture as HfModelApiItem[])[0];
      const item = normalizeHfItem(space, 'space');

      expect(item.id).toBe('huggingface-space-acme/agent-playground');
      expect(item.url).toBe('https://huggingface.co/spaces/acme/agent-playground');
    });
  });

  describe('fetchHuggingFaceTrending', () => {
    it('fetches models and spaces in parallel and merges them', async () => {
      const mockFetch = jest.fn().mockImplementation(async (url: string) => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => (url.includes('/spaces') ? spacesFixture : modelsFixture),
      }));

      const items = await fetchHuggingFaceTrending(mockFetch as unknown as typeof fetch);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(items).toHaveLength(2);
      expect(items.map((i) => i.source)).toEqual(['huggingface', 'huggingface']);
    });

    it('throws when the API responds with an error status', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
        json: async () => ({}),
      });

      await expect(
        fetchHuggingFaceTrending(mockFetch as unknown as typeof fetch)
      ).rejects.toThrow('Hugging Face API error: 500 Server Error');
    });
  });
});
