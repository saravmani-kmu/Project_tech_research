import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentItem, SourceType } from '../models/content-item';
import { DataService } from '../services/data.service';

const SOURCE_LABELS: Record<SourceType, string> = {
  github: 'GitHub',
  huggingface: 'Hugging Face',
  arxiv: 'arXiv',
  hackernews: 'Hacker News',
  rss: 'Blog',
};

const ALL_SOURCES: SourceType[] = ['github', 'huggingface', 'arxiv', 'hackernews', 'rss'];

const MAX_TAGS = 5;

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css',
})
export class FeedComponent implements OnInit {
  private dataService = inject(DataService);

  items = signal<ContentItem[]>([]);
  loading = signal(true);
  selectedTags = signal<Set<string>>(new Set());
  selectedSource = signal<SourceType | 'all'>('all');

  sourceLabels = SOURCE_LABELS;
  sources = ALL_SOURCES;

  allTags = computed(() => {
    const source = this.selectedSource();
    const tagCounts = new Map<string, number>();
    for (const item of this.items()) {
      if (source !== 'all' && item.source !== source) continue;
      for (const tag of item.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
    return [...tagCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_TAGS)
      .map(([tag]) => tag);
  });

  filteredItems = computed(() => {
    const tags = this.selectedTags();
    const source = this.selectedSource();
    return this.items().filter((item) => {
      const matchesSource = source === 'all' || item.source === source;
      const matchesTags = tags.size === 0 || item.tags.some((t) => tags.has(t));
      return matchesSource && matchesTags;
    });
  });

  async ngOnInit(): Promise<void> {
    const items = await this.dataService.getLatest();
    this.items.set(items);
    this.loading.set(false);
  }

  toggleTag(tag: string): void {
    const next = new Set(this.selectedTags());
    if (next.has(tag)) {
      next.delete(tag);
    } else {
      next.add(tag);
    }
    this.selectedTags.set(next);
  }

  setSource(source: SourceType | 'all'): void {
    this.selectedSource.set(source);
    this.selectedTags.set(new Set());
  }

  clearTags(): void {
    this.selectedTags.set(new Set());
  }
}
