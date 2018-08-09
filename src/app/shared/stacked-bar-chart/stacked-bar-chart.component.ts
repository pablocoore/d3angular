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
import { text } from 'd3';


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
  @Input('ys') private y_attrs: string[]=[];
  @Input('limit-x-values') private limitXValues :[any, any];//[minX, maxX]
  //@Input("format-values") private formatValues = "time";//time/percentage
  @Input("format-values") private formatValues = "duration"; //values are "percent", "SI prefix", "duration", "none"

  @Input() private showYAxis = true;
  @Input() private showXAxis = true;
  @Input() private showLegend = true;
  @Input('enable-tooltip') private enableTooltips = true;
  @Input('show-object-data-on-tooltip') private showObjectDataOnTooltip = false;
  @Input('percentage-values') private percentageValues = [];

  @Input('group-elements') private groupElements: boolean=true;

  @Input('group-by') private group_by: string="day";//day, week, month, year
  @Input('bar-width-limits') private barWidthLimit = [8, 50];
  @Input('transition-duration') private transitionDuration: number = 200;
  @Input() private colors: string[] = ['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00', "#8595e1", "#b5bbe3", "#e6afb9", "#e07b91", "#d33f6a", "#11c638", "#8dd593", "#c6dec7", "#ead3c6", "#f0b98d", "#ef9708", "#0fcfc0", "#9cded6", "#d5eae7", "#f3e1eb", "#f6c4e1", "#f79cd4"];
  @Output("data-click") dataClick = new EventEmitter();
  
  @Input('override-tooltip-function') private overrideTooltipFunction: boolean = false;
  @Output("tooltip-text-function") tooltipTextFunctionExtern = new EventEmitter<any>();

  @Input("type-datetime") private typeDatetime = true;
  @Input() private margin =  { top: 20, bottom: 20, left: 30, right: 20};

  
  @Input() public tooltip: any ={x:"", y:"", z: "", top: "0px", left:"0px", opacity:0, extra:[]};

  private chart: any;
  private width = 0;
  private height = 0;
  private xScale: any;
  private yScale: any;
  private zScale: any;
  private xAxis: any;
  private yAxis: any;
  private legendSpace=0;
  public mouse = {x: 0, y: 0};
  private keys = [];
  private barWidth = 0;
  private horizontalTickN =0;
  private axisFormat
  private offsetChart =30;
  constructor(private ref: ChangeDetectorRef) { }

  ngOnInit() {
    if (this.data) {
      this.createChart();
      this.updateChart();
    }
  }

  groupData() {
    if (this.groupElements){
      let grouped_elems = d3.nest()
        // agrupamos por semana/mes, etc y ponemos en la key los dias
        .key((d: any) => moment(d[this.x_attr]).startOf(this.group_by as moment.unitOfTime.StartOf).format('YYYY-MM-DD'))
        .rollup((values) => { // aplicamos la funcion a cada grupo
          const group: any = {};
          this.keys.forEach( key => {
            group[key] = d3.sum(values, (d) =>  d[key]);
          });
          return group;
        })
        .map(this.data);
        const grouped_elems_list = grouped_elems.values();
        const grouped_elems_keys = grouped_elems.keys();
        this.data = grouped_elems_list.map((elem, i) => {
          elem[this.x_attr] = moment(grouped_elems_keys[i]).toDate();
          return elem;
        });
        //console.log("group by:", this.group_by)
        //console.log("grouped data:", this.data)     
    }
  }

  ngOnChanges() {
    // obtenemos las keys de los objetos
    if (this.y_attrs.length>0){
      this.keys=this.y_attrs;
    }else{
      this.keys = Object.getOwnPropertyNames(this.data[0]).filter(elem=> elem!=this.x_attr);
    }
    this.groupData();
    // agregamos la variable total a cada dato
    this.data = this.data.map(v => {
      if (this.typeDatetime){
        v[this.x_attr]=moment(v[this.x_attr]).toDate();
      }
      v.total = this.keys.map(key => v[key]).reduce((a, b) => a + b, 0);
      return v;
    });
    this.showLegend ? this.legendSpace=150: this.legendSpace=0;
    //this.setBarWidth();

    if (this.chart) {
      this.horizontalTickN=Math.min(this.data.length, 20);
      if (this.formatValues=='percent'){
        let max_value=d3.max(this.data, (d: any) => 2/*this.getYElem(d)*/)
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
          debugger
          /*if (this.y!=''){

            elem[this.y]=elem[this.y]/(maxValue)
          }else{
            elem[1]=elem[1]/(maxValue);
          }
          return elem;*/
        })
    }
  }

  setBarWidth(){
    let cantBars=this.data.length;

    const day1=this.xScale.domain()[0]
    const day2=moment(day1).add(1,this.group_by as moment.unitOfTime.DurationConstructor);
    const value_day1=this.xScale(day1)
    const value_day2=this.xScale(day2)
    const distBetweenBars=(value_day2-value_day1)*0.85;    
    this.barWidth = Math.max(this.barWidthLimit[0], distBetweenBars);
    this.barWidth = Math.min(this.barWidth, this.barWidthLimit[1])
  }

  public trackMousePosition($event) {
    this.mouse.x = $event.offsetX - 30;
    this.mouse.y = $event.offsetY - 30;
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



  public highLightSelectedGroup(groupId){
    this.chart.selectAll(".barGroup")
//      .filter((d,j)=> j != groupId)
      .transition()
      .duration(this.transitionDuration)
      .style('fill', (d, i) => {
        if (i!=groupId){
          const grayscale = d3.scaleLinear().domain([0, 1]).range(<any[]>['#dfdfdf', this.zScale(i)]);
          return grayscale(0.5);  
        }else{
          return this.zScale(i)
        }
      });

      //.style('opacity', 0.5);
  }

  createChart() {
    const element = this.chartContainer.nativeElement;
    this.width = element.offsetWidth - this.margin.left - this.margin.right;
    this.height = element.offsetHeight - this.margin.top - this.margin.bottom;
    //console.log("element.offsetHeight", element.offsetHeight);
    const svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    // define X & Y domains
    const xDomain = this.data.map((d: any) => d[this.x_attr]);
    const yDomain = [0, d3.max(this.data, (d: any) => d.total)];

    // create scales
    if (this.typeDatetime){
        this.xScale = d3.scaleTime().range([0, this.width - this.legendSpace]);
        if (this.showXAxis){
          this.xAxis = svg.append('g')
            .attr('class', 'axis axis-x')
            .attr('transform', `translate(${this.margin.left+this.offsetChart}, ${this.margin.top + this.height})`)
            .call(d3.axisBottom(this.xScale)
                    .ticks(d3.timeDay, 2)
                    .tickFormat(d3.timeFormat('%b %d'))
            );
            this.setBarWidth();
        }
    }else{
        this.xScale = d3.scaleBand().padding(0.1).domain(xDomain).rangeRound([0, this.width - this.legendSpace]);
        if (this.showXAxis){
          this.xAxis = svg.append('g')
            .attr('class', 'axis axis-x')
            .attr('transform', `translate(${this.margin.left+this.offsetChart}, ${this.margin.top + this.height})`)
            .call(d3.axisBottom(this.xScale));
        }
        this.barWidth=this.xScale.bandwidth();
    }

    this.yScale = d3.scaleLinear().domain(yDomain).range([this.height, 0]);
    // bar colors
    this.zScale = d3.scaleOrdinal()
      .range(this.colors);
    // y axis
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
          return this.prettyPrintDuration(n)
        })
      break;
      default:
        break;
    }

    if (this.showYAxis){
      this.yAxis = svg.append('g')
      .attr('class', 'axis axis-y')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)
      .call(this.axisFormat);
    }

    // chart plot area
    this.chart = svg.append('g')
      .attr('class', 'chartArea')
      .attr('transform', `translate(${this.margin.left+this.offsetChart}, ${this.margin.top})`);
  }

  private prettyPrintDuration(duration){
    let textToDisplay="";
    const durationHS = moment.duration(duration, 'h');
    const days = durationHS.days();
    const total_hours= (durationHS.hours()+days*24);
    //textToDisplay += durationHS.days() > 0 ? durationHS.days() + 'd ' : '';
    textToDisplay += total_hours > 0 ? total_hours + 'h' : '';
    textToDisplay += total_hours > 1 ? 's' : ''; // si es mas de una hora se transforma a plural
    textToDisplay += durationHS.minutes() > 0 ?  ' ' + durationHS.minutes() + 'm' : '';
    return textToDisplay
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
    barGroup.attr('id', (d, i) => i).style('fill', (d, i) => this.zScale(i));
    bar.transition()
      .attr('x', d => this.typeDatetime? this.xScale(d.data[this.x_attr]) - this.barWidth / 2+1 : this.xScale(d.data[this.x_attr]))
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
      .attr('x', d => this.typeDatetime? this.xScale(d.data[this.x_attr]) - this.barWidth / 2+1 : this.xScale(d.data[this.x_attr]))
      .attr('y', d => this.yScale(d[0]))
      .attr('width', this.barWidth)
      .attr('height', 0)
      .transition()
      .delay((d, i) => i * 10)
      .attr('y', d => {return this.yScale(d[1])})
      .attr('height', d => this.yScale(d[0]) - this.yScale(d[1]));

  }

  private drawLegend(dataToDraw) {
    if(this.showLegend){
      const legend = this.chart.append('g')
      .attr('class', 'legend')
      .attr('font-family', 'sans-serif')
      .attr('font-size', 10)
      .attr('text-anchor', 'end')
      .selectAll('g')
      .data(dataToDraw)
      .enter().append('g')
      .attr('transform', (d, i) => 'translate(0,' + i * 20 + ')');
  
      legend.append('rect')
          .attr('x', this.width - 19)
          .attr('width', 19)
          .attr('height', 19)
          .attr('fill', (d, i) => this.zScale(i));
  
      legend.append('text')
          .attr('x', this.width - 24)
          .attr('y', 9.5)
          .attr('dy', '0.32em')
          .text(d => d.key);
      this.chart.selectAll('.legend')
        .on('mouseenter', (d, i) => {
          this.highLightSelectedGroup(i);
          this.tooltip.y = d?d.key:"";
        }).on('mouseout', () => this.chart.selectAll(".barGroup").transition().duration(this.transitionDuration).style('opacity', 1));
    }
  }


  private tooltipTextFunction(elem, value){
    let extra=[]
    if (this.showObjectDataOnTooltip){
      let keys = Object.getOwnPropertyNames(elem).filter(elem=>{ return elem!="total" && elem!=this.x_attr && this.y_attrs.indexOf(elem)==-1})
      keys.forEach(key => {
        extra.push(key + ": "+ this.prettyPrint(elem[key], key));
      });  
    }

    if (this.typeDatetime){
      let textToDisplay = '';
      let tooltipHeader = '';
      switch (this.formatValues) {
        case "duration":         
          textToDisplay='Total trabajado: ' + this.prettyPrintDuration(value);
        break;
        case "percent":
          textToDisplay = "% "+ value.toFixed(2)
        break;
      }
      switch (this.group_by) {
        case 'day':
          tooltipHeader = d3.timeFormat('%e %B %Y')(elem[this.x_attr]);
        break;
        case 'week':
          tooltipHeader = "Semana del " + moment(elem[this.x_attr]).format("DD/MM") + " al " + moment(elem[this.x_attr]).add(6, 'day').format("DD/MM");
        break;
        case 'month':
          tooltipHeader = d3.timeFormat('%B')(elem[this.x_attr]);
        break;
      }
      return {x: tooltipHeader, y:'', z: textToDisplay, extra: extra}
    }else{
      return {x: elem[this.x_attr], y:'', z: value, extra: extra};
    }
  }

  private barEvents() {
    if (this.enableTooltips){
      const tooltip = d3.select(this.tooltipElem.nativeElement)
      .style('opacity', 0);
      this.chart.selectAll('.barGroup')
        .on('mouseenter', (d, i) => {
          this.highLightSelectedGroup(i);
          this.tooltip.y = d.key;
        }).on('mouseout', () => this.chart.selectAll('.barGroup').transition().duration(this.transitionDuration)
        .style('fill', (d, i) => this.zScale(i)));
      this.chart.selectAll('.barGroup').selectAll('.bar')
        .on('mousemove', (d) => {
          tooltip.transition().duration(this.transitionDuration).style('opacity', 0.95);
          if (!this.overrideTooltipFunction){
            let textTooltip = this.tooltipTextFunction(d.data, d[1] - d[0]);
            this.tooltip.x = textTooltip.x;
            this.tooltip.z = textTooltip.z;
            this.tooltip.extra = textTooltip.extra;
          }else{
            const elem_to_emit = {};
            elem_to_emit[this.x_attr] = d.data[this.x_attr];
            elem_to_emit['key'] = this.tooltip.y;
            elem_to_emit['value'] = (d[1] - d[0]);
            elem_to_emit['extra'] = this.tooltip.extra;
            this.tooltipTextFunctionExtern.emit(elem_to_emit)
          }
          
          const xPos = this.mouse.x + 40;
          this.tooltip.left =  '' + xPos + 'px';
          this.tooltip.top = '' + this.mouse.y + 'px';
          this.ref.markForCheck();
        })
        .on('mouseout', () => tooltip.transition().duration(500).style('opacity', 0))
    }
    this.chart.selectAll('.barGroup').selectAll('.bar')
      .on('click', (d) => {
        const elem = {};
        elem[this.x_attr] = d.data[this.x_attr];
        elem['key'] = this.tooltip.y;
        elem['value'] = d[1] - d[0];
        this.dataClick.emit(elem);
      });
  }

  updateChart() {
      const x_attr = this.x_attr;
      let minMaxValues=null;
      if (this.limitXValues==undefined){
        minMaxValues = d3.extent(this.data, d => d[x_attr]);
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
        this.setBarWidth();
      }
      this.yScale.domain([0, d3.max(this.data, (d: any) => d.total)]).nice();

      if (this.showYAxis){
        this.yAxis.transition().call(() => {
          this.axisFormat;
          this.yAxis.select('.domain').remove();
          this.yAxis.selectAll('line').attr('x2', this.xScale(minMaxValues[1]) * 0.9);
        });
      }
      
      // update scales & axis
      this.zScale.domain([0, this.keys.length]);
      //console.log("this.keys", this.keys)
      const stackedDataByKeys = d3.stack().keys(this.keys)(this.data);
      //console.log("stackedDataByKeys", stackedDataByKeys)

      //console.log("d3.axisBottom().ticks().length", d3.axisBottom().ticks().length)
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
        .attr("x1", "15")
     // .attr("dy", "-2em")
    }

}

