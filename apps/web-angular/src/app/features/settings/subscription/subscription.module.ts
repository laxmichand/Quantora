import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SubscriptionComponent } from './subscription.component';

const routes: Routes = [{ path: '', component: SubscriptionComponent }];

@NgModule({
  declarations: [SubscriptionComponent],
  imports: [CommonModule, RouterModule.forChild(routes), MatIconModule, MatButtonModule],
})
export class SubscriptionModule {}
