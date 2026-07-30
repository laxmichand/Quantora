import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/landing/landing.module').then((m) => m.LandingModule),
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.module').then((m) => m.DashboardModule),
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'stocks',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/stocks/stocks.module').then((m) => m.StocksModule),
  },
  {
    path: 'portfolio',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/portfolio/portfolio.module').then((m) => m.PortfolioModule),
  },
  {
    path: 'ai-chat',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/ai-chat/ai-chat.module').then((m) => m.AiChatModule),
  },
  {
    path: 'settings',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/settings/settings.module').then((m) => m.SettingsModule),
  },
  {
    path: 'home',
    canActivate: [AuthGuard],
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
