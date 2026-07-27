import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/landing/landing.module').then((m) => m.LandingModule),
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./features/dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'stocks',
    loadChildren: () => import('./features/stocks/stocks.module').then((m) => m.StocksModule),
  },
  {
    path: 'portfolio',
    loadChildren: () =>
      import('./features/portfolio/portfolio.module').then((m) => m.PortfolioModule),
  },
  {
    path: 'ai-chat',
    loadChildren: () => import('./features/ai-chat/ai-chat.module').then((m) => m.AiChatModule),
  },
  {
    path: 'settings',
    loadChildren: () => import('./features/settings/settings.module').then((m) => m.SettingsModule),
  },
  {
    path: 'home',
    loadChildren: () => import('./features/home/home.module').then((m) => m.HomeModule),
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
