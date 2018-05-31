import { Component,
  OnInit,
  OnChanges,
  ViewChild,
  ElementRef,
  Input,
  ViewEncapsulation,
  Output,
  EventEmitter, 
  ChangeDetectorRef} from '@angular/core';

import * as d3 from 'd3';
import * as moment from 'moment';

var locale ={
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
export class StackedBarChartComponent implements OnInit, OnChanges {
  @ViewChild('chart') private chartContainer: ElementRef;
  @ViewChild('tooltipElem') private tooltipElem: ElementRef;

  @Input() private data: Array<any>;
  @Input('x') private x_attr: string;
  @Input('min-bar-width') private minBarWidth: number = 10;
  @Input('transition-duration') private transitionDuration: number = 200;
  @Input() private colors: string[] = ['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00'];
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
    if (this.data) {
      this.createChart();
      this.updateChart();
    }
  }

  ngOnChanges() {
    // obtenemos las keys de los objetos
    this.keys = Object.getOwnPropertyNames(this.data[0]).slice(1);

    this.data.forEach( data => {
        data[this.x_attr] = moment(data[this.x_attr]).startOf('day');
    });
    console.log(this.data)
    // agregamos la variable total a cada dato
    this.data = this.data.map(v => {
      v.total = this.keys.map(key => v[key]).reduce((a, b) => a + b, 0);
      return v;
    });

    this.barWidth = Math.max(this.minBarWidth, Math.round((this.width - 100) / this.data.length) - 12);

    if (this.chart) {
      this.updateChart();
    }
  }

  public trackMousePosition($event) {
    this.mouse.x = $event.offsetX - 30;
    this.mouse.y = $event.offsetY - 30;
  }

  public highLightSelectedGroup(groupId){
    this.chart.selectAll(".barGroup")
      .filter((d,j)=> groupId !== j )
      .transition()
      .duration(this.transitionDuration)
      .style('opacity', 0.5);
  }

  createChart() {
    const element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;
    console.log("element.offsetHeight", element.offsetHeight);
    const svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    // chart plot area
    this.chart = svg.append('g')
      .attr('class', 'chartArea')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    this.barWidth = Math.max(this.minBarWidth, Math.round((this.width - 100) / this.data.length) - 12);

    // define X & Y domains
    const xDomain = this.data.map((d: any) => d[this.x_attr]);
    const yDomain = [0, d3.max(this.data, (d: any) => d.total)];

    // create scales
    //this.xScale = d3.scaleBand().padding(0.1).domain(xDomain).rangeRound([0, this.width]);
    this.xScale = d3.scaleTime().range([0, this.width - 100]);

    this.yScale = d3.scaleLinear().domain(yDomain).range([this.height, 0]);
    // bar colors
    this.zScale = d3.scaleOrdinal()
      .range(this.colors);

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
      /*.call(d3.axisLeft(this.yScale)
        .ticks(10)
        .tickFormat(null)
        .tickSize(this.width)
        .scale(this.yScale)
      );*/
      .call(d3.axisLeft(this.yScale));
  }

  updateChart() {

      const x_attr = this.x_attr;
      let minMaxValues = d3.extent(this.data, d => d[x_attr]);
      //console.log("minMaxValues", minMaxValues)
      //console.log("this.xScale(new Date('2018-05-25'))", this.xScale(minMaxValues[0]));
      minMaxValues[0] = moment(minMaxValues[0]).startOf('day').subtract(12, 'h');
      minMaxValues[1] = moment(minMaxValues[1]).endOf('day').add(12, 'h');
      this.xScale.domain(minMaxValues);

      this.yScale.domain([0, d3.max(this.data, (d: any) => d.total)]).nice();
  
      // update scales & axis
      this.zScale.domain([0, this.data.length]);
      this.xAxis.transition().call(d3.axisBottom(this.xScale));
      //this.yAxis.transition().call(d3.axisLeft(this.yScale).tickFormat(null).tickSize(-this.width).scale(this.yScale));
      this.yAxis.transition().call(d3.axisLeft(this.yScale));
      //console.log("d3.stack().keys(this.keys)(this.data)", d3.stack().keys(this.keys)(this.data));
      //console.log("this.chart.selectAll('.bar')", this.chart.selectAll('.bar'));
      //console.log("this.chart.selectAll('.barGroup')", this.chart.selectAll('.barGroup'));
      const stackedDataByKeys = d3.stack().keys(this.keys)(this.data);
      const barGroup = this.chart.selectAll('.barGroup')
        .data(stackedDataByKeys)//retorna las posiciones stackeadas;
      let bar = barGroup.selectAll('.bar').data(d => d);

      // remove exiting bars
      bar.exit().remove();
      barGroup.exit().remove();
      d3.selectAll('.tooltip').remove();
      this.chart.select('.legend').remove();

      // update existing bars
      barGroup.attr('id', (d, i) => i).style('fill', (d, i) => this.zScale(i));
      bar.transition()
        .attr('x', d => this.xScale(d.data[this.x_attr]) - this.barWidth / 2+1)
        .attr('y', d => this.yScale(d[1]))
        .attr('width', this.barWidth)
        .attr('height', d => this.yScale(d[0]) - this.yScale(d[1]))

  
      // add new bars
      let newBars=barGroup.enter()
        .append('g')
        .attr('class', 'barGroup')
        .attr('id', (d, i) => i)
        .style('fill', (d, i) => this.zScale(i));
      //workaround para la creacion de barGroups
      bar = this.chart.selectAll('.barGroup').selectAll('.bar').data(d => d);
      //end workaround
      bar.enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => this.xScale(d.data[this.x_attr]) - this.barWidth / 2 +1)
        .attr('y', d => this.yScale(d[0]))
        .attr('width', this.barWidth)
        .attr('height', 0)
        .transition()
        .delay((d, i) => i * 10)
        .attr('y', d => {return this.yScale(d[1])})
        .attr('height', d => this.yScale(d[0]) - this.yScale(d[1]));
  
      // Prep the tooltip bits, initial display is hidden
     //let tooltip = d3.select('body').select('.tooltip-chart')
      let tooltip = d3.select(this.tooltipElem.nativeElement)
        .style('opacity', 0);
      this.chart.selectAll('.barGroup')
        .on('mouseenter', (d, i) => {
          this.highLightSelectedGroup(i);
          this.tooltip.y = d.key;
        }).on('mouseout', () => this.chart.selectAll(".barGroup").transition().duration(this.transitionDuration).style('opacity', 1));
        this.chart.selectAll('.barGroup').selectAll('.bar')
        .on('mousemove', (d) => {
          tooltip.transition().duration(this.transitionDuration).style('opacity', 0.95);
          const durationHS = moment.duration(d[1] - d[0], 'h');
          let textToDisplay = '' + durationHS.hours() + 'h';
          textToDisplay += durationHS.hours() > 1 ? 's' : ''; // si es mas de una hora se transforma a plural
          textToDisplay += durationHS.minutes() > 0 ?  ' ' + durationHS.minutes() + 'm' : '';
          this.tooltip.x = d3.timeFormat('%e %B %Y')(d.data[this.x_attr]);
          this.tooltip.z = "Total trabajado: "+textToDisplay;
          const xPos = this.mouse.x + 40;
          this.tooltip.left = "" + xPos +"px";
          this.tooltip.top = "" +this.mouse.y +"px";
          this.ref.markForCheck();
          //this.tooltip.left = (d3.event.pageX) + 'px';
          //this.tooltip.top = (d3.event.pageY - 28) + 'px';
        })
        .on('mouseout', () => tooltip.transition().duration(500).style('opacity', 0))
        .on('click', (d) => {
          let elem = {};
          elem[x_attr] = d.data[this.x_attr].toDate();
          elem['key'] = this.tooltip.y;
          elem['value'] = d[1] - d[0];
          this.dataClick.emit(elem);
        });
  
      // generamos la leyenda
      const legend = this.chart.append('g')
          .attr('class', 'legend')
          .attr('font-family', 'sans-serif')
          .attr('font-size', 10)
          .attr('text-anchor', 'end')
          .selectAll('g')
          .data(stackedDataByKeys)
          .enter().append('g')
          .attr('transform', (d, i) => 'translate(0,' + i * 20 + ')');
  
      legend.append('rect')
          .attr('x', this.width - 19)
          .attr('width', 19)
          .attr('height', 19)
          .attr('fill', (d, i) => this.zScale(i));
          //.attr('fill', this.zScale);
  
      legend.append('text')
          .attr('x', this.width - 24)
          .attr('y', 9.5)
          .attr('dy', '0.32em')
          .text(d => d.key);
      this.chart.selectAll('.legend')
        .on('mouseenter', (d, i) => {
          this.highLightSelectedGroup(i);
          this.tooltip.y = d.key;
        }).on('mouseout', () => this.chart.selectAll(".barGroup").transition().duration(this.transitionDuration).style('opacity', 1));
    }

}

