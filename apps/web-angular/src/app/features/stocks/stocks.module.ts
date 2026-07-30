import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { StocksRoutingModule } from './stocks-routing.module';
import { StockListComponent } from './stock-list/stock-list.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [StockListComponent],
  imports: [CommonModule, FormsModule, MatIconModule, StocksRoutingModule, SharedModule],
})
export class StocksModule {}
