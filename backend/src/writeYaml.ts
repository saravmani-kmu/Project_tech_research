import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { ContentItem } from './types';

export function todayIsoDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function writeSourceYaml(
  dataDir: string,
  date: string,
  source: string,
  items: ContentItem[]
): string {
  const dayDir = path.join(dataDir, date);
  fs.mkdirSync(dayDir, { recursive: true });
  const filePath = path.join(dayDir, `${source}.yaml`);
  fs.writeFileSync(filePath, yaml.dump(items, { noRefs: true, lineWidth: 100 }), 'utf8');
  return filePath;
}

export function writeLatestYaml(dataDir: string, items: ContentItem[]): string {
  const filePath = path.join(dataDir, 'latest.yaml');
  fs.writeFileSync(filePath, yaml.dump(items, { noRefs: true, lineWidth: 100 }), 'utf8');
  return filePath;
}

export function updateIndexYaml(dataDir: string, date: string): string {
  const filePath = path.join(dataDir, 'index.yaml');
  let dates: string[] = [];
  if (fs.existsSync(filePath)) {
    const parsed = yaml.load(fs.readFileSync(filePath, 'utf8'));
    if (Array.isArray(parsed)) {
      dates = parsed as string[];
    }
  }
  if (!dates.includes(date)) {
    dates.push(date);
  }
  dates.sort().reverse();
  fs.writeFileSync(filePath, yaml.dump(dates, { noRefs: true }), 'utf8');
  return filePath;
}

export function readYamlItems(filePath: string): ContentItem[] {
  const parsed = yaml.load(fs.readFileSync(filePath, 'utf8'));
  return Array.isArray(parsed) ? (parsed as ContentItem[]) : [];
}
