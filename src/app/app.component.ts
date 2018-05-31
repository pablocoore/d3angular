import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  private chartData: Array<any>;
  private stackedChartData: Array<any>;
  private stackedChartData2: Array<any>;
  x_attr = 'fecha';

  constructor() {}

  ngOnInit() {
    // give everything a chance to get loaded before starting the animation to reduce choppiness
    this.generateData();
    this.generateStackedBarData();
    setInterval(() => {
      this.generateData();

      // change the data periodically
      //setTimeout(() => {
        this.generateStackedBarData();
        //this.generateData();
      //}, 2000);
    }, 20000);
  }

  generateData() {
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

  }
}
