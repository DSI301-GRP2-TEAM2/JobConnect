import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EntrepriseViewService {
  readonly view = signal<'list' | 'form'>('list');
  readonly selectedOfferId = signal<string | null>(null);

  showList(): void {
    this.view.set('list');
  }

  showForm(id: string | null = null): void {
    this.selectedOfferId.set(id);
    this.view.set('form');
  }
}
