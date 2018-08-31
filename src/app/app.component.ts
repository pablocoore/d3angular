import { Component, OnInit } from '@angular/core';
import * as moment from 'moment';
import { cardList } from './config-objects'

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit {
    chartData: Array<any>;
    horizontalBarData = [35];
    yFormat = "percent"

    stackedChartData2: Array<any>;

    lineChartData: Array<any>;
    pieChartData: Array<any>;

    groupByWeek = 'week';
    groupByMonth = 'month';

    x_attr = 'fecha';
    y_attrs = ['percentage_completed', 'percentage_missing'];
    barWidths = [8, 8];
    limitX = [new Date(), moment().add(150, 'd').toDate()]

    x = 'x';
    y = ['y'];
    showExtraData = 'showExtraData';

    format_percentage = "percentage";
    false_value = false;
    true_value = true;

    thresholds = [50]
    colors2 = ['steelblue']

    colors = ['#dc3545', '#28a745'];
    colors3 = ['#28a745', '#fff', '#dc3545']
    enableTooltip = true;
    constructor() { }
    cards = [];
    ngOnInit() {
        this.cards = cardList
        // give everything a chance to get loaded before starting the animation to reduce choppiness
        this.generateBarData();
        this.generateStackedBarData();
        this.generatePieChartData();

        let a = setInterval(() => {
            this.generateBarData();
            this.generateStackedBarData();
            this.generatePieChartData();
            this.cards.forEach(elem=> elem.data=elem.generateData())
        }, 10000);

        setTimeout(() => {
            clearInterval(a);
        }, 40000)
    }

    generateBarData() {
        let years: [number, number] = [1980, 2018]

        this.chartData =[]
        for (let i = 1980+Math.floor(Math.random() * 10); i < 2018-Math.floor(Math.random() * 5); i++) {
            this.chartData.push(
                {
                    year: i,
                    value: Math.floor(Math.random() * 200)
                },
            );
        }
    }

    mostrarClick($event) {
        console.log("recibido:", $event);
    }

    generateStackedBarData() {
        this.stackedChartData2 = [];

        for (let i = 0; i < (40 + Math.floor(Math.random() * 70)); i++) {
            this.stackedChartData2.push(
                {
                    "fecha": moment().add(i, 'd').toDate(),
                    "Jorge Batlle": Math.floor(Math.random() * 2),
                    "Jose Mujica": Math.floor(Math.random() * 8),
                    "Tabaré Vazquez": Math.floor(Math.random() * 6),
                    "Julio Sanguinetti": Math.floor(Math.random() * 8),
                    "Luis Lacalle": Math.floor(Math.random() * 4)

                },
            );
        }

        this.lineChartData = this.stackedChartData2;
    }
    generatePieChartData() {
        this.pieChartData = [];
        let soccerPlayers = ["Cristiano Ronaldo", "Lionel Messi", "Neymar", "Paul Pogba", "Luis Suárez", "Edinson Cavani", "Gareth Bale", "Harry Kane", "Andrés Iniesta"]
        let seed = Math.floor(Math.random() * soccerPlayers.length);
        for (let i = 0; i < (2 + Math.floor(Math.random() * 5)); i++) {
            this.pieChartData.push(
                {
                    "label": soccerPlayers[(seed + i) % soccerPlayers.length],
                    "value": Math.floor(Math.random() * 50)
                },
            );
        }
    }
}
