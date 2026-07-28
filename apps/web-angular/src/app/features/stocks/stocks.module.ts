import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { StocksRoutingModule } from './stocks-routing.module';
import { StockListComponent } from './stock-list/stock-list.component';

@NgModule({
  declarations: [StockListComponent],
  imports: [CommonModule, FormsModule, MatIconModule, StocksRoutingModule],
})
export class StocksModule {}
