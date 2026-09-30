import { ContentItem } from './types';

export const TOPIC_TAGS = [
  'agentic-ai',
  'azure',
  'dotnet',
  'angular',
  'langgraph',
  'llm',
  'genai',
] as const;

const TOPIC_PATTERNS: Record<(typeof TOPIC_TAGS)[number], RegExp> = {
  'agentic-ai': /\bagentic\b|\bai[- ]agents?\b|\bmulti-agent\b|\bautonomous agents?\b/i,
  azure: /\bazure\b/i,
  dotnet: /(?:^|[^\w])\.net\b|\bdotnet\b|\basp\.net\b|\bc#|\bcsharp\b/i,
  angular: /\bangular\b/i,
  langgraph: /\blang-?graph\b/i,
  llm: /\bllms?\b|\blarge language models?\b/i,
  genai: /\bgen-?ai\b|\bgenerative ai\b/i,
};

export function enrichTags(item: ContentItem): ContentItem {
  const haystack = [item.title, item.summary, item.details, ...item.tags].join(' ');
  const existing = new Set(item.tags.map((t) => t.toLowerCase()));
  const added = TOPIC_TAGS.filter(
    (tag) => !existing.has(tag) && TOPIC_PATTERNS[tag].test(haystack)
  );
  return added.length === 0 ? item : { ...item, tags: [...item.tags, ...added] };
}
