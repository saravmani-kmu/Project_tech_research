import Parser from 'rss-parser';
import { ContentItem } from '../types';

export interface ArxivFeedItem {
  id?: string;
  link?: string;
  title?: string;
  contentSnippet?: string;
  content?: string;
  isoDate?: string;
  pubDate?: string;
  categories?: string[];
}

const QUERY_TERMS = ['agentic AI', 'large language model', 'generative AI'];
const ARXIV_QUERY = QUERY_TERMS.map((t) => `all:"${t}"`).join('+OR+');
export const ARXIV_URL = `http://export.arxiv.org/api/query?search_query=${encodeURIComponent(
  ARXIV_QUERY
).replace(/%2B/g, '+')}&sortBy=submittedDate&sortOrder=descending&max_results=25`;

function makeId(entry: ArxivFeedItem): string {
  const raw = entry.id ?? entry.link ?? entry.title ?? Math.random().toString(36);
  return `arxiv-${raw.split('/').pop()}`;
}

export function normalizeArxivEntry(entry: ArxivFeedItem): ContentItem {
  const summary = (entry.contentSnippet ?? entry.content ?? '').trim();
  return {
    id: makeId(entry),
    title: (entry.title ?? '').replace(/\s+/g, ' ').trim(),
    summary: summary.length > 280 ? `${summary.slice(0, 280)}…` : summary,
    details: (entry.content ?? summary).trim(),
    url: entry.id ?? entry.link ?? '',
    source: 'arxiv',
    tags: entry.categories && entry.categories.length > 0 ? entry.categories : ['arxiv'],
    score: 0,
    publishedAt: entry.isoDate ?? entry.pubDate ?? new Date().toISOString(),
  };
}

export interface ArxivParser {
  parseURL(url: string): Promise<{ items: ArxivFeedItem[] }>;
}

export async function fetchArxivPapers(
  parser: ArxivParser = new Parser() as unknown as ArxivParser
): Promise<ContentItem[]> {
  const feed = await parser.parseURL(ARXIV_URL);
  return feed.items.map(normalizeArxivEntry);
}
