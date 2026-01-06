import { Routes } from '@angular/router';
import { FileUploadComponent } from './components/file-upload/file-upload';
import { ProductSearch } from './components/product-search/product-search';

export const routes: Routes = [
  { path: '', redirectTo: 'upload', pathMatch: 'full' },
  { path: 'upload', component: FileUploadComponent },
  { path: 'search', component: ProductSearch },
];
