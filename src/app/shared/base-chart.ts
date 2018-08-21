
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

    @ViewChild('chart') protected chartContainer: ElementRef;
    @Input() protected data: Array<any>;
    @Input('group-elements') protected groupElements: boolean = true;
    @Input('group-by') protected group_by: string = "day";//day, week, month, year

    @Input('bar-width-limits') protected barWidthLimit = [8, 50];

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


    protected chart: any;
    protected width = 0;
    protected height = 0;
    protected xScale: any;
    protected yScale: any;
    protected colorScale: any;
    protected xAxis: any;
    protected yAxis: any;
    protected barWidth = 0;
    protected axisFormat
    protected offsetChart = 30;
    protected horizontalTickN = 0;
    public mouse = { x: 0, y: 0 };


    protected normalizeValues(maxValue) {
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

    setBarWidth() {
        if (this.typeDatetime) {
            const day1 = this.xScale.domain()[0]
            const day2 = moment(day1).add(1, this.group_by as moment.unitOfTime.DurationConstructor);
            const value_day1 = this.xScale(day1)
            const value_day2 = this.xScale(day2)
            const distBetweenBars = (value_day2 - value_day1) * 0.85;
            this.barWidth = Math.max(this.barWidthLimit[0], distBetweenBars);
            this.barWidth = Math.min(this.barWidth, this.barWidthLimit[1])
        } else {
            this.barWidth = this.xScale.bandwidth()
        }
    }


}