
import * as d3 from 'd3';
import * as moment from 'moment';
import { text } from 'd3';
import { ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { ChartConfig } from './models/chart-config.model';

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
    @ViewChild('chart') protected chartContainer: ElementRef;
    @ViewChild('tooltipElem') protected tooltipElem: ElementRef;

    @Output("data-click") dataClick = new EventEmitter();

    @Input() protected data = [];
    @Input() protected configObject: ChartConfig;

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
    codomainMinMax: [any, any];

    public mouse = { x: 0, y: 0 };
    protected keys = [];

    initMargins() {
        if (this.configObject.horizontalBars || (this.configObject.typeDatetime && this.configObject.showYAxis)) {
            this.configObject.margin.left = Math.max(this.configObject.margin.left, 85)
        } else if (this.configObject.showYAxis) {
            this.configObject.margin.left = Math.max(this.configObject.margin.left, 40)
        }

        if (this.configObject.typeDatetime) {
            if (this.configObject.horizontalBars) {
                this.configObject.margin.bottom = this.configObject.margin.bottom + this.configObject.barWidthLimits[1] * 0.8
            } else {
                this.configObject.margin.right = this.configObject.margin.right + this.configObject.barWidthLimits[1] * 0.8
            }
        }
        if (this.configObject.rotateXAxisLabels){
            this.configObject.margin.bottom = Math.max(this.configObject.margin.left, 65)
        }
    }

    normalizeValues(maxValue) {
        if (this.data.length > 0) {
            this.data = this.data.map(elem => {
                if (this.configObject.ys.length > 0) {
                    this.configObject.ys.forEach(y => {
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

    groupData() {
        if (this.configObject.groupElements) {
            let grouped_elems = d3.nest()
                // agrupamos por semana/mes, etc y ponemos en la key los dias
                .key((d: any) => moment(d[this.configObject.x]).startOf(this.configObject.groupBy as moment.unitOfTime.StartOf).format('YYYY-MM-DD'))
                .rollup((values) => { // aplicamos la funcion a cada grupo
                    const group: any = {};
                    this.keys.forEach(key => {
                        group[key] = d3.sum(values, (d) => d[key]);
                    });
                    return group;
                })
                .map(this.data);
            const grouped_elems_list = grouped_elems.values();
            const grouped_elems_keys = grouped_elems.keys();
            this.data = grouped_elems_list.map((elem, i) => {
                elem[this.configObject.x] = moment(grouped_elems_keys[i]).toDate();
                return elem;
            });   
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
        if (this.configObject.typeDatetime) {
            const day1 = this.xScale.domain()[0]
            const day2 = moment(day1).add(1, this.configObject.groupBy as moment.unitOfTime.DurationConstructor);
            const value_day1 = scale(day1)
            const value_day2 = scale(day2)
            const distBetweenBars = (value_day2 - value_day1) * 0.85;
            this.barWidth = Math.max(this.configObject.barWidthLimits[0], distBetweenBars);
            this.barWidth = Math.min(this.barWidth, this.configObject.barWidthLimits[1])
        } else {
            this.barWidth = scale.bandwidth()
        }
    }


    getYElem(d) {
        if (this.configObject.ys !== undefined && this.configObject.ys.length == 1 && this.configObject.ys[0] != '') {
            return d[this.configObject.ys[0]];
        } else {
            if (this.configObject.ys !== undefined && this.configObject.ys.length > 1 && d.total === undefined) {
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
        if (this.configObject.x != undefined && this.configObject.x != '') {
            return d[this.configObject.x];
        } else {
            return d[0];
        }
    }

    isFloat(n) {//checking if it's a number and float
        return Number(n) === n && n % 1 !== 0;
    }

    prettyPrint(value, key = null) {
        let iniString = '';
        if (key != null && this.configObject.percentageValues.indexOf(key) != -1) {
            iniString = '% ';
        }
        return iniString + (this.isFloat(value) ? value.toFixed(2) : value);
    }

    updateWidthAndHeight() {
        // if (this.typeDatetime) return;
        if (!this.configObject.fixedSize) {
            let chartWidthArea = this.chartContainer.nativeElement.offsetWidth - this.configObject.margin.left - this.configObject.margin.right;
            let chartHeigthArea = this.chartContainer.nativeElement.offsetHeight - this.configObject.margin.top - this.configObject.margin.bottom;
            this.height = chartHeigthArea;
            this.width = chartWidthArea;
            if (this.configObject.horizontalBars) {
                this.height = Math.min(this.data.length * this.configObject.barWidthLimits[1] + (this.data.length - 1) * this.configObject.distanceBetweenBars, this.height);
                this.height = Math.max(this.height, this.configObject.minChartHeight)
            } else {
                this.width = Math.min(this.data.length * this.configObject.barWidthLimits[1] + (this.data.length - 1) * this.configObject.distanceBetweenBars, this.width);
                this.width = Math.max(this.width, this.configObject.minChartWidth)
            }
        }

        d3.select(this.chartContainer.nativeElement).select('svg')
            .attr('width', this.width + this.configObject.margin.left + this.configObject.margin.right)
            .attr('height', this.height + this.configObject.margin.bottom + this.configObject.margin.top);

        this.yScale.rangeRound([this.height, 0])
        this.xScale.rangeRound([0, this.width - this.legendSpace])

    }

    getDomainMinMax() {
        if (this.configObject.limitXValues == undefined) {
            this.codomainMinMax = d3.extent(this.data, d => d[this.configObject.x]);
        } else {
            this.codomainMinMax = this.configObject.limitXValues;
        }
    }

    updateScalesDomain() {
        let scaleElem, scaleElem2, axisElem
        if (this.configObject.horizontalBars) {
            scaleElem = this.yScale.domain(this.codomainMinMax);
            axisElem = this.yAxis;
            scaleElem2 = this.xScale;
        } else {
            scaleElem = this.xScale.domain(this.codomainMinMax);
            axisElem = this.xAxis;
            scaleElem2 = this.yScale;
        }
        if (this.configObject.typeDatetime) {
            scaleElem.domain(this.codomainMinMax);
        } else {
            scaleElem.domain(this.data.map(d => this.getXElem(d)));
        }
        this.setBarWidth(scaleElem);
        scaleElem2.domain([0, d3.max(this.data, (d: any) => this.getYElem(d))]).nice();
        return this.codomainMinMax;
    }


    private formatAxis2(scale, isBottom, type, externalFuntion = null, date_groupBy = null, data_length = 0) {
        let axis = isBottom ? d3.axisBottom(scale) : d3.axisLeft(scale)
        switch (type) {
            case "none":
                break;
            case "datetime":
                switch (date_groupBy) {
                    case 'day':
                        if (data_length < 5) {
                            axis = axis.tickFormat(d3.timeFormat('%b %d')).ticks(d3.timeDay.every(1));
                        } else {
                            axis = axis.tickFormat(d3.timeFormat('%b %d'));
                        }
                        break;
                    case 'week':
                        axis = axis.tickFormat(d3.timeFormat('%b %d'));
                        break;
                    case 'month':
                        axis = axis.ticks(d3.timeMonth, 1).tickFormat(d3.timeFormat('%b-%Y'));
                        break;
                }
                break;
            case "percent":
                axis = axis.tickFormat(d3.format('.0%'))
                break;
            case "SI prefix":
                axis = axis.tickFormat(d3.format('.0s'))
                break;
            case "duration":
                axis = axis.tickFormat((n: number) => {
                    return externalFuntion(n)
                })
                break;
            default:
                break;
        }
        return axis
    }

    protected formatAxis() {
        const formatAxis2 = this.formatAxis2
        const prettyPrintDurationFuntion = this.prettyPrintDuration;
        const datetimeGroupBy = this.configObject.groupBy;
        const yAxis = d3.select(this.chartContainer.nativeElement)
            .select(".axis-y");
        const xAxis = d3.select(this.chartContainer.nativeElement)
            .select(".axis-x");
        if (this.configObject.typeDatetime) {
            yAxis.attr('transform', `translate(${this.configObject.margin.left - this.barWidth * 0.8}, ${this.configObject.margin.top})`)
        }
        if (this.configObject.showXAxis) {
            if (this.configObject.typeDatetime && !this.configObject.horizontalBars) {
                this.xAxis.call(formatAxis2(this.xScale, true, 'datetime', null, datetimeGroupBy, this.data.length));
            } else if (!this.configObject.typeDatetime && !this.configObject.horizontalBars) {
                this.xAxis.call(formatAxis2(this.xScale, true, 'none'));
            } else {
                this.xAxis.call(formatAxis2(this.xScale, true, this.configObject.formatValues, prettyPrintDurationFuntion));
            }
            //this.configObject.xAxis
        }
        if (this.configObject.showYAxis) {
            if (this.configObject.typeDatetime && this.configObject.horizontalBars) {
                this.yAxis.call(formatAxis2(this.yScale, false, 'datetime', null, datetimeGroupBy, this.data.length));
            } else if (!this.configObject.typeDatetime && this.configObject.horizontalBars) {
                this.yAxis.call(formatAxis2(this.yScale, false, 'none'));//domain values
            } else {
                this.yAxis.call(formatAxis2(this.yScale, false, this.configObject.formatValues, prettyPrintDurationFuntion));
            }
        }
        if (!this.configObject.showYAxisLine) {
            yAxis.select('.domain').remove() //remove axis vertical line
            yAxis.selectAll('line').attr('x2', this.xScale(this.codomainMinMax[1]) + this.barWidth * 1.5); //generate chart wide ticks
            yAxis.selectAll('.tick > text')//move y text label to the left
                .attr("dx", "2em")
                .attr("x", "-30")
        }
        if(this.configObject.rotateXAxisLabels){
            xAxis.selectAll("text")
            .attr("y", 10)
            .attr("x", 0)
            .attr("dy", ".35em")
            .attr("transform", "rotate(35)")
            .style("text-anchor", "start");
        }
    }

    createChart() {
        this.initMargins()
        const element = this.chartContainer.nativeElement;
        this.width = element.offsetWidth - this.configObject.margin.left - this.configObject.margin.right;
        this.height = element.offsetHeight - this.configObject.margin.top - this.configObject.margin.bottom;
        
        const svg = d3.select(element).append('svg')
            .attr('width', element.offsetWidth)
            .attr('height', element.offsetHeight);

        let domain = this.data.map((d: any) => this.getXElem(d));
        let codomain = [0, d3.max(this.data, (d: any) => this.getYElem(d))];
        let xDomain, yDomain
        // define X & Y domains
        if (!this.configObject.horizontalBars) {
            xDomain = domain;
            yDomain = codomain;
            this.xScale = this.configObject.typeDatetime ? d3.scaleTime() : d3.scaleBand().padding(0.1);
            this.yScale = d3.scaleLinear();
        } else {
            xDomain = codomain;
            yDomain = domain;
            this.xScale = d3.scaleLinear();
            this.yScale = this.configObject.typeDatetime ? d3.scaleTime() : d3.scaleBand().padding(0.1);
        }
        this.xScale = this.xScale.domain(xDomain)
        this.yScale = this.yScale.domain(yDomain)
        if (this.configObject.showYAxis) {
            this.yAxis = svg.append('g')
                .attr('class', 'axis axis-y')
                .attr('transform', `translate(${this.configObject.margin.left}, ${this.configObject.margin.top})`)
        }

        if (this.configObject.showXAxis) {
            this.xAxis = svg.append('g')
                .attr('class', 'axis axis-x')
                .attr('transform', `translate(${this.configObject.margin.left}, ${this.configObject.margin.top + this.height})`);
        }

        this.updateWidthAndHeight();
        this.getDomainMinMax();
        this.formatAxis()
        if (this.configObject.horizontalBars) {
            this.setBarWidth(this.yScale);
        } else {
            this.setBarWidth(this.xScale);
        }
        // chart plot area
        this.chart = svg.append('g')
            .attr('class', 'chartArea')
            .attr('transform', `translate(${this.configObject.margin.left}, ${this.configObject.margin.top})`);
    }
}