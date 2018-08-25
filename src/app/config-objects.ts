import * as moment from 'moment';
import { ChartConfig } from './shared/models/chart-config.model';
import { CardChart } from './card-chart.model';



let card1 = new CardChart('bar');
card1.generateData = function (){
    let data=[]
    for (let i = 0; i < (8 + Math.floor(Math.random() * 10)); i++) {
        data.push([
            `Index ${i}`,
            Math.floor(Math.random() * 100)
        ]);
    }
    return data
}
card1.data = card1.generateData() ;
card1.config.formatValues= 'percent';
card1.config.type= 'bar';



let card2 = new CardChart('bar');
card2.generateData = function (){
    let data=[]
    for (let i = 0; i < (8 + Math.floor(Math.random() * 17)); i++) {
        data.push({
            x:`Index ${i}`,
            y:Math.floor(Math.random() * 100),
            price: '$'+ (150+Math.floor(Math.random() * 100)),
            cost: '$' + (20 + Math.floor(Math.random() * 120))
        }
        );
    }
    return data
}
//height 700px
card2.data = card2.generateData() ;
card2.config.showXAxis=false
card2.config.colorList=['steelblue']
card2.config.x='x'
card2.config.ys=['y']
card2.config.percentageValues=['y']
card2.config.showObjectDataOnTooltip=true
card2.config.horizontalBars=true;
card2.config.type= 'bar';



//HORIZONTAL BAR
let card3 = new CardChart('bar');
card3.generateData = function (){
    let data=[]
    for (let i = 0; i < (8 + Math.floor(Math.random() * 40)); i++) {
        data.push(
            {
                "x": moment().add(i, 'd').toDate(),
                "y": Math.floor(Math.random() * 100)
            },
        );
    }
    return data
}
//height 700px
card3.data = card3.generateData() ;
card3.config.showXAxis=false
card3.config.showYAxis=false
card3.config.colorList=['#dc3545', '#28a745']
card3.config.x='x'
card3.config.ys=['y']
card3.config.showObjectDataOnTooltip=true
card3.config.type= 'bar';
card3.config.thresholdList= [50];
card3.config.enableTooltips= true;
card3.config.typeDatetime= true;


card3.debug=true;
/*<app-horizontal-bar style="width:800px; height:40px" 
                    *ngIf="horizontalBarData"
                    [data]="horizontalBarData"
                    [color-list]="['steelblue']">
</app-horizontal-bar>
*/

let card4 = new CardChart('stacked');
card4.generateData = function () {
    let data = []
    for (let i = 0; i < (8 + Math.floor(Math.random() * 40)); i++) {
        data.push(
            {
                "fecha": moment().add(i, 'd').toDate(),
                "JORGE MARTINEZ": Math.floor(Math.random() * 2),
                "DANIEL ANDRADE": Math.floor(Math.random() * 8)
            },
        );
    }
    return data
}
//data click
card4.data = card4.generateData() ;
card4.config.x='fecha'
card4.config.type="stacked"


let card5 = new CardChart('stacked');
card5.generateData = function () {
    let data = []
    for (let i = 0; i < (40 + Math.floor(Math.random() * 70)); i++) {
        data.push(
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
    return data
}
//data click
card5.data = card5.generateData() ;
card5.config.x='fecha'
card5.config.type='stacked';



let card6 = new CardChart('stacked');
card6.generateData = function () {
    let data = []
    for (let i = 0; i < (40 + Math.floor(Math.random() * 70)); i++) {
        data.push(
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
    return data
}
//data click
card6.data = card6.generateData() ;
card6.config.x='fecha'
card6.config.type='stacked';
card6.config.groupBy='week';



let card7 = new CardChart('stacked');
card7.generateData = function () {
    let data = []
    for (let i = 0; i < (40 + Math.floor(Math.random() * 70)); i++) {
        data.push(
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
    return data
}
//data click
card7.data = card7.generateData() ;
card7.config.x='fecha'
card7.config.type='stacked';
card7.config.groupBy='month';
card7.config.fixedSize=false;

/*
<app-line-chart style="width:800px; height: 400px" 
                *ngIf="stackedChartData2" 
                [data]="stackedChartData2"
                [x]="'fecha'">
</app-line-chart>
*/



let card8 = new CardChart('stacked');
card8.generateData = function () {
    let data = []
    for (let i = 0; i < (10 + Math.floor(Math.random() * 15)); i++) {
        let empty_chunk = Math.floor(Math.random() * 10)
        let total_hours=Math.floor(Math.random() * 40);
        let invoiced_hours=Math.floor(Math.random() * total_hours);
        let percentage = total_hours > 0 ? Math.floor(invoiced_hours / total_hours * 100) : 0;
        data.push(
            {
                "fecha": moment().add((i + empty_chunk) * 7, 'd').toDate(),
                "percentage_completed": percentage,
                "percentage_missing": percentage < 100 ? 100 - percentage : 0,
                "Total hours": total_hours,
                "Invoiced hours": invoiced_hours,
            },
        );
    }
    return data
}
card8.data = card8.generateData() ;
card8.config.showYAxis=false;
card8.config.showLegend=false;
card8.config.barWidthLimits=[8,8];
card8.config.limitXValues=[new Date(), moment().add(150,'d').toDate()];
card8.config.x='fecha'
card8.config.ys=['percentage_completed', 'percentage_missing']
card8.config.showObjectDataOnTooltip=true;
card8.config.groupElements=false;
card8.config.formatValues='percentage';
card8.config.colorList=['#28a745','#fff', '#dc3545'];
card8.config.type= 'stacked';






let card9 = new CardChart('stacked');
card9.generateData = function () {
    let data = []
    for (let i = 0; i < (10 + Math.floor(Math.random() * 20)); i++) {
        let empty_chunk = Math.floor(Math.random() * 15)
        let total_hours=Math.floor(Math.random() * 40);
        let invoiced_hours=Math.floor(Math.random() * total_hours);
        let percentage = total_hours>0? Math.floor(invoiced_hours/total_hours*100): 0;
        data.push(
          {
            "fecha": moment().add((i+empty_chunk)*7,'d').toDate(),
            "percentage_completed":percentage,
            "percentage_missing":percentage<100? 100-percentage: 0,
            "Total hours":total_hours,
            "Invoiced hours":invoiced_hours,
          },
        );
      }
    return data
}
card9.data = card9.generateData() ;
card9.config.showYAxis=false;
card9.config.showLegend=false;
card9.config.barWidthLimits=[8,8];
card9.config.limitXValues=[new Date(), moment().add(150,'d').toDate()];
card9.config.x='fecha'
card9.config.ys=['percentage_completed', 'percentage_missing']
card9.config.showObjectDataOnTooltip=true;
card9.config.groupElements=false;
card9.config.formatValues='percentage';
card9.config.colorList=['#28a745','#fff', '#dc3545'];
card9.config.type= 'stacked';

/*
<app-pie-chart style="width:800px; height: 400px" 
                *ngIf="pieChartData"
                [data]="pieChartData"
                (data-click)="mostrarClick($event)">
</app-pie-chart>
*/

export let cardList=[card1, card2, card3, card4, card5,
                card6, card7, card8, card9]