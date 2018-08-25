import { Component, OnInit, OnChanges, ViewChild, ElementRef, Input, ViewEncapsulation, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import * as d3 from 'd3';
import * as moment from 'moment';
import { BaseChart } from '../base-chart';

@Component({
    selector: 'app-bar-chart',
    templateUrl: './bar-chart.component.html',
    styleUrls: ['./bar-chart.component.css'],
    encapsulation: ViewEncapsulation.None // This allows D3 to access the CSS classes
})
export class BarChartComponent extends BaseChart implements OnInit, OnChanges {
    // ViewChild allows the component to directly access the native element (which D3 needs)

    constructor(private ref: ChangeDetectorRef) {
        super();
    }

    ngOnInit() {
        //set n of horizontal ticks
        this.horizontalTickN = Math.min(this.data.length, 20);
        //normalize data
        if (this.configObject.formatValues == 'percent') {
            let max_value = d3.max(this.data, (d: any) => this.getYElem(d))
            if (max_value > 1) {
                this.normalizeValues(max_value);
            }
        }
        this.createChart();
        if (this.data) {
            this.updateChart();
        }
    }
    //The OnChanges interface is implemented to allow the chart to be re-rendered
    // (with animation) when the data changes
    ngOnChanges() {
        if (this.chart) {
            //set n of horizontal ticks
            this.horizontalTickN = Math.min(this.data.length, 20);
            //normalize data
            if (this.configObject.formatValues == 'percent') {
                let max_value = d3.max(this.data, (d: any) => this.getYElem(d))
                if (max_value > 1) {
                    this.normalizeValues(max_value);
                }
            }
            this.updateChart();
        }
    }

    setTooltipExtraElems(d) {
        if (this.configObject.showObjectDataOnTooltip) {
            let keys = Object.getOwnPropertyNames(d).filter(elem => { return elem != this.configObject.x && elem != this.configObject.ys[0] })
            this.configObject.tooltip.extra = [];
            keys.forEach(key => {
                this.configObject.tooltip.extra.push(key + ": " + this.prettyPrint(d[key], key));
            });
        }
    }

    public highLightSelected(id) {
        this.chart.selectAll(".bar")
            .filter((d, j) => id !== j)
            .transition()
            .duration(this.configObject.transitionDuration)
            .style('fill', (d, i) => {
                const grayscale = d3.scaleLinear().domain([0, 1]).range(<any[]>['#dfdfdf', this.barColor(this.getYElem(d), i)]);
                return grayscale(0.5);
            });
    }

    private barEvents() {
        const tooltip = d3.select(this.tooltipElem.nativeElement)
            .style('opacity', 0);
        this.chart.selectAll('.bar')
            .on('mouseenter', (d, i) => {
                this.highLightSelected(i);
                this.configObject.tooltip.y = this.prettyPrint(this.getYElem(d), this.configObject.ys[0]);
                if (this.configObject.typeDatetime) {
                    this.configObject.tooltip.x = d3.timeFormat('%e %B %Y')(this.getXElem(d))
                } else {
                    this.configObject.tooltip.x = this.prettyPrint(this.getXElem(d), this.configObject.x);
                }
                this.setTooltipExtraElems(d);
            })
            .on('mousemove', (d) => {
                tooltip.transition().duration(this.configObject.transitionDuration).style('opacity', 0.95);
                const xPos = this.mouse.x + 60;
                this.configObject.tooltip.left = '' + xPos + 'px';
                this.configObject.tooltip.top = '' + this.mouse.y + 'px';
                this.ref.markForCheck();
            })
            .on('mouseout', () => {
                this.chart.selectAll('.bar')
                    .transition()
                    .duration(this.configObject.transitionDuration)
                    .style('fill', (d, i) => this.barColor(this.getYElem(d), i))
                tooltip.transition().duration(500).style('opacity', 0)
            })
            .on('click', (d) => {
                const elem = {};
                elem['label'] = this.getXElem(d);
                elem['value'] = this.getYElem(d);
                this.dataClick.emit(elem);
            });
    }

    createChart() {
        super.createChart();
        // bar colorScale
        if (this.configObject.thresholdList.length == 0) {
            this.colorScale = d3.scaleLinear().domain([0, this.data.length]).range(<any[]>this.configObject.colorList);
        } else {
            this.colorScale = d3.scaleThreshold()
                .domain(this.configObject.thresholdList)
                .range(<any[]>this.configObject.colorList)
        }
    }

    barColor(data, index) {
        if (this.configObject.thresholdList.length == 0) {
            if (this.configObject.colorList.length == 1) {
                return this.configObject.colorList[0];
            } else {
                return this.colorScale(index);
            }
        } else {
            return d3.scaleThreshold().domain(this.configObject.thresholdList).range(<any[]>this.configObject.colorList)(data)
        }
    }

    updateChart() {
        // update scales & axis
        this.getDomainMinMax();
        this.updateWidthAndHeight();
        this.updateScalesDomain()
        this.colorScale.domain([0, this.data.length]);
        this.formatAxis()

        const update = this.chart.selectAll('.bar')
            .data(this.data);

        // remove exiting bars
        update.exit().remove();

        // update existing bars
        this.chart.selectAll('.bar').transition()
            .attr('x', d => this.configObject.horizontalBars ? this.xScale(0) : this.xScale(this.getXElem(d)))
            .attr('y', d => this.configObject.horizontalBars ? this.yScale(this.getXElem(d)) : this.yScale(this.getYElem(d)))
            .attr('height', d => this.configObject.horizontalBars ? this.barWidth : this.height - this.yScale(this.getYElem(d)))
            .attr('width', d => this.configObject.horizontalBars ? this.xScale(this.getYElem(d)) : this.barWidth)
            .style('fill', (d, i) => this.barColor(this.getYElem(d), i));
        // add new bars
        update
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => this.configObject.horizontalBars ? this.xScale(0) : this.xScale(this.getXElem(d)))
            .attr('y', d => this.configObject.horizontalBars ? this.yScale(this.getXElem(d)) : this.yScale(0))
            .attr('width', this.configObject.horizontalBars ? 0 : this.barWidth)
            .attr('height', this.configObject.horizontalBars ? this.barWidth : 0)
            .style('fill', (d, i) => this.barColor(this.getYElem(d), i))
            .transition()
            .delay((d, i) => i * 10)
            .attr('y', d => this.configObject.horizontalBars ? this.yScale(this.getXElem(d)) : this.yScale(this.getYElem(d)))
            .attr('height', d => this.configObject.horizontalBars ? this.barWidth : this.height - this.yScale(this.getYElem(d)))
            .attr('width', d => this.configObject.horizontalBars ? this.xScale(this.getYElem(d)) : this.barWidth);

        if (this.configObject.enableTooltips) {
            this.barEvents();
        }

    }
}
