import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-settings-nav',
  standalone: false,
  templateUrl: './settings-nav.component.html',
  styleUrls: ['./settings-nav.component.scss'],
})
export class SettingsNavComponent {
  @Input() tab: 'general' | 'devices' | 'subscription' = 'general';

  readonly tabs: Record<string, { route: string; icon: string; label: string; exact: boolean }> = {
    general: { route: '/settings', icon: 'settings', label: 'SETTINGS.GENERAL', exact: true },
    devices: {
      route: '/settings/devices',
      icon: 'devices',
      label: 'DEVICES.TITLE',
      exact: false,
    },
    subscription: {
      route: '/settings/subscription',
      icon: 'workspace_premium',
      label: 'SETTINGS.SUBSCRIPTION',
      exact: false,
    },
  };
}
