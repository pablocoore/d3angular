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
import { BaseChart } from '../base-chart';


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
export class StackedBarChartComponent extends BaseChart implements OnInit, OnChanges {
  //@Input("format-values") private formatValues = "time";//time/percentage
  @Input("format-values") protected formatValues = "duration"; //values are "percent", "SI prefix", "duration", "none"
  @Input("type-datetime") protected typeDatetime = true;
  @Input() private colors: string[] = ['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00', "#8595e1", "#b5bbe3", "#e6afb9", "#e07b91", "#d33f6a", "#11c638", "#8dd593", "#c6dec7", "#ead3c6", "#f0b98d", "#ef9708", "#0fcfc0", "#9cded6", "#d5eae7", "#f3e1eb", "#f6c4e1", "#f79cd4"];
  @Input() protected showYAxisLine = false;

  @Input('override-tooltip-function') private overrideTooltipFunction: boolean = false;
  @Output("tooltip-text-function") tooltipTextFunctionExtern = new EventEmitter<any>();

  
  @Input() private showLegend = true;

  private keys = [];
  constructor(private ref: ChangeDetectorRef) {
    super();
   }

  ngOnInit() {
    if (this.horizontalBars){
      throw "horizontalBars is not implemented in stacked bar chart"
    }

    if (this.data) {
      this.createChart();
      if (this.data.length<5){
        this.horizontalTickN=this.data.length;
      }else{
        
      }
      if (this.formatValues=='percent'){
        let max_value=d3.max(this.data, (d: any) => 2/*this.getYElem(d)*/)
        if (max_value>1){
          this.normalizeValues(max_value);
        }
      }
      this.updateChart();
    }
  }

  groupData() {
    if (this.groupElements){
      let grouped_elems = d3.nest()
        // agrupamos por semana/mes, etc y ponemos en la key los dias
        .key((d: any) => moment(d[this.x]).startOf(this.group_by as moment.unitOfTime.StartOf).format('YYYY-MM-DD'))
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
          elem[this.x] = moment(grouped_elems_keys[i]).toDate();
          return elem;
        });
        //console.log("group by:", this.group_by)
        //console.log("grouped data:", this.data)     
    }
  }

  ngOnChanges() {
    // obtenemos las keys de los objetos
    if (this.ys.length>0){
      this.keys=this.ys;
    }else{
      this.keys = Object.getOwnPropertyNames(this.data[0]).filter(elem=> elem!=this.x);
    }
    this.groupData();
    // agregamos la variable total a cada dato
    this.data = this.data.map(v => {
      if (this.typeDatetime){
        v[this.x]=moment(v[this.x]).toDate();
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

  public highLightSelectedGroup(groupId){
    this.chart.selectAll(".barGroup")
//      .filter((d,j)=> j != groupId)
      .transition()
      .duration(this.transitionDuration)
      .style('fill', (d, i) => {
        if (i!=groupId){
          const grayscale = d3.scaleLinear().domain([0, 1]).range(<any[]>['#dfdfdf', this.colorScale(i)]);
          return grayscale(0.5);  
        }else{
          return this.colorScale(i)
        }
      });

      //.style('opacity', 0.5);
  }

  createChart() {
    super.createChart();
    // bar colors
    this.colorScale = d3.scaleOrdinal()
      .range(this.colors);
    // y axis


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
      .attr('x', d => this.typeDatetime? this.xScale(d.data[this.x]) - this.barWidth / 2+1 : this.xScale(d.data[this.x]))
      .attr('y', d => this.yScale(d[1]))
      .attr('width', this.barWidth)
      .attr('height', d => this.yScale(d[0]) - this.yScale(d[1]))

    // add new bars
    let newBars=barGroup.enter()
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
      .attr('x', d => this.typeDatetime? this.xScale(d.data[this.x]) - this.barWidth / 2+1 : this.xScale(d.data[this.x]))
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
          .attr('fill', (d, i) => this.colorScale(i));
  
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
      let keys = Object.getOwnPropertyNames(elem).filter(elem=>{ return elem!="total" && elem!=this.x && this.ys.indexOf(elem)==-1})
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
          tooltipHeader = d3.timeFormat('%e %B %Y')(elem[this.x]);
        break;
        case 'week':
          tooltipHeader = "Semana del " + moment(elem[this.x]).format("DD/MM") + " al " + moment(elem[this.x]).add(6, 'day').format("DD/MM");
        break;
        case 'month':
          tooltipHeader = d3.timeFormat('%B')(elem[this.x]);
        break;
      }
      return {x: tooltipHeader, y:'', z: textToDisplay, extra: extra}
    }else{
      return {x: elem[this.x], y:'', z: value, extra: extra};
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
        .style('fill', (d, i) => this.colorScale(i)));
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
            elem_to_emit[this.x] = d.data[this.x];
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
        elem[this.x] = d.data[this.x];
        elem['key'] = this.tooltip.y;
        elem['value'] = d[1] - d[0];
        this.dataClick.emit(elem);
      });
  }


  updateChart() {
      const x = this.x;
      this.getDomainMinMax();
      this.updateWidthAndHeight();
      this.updateTicksAndScales();
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

