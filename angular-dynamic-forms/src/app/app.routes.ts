import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./demo/demo').then(m => m.Demo)
  },
  {
    path: 'builder',
    loadComponent: () => import('./form-builder/form-builder').then(m => m.FormBuilder)
  }
];
