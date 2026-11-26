import { EntrepriseViewService } from './entreprise-view.service';

describe('EntrepriseViewService', () => {
  it('starts with the company offer list', () => {
    const service = new EntrepriseViewService();
    expect(service.view()).toBe('list');
    expect(service.selectedOfferId()).toBeNull();
  });

  it('opens a selected draft, returns to the list and starts a new offer', () => {
    const service = new EntrepriseViewService();
    service.showForm('draft-1');
    expect(service.view()).toBe('form');
    expect(service.selectedOfferId()).toBe('draft-1');

    service.showList();
    expect(service.view()).toBe('list');

    service.showForm();
    expect(service.view()).toBe('form');
    expect(service.selectedOfferId()).toBeNull();
  });
});
