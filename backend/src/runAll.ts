import * as path from 'path';
import { ContentItem, SourceType } from './types';
import { fetchGithubTrending } from './fetchers/github';
import { fetchHuggingFaceTrending } from './fetchers/huggingface';
import { fetchArxivPapers } from './fetchers/arxiv';
import { fetchHackerNewsTrending } from './fetchers/hackernews';
import { fetchAllRssFeeds } from './fetchers/rss';
import { mergeAndDedup } from './merge';
import { writeSourceYaml, writeLatestYaml, updateIndexYaml, todayIsoDate } from './writeYaml';

const DATA_DIR = path.join(__dirname, '..', '..', 'data');

interface SourceJob {
  source: SourceType;
  run: () => Promise<ContentItem[]>;
}

const JOBS: SourceJob[] = [
  { source: 'github', run: () => fetchGithubTrending() },
  { source: 'huggingface', run: () => fetchHuggingFaceTrending() },
  { source: 'arxiv', run: () => fetchArxivPapers() },
  { source: 'hackernews', run: () => fetchHackerNewsTrending() },
  { source: 'rss', run: () => fetchAllRssFeeds() },
];

async function main(): Promise<void> {
  const date = todayIsoDate();
  const results: ContentItem[][] = [];

  for (const job of JOBS) {
    try {
      const items = await job.run();
      writeSourceYaml(DATA_DIR, date, job.source, items);
      results.push(items);
      console.log(`[${job.source}] fetched ${items.length} items`);
    } catch (err) {
      console.error(`[${job.source}] failed:`, (err as Error).message);
    }
  }

  const merged = mergeAndDedup(results);
  writeLatestYaml(DATA_DIR, merged);
  updateIndexYaml(DATA_DIR, date);
  console.log(`Wrote ${merged.length} merged items to latest.yaml`);
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('runAll failed:', err);
      process.exit(1);
    });
}
