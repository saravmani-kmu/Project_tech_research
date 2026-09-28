export type SourceType = 'github' | 'huggingface' | 'arxiv' | 'hackernews' | 'rss';

export interface ContentItem {
  id: string;
  title: string;
  summary: string;
  details: string;
  url: string;
  source: SourceType;
  tags: string[];
  score: number;
  publishedAt: string;
}
