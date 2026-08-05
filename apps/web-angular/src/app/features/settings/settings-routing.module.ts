import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SettingsComponent } from './settings.component';
const routes: Routes = [
  { path: '', component: SettingsComponent },
  {
    path: 'devices',
    loadChildren: () => import('./devices/devices.module').then((m) => m.DevicesModule),
  },
  {
    path: 'subscription',
    loadChildren: () =>
      import('./subscription/subscription.module').then((m) => m.SubscriptionModule),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SettingsRoutingModule {}
