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
export class BarChartComponent  extends BaseChart implements OnInit, OnChanges {
  // ViewChild allows the component to directly access the native element (which D3 needs)
  @Input("format-values") protected formatValues = "none"; //values are "percent", "SI prefix", "duration", "none"
  @Input("type-datetime") protected typeDatetime = false;
  @Input("color-list") private color_list = ['red', 'blue'];

  @Input("threshold-list") private threshold_list: number[] = [];//ordered list of thresholds: [5.4, 27, 45]
  
  constructor(private ref: ChangeDetectorRef) {
    super();
  }

  ngOnInit() {
    //set n of horizontal ticks
    this.horizontalTickN=Math.min(this.data.length, 20);
    //normalize data
    if (this.formatValues=='percent'){
      let max_value=d3.max(this.data, (d: any) => this.getYElem(d))
      if (max_value>1){
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
      this.horizontalTickN=Math.min(this.data.length, 20);
      //normalize data
      if (this.formatValues=='percent'){
        let max_value=d3.max(this.data, (d: any) => this.getYElem(d))
        if (max_value>1){
          this.normalizeValues(max_value);
        }
      }
      this.updateChart();
    }
  }

  setTooltipExtraElems(d){
    if (this.showObjectDataOnTooltip){
      let keys = Object.getOwnPropertyNames(d).filter(elem=>{ return elem!=this.x && elem!=this.ys[0]})
      this.tooltip.extra=[];
      keys.forEach(key => {
        this.tooltip.extra.push(key + ": "+ this.prettyPrint(d[key], key));
      });  
    }
  }

  public highLightSelected(id){
    this.chart.selectAll(".bar")
      .filter((d,j)=> id !== j )
      .transition()
      .duration(this.transitionDuration)
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
        this.tooltip.y = this.prettyPrint(this.getYElem(d), this.ys[0]);
        if (this.typeDatetime){
          this.tooltip.x = d3.timeFormat('%e %B %Y')(this.getXElem(d))
        }else{
          this.tooltip.x = this.prettyPrint(this.getXElem(d), this.x);
        }
        this.setTooltipExtraElems(d);
      })
      .on('mousemove', (d) => {
        tooltip.transition().duration(this.transitionDuration).style('opacity', 0.95);
        const xPos = this.mouse.x + 60;
        this.tooltip.left =  '' + xPos + 'px';
        this.tooltip.top = '' + this.mouse.y + 'px';
        this.ref.markForCheck();
      })
      .on('mouseout', () => {
        this.chart.selectAll('.bar')
          .transition()
          .duration(this.transitionDuration)
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
    if(this.threshold_list.length==0){
      this.colorScale = d3.scaleLinear().domain([0, this.data.length]).range(<any[]>this.color_list);
    }else{
      this.colorScale = d3.scaleThreshold()
        .domain(this.threshold_list)
        .range(<any[]>this.color_list)
    }
  }

  barColor(data, index){
    if(this.threshold_list.length==0){
      if (this.color_list.length==1){
        return this.color_list[0]; 
      }else{
        return this.colorScale(index);
      }
    }else{
      return d3.scaleThreshold().domain(this.threshold_list).range(<any[]>this.color_list)(data)
    }
  }

  updateChart() {
    // update scales & axis
    this.getDomainMinMax();
    this.updateWidthAndHeight();
    this.updateTicksAndScales()
    this.colorScale.domain([0, this.data.length]);
    this.formatAxis()
    
    const update = this.chart.selectAll('.bar')
      .data(this.data);

    // remove exiting bars
    update.exit().remove();

    // update existing bars
    this.chart.selectAll('.bar').transition()
      .attr('x', d => this.horizontalBars? this.xScale(0):this.xScale(this.getXElem(d)))
      .attr('y', d => this.horizontalBars? this.yScale(this.getXElem(d)): this.yScale(this.getYElem(d)))
      .attr('height', d => this.horizontalBars? this.barWidth: this.height - this.yScale(this.getYElem(d)))
      .attr('width', d => this.horizontalBars? this.xScale(this.getYElem(d)):this.barWidth )
      .style('fill', (d, i) => this.barColor(this.getYElem(d),i));
    // add new bars
    update
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => this.horizontalBars? this.xScale(0):this.xScale(this.getXElem(d)))
      .attr('y', d => this.horizontalBars? this.yScale(this.getXElem(d)):this.yScale(0))
      .attr('width', this.horizontalBars? 0 :this.barWidth)
      .attr('height', this.horizontalBars? this.barWidth: 0)
      .style('fill', (d, i) => this.barColor(this.getYElem(d),i))
      .transition()
      .delay((d, i) => i * 10)
      .attr('y', d => this.horizontalBars? this.yScale(this.getXElem(d)): this.yScale(this.getYElem(d)))
      .attr('height', d => this.horizontalBars? this.barWidth: this.height - this.yScale(this.getYElem(d)))
      .attr('width', d => this.horizontalBars? this.xScale(this.getYElem(d)):this.barWidth );

    if (this.enableTooltips){
      this.barEvents();
    }
    
  }
}
