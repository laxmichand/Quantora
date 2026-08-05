import { TestBed } from '@angular/core/testing';
import { SettingsNavComponent } from './settings-nav.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

describe('SettingsNavComponent', () => {
  let component: SettingsNavComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SettingsNavComponent],
      imports: [RouterTestingModule, MatIconModule, TranslateModule.forRoot()],
      providers: [
        {
          provide: TranslateService,
          useValue: { instant: (key: string) => key },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsNavComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to the general tab', () => {
    expect(component.tab).toBe('general');
    expect(component.tabs['general'].route).toBe('/settings');
  });

  it('should expose a single tab definition per tab id', () => {
    expect(Object.keys(component.tabs)).toEqual(['general', 'devices', 'subscription']);
  });

  it('should map devices tab to its route and label', () => {
    component.tab = 'devices';
    expect(component.tabs['devices'].route).toBe('/settings/devices');
    expect(component.tabs['devices'].label).toBe('DEVICES.TITLE');
  });

  it('should map subscription tab to its route and label', () => {
    component.tab = 'subscription';
    expect(component.tabs['subscription'].route).toBe('/settings/subscription');
    expect(component.tabs['subscription'].label).toBe('SETTINGS.SUBSCRIPTION');
  });

  it('should mark the general link as exact-matched', () => {
    expect(component.tabs['general'].exact).toBeTrue();
    expect(component.tabs['devices'].exact).toBeFalse();
    expect(component.tabs['subscription'].exact).toBeFalse();
  });
});
