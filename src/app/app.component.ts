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
    chartData2: Array<any>;
    chartData3: Array<any>;

    stackedChartData: Array<any>;
    stackedChartData2: Array<any>;
    stackedChartData3: Array<any>;
    stackedChartData4: Array<any>;

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
        }, 10000);

        setTimeout(() => {
            clearInterval(a);
        }, 40000)
    }

    generateBarData() {
        this.chartData = [];
        this.chartData2 = [];
        this.chartData3 = [];

        for (let i = 0; i < (8 + Math.floor(Math.random() * 10)); i++) {
            this.chartData.push([
                `Index ${i}`,
                Math.floor(Math.random() * 100)
            ]);
        }

        for (let i = 0; i < (8 + Math.floor(Math.random() * 17)); i++) {
            this.chartData2.push({
                x: `Index ${i}`,
                y: Math.floor(Math.random() * 100),
                price: '$' + (150 + Math.floor(Math.random() * 100)),
                cost: '$' + (20 + Math.floor(Math.random() * 120))
            }
            );
        }


        for (let i = 0; i < (8 + Math.floor(Math.random() * 40)); i++) {
            this.chartData3.push(
                {
                    "x": moment().add(i, 'd').toDate(),
                    "y": Math.floor(Math.random() * 100)
                },
            );
        }
    }

    mostrarClick($event) {
        console.log("recibido:", $event);
    }

    generateStackedBarData() {
        this.stackedChartData = [];
        this.stackedChartData2 = [];
        this.stackedChartData3 = [];
        this.stackedChartData4 = [];

        for (let i = 0; i < (8 + Math.floor(Math.random() * 40)); i++) {
            this.stackedChartData.push(
                {
                    "fecha": moment().add(i, 'd').toDate(),
                    "JORGE MARTINEZ": Math.floor(Math.random() * 2),
                    "DANIEL ANDRADE": Math.floor(Math.random() * 8)
                },
            );
        }

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

        for (let i = 0; i < (10 + Math.floor(Math.random() * 15)); i++) {
            let empty_chunk = Math.floor(Math.random() * 10)
            let total_hours = Math.floor(Math.random() * 40);
            let invoiced_hours = Math.floor(Math.random() * total_hours);
            let percentage = total_hours > 0 ? Math.floor(invoiced_hours / total_hours * 100) : 0;
            this.stackedChartData3.push(
                {
                    "fecha": moment().add((i + empty_chunk) * 7, 'd').toDate(),
                    "percentage_completed": percentage,
                    "percentage_missing": percentage < 100 ? 100 - percentage : 0,
                    "Total hours": total_hours,
                    "Invoiced hours": invoiced_hours,
                },
            );
        }

        for (let i = 0; i < (10 + Math.floor(Math.random() * 20)); i++) {
            let empty_chunk = Math.floor(Math.random() * 15)
            let total_hours = Math.floor(Math.random() * 40);
            let invoiced_hours = Math.floor(Math.random() * total_hours);
            let percentage = total_hours > 0 ? Math.floor(invoiced_hours / total_hours * 100) : 0;
            this.stackedChartData4.push(
                {
                    "fecha": moment().add((i + empty_chunk) * 7, 'd').toDate(),
                    "percentage_completed": percentage,
                    "percentage_missing": percentage < 100 ? 100 - percentage : 0,
                    "Total hours": total_hours,
                    "Invoiced hours": invoiced_hours,
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
