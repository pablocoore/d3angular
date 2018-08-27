import {
    Component,
    OnInit,
    OnChanges,
    ViewChild,
    ElementRef,
    Input,
    ViewEncapsulation,
    Output,
    EventEmitter,
    ChangeDetectorRef
} from '@angular/core';

import * as d3 from 'd3';
import * as moment from 'moment';
import { text } from 'd3';
import { BaseChart } from '../base-chart';


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

@Component({
    selector: 'app-stacked-bar-chart',
    templateUrl: './stacked-bar-chart.component.html',
    styleUrls: ['./stacked-bar-chart.component.css'],
    encapsulation: ViewEncapsulation.None
})
export class StackedBarChartComponent extends BaseChart implements OnInit, OnChanges {
    //@Input("format-values") private formatValues = "time";//time/percentage

    @Input('override-tooltip-function') private overrideTooltipFunction: boolean = false;
    @Output("tooltip-text-function") tooltipTextFunctionExtern = new EventEmitter<any>();


    constructor(private ref: ChangeDetectorRef) {
        super();
    }

    ngOnInit() {
        if (this.configObject.horizontalBars) {
            throw "horizontalBars is not implemented in stacked bar chart"
        }

        if (this.data) {
            this.createChart();
            if (this.data.length < 5) {
                this.horizontalTickN = this.data.length;
            } else {

            }
            if (this.configObject.formatValues == 'percentage') {
                let max_value = d3.max(this.data, (d: any) => 2/*this.getYElem(d)*/)
                if (max_value > 1) {
                    this.normalizeValues(max_value);
                }
            }
            this.updateChart();
        }
    }

    ngOnChanges() {
        // obtenemos las keys de los objetos
        if (this.configObject.ys.length > 0) {
            this.keys = this.configObject.ys;
        } else {
            this.keys = Object.getOwnPropertyNames(this.data[0]).filter(elem => elem != this.configObject.x);
        }
        this.groupData();
        // agregamos la variable total a cada dato
        this.data = this.data.map(v => {
            if (this.configObject.typeDatetime) {
                v[this.configObject.x] = moment(v[this.configObject.x]).toDate();
            }
            v.total = this.keys.map(key => v[key]).reduce((a, b) => a + b, 0);
            return v;
        });
        this.configObject.showLegend ? this.legendSpace = 75 : this.legendSpace = 0;
        //this.setBarWidth();

        if (this.chart) {
            this.horizontalTickN = Math.min(this.data.length, 20);
            if (this.configObject.formatValues == 'percent') {
                let max_value = d3.max(this.data, (d: any) => 2/*this.getYElem(d)*/)
                if (max_value > 1) {
                    this.normalizeValues(max_value);
                }
            }
            this.updateChart();
        }
    }
    public removeHighlight(){
        this.chart.selectAll(".legend-color")
            .transition()
            .duration(this.configObject.transitionDuration)
            .style('fill', (d, i) => this.colorScale(i))
        this.chart.selectAll(".legend-text")
            .transition()
            .duration(this.configObject.transitionDuration)
            .style('fill', (d, i) => '#000000')
        this.chart.selectAll('.barGroup')
            .transition()
            .duration(this.configObject.transitionDuration)
            .style('fill', (d, i) => this.colorScale(i))
    }

    public highLightSelectedGroup(groupId) {
        this.chart.selectAll(".barGroup")
            //      .filter((d,j)=> j != groupId)
            .transition()
            .duration(this.configObject.transitionDuration)
            .style('fill', (d, i) => {
                if (i != groupId) {
                    const grayscale = d3.scaleLinear().domain([0, 1]).range(<any[]>['#dfdfdf', this.colorScale(i)]);
                    return grayscale(0.5);
                } else {
                    return this.colorScale(i)
                }
            });

        this.chart.selectAll(".legend-text")
            //      .filter((d,j)=> j != groupId)
            .transition()
            .duration(this.configObject.transitionDuration)
            .style('fill', (d, i) => {
                if (i != groupId) {
                    return '#dfdfdf'
                } else {
                    return '#000000'
                }
            });
        
        this.chart.selectAll(".legend-color")
            //      .filter((d,j)=> j != groupId)
            .transition()
            .duration(this.configObject.transitionDuration)
            .style('fill', (d, i) => {
                if (i != groupId) {
                    return '#dfdfdf'
                } else {
                    return this.colorScale(i)
                }
            });
        //.style('opacity', 0.5);
    }

