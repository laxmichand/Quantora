import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { RouterModule } from '@angular/router';

import { DataTableComponent } from './components/data-table/data-table.component';
import { SettingsNavComponent } from './components/settings-nav/settings-nav.component';

const COMPONENTS = [DataTableComponent, SettingsNavComponent];

const MATERIAL = [
  CommonModule,
  FormsModule,
  MatIconModule,
  MatButtonModule,
  MatCardModule,
  MatTooltipModule,
  MatMenuModule,
  DragDropModule,
  RouterModule,
];

@NgModule({
  declarations: [...COMPONENTS],
  imports: [...MATERIAL],
  exports: [...COMPONENTS, ...MATERIAL],
})
export class SharedModule {}
