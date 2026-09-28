import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  writeSourceYaml,
  writeLatestYaml,
  updateIndexYaml,
  readYamlItems,
  todayIsoDate,
} from '../src/writeYaml';
import { ContentItem } from '../src/types';

const sampleItems: ContentItem[] = [
  {
    id: 'github-1',
    title: 'repo',
    summary: 'summary',
    details: 'details',
    url: 'https://github.com/a/b',
    source: 'github',
    tags: ['llm'],
    score: 10,
    publishedAt: '2026-09-20T00:00:00.000Z',
  },
];

describe('writeYaml', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-trends-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('writes a per-source dated yaml file that round-trips through readYamlItems', () => {
    const filePath = writeSourceYaml(tmpDir, '2026-09-28', 'github', sampleItems);

    expect(fs.existsSync(filePath)).toBe(true);
    expect(readYamlItems(filePath)).toEqual(sampleItems);
  });

  it('writes latest.yaml at the data dir root', () => {
    const filePath = writeLatestYaml(tmpDir, sampleItems);
    expect(path.basename(filePath)).toBe('latest.yaml');
    expect(readYamlItems(filePath)).toEqual(sampleItems);
  });

  it('creates index.yaml with the date on first write', () => {
    const filePath = updateIndexYaml(tmpDir, '2026-09-28');
    const dates = readYamlItems(filePath) as unknown as string[];
    expect(dates).toEqual(['2026-09-28']);
  });

  it('appends new dates without duplicating and sorts newest first', () => {
    updateIndexYaml(tmpDir, '2026-09-26');
    updateIndexYaml(tmpDir, '2026-09-28');
    const filePath = updateIndexYaml(tmpDir, '2026-09-26');
    const dates = readYamlItems(filePath) as unknown as string[];
    expect(dates).toEqual(['2026-09-28', '2026-09-26']);
  });

  it('todayIsoDate formats a given date as YYYY-MM-DD', () => {
    expect(todayIsoDate(new Date('2026-09-28T15:30:00.000Z'))).toBe('2026-09-28');
  });
});
