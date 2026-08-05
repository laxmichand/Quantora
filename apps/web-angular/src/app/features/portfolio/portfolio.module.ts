import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '../../shared/shared.module';
import { PortfolioRoutingModule } from './portfolio-routing.module';
import { PortfolioOverviewComponent } from './portfolio-overview/portfolio-overview.component';

@NgModule({
  declarations: [PortfolioOverviewComponent],
  imports: [SharedModule, TranslateModule, PortfolioRoutingModule],
})
export class PortfolioModule {}
