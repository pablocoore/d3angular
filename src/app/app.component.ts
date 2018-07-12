import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
  chartData: Array<any>;
  chartData2: Array<any>;
  stackedChartData: Array<any>;
  stackedChartData2: Array<any>;
  lineChartData: Array<any>;
  pieChartData: Array<any>;

  groupByWeek = 'week';
  groupByMonth = 'month';

  x_attr = 'fecha';
  x= 'x';
  y= 'y';
  showExtraData='showExtraData';
  
  show_x=false;
  show_y=false;
  thresholds=[50]
  colors=['red', 'green']
  enableTooltip=true;
  constructor() {}

  ngOnInit() {
    // give everything a chance to get loaded before starting the animation to reduce choppiness
    this.generateBarData();
    this.generateStackedBarData();
    this.generatePieChartData();

    let a=setInterval(() => {
      this.generateBarData();
      this.generateStackedBarData();
      this.generatePieChartData();
    }, 10000);

    setTimeout(()=>{
      clearInterval(a);
    },40000)
  }

  generateBarData() {
    this.chartData = [];
    this.chartData2 = [];

    for (let i = 0; i < (8 + Math.floor(Math.random() * 10)); i++) {
      this.chartData.push([
        `Index ${i}`,
        Math.floor(Math.random() * 100)
      ]);
    }

    for (let i = 0; i < (30 + Math.floor(Math.random() * 30)); i++) {
      this.chartData2.push({
          x:`Index ${i}`,
          y:Math.floor(Math.random() * 100),
          price: '$'+ (150+Math.floor(Math.random() * 100)),
          cost: '$'+ (20+Math.floor(Math.random() * 120))
        }
      );
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
  generatePieChartData(){
    this.pieChartData=[];
    let soccerPlayers=["Cristiano Ronaldo", "Lionel Messi", "Neymar", "Paul Pogba", "Luis Suárez", "Edinson Cavani", "Gareth Bale", "Harry Kane", "Andrés Iniesta"]
    let seed =Math.floor(Math.random() * soccerPlayers.length);
    for (let i = 0; i < (2 + Math.floor(Math.random() * 5)); i++) {
      this.pieChartData.push(
        {
          "label": soccerPlayers[ (seed+i) % soccerPlayers.length],
          "value": Math.floor(Math.random() * 50)
        },
      );
    }
  }
}
