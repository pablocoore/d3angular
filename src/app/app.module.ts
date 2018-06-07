import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { BarChartComponent } from './shared/bar-chart/bar-chart.component';
import { StackedBarChartComponent } from './shared/stacked-bar-chart/stacked-bar-chart.component';
import { LineChartComponent } from './shared/line-chart/line-chart.component';


@NgModule({
  declarations: [
    AppComponent,
    BarChartComponent,
    StackedBarChartComponent,
    LineChartComponent
  ],
  imports: [
    BrowserModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
