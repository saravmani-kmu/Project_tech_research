import { ContentItem } from '../types';
import { FetchFn } from './github';

export interface HnHit {
  objectID: string;
  title: string;
  url: string | null;
  points: number;
  created_at: string;
  story_text?: string | null;
  _tags: string[];
}

export interface HnSearchResponse {
  hits: HnHit[];
}

const QUERY_TERMS = ['LLM', 'agentic AI', 'GenAI', 'AI agent'];
const SEARCH_URL = `https://hn.algolia.com/api/v1/search_by_date?tags=story&query=${encodeURIComponent(
  QUERY_TERMS.join(' OR ')
)}`;

export function normalizeHnHit(hit: HnHit): ContentItem {
  return {
    id: `hackernews-${hit.objectID}`,
    title: hit.title,
    summary: hit.story_text ? hit.story_text.slice(0, 200) : '',
    details: hit.story_text ?? '',
    url: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
    source: 'hackernews',
    tags: hit._tags.filter((t) => t !== 'story'),
    score: hit.points,
    publishedAt: hit.created_at,
  };
}

export async function fetchHackerNewsTrending(fetchImpl: FetchFn = fetch): Promise<ContentItem[]> {
  const res = await fetchImpl(SEARCH_URL);
  if (!res.ok) {
    throw new Error(`Hacker News API error: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as HnSearchResponse;
  return data.hits.map(normalizeHnHit);
}
