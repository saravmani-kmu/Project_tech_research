import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import * as yaml from 'js-yaml';
import { firstValueFrom } from 'rxjs';
import { ContentItem } from '../models/content-item';

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);
  private cache = new Map<string, Promise<unknown>>();

  getLatest(): Promise<ContentItem[]> {
    return this.loadYaml<ContentItem[]>('data/latest.yaml', []);
  }

  getByDate(date: string): Promise<ContentItem[]> {
    return this.loadYaml<ContentItem[]>(`data/${date}/all.yaml`, []);
  }

  getAvailableDates(): Promise<string[]> {
    return this.loadYaml<string[]>('data/index.yaml', []);
  }

  async getById(id: string): Promise<ContentItem | undefined> {
    const items = await this.getLatest();
    return items.find((item) => item.id === id);
  }

  private loadYaml<T>(path: string, fallback: T): Promise<T> {
    if (!this.cache.has(path)) {
      const promise = firstValueFrom(this.http.get(path, { responseType: 'text' }))
        .then((text) => (yaml.load(text) as T) ?? fallback)
        .catch(() => fallback);
      this.cache.set(path, promise);
    }
    return this.cache.get(path) as Promise<T>;
  }
}
