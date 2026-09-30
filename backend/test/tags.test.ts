import { enrichTags } from '../src/tags';
import { ContentItem } from '../src/types';

function makeItem(overrides: Partial<ContentItem>): ContentItem {
  return {
    id: 'id-1',
    title: '',
    summary: '',
    details: '',
    url: 'https://example.com/1',
    source: 'rss',
    tags: [],
    score: 0,
    publishedAt: '2026-09-20T00:00:00.000Z',
    ...overrides,
  };
}

describe('enrichTags', () => {
  it.each([
    ['agentic-ai', 'Building agentic workflows'],
    ['agentic-ai', 'How AI agents use tools'],
    ['azure', 'Deploying to Azure OpenAI'],
    ['dotnet', 'What is new in .NET 10'],
    ['dotnet', 'Using dotnet CLI'],
    ['dotnet', 'ASP.NET Core minimal APIs'],
    ['dotnet', 'Writing C# agents'],
    ['angular', 'Angular signals deep dive'],
    ['langgraph', 'LangGraph state machines'],
    ['langgraph', 'lang-graph tutorial'],
    ['llm', 'Serving LLMs at scale'],
    ['llm', 'A large language model survey'],
    ['genai', 'GenAI for enterprises'],
    ['genai', 'Generative AI in production'],
  ])('adds "%s" for "%s"', (tag, title) => {
    expect(enrichTags(makeItem({ title })).tags).toContain(tag);
  });

  it('matches against summary, details and existing tags too', () => {
    expect(enrichTags(makeItem({ summary: 'runs on Azure' })).tags).toContain('azure');
    expect(enrichTags(makeItem({ details: 'built with Angular' })).tags).toContain('angular');
    expect(enrichTags(makeItem({ tags: ['langgraph-example'] })).tags).toContain('langgraph');
  });

  it('does not match look-alike words', () => {
    const tags = enrichTags(
      makeItem({ title: 'Triangular matrices, planet.net domains and travel agents' })
    ).tags;
    expect(tags).not.toContain('angular');
    expect(tags).not.toContain('dotnet');
    expect(tags).not.toContain('agentic-ai');
  });

  it('keeps existing tags and never duplicates a topic tag', () => {
    const item = makeItem({ title: 'LLM AI agents on Azure', tags: ['llm', 'python'] });
    const tags = enrichTags(item).tags;
    expect(tags.filter((t) => t === 'llm')).toHaveLength(1);
    expect(tags).toEqual(expect.arrayContaining(['llm', 'python', 'azure', 'agentic-ai']));
  });

  it('returns the same item when nothing matches and does not mutate its input', () => {
    const plain = makeItem({ title: 'Sourdough tips' });
    expect(enrichTags(plain)).toBe(plain);

    const original = makeItem({ title: 'Azure news', tags: ['news'] });
    enrichTags(original);
    expect(original.tags).toEqual(['news']);
  });
});
