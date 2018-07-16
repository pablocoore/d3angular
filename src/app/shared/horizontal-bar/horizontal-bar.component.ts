import { Component, OnInit, OnChanges, ViewChild, ElementRef, Input, ViewEncapsulation, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-horizontal-bar',
  templateUrl: './horizontal-bar.component.html',
  styleUrls: ['./horizontal-bar.component.css'],
  encapsulation: ViewEncapsulation.None // This allows D3 to access the CSS classes
})
export class HorizontalBarComponent implements OnInit, OnChanges {
  // ViewChild allows the component to directly access the native element (which D3 needs)
  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() private data: Array<any>;
  @Input() private showXAxis = false;

  @Input("color-list") private color_list = ['red', 'blue'];
  @Input("threshold-list") private threshold_list: number[] = [];//ordered list of thresholds: [5.4, 27, 45]
  
  @Input('transition-duration') private transitionDuration: number = 200;
  @Output("data-click") dataClick = new EventEmitter();

  public mouse = {x: 0, y: 0};

  private chart: any;
  private width: number;
  private height: number;
  private xScale: any;
  private colors: any;
  private xAxis: any;

  constructor(private ref: ChangeDetectorRef) { }

  ngOnInit() {
    this.createChart();
    if (this.data) {
      this.updateChart();
    }
  }
  //The OnChanges interface is implemented to allow the chart to be re-rendered
  // (with animation) when the data changes
  ngOnChanges() {
    if (this.chart) {
      this.updateChart();
    }
  }

  private barEvents() {
    this.chart.selectAll('.bar')
      .on('click', (d) => {
        const elem = {};
        elem['value'] = this.data;
        this.dataClick.emit(elem);
      });
  }

  createChart() {
    const element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth;
    this.height = element.offsetHeight;
    const svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    // chart plot area
    this.chart = svg.append('g')
      .attr('class', 'bars')
      .attr('transform', `translate(0, 0)`);

    // define X & Y domains
    const xDomain = [0, 100];

    // create scales
    this.xScale = d3.scaleLinear().domain(xDomain).range([0, this.width]);

    // bar colors
    if(this.threshold_list.length==0){
      this.colors = d3.scaleLinear().domain([0, this.data.length]).range(<any[]>this.color_list);
    }else{
      this.colors = d3.scaleThreshold()
        .domain(this.threshold_list)
        .range(<any[]>this.color_list)
    }

    // x & y axis
    if (this.showXAxis){
      this.xAxis = svg.append('g')
        .attr('class', 'axis axis-x')
        .attr('transform', `translate(0, ${this.height})`)
        .call(d3.axisBottom(this.xScale));
    }
  }
  barColor(data, index){
    if(this.threshold_list.length==0){
      if (this.color_list.length==1){
        return this.color_list[0]; 
      }else{
        return this.colors(index);
      }
    }else{
      return d3.scaleThreshold().domain(this.threshold_list).range(<any[]>this.color_list)(data)
    }
  }

  updateChart() {
    // update scales & axis
    if(this.showXAxis){
      this.xAxis.transition().call(d3.axisBottom(this.xScale));
    }

    const update = this.chart.selectAll('.bar')
      .data(this.data);

    const label = this.chart.selectAll('text')
      .data(this.data);

    // remove exiting bars
    update.exit().remove();
    label.exit().remove();

    // update existing bars
    this.chart.selectAll('.bar').transition()
      .attr('x', 0)
      .attr('y', this.height)
      .attr('width', d => this.xScale(d))
      .attr('height', d => this.height -this.height*0.8 )
      .style('fill', (d, i) => this.barColor(d,i));

    this.chart.selectAll('text').transition()
      .attr('x', d => this.xScale(d) +8)
      .attr('y', this.height*0.5)
      .attr('dy', '0.5em')
      .style('fill', (d, i) => this.barColor(d,i))
      .text(d => "% " +  d);


    // add new bars
    update
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', this.height-this.height*0.8)
      .attr('width', 0)
      .attr('height', d => this.height*0.8 )
      .style('fill', (d, i) => this.barColor(d,i))
      .transition()
      .delay((d, i) => i * 10)
      .attr('x', 0)
      .attr('width', d => this.xScale(d));

    label
      .enter()
      .append('text')
      .attr('x',  d => this.xScale(d) +8)
      .attr('y', this.height*0.5)
      .attr('dy', '0.5em')
      .style('fill', (d, i) => this.barColor(d,i))
      .text(d => "% " +  d);

    this.barEvents();    
  }
}
