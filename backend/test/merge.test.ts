import { mergeAndDedup } from '../src/merge';
import { ContentItem } from '../src/types';

function makeItem(overrides: Partial<ContentItem>): ContentItem {
  return {
    id: 'id-1',
    title: 'Title',
    summary: 'Summary',
    details: 'Details',
    url: 'https://example.com/1',
    source: 'github',
    tags: [],
    score: 0,
    publishedAt: '2026-09-20T00:00:00.000Z',
    ...overrides,
  };
}

describe('mergeAndDedup', () => {
  it('dedupes items sharing the same url across sources', () => {
    const a = makeItem({ id: 'a', url: 'https://example.com/dup' });
    const b = makeItem({ id: 'b', url: 'https://example.com/dup' });
    const c = makeItem({ id: 'c', url: 'https://example.com/unique' });

    const merged = mergeAndDedup([[a], [b, c]]);

    expect(merged).toHaveLength(2);
    expect(merged.map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('sorts merged items by publishedAt descending', () => {
    const older = makeItem({ id: 'old', url: 'https://example.com/old', publishedAt: '2026-01-01T00:00:00.000Z' });
    const newer = makeItem({ id: 'new', url: 'https://example.com/new', publishedAt: '2026-09-01T00:00:00.000Z' });

    const merged = mergeAndDedup([[older], [newer]]);

    expect(merged.map((i) => i.id)).toEqual(['new', 'old']);
  });

  it('returns an empty array when given no items', () => {
    expect(mergeAndDedup([])).toEqual([]);
    expect(mergeAndDedup([[], []])).toEqual([]);
  });
});
