
export class ChartConfig { 
    //DATA CONFIG
    x= '';
    ys= [];
    //data: any[];

    //DATA DISPLAY
    percentageValues: string[]=[];
    formatValues= "duration"; //values are "percent", "SI prefix", "duration", "none";
    groupElements= true;
    groupBy= "day"; //day, week, month, year;
    typeDatetime= false;
    tooltip= { x: "", y: "", z: "", top: "0px", left: "0px", opacity: 0, extra: [] };
    colorList: string[];

    //CHART MEASURES
    distanceBetweenBars= 5;
    barWidthLimits=[8, 50];
    minChartWidth= 350;
    minChartHeight= 350;
    margin= { top: 20, bottom: 20, left: 20, right: 20 };
    limitXValues: [any, any];
    fixedSize= false;

    //CHART CONFIG;
    horizontalBars= false;
    showYAxis= true;
    showXAxis= true;
    showYAxisLine= true;
    enableTooltips= true;
    showObjectDataOnTooltip= false;
    transitionDuration= 200;
    rotateXAxisLabels= false;

    //BAR CHART CUSTOM CONFIG
    thresholdList: number[] = [];//ordered list of thresholds: [5.4, 27, 45]

    //STACKED BAR CUSTOM CONFIG
    showLegend:boolean;

    constructor(type){
        this.type=type;
        switch (this.type) {
            case 'bar':
                this.colorList=['red','blue']
                this.formatValues = "none";
                this.typeDatetime=false;
                this.groupElements=false;
            break;
            case 'stacked':
                this.colorList=['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00', "#8595e1", "#b5bbe3", "#e6afb9", "#e07b91", "#d33f6a", "#11c638", "#8dd593", "#c6dec7", "#ead3c6", "#f0b98d", "#ef9708", "#0fcfc0", "#9cded6", "#d5eae7", "#f3e1eb", "#f6c4e1", "#f79cd4"];
                this.formatValues = "duration";
                this.typeDatetime=true;
                this.showYAxisLine= false;
                this.fixedSize=true;
                this.showLegend = true;
            break;

            default:
            break;
        }
    }

    type="bar"
}
