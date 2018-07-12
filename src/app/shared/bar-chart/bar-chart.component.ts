import { Component, OnInit, OnChanges, ViewChild, ElementRef, Input, ViewEncapsulation, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css'],
  encapsulation: ViewEncapsulation.None // This allows D3 to access the CSS classes
})
export class BarChartComponent implements OnInit, OnChanges {
  // ViewChild allows the component to directly access the native element (which D3 needs)
  @ViewChild('chart') private chartContainer: ElementRef;
  @Input() private data: Array<any>;
  @Input() private showYAxis = true;
  @Input() private showXAxis = true;
  @Input() private x ="";
  @Input() private y ="";

  @Input("color-list") private color_list = ['red', 'blue'];
  @Input("threshold-list") private threshold_list: number[] = [];//ordered list of thresholds: [5.4, 27, 45]
  @ViewChild('tooltipElem') private tooltipElem: ElementRef;
  @Input('enable-tooltip') private enableTooltips = false;
  @Input('show-object-data-on-tooltip') private showObjectDataOnTooltip = false;

  @Input('transition-duration') private transitionDuration: number = 200;
  @Output("data-click") dataClick = new EventEmitter();

  @Input() public tooltip: any ={x:"", y:"", z: "", top: "0px", left:"0px", opacity:0, extra:[]};
  public mouse = {x: 0, y: 0};

  private margin: any = { top: 20, bottom: 20, left: 20, right: 20};
  private chart: any;
  private width: number;
  private height: number;
  private xScale: any;
  private yScale: any;
  private colors: any;
  private xAxis: any;
  private yAxis: any;

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

  setTooltipExtraElems(d){
    if (this.showObjectDataOnTooltip){
      let keys = Object.getOwnPropertyNames(d).filter(elem=>{ return elem!=this.x && elem!=this.y})
      this.tooltip.extra=[];
      keys.forEach(key => {
        this.tooltip.extra.push(key + ": "+ d[key]);
      });  
    }
  }

  public trackMousePosition($event) {
    this.mouse.x = $event.offsetX - 30;
    this.mouse.y = $event.offsetY - 30;
  }

  private getYElem(d){
    if(this.y!=''){
      return d[this.y];
    }else{
      return d[1];
    }
  }

  private getXElem(d){
    if(this.x!=''){
      return d[this.x];
    }else{
      return d[0];
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
      console.log("tooltip", tooltip)
    this.chart.selectAll('.bar')
      .on('mouseenter', (d, i) => {
        this.highLightSelected(i);
        this.tooltip.y = this.getXElem(d);
        this.tooltip.x = this.getYElem(d);
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
    const element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;
    const svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    // chart plot area
    this.chart = svg.append('g')
      .attr('class', 'bars')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    // define X & Y domains
    const xDomain = this.data.map(d => this.getXElem(d));
    const yDomain = [0, d3.max(this.data, d => this.getYElem(d))];

    // create scales
    this.xScale = d3.scaleBand().padding(0.1).domain(xDomain).rangeRound([0, this.width]);
    this.yScale = d3.scaleLinear().domain(yDomain).range([this.height, 0]);

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
        .attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.height})`)
        .call(d3.axisBottom(this.xScale));
    }
    if (this.showYAxis){
      this.yAxis = svg.append('g')
        .attr('class', 'axis axis-y')
        .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
        .call(d3.axisLeft(this.yScale));
    }
  }
  barColor(data, index){
    if(this.threshold_list.length==0){
      return this.colors(index);
    }else{
      return d3.scaleThreshold().domain(this.threshold_list).range(<any[]>this.color_list)(data)
    }
  }

  updateChart() {
    // update scales & axis
    this.xScale.domain(this.data.map(d => this.getXElem(d)));
    this.yScale.domain([0, d3.max(this.data, d => this.getYElem(d))]);
    this.colors.domain([0, this.data.length]);
    if(this.showXAxis){
      this.xAxis.transition().call(d3.axisBottom(this.xScale));
    }
    if (this.showYAxis){
      this.yAxis.transition().call(d3.axisLeft(this.yScale));
    }

    const update = this.chart.selectAll('.bar')
      .data(this.data);

    // remove exiting bars
    update.exit().remove();

    // update existing bars
    this.chart.selectAll('.bar').transition()
      .attr('x', d => this.xScale(this.getXElem(d)))
      .attr('y', d => this.yScale(this.getYElem(d)))
      .attr('width', d => this.xScale.bandwidth())
      .attr('height', d => this.height - this.yScale(this.getYElem(d)))
      .style('fill', (d, i) => this.barColor(this.getYElem(d),i));

    // add new bars
    update
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => this.xScale(this.getXElem(d)))
      .attr('y', d => this.yScale(0))
      .attr('width', this.xScale.bandwidth())
      .attr('height', 0)
      .style('fill', (d, i) => this.barColor(this.getYElem(d),i))
      .transition()
      .delay((d, i) => i * 10)
      .attr('y', d => this.yScale(this.getYElem(d)))
      .attr('height', d => this.height - this.yScale(this.getYElem(d)));

    if (this.enableTooltips){
      this.barEvents();
    }
  }
}
