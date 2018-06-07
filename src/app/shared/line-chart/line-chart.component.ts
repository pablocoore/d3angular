import { Component, OnInit, ElementRef, ViewChild, Input, ViewEncapsulation, OnChanges, ChangeDetectorRef, Output } from '@angular/core';
import * as d3 from 'd3';
import { EventEmitter } from 'events';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css'],
  encapsulation: ViewEncapsulation.None 

})
export class LineChartComponent implements OnInit, OnChanges {

  @ViewChild('chart') private chartContainer: ElementRef;
  @ViewChild('tooltipElem') private tooltipElem: ElementRef;

  @Input() private data: Array<any> = [];
  @Input('x') private x_attr: string;

  @Input('transition-duration') private transitionDuration: number = 200;
  @Input() private colors = d3.scaleLinear().domain([0, this.data.length]).range(<any[]>['green', 'blue']);
  @Output("data-click") dataClick = new EventEmitter();

  

  public tooltip: any ={x:"", y:"", z: "", top: "0px", left:"0px", opacity:0};
  private margin: any = { top: 20, bottom: 20, left: 20, right: 20};

  private chart: any;
  private width = 0;
  private height = 0;
  private xScale: any;
  private yScale: any;
  private zScale: any;
  private xAxis: any;
  private yAxis: any;
  private zAxis: any;

  public mouse = {x: 0, y: 0};
  private keys = [];
  private barWidth = 0;
  constructor(private ref: ChangeDetectorRef) { }

  ngOnInit() {
    this.createChart();
    if (this.data) {
      this.updateChart();
    }
  }

  ngOnChanges() {
    if (this.chart) {
      this.updateChart();
    }
  }

  public trackMousePosition($event) {
    this.mouse.x = $event.offsetX - 30;
    this.mouse.y = $event.offsetY - 30;
  }

  createChart() {
    const element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;
    const svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    // chart plot area
    this.chart = svg.append('g')
      .attr('class', 'chartArea')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    // define X & Y domains
    const xDomain = this.data.map(d => d[0]);
    const yDomain = [0, d3.max(this.data, d => d[1])];

    // create scales
    this.xScale = d3.scaleTime().range([0, this.width - 100]);
    this.yScale = d3.scaleLinear().domain(yDomain).range([this.height, 0]);
    this.zScale = this.colors;

    // x & y axis
    // x & y axis
    this.xAxis = svg.append('g')
      .attr('class', 'axis axis-x')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.height})`)
      .call(d3.axisBottom(this.xScale)
              .ticks(d3.timeDay, 2)
              .tickFormat(d3.timeFormat('%b %d'))
      );
    this.yAxis = svg.append('g')
      .attr('class', 'axis axis-y')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
      .call(d3.axisLeft(this.yScale));
  }

  updateChart(){
      const x_attr = this.x_attr;
      const minMaxValues = d3.extent(this.data, d => d[x_attr]);
      this.xScale.domain(minMaxValues);

      this.yScale.domain([0, d3.max(this.data, (d: any) => d.total)]).nice();
  
      // update scales & axis
      this.zScale.domain([0, this.data.length]);
      this.xAxis.transition().call(d3.axisBottom(this.xScale));
      this.yAxis.transition().call(d3.axisLeft(this.yScale));

      const stackedDataByKeys = d3.stack().keys(this.keys)(this.data);
      const lineGroup = this.chart.selectAll('.lineGroup')
        .data(stackedDataByKeys)
      console.log("stackedDataByKeys", stackedDataByKeys);
      //TODO revisar linea de abajo
     /*const lineGenerator = d3.line().x((point_data, i) => {
        return this.xScale(point_data[this.x_attr]);
      })
      //const lineGenerator = d3.line()
      .y(function(point_data) {
        return this.yScale(point_data[1]);
      });

      // remove exiting lines
      lineGroup.exit().remove();
      d3.selectAll('.tooltip').remove();
      this.chart.select('.legend').remove();

      // update existing lines
      lineGroup.transition()
      .attr('d', (d) => {
        return lineGenerator(d);
      });

      // add new lines
      const newLines = lineGroup.enter()
        .append('path')
        .attr('class', 'lineGroup')
        .style('stroke', (d, i) => this.zScale(i))
        .attr('d', (d) => {
          return lineGenerator(d);
        });*/
  }

}
