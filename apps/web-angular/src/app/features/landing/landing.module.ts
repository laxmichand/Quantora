import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { LandingRoutingModule } from './landing-routing.module';
import { LandingComponent } from './landing.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [LandingComponent],
  imports: [CommonModule, MatIconModule, TranslateModule, LandingRoutingModule, SharedModule],
})
export class LandingModule {}
