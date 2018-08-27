import { BrowserModule } from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { BarChartComponent } from './shared/bar-chart/bar-chart.component';
import { StackedBarChartComponent } from './shared/stacked-bar-chart/stacked-bar-chart.component';
import { LineChartComponent } from './shared/line-chart/line-chart.component';
import { PieChartComponent } from './shared/pie-chart/pie-chart.component';
import { HorizontalBarComponent } from './shared/horizontal-bar/horizontal-bar.component';
import { MainDashboardComponent } from './main-dashboard/main-dashboard.component';
import { MatGridListModule, MatCardModule, MatMenuModule, MatIconModule, MatButtonModule } from '@angular/material';
import { LayoutModule } from '@angular/cdk/layout';
import { BrushableBarsComponent } from './shared/brushable-bars/brushable-bars.component';


@NgModule({
  declarations: [
    AppComponent,
    BarChartComponent,
    StackedBarChartComponent,
    LineChartComponent,
    PieChartComponent,
    HorizontalBarComponent,
    MainDashboardComponent,
    BrushableBarsComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    LayoutModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
