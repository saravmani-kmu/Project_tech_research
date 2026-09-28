import { Routes } from '@angular/router';
import { FeedComponent } from './feed/feed.component';
import { ItemDetailComponent } from './item-detail/item-detail.component';

export const routes: Routes = [
  { path: '', component: FeedComponent },
  { path: 'item/:id', component: ItemDetailComponent },
  { path: '**', redirectTo: '' },
];