    createChart() {
        super.createChart();
        // bar colors
        this.colorScale = d3.scaleOrdinal()
            .range(this.configObject.colorList);


    }

    private drawBars(dataToDraw) {
        const barGroup = this.chart.selectAll('.barGroup')
            .data(dataToDraw)//retorna las posiciones stackeadas;
        let bar = barGroup.selectAll('.bar').data(d => d);

        // remove exiting bars
        bar.exit().remove();
        barGroup.exit().remove();
        d3.selectAll('.tooltip').remove();
        this.chart.select('.legend').remove();

        // update existing bars
        barGroup.attr('id', (d, i) => i).style('fill', (d, i) => this.colorScale(i));
        bar.transition()
            .attr('x', d => this.configObject.typeDatetime ? this.xScale(d.data[this.configObject.x]) - this.barWidth / 2 + 1 : this.xScale(d.data[this.configObject.x]))
            .attr('y', d => this.yScale(d[1]))
            .attr('width', this.barWidth)
            .attr('height', d => this.yScale(d[0]) - this.yScale(d[1]))

        // add new bars
        let newBars = barGroup.enter()
            .append('g')
            .attr('class', 'barGroup')
            .attr('id', (d, i) => i)
            .style('fill', (d, i) => this.colorScale(i));
        //workaround para la creacion de barGroups
        bar = this.chart.selectAll('.barGroup').selectAll('.bar').data(d => d);
        //end workaround
        bar.enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => this.configObject.typeDatetime ? this.xScale(d.data[this.configObject.x]) - this.barWidth / 2 + 1 : this.xScale(d.data[this.configObject.x]))
            .attr('y', d => this.yScale(d[0]))
            .attr('width', this.barWidth)
            .attr('height', 0)
            .transition()
            .delay((d, i) => i * 10)
            .attr('y', d => { return this.yScale(d[1]) })
            .attr('height', d => this.yScale(d[0]) - this.yScale(d[1]));

    }

    private drawLegend(dataToDraw) {
        if (this.configObject.showLegend) {
            const legend = this.chart.append('g')
                .attr('class', 'legend')
                .attr('font-family', 'sans-serif')
                .attr('font-size', 10)
                .selectAll('g')
                .data(dataToDraw)
                .enter().append('g')
                .attr('class', 'legend-label')
                .attr('transform', (d, i) => 'translate(0,' + i * 20 + ')');

            legend.append('rect')
                .attr('x', this.xScale(this.codomainMinMax[1])+this.barWidth/2+10)
                .attr('class', 'legend-color')
                .attr('width', 12)
                .attr('height', 12)
                .attr('fill', (d, i) => this.colorScale(i));

            legend.append('text')
                .attr('x', this.xScale(this.codomainMinMax[1])+this.barWidth/2+10+15)
                .attr('class', 'legend-text')
                .attr('y', 7)
                .attr('dy', '0.32em')
                .text(d => d.key);
            this.chart.selectAll('.legend-label')
                .on('mouseenter', (d, i) => {
                    this.highLightSelectedGroup(i);
                    this.configObject.tooltip.y = d ? d.key : "";
                }).on('mouseout', () => {
                    this.removeHighlight()
                });
        }
    }


    private tooltipTextFunction(elem, value) {
        let extra = []
        if (this.configObject.showObjectDataOnTooltip) {
            let keys = Object.getOwnPropertyNames(elem).filter(elem => { return elem != "total" && elem != this.configObject.x && this.configObject.ys.indexOf(elem) == -1 })
            keys.forEach(key => {
                extra.push(key + ": " + this.prettyPrint(elem[key], key));
            });
        }

        if (this.configObject.typeDatetime) {
            let textToDisplay = '';
            let tooltipHeader = '';
            switch (this.configObject.formatValues) {
                case "duration":
                    textToDisplay = 'Total trabajado: ' + this.prettyPrintDuration(value);
                    break;
                case "percentage":
                    textToDisplay = "% " + value.toFixed(2)
                    break;
            }
            switch (this.configObject.groupBy) {
                case 'day':
                    tooltipHeader = d3.timeFormat('%e %B %Y')(elem[this.configObject.x]);
                    break;
                case 'week':
                    tooltipHeader = "Semana del " + moment(elem[this.configObject.x]).format("DD/MM") + " al " + moment(elem[this.configObject.x]).add(6, 'day').format("DD/MM");
                    break;
                case 'month':
                    tooltipHeader = d3.timeFormat('%B')(elem[this.configObject.x]);
                    break;
            }
            return { x: tooltipHeader, y: '', z: textToDisplay, extra: extra }
        } else {
            return { x: elem[this.configObject.x], y: '', z: value, extra: extra };
        }
    }

    private barEvents() {
        if (this.configObject.enableTooltips) {
            const tooltip = d3.select(this.tooltipElem.nativeElement)
                .style('opacity', 0);
            this.chart.selectAll('.barGroup')
                .on('mouseenter', (d, i) => {
                    this.highLightSelectedGroup(i);
                    this.configObject.tooltip.y = d.key;
                }).on('mouseout', () => this.removeHighlight());
            this.chart.selectAll('.barGroup').selectAll('.bar')
                .on('mousemove', (d) => {
                    tooltip.transition().duration(this.configObject.transitionDuration).style('opacity', 0.95);
                    if (!this.overrideTooltipFunction) {
                        let textTooltip = this.tooltipTextFunction(d.data, d[1] - d[0]);
                        this.configObject.tooltip.x = textTooltip.x;
                        this.configObject.tooltip.z = textTooltip.z;
                        this.configObject.tooltip.extra = textTooltip.extra;
                    } else {
                        const elem_to_emit = {};
                        elem_to_emit[this.configObject.x] = d.data[this.configObject.x];
                        elem_to_emit['key'] = this.configObject.tooltip.y;
                        elem_to_emit['value'] = (d[1] - d[0]);
                        elem_to_emit['extra'] = this.configObject.tooltip.extra;
                        this.tooltipTextFunctionExtern.emit(elem_to_emit)
                    }

                    const xPos = this.mouse.x + 40;
                    this.configObject.tooltip.left = '' + xPos + 'px';
                    this.configObject.tooltip.top = '' + this.mouse.y + 'px';
                    this.ref.markForCheck();
                })
                .on('mouseout', () => tooltip.transition().duration(500).style('opacity', 0))
        }
        this.chart.selectAll('.barGroup').selectAll('.bar')
            .on('click', (d) => {
                const elem = {};
                elem[this.configObject.x] = d.data[this.configObject.x];
                elem['key'] = this.configObject.tooltip.y;
                elem['value'] = d[1] - d[0];
                this.dataClick.emit(elem);
            });
    }


    updateChart() {
        const x = this.configObject.x;
        this.getDomainMinMax();
        this.updateWidthAndHeight();
        this.updateScalesDomain();
        this.formatAxis()
        this.colorScale.domain([0, this.keys.length]);

        // update scales & axis
        const stackedDataByKeys = d3.stack().keys(this.keys)(this.data);

        this.drawBars(stackedDataByKeys)

        // generamos la leyenda
        this.drawLegend(stackedDataByKeys);

        //generamos tooltip
        this.barEvents();

        d3.select(this.chartContainer.nativeElement)
            .select(".axis-y")
            .selectAll('.tick > text')
            .attr("dx", "2em")

        d3.select(this.chartContainer.nativeElement)
            .select(".axis-y")
            .selectAll('.tick > line')
            .attr("x1", "0")
        // .attr("dy", "-2em")
    }

}

