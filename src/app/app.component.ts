import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  chartData: Array<any>;
  stackedChartData: Array<any>;
  stackedChartData2: Array<any>;
  lineChartData: Array<any>;

  groupByWeek = 'week';
  groupByMonth = 'month';

  x_attr = 'fecha';

  constructor() {}

  ngOnInit() {
    // give everything a chance to get loaded before starting the animation to reduce choppiness
    this.generateBarData();
    this.generateStackedBarData();

    setInterval(() => {
      this.generateBarData();
      this.generateStackedBarData();
    }, 20000);
  }

  generateBarData() {
    this.chartData = [];
    for (let i = 0; i < (8 + Math.floor(Math.random() * 10)); i++) {
      this.chartData.push([
        `Index ${i}`,
        Math.floor(Math.random() * 100)
      ]);
    }
  }

  mostrarClick($event){
    console.log("recibido:", $event);
  }

  generateStackedBarData() {
    this.stackedChartData = [];
    this.stackedChartData2 = [];

    for (let i = 0; i < (8 + Math.floor(Math.random() * 40)); i++) {
      this.stackedChartData.push(
        {
          "fecha": moment().add(i,'d').toDate(),
          "JORGE MARTINEZ":Math.floor(Math.random() * 2),
          "DANIEL ANDRADE":Math.floor(Math.random() * 8),
          "JUAN GONZALEZ":Math.floor(Math.random() * 6)
        },
      );
    }

    for (let i = 0; i < (40 + Math.floor(Math.random() * 70)); i++) {
      this.stackedChartData2.push(
        {
          "fecha": moment().add(i,'d').toDate(),
          "Jorge Batlle":Math.floor(Math.random() * 2),
          "Jose Mujica":Math.floor(Math.random() * 8),
          "Tabaré Vazquez":Math.floor(Math.random() * 6),
          "Julio Sanguinetti":Math.floor(Math.random() * 8),
          "Luis Lacalle":Math.floor(Math.random() * 4)

        },
      );
    }
    this.lineChartData = this.stackedChartData2;
  }

}
