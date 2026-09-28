import { ContentItem } from '../types';
import { FetchFn } from './github';

export interface HfModelApiItem {
  id: string;
  likes: number;
  downloads: number;
  tags?: string[];
  pipeline_tag?: string;
  lastModified: string;
}

const MODELS_URL = 'https://huggingface.co/api/models?sort=likes&direction=-1&limit=25';
const SPACES_URL = 'https://huggingface.co/api/spaces?sort=likes&direction=-1&limit=25';

export function normalizeHfItem(
  item: HfModelApiItem,
  kind: 'model' | 'space'
): ContentItem {
  const tags = item.tags ?? [];
  return {
    id: `huggingface-${kind}-${item.id}`,
    title: item.id,
    summary: item.pipeline_tag ?? tags.slice(0, 3).join(', '),
    details: `${kind === 'model' ? 'Model' : 'Space'} · ${tags.join(', ')}`,
    url: `https://huggingface.co/${kind === 'space' ? 'spaces/' : ''}${item.id}`,
    source: 'huggingface',
    tags,
    score: item.likes,
    publishedAt: item.lastModified,
  };
}

async function fetchHfList(
  url: string,
  kind: 'model' | 'space',
  fetchImpl: FetchFn
): Promise<ContentItem[]> {
  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`Hugging Face API error: ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as HfModelApiItem[];
  return data.map((item) => normalizeHfItem(item, kind));
}

export async function fetchHuggingFaceTrending(fetchImpl: FetchFn = fetch): Promise<ContentItem[]> {
  const [models, spaces] = await Promise.all([
    fetchHfList(MODELS_URL, 'model', fetchImpl),
    fetchHfList(SPACES_URL, 'space', fetchImpl),
  ]);
  return [...models, ...spaces];
}
