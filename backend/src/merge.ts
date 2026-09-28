import { ContentItem } from './types';

export function mergeAndDedup(itemGroups: ContentItem[][]): ContentItem[] {
  const seen = new Map<string, ContentItem>();
  for (const group of itemGroups) {
    for (const item of group) {
      const key = item.url || item.id;
      if (!seen.has(key)) {
        seen.set(key, item);
      }
    }
  }
  return Array.from(seen.values()).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}
