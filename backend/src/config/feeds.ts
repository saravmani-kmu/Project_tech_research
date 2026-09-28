export interface FeedConfig {
  url: string;
  sourceLabel: string;
  tags: string[];
}

export const RSS_FEEDS: FeedConfig[] = [
  { url: 'https://openai.com/blog/rss.xml', sourceLabel: 'OpenAI', tags: ['genai', 'llm'] },
  { url: 'https://www.anthropic.com/rss.xml', sourceLabel: 'Anthropic', tags: ['genai', 'llm', 'agentic-ai'] },
  { url: 'https://ai.googleblog.com/feeds/posts/default', sourceLabel: 'Google AI', tags: ['genai', 'llm'] },
  { url: 'https://ai.meta.com/blog/rss/', sourceLabel: 'Meta AI', tags: ['genai', 'llm'] },
  { url: 'https://blog.langchain.dev/rss/', sourceLabel: 'LangChain', tags: ['agentic-ai', 'frameworks'] },
];
