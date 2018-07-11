import { Component, OnInit, ElementRef, ViewChild, Input, ViewEncapsulation, OnChanges, ChangeDetectorRef, Output } from '@angular/core';
import * as d3 from 'd3';
import { EventEmitter } from 'events';
import * as moment from 'moment';

@Component({
  selector: 'app-pie-chart',
  templateUrl: './pie-chart.component.html',
  styleUrls: ['./pie-chart.component.css'],
  encapsulation: ViewEncapsulation.None 

})
export class PieChartComponent implements OnInit, OnChanges {

  @ViewChild('chart') private chartContainer: ElementRef;
  @ViewChild('tooltipElem') private tooltipElem: ElementRef;

  @Input() private data: Array<any> = [{x:'<5' , y: 2704659 }, {x:'5-13' , y: 4499890 }, {x:'14-17' , y: 2159981 }, {x:'18-24' , y: 3853788 }, {x:'25-44' , y: 14106543 }, {x:'45-64' , y: 8819342 }, {x:'≥65' , y: 612463 }];
  @Input() private x: string = 'x';
  @Input() private y: string = 'y';

  @Input('transition-duration') private transitionDuration: number = 200;
  @Input() private colors = ['#98abc5', '#8a89a6', '#7b6888', '#6b486b', '#a05d56', '#d0743c', '#ff8c00', "#8595e1", "#b5bbe3", "#e6afb9", "#e07b91", "#d33f6a", "#11c638", "#8dd593", "#c6dec7", "#ead3c6", "#f0b98d", "#ef9708", "#0fcfc0", "#9cded6", "#d5eae7", "#f3e1eb", "#f6c4e1", "#f79cd4"];
  @Output("data-click") dataClick = new EventEmitter();

  

  public tooltip: any ={x:"", y:"", z: "", top: "0px", left:"0px", opacity:0};
  private margin: any = { top: 20, bottom: 20, left: 20, right: 20};

  private chart: any;
  private width = 0;
  private height = 0;
  private radius = 0;
  private colorScale: any;

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
    console.log("Pie chart data:",this.data)
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
    this.radius = Math.min(this.width, this.height) / 2;

    const svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    // chart plot area
    this.chart = svg.append('g')
      .attr('class', 'chartArea')
      .attr('transform', 'translate(' + this.width / 2 + ',' + this.height / 2 + ')');

    this.colorScale =  d3.scaleOrdinal().range(this.colors);
  }

  updateChart() {
    const yComponent = this.y;
    const xComponent = this.x;
    const pie = d3.pie()
      .sort(null)
      .value((d: any) => d[yComponent]);

    const path = d3.arc()
        .outerRadius(this.radius - 10)
        .innerRadius(0);

    const label = d3.arc()
        .outerRadius(this.radius - 40)
        .innerRadius(this.radius - 40);


    // remove exiting arcs
    //arc.selectAll('text').remove();
    this.chart.selectAll('.arc').remove();

    const arc = this.chart.selectAll('.arc')
      .data(pie(this.data))
    
    //add new arcs
    const newArc = arc.enter()
        .append('g')
        .attr('class', 'arc');

    newArc.append('path')
        .attr('d', path)
        .attr('fill', (d, i) => this.colorScale(i));

    newArc.append('text')
        .attr('transform', function(d) { return 'translate(' + label.centroid(d) + ')'; })
        .attr('dy', '0.35em')
        .text( d => d.data[xComponent]);
  }

}
