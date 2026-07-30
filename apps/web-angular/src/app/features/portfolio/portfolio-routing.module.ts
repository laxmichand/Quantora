import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PortfolioOverviewComponent } from './portfolio-overview/portfolio-overview.component';

const routes: Routes = [{ path: '', component: PortfolioOverviewComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PortfolioRoutingModule {}
