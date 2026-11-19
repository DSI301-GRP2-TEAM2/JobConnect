import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserHeaderComponent } from './user-header.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

describe('UserHeaderComponent (US-04)', () => {
  let fixture: ComponentFixture<UserHeaderComponent>;
  let component: UserHeaderComponent;
  let auth: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserHeaderComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(UserHeaderComponent);
    component = fixture.componentInstance;
    auth = TestBed.inject(AuthService);
    auth.storeSession('fake-token', { id: '1', nom: 'Sarah J.', email: 'sarah@example.com', role: 'candidat' });
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('creates the component', () => expect(component).toBeTruthy());

  it('shows the seeded user email in the who-block', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('sarah@example.com');
  });

  it('shows the user initial in the avatar badge', () => {
    expect(component.initials()).toBe('S');
  });

  it('does not show the dropdown menu by default', () => {
    expect(component.menuOpen()).toBeFalse();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.user-menu')).toBeNull();
  });

  it('opens the dropdown menu on toggleMenu()', () => {
    component.toggleMenu();
    fixture.detectChanges();
    expect(component.menuOpen()).toBeTrue();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.user-menu')).not.toBeNull();
  });

  it('does not show the logout modal by default', () => {
    expect(component.modalOpen()).toBeFalse();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.modal-backdrop')).toBeNull();
  });

  it('opens the logout modal on openLogoutModal() and closes the dropdown', () => {
    component.toggleMenu();
    expect(component.menuOpen()).toBeTrue();
    component.openLogoutModal();
    expect(component.modalOpen()).toBeTrue();
    expect(component.menuOpen()).toBeFalse();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.modal-backdrop')).not.toBeNull();
  });

  it('closes the modal on cancelLogout()', () => {
    component.openLogoutModal();
    component.cancelLogout();
    expect(component.modalOpen()).toBeFalse();
  });
});
