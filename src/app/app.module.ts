import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { BarChartComponent } from './shared/bar-chart/bar-chart.component';
import { StackedBarChartComponent } from './shared/stacked-bar-chart/stacked-bar-chart.component';


@NgModule({
  declarations: [
    AppComponent,
    BarChartComponent,
    StackedBarChartComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
