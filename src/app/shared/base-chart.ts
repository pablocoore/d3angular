
import * as d3 from 'd3';
import * as moment from 'moment';
import { text } from 'd3';
import { ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';

var locale = {
    "dateTime": "%a %b %e %X %Y",
    "date": "%d/%m/%Y",
    "time": "%H:%M:%S",
    "periods": ['AM', 'PM'] as [string, string],
    "days": ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sábado"] as [string, string, string, string, string, string, string],
    "shortDays": ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"] as [string, string, string, string, string, string, string],
    "months": ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"] as [string, string, string, string, string, string, string, string, string, string, string, string],
    "shortMonths": ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"] as [string, string, string, string, string, string, string, string, string, string, string, string]
};
d3.timeFormatDefaultLocale(locale);

export interface Margin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export abstract class BaseChart {
    @Input('x') protected x: string;
    @Input('ys') protected ys: string[] = [];
    @Input("format-values") protected formatValues = "duration"; //values are "percent", "SI prefix", "duration", "none"

    @ViewChild('chart') protected chartContainer: ElementRef;
    @Input() protected data: Array<any>;
    @Input('group-elements') protected groupElements: boolean = true;
    @Input('group-by') protected group_by: string = "day";//day, week, month, year

    @Input('bar-width-limits') protected barWidthLimit = [8, 50];

    @Input() protected horizontalBars = false;

    @Input() protected showYAxis = true;
    @Input() protected showXAxis = true;
    @Input('enable-tooltip') protected enableTooltips = true;

    @Input() public tooltip: any = { x: "", y: "", z: "", top: "0px", left: "0px", opacity: 0, extra: [] };
    @Input() protected margin = { top: 20, bottom: 20, left: 50, right: 20 };
    //@Input("format-values") protected formatValues = "duration"; //values are "percent", "SI prefix", "duration", "none"

    @Input('limit-x-values') protected limitXValues: [any, any];//[minX, maxX]
    @Input('transition-duration') protected transitionDuration: number = 200;
    @Input('percentage-values') protected percentageValues = [];
    @ViewChild('tooltipElem') protected tooltipElem: ElementRef;
    @Input('show-object-data-on-tooltip') protected showObjectDataOnTooltip = false;
    @Output("data-click") dataClick = new EventEmitter();
    @Input("type-datetime") protected typeDatetime = false;
    @Input() protected offsetChart = 30;

    chart: any;
    width = 0;
    height = 0;
    xScale: any;
    yScale: any;
    colorScale: any;
    xAxis: any;
    yAxis: any;
    barWidth = 0;
    axisFormat
    horizontalTickN = 0;
    legendSpace = 0;
    public mouse = { x: 0, y: 0 };


    normalizeValues(maxValue) {
        if (this.data.length > 0) {
            this.data = this.data.map(elem => {
                if (this.ys.length > 0) {
                    this.ys.forEach(y => {
                        if (y != '') {
                            elem[y] = elem[y] / (maxValue)
                        }
                    })
                } else {
                    elem[1] = elem[1] / (maxValue);
                }
                return elem;
            })
        }
    }

    prettyPrintDuration(duration) {
        let textToDisplay = "";
        const durationHS = moment.duration(duration, 'h');
        const days = durationHS.days();
        const total_hours = (durationHS.hours() + days * 24);
        //textToDisplay += durationHS.days() > 0 ? durationHS.days() + 'd ' : '';
        textToDisplay += total_hours > 0 ? total_hours + 'h' : '';
        textToDisplay += total_hours > 1 ? 's' : ''; // si es mas de una hora se transforma a plural
        textToDisplay += durationHS.minutes() > 0 ? ' ' + durationHS.minutes() + 'm' : '';
        return textToDisplay
    }

    public trackMousePosition($event) {
        this.mouse.x = $event.offsetX - 30;
        this.mouse.y = $event.offsetY - 30;
    }

    setBarWidth(scale) {
        if (this.typeDatetime) {
            const day1 = this.xScale.domain()[0]
            const day2 = moment(day1).add(1, this.group_by as moment.unitOfTime.DurationConstructor);
            const value_day1 = scale(day1)
            const value_day2 = scale(day2)
            const distBetweenBars = (value_day2 - value_day1) * 0.85;
            this.barWidth = Math.max(this.barWidthLimit[0], distBetweenBars);
            this.barWidth = Math.min(this.barWidth, this.barWidthLimit[1])
        } else {
            this.barWidth = scale.bandwidth()
        }
    }


    getYElem(d) {
        if (this.ys.length == 1 && this.ys[0] != '') {
            return d[this.ys[0]];
        } else {
            if (this.ys.length > 1 && d.total === undefined) {
                throw "Missing total attribute, multiple Ys defined";
            }
            if (d.total != undefined) {
                return d.total
            } else {
                return d[1];
            }
        }
    }

    getXElem(d) {
        if (this.x != undefined && this.x != '') {
            return d[this.x];
        } else {
            return d[0];
        }
    }

    isFloat(n){//checking if it's a number and float
        return Number(n) === n && n % 1 !== 0;
    }

    prettyPrint(value, key = null) {
        let iniString = '';
        if (key != null && this.percentageValues.indexOf(key) != -1) {
            iniString = '% ';
        }
        return iniString + (this.isFloat(value) ? value.toFixed(2) : value);
    }

    updateTicksAndScales(){
        let minMaxValues = null;
        if (this.limitXValues == undefined) {
            minMaxValues = d3.extent(this.data, d => d[this.x]);
        } else {
            minMaxValues = this.limitXValues;
        }
        let scaleElem,scaleElem2, axisElem
        if (this.horizontalBars){
            scaleElem=this.yScale.domain(minMaxValues);
            axisElem=this.yAxis;
            scaleElem2=this.xScale;
        }else{
            scaleElem=this.xScale.domain(minMaxValues);
            axisElem=this.xAxis;
            scaleElem2=this.yScale;
        }
        if (this.typeDatetime) {
            switch (this.group_by) {
                case 'day':
                    minMaxValues[0] = moment(minMaxValues[0]).startOf('day').subtract(12, 'h');
                    minMaxValues[1] = moment(minMaxValues[1]).endOf('day').add(12, 'h');
                    scaleElem.domain(minMaxValues);

                    if (this.showXAxis) {
                        if (this.data.length < 5) {
                            axisElem.transition().call(d3.axisBottom(scaleElem).tickFormat(d3.timeFormat('%b %d')).ticks(d3.timeDay.every(1)));
                        } else {
                            axisElem.transition().call(d3.axisBottom(scaleElem).tickFormat(d3.timeFormat('%b %d')));
                        }
                    }
                    break;
                case 'week':
                    minMaxValues[0] = moment(minMaxValues[0]).startOf('week').subtract(3, 'd');
                    minMaxValues[1] = moment(minMaxValues[1]).endOf('week').add(3, 'd');
                    scaleElem.domain(minMaxValues);
                    if (this.showXAxis) axisElem.transition().call(d3.axisBottom(scaleElem).tickFormat(d3.timeFormat('%b %d')));
                    break;
                case 'month':
                    minMaxValues[0] = moment(minMaxValues[0]).startOf('month').subtract(2, 'w');
                    minMaxValues[1] = moment(minMaxValues[1]).endOf('month').add(2, 'w');
                    scaleElem.domain(minMaxValues);
                    if (this.showXAxis) axisElem.transition().call(d3.axisBottom(scaleElem).ticks(d3.timeMonth, 1).tickFormat(d3.timeFormat('%b-%Y')));
                    break;
            }
        } else {
            scaleElem.domain(this.data.map(d => this.getXElem(d)));
        }
        this.setBarWidth(scaleElem);
        scaleElem2.domain([0, d3.max(this.data, (d: any) => this.getYElem(d))]).nice();
        return minMaxValues;
    }


    private formatAxis(scale, isBottom, type, externalFuntion=null){
        let axis= isBottom? d3.axisBottom(scale): d3.axisLeft(scale) 
        switch (type) {
            case "none":
                break;
            case "datetime":
                axis =axis.ticks(d3.timeDay, 2).tickFormat(d3.timeFormat('%b %d'))
                break;
            case "percent":
                axis =axis.tickFormat(d3.format('.0%'))
                break;
            case "SI prefix":
                axis =axis.tickFormat(d3.format('.0s'))
                break;
            case "duration":
                axis =axis.tickFormat((n: number) => {
                    return externalFuntion(n)
                })
                break;
            default:
                break;
        }
        return axis
    }

    createChart() {
        const element = this.chartContainer.nativeElement;
        this.width = element.offsetWidth - this.margin.left - this.margin.right;
        this.height = element.offsetHeight - this.margin.top - this.margin.bottom;
        const prettyPrintDurationFuntion=this.prettyPrintDuration;

        //console.log("element.offsetHeight", element.offsetHeight);
        const svg = d3.select(element).append('svg')
            .attr('width', element.offsetWidth)
            .attr('height', element.offsetHeight);
        
        let domain = this.data.map((d: any) => this.getXElem(d));
        let codomain =  [0, d3.max(this.data, (d: any) => this.getYElem(d))];
        let xDomain, yDomain
        // define X & Y domains
        if (!this.horizontalBars){
            xDomain = domain;
            yDomain = codomain;
            this.xScale= this.typeDatetime ? d3.scaleTime(): d3.scaleBand().padding(0.1);
            this.yScale= d3.scaleLinear();
        }else{
            xDomain = codomain;
            yDomain = domain;
            this.xScale= d3.scaleLinear();
            this.yScale= this.typeDatetime ? d3.scaleTime(): d3.scaleBand().padding(0.1);
        }
        this.xScale=this.xScale.domain(xDomain).rangeRound([0, this.width - this.legendSpace])
        this.yScale=this.yScale.domain(yDomain).rangeRound([this.height, 0])
        const formatAxis=this.formatAxis
        if (this.showXAxis){
            this.xAxis = svg.append('g')
            .attr('class', 'axis axis-x')
            .attr('transform', `translate(${this.margin.left + this.offsetChart}, ${this.margin.top + this.height})`);
            if (this.typeDatetime && !this.horizontalBars) {
                this.xAxis.call(formatAxis(this.xScale, true, 'datetime'));
            } else {
                this.xAxis.call(formatAxis(this.xScale, true, this.formatValues, prettyPrintDurationFuntion));
            }
        }

        if (this.showYAxis) {
            this.yAxis = svg.append('g')
                .attr('class', 'axis axis-y')
                .attr('transform', `translate(${this.margin.left+ this.offsetChart}, ${this.margin.top})`)
            if (this.typeDatetime && this.horizontalBars) {
                this.yAxis.call(formatAxis(this.yScale, false, 'datetime'));
            } else {
                this.yAxis.call(formatAxis(this.yScale, false, this.formatValues, prettyPrintDurationFuntion));
            }
        }
        if (this.horizontalBars){
            this.setBarWidth(this.yScale);
        }else{
            this.setBarWidth(this.xScale);
        }

        // chart plot area
        this.chart = svg.append('g')
            .attr('class', 'chartArea')
            .attr('transform', `translate(${this.margin.left + this.offsetChart}, ${this.margin.top})`);
    }
}