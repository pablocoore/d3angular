import { Component, OnInit, OnChanges, ViewChild, ElementRef, Input, ViewEncapsulation, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import * as d3 from 'd3';
import * as moment from 'moment';

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

  @Input("format-values") private formatValues = "none"; //values are "percent", "SI prefix", "duration", "none"
  @Input("type-datetime") private typeDatetime = false;
  @Input('group-by') private group_by: string="day";//day, week, month, year
  @Input('limit-x-values') private limitXValues :[any, any];//[minX, maxX]
  @Input('bar-width-limits') private barWidthLimit = [8, 50];

  @Input("color-list") private color_list = ['red', 'blue'];
  @Input("threshold-list") private threshold_list: number[] = [];//ordered list of thresholds: [5.4, 27, 45]
  @ViewChild('tooltipElem') private tooltipElem: ElementRef;
  @Input('enable-tooltip') private enableTooltips = false;
  @Input('percentage-values') private percentageValues = [];
  
  @Input('show-object-data-on-tooltip') private showObjectDataOnTooltip = false;

  @Input('transition-duration') private transitionDuration: number = 200;
  @Output("data-click") dataClick = new EventEmitter();
  @Input('group-elements') private groupElements: boolean=false;

  @Input() public tooltip: any ={x:"", y:"", z: "", top: "0px", left:"0px", opacity:0, extra:[]};
  @Input() private margin =  { top: 20, bottom: 20, left: 50, right: 20};

  public mouse = {x: 0, y: 0};

  private chart: any;
  private width: number;
  private height: number;
  private xScale: any;
  private yScale: any;
  private colors: any;
  private xAxis: any;
  private yAxis: any;
  private barWidth: number;
  private horizontalTickN =0;
  private axisFormat
  private offsetChart =30;
  constructor(private ref: ChangeDetectorRef) { }

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

  private normalizeValues(maxValue){
    if (this.data.length>0){
        this.data=this.data.map(elem=> {
          if (this.y!=''){
            elem[this.y]=elem[this.y]/(maxValue)
          }else{
            elem[1]=elem[1]/(maxValue);
          }
          return elem;
        })
    }
  }

  private isFloat(n){//checking if it's a number and float
      return Number(n) === n && n % 1 !== 0;
  }

  private prettyPrint(value, key=null){
    let iniString='';
    if (key!=null && this.percentageValues.indexOf(key)!=-1){
      iniString='% ';
    }
    return iniString + (this.isFloat(value) ? value.toFixed(2): value);
  }

  setTooltipExtraElems(d){
    if (this.showObjectDataOnTooltip){
      let keys = Object.getOwnPropertyNames(d).filter(elem=>{ return elem!=this.x && elem!=this.y})
      this.tooltip.extra=[];
      keys.forEach(key => {
        this.tooltip.extra.push(key + ": "+ this.prettyPrint(d[key], key));
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
        this.tooltip.y = this.prettyPrint(this.getYElem(d), this.y);
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
  
  setBarWidth(){
    if (this.typeDatetime){
      const day1=this.xScale.domain()[0]
      const day2=moment(day1).add(1,this.group_by as moment.unitOfTime.DurationConstructor);
      const value_day1=this.xScale(day1)
      const value_day2=this.xScale(day2)
      const distBetweenBars=(value_day2-value_day1)*0.85;
      this.barWidth = Math.max(this.barWidthLimit[0], distBetweenBars);
      this.barWidth = Math.min(this.barWidth, this.barWidthLimit[1])
    }else{
      this.barWidth = this.xScale.bandwidth()
    }
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
      .attr('transform', `translate(${this.margin.left+ this.offsetChart}, ${this.margin.top})`);

    // define X & Y domains
    const xDomain = this.data.map(d => this.getXElem(d));
    const yDomain = [0, d3.max(this.data, d => this.getYElem(d))];

    // create scales
    if (this.typeDatetime){
      this.xScale = d3.scaleTime().range([0, this.width - 150]);
      if (this.showXAxis){
        this.xAxis = svg.append('g')
          .attr('class', 'axis axis-x')
          .attr('transform', `translate(${this.margin.left+this.offsetChart}, ${this.margin.top + this.height})`)
          .call(d3.axisBottom(this.xScale)
                  .ticks(d3.timeDay, 2)
                  .tickFormat(d3.timeFormat('%b %d'))
          );
      }
    }else{
      this.xScale = d3.scaleBand().padding(0.1).domain(xDomain).rangeRound([0, this.width]);
      if (this.showXAxis){
        this.xAxis = svg.append('g')
          .attr('class', 'axis axis-x')
          .attr('transform', `translate(${this.margin.left+this.offsetChart}, ${this.margin.top + this.height})`)
          .call(d3.axisBottom(this.xScale));
      }
    }
    this.setBarWidth();

    this.yScale = d3.scaleLinear().domain(yDomain).range([this.height, 0]);

    // bar colors
    if(this.threshold_list.length==0){
      this.colors = d3.scaleLinear().domain([0, this.data.length]).range(<any[]>this.color_list);
    }else{
      this.colors = d3.scaleThreshold()
        .domain(this.threshold_list)
        .range(<any[]>this.color_list)
    }

    
    //y axis
    this.axisFormat=d3.axisLeft(this.yScale);
    switch (this.formatValues) {
      case "none":
      break;
      case "percent":
        this.axisFormat=this.axisFormat.tickFormat(d3.format('.0%'))
      break;
      case "SI prefix":
        this.axisFormat=this.axisFormat.tickFormat(d3.format('.0s'))
      break;
      case "duration":
        this.axisFormat=this.axisFormat.tickFormat((n:number)=>{
        })
      break;
      default:
        break;
    }
    
    if (this.showYAxis){
      this.yAxis = svg.append('g')
        .attr('class', 'axis axis-y')
        .attr('transform', `translate(${this.margin.left+ this.offsetChart}, ${this.margin.top})`)
        .call(this.axisFormat);
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
    let minMaxValues=null;
    if (this.limitXValues==undefined){
      minMaxValues = d3.extent(this.data, d => d[this.x]);
    }else{
      minMaxValues = this.limitXValues;
    }
    //console.log("minMaxValues", minMaxValues)
    //console.log("this.xScale(new Date('2018-05-25'))", this.xScale(minMaxValues[0]));

    this.xScale.domain(minMaxValues);
    if (this.typeDatetime){
      switch (this.group_by) {
        case 'day':
          minMaxValues[0] = moment(minMaxValues[0]).startOf('day').subtract(12, 'h');
          minMaxValues[1] = moment(minMaxValues[1]).endOf('day').add(12, 'h');
          this.xScale.domain(minMaxValues);
          if (this.showXAxis) this.xAxis.transition().call(d3.axisBottom(this.xScale).tickFormat(d3.timeFormat('%b %d')));
        break;
        case 'week':
          minMaxValues[0] = moment(minMaxValues[0]).startOf('week').subtract(3, 'd');
          minMaxValues[1] = moment(minMaxValues[1]).endOf('week').add(3, 'd');
          this.xScale.domain(minMaxValues);
          if (this.showXAxis) this.xAxis.transition().call(d3.axisBottom(this.xScale).tickFormat(d3.timeFormat('%b %d')));
        break;
        case 'month':
          minMaxValues[0] = moment(minMaxValues[0]).startOf('month').subtract(2, 'w');
          minMaxValues[1] = moment(minMaxValues[1]).endOf('month').add(2, 'w');
          this.xScale.domain(minMaxValues);
          if (this.showXAxis) this.xAxis.transition().call(d3.axisBottom(this.xScale).ticks(d3.timeMonth, 1).tickFormat(d3.timeFormat('%b-%Y')));
        break;      
      }
    }else{
      this.xScale.domain(this.data.map(d => this.getXElem(d)));
    }
    this.setBarWidth();

    this.yScale.domain([0, d3.max(this.data, d => this.getYElem(d))]);
    this.colors.domain([0, this.data.length]);
    if(this.showXAxis){
      this.xAxis.transition().call(d3.axisBottom(this.xScale));
    }
    if (this.showYAxis){
      this.yAxis.transition().call(()=>{
        this.axisFormat
        d3.select(this.chartContainer.nativeElement)
        .select(".axis-y")
        .selectAll('.tick > text')
        .attr("dx", "2em")
        .attr("x", "-30")
      });
    }

    const update = this.chart.selectAll('.bar')
      .data(this.data);

    // remove exiting bars
    update.exit().remove();

    // update existing bars
    this.chart.selectAll('.bar').transition()
      .attr('x', d => this.xScale(this.getXElem(d)))
      .attr('y', d => this.yScale(this.getYElem(d)))
      .attr('width', d => this.barWidth)
      .attr('height', d => this.height - this.yScale(this.getYElem(d)))
      .style('fill', (d, i) => this.barColor(this.getYElem(d),i));

    // add new bars
    update
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => this.xScale(this.getXElem(d)))
      .attr('y', d => this.yScale(0))
      .attr('width', this.barWidth)
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
