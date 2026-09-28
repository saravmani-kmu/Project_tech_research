import { ContentItem } from '../types';

export interface GithubRepoApiItem {
  id: number;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  topics?: string[];
  pushed_at: string;
}

export interface GithubSearchResponse {
  items: GithubRepoApiItem[];
}

const TRACKED_TOPICS = ['llm', 'agentic-ai', 'genai', 'rag', 'ai-agents'];
const LOOKBACK_DAYS = 30;

export function normalizeGithubRepo(repo: GithubRepoApiItem): ContentItem {
  return {
    id: `github-${repo.id}`,
    title: repo.full_name,
    summary: repo.description ?? '',
    details: repo.description ?? '',
    url: repo.html_url,
    source: 'github',
    tags: repo.topics ?? [],
    score: repo.stargazers_count,
    publishedAt: repo.pushed_at,
  };
}

export function buildGithubSearchUrl(now: Date = new Date()): string {
  const since = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const topicQuery = TRACKED_TOPICS.map((t) => `topic:${t}`).join(' ');
  const query = `${topicQuery} created:>${since}`;
  return `https://api.github.com/search/repositories?q=${encodeURIComponent(
    query
  )}&sort=stars&order=desc&per_page=25`;
}

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

export async function fetchGithubTrending(fetchImpl: FetchFn = fetch): Promise<ContentItem[]> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetchImpl(buildGithubSearchUrl(), { headers });
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as GithubSearchResponse;
  return data.items.map(normalizeGithubRepo);
}
