import { Component, OnInit, ElementRef, ViewChild, Input, ViewEncapsulation, OnChanges, ChangeDetectorRef, Output } from '@angular/core';
import * as d3 from 'd3';
import { EventEmitter } from '@angular/core';
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

  @Input() private data: Array<any> = [{label:'<5' , value: 2704659 }, {label:'5-13' , value: 4499890 }, {label:'14-17' , value: 2159981 }, {label:'18-24' , value: 3853788 }, {label:'25-44' , value: 14106543 }, {label:'45-64' , value: 8819342 }, {label:'≥65' , value: 612463 }];
  @Input() private x: string = 'label';
  @Input() private y: string = 'value';

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
    this.keys = this.data.map(elem=>elem[this.x]);
    const yComponent = this.y;
    this.data.sort(function(a, b) { //we order by name
      return d3.ascending(a[yComponent], b[yComponent]);
    });
    
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
    this.width = element.offsetWidth ;
    this.height = element.offsetHeight;
    this.radius = Math.min(this.width*0.8, this.height*0.8) / 2;

    const svg = d3.select(element).append('svg')
      .attr('width', element.offsetWidth)
      .attr('height', element.offsetHeight);

    // chart plot area
    this.chart = svg.append('g')
      .attr('class', 'chartArea')
      .attr('transform', 'translate(' + this.width / 2 + ',' + this.height / 2 + ')');

    this.colorScale =  d3.scaleOrdinal().range(this.colors);
  }

  addLegend(arcs, pie){
    const yComponent = this.y;
    const xComponent = this.x;

    let outerArc = d3.arc()
      .outerRadius(this.radius * 0.98)
      .innerRadius(this.radius * 0.98);

    const label = d3.arc()
      .outerRadius(this.radius -40)
      .innerRadius(this.radius -40);
      
    arcs.enter().append("text")
      .attr("fill", (d,i) => this.colorScale(i) )
      .attr("text-anchor", 'left')
      .attr("transform", (d,i)=>{
        let pos = outerArc.centroid(d);
        pos[0] = this.radius * (midAngle(d) < Math.PI ? 1.1 : -1.1);
        let percent = (d.endAngle - d.startAngle)/(2*Math.PI)*100
        if(percent<3){
          pos[1] += i*15
        }
        return "translate("+ pos +")";
      })
      .attr("dx", (d)=> midAngle(d) < Math.PI ? 0:-this.radius*0.72)
      .attr("dy", 5)
      .text((d) => d.data[xComponent] )

      
    function midAngle(d) {
      return d.startAngle + (d.endAngle - d.startAngle) / 2;
    }

    this.chart.selectAll("polyline")
      .data(pie(this.data), (d) =>{
        return d.data[xComponent];
      })
      .enter()
      .append("polyline")
      .attr("points", (d,i) =>{
        var pos = outerArc.centroid(d);
            pos[0] = this.radius * (midAngle(d) < Math.PI ? 1 : -1);
        var o=   outerArc.centroid(d)
        var percent = (d.endAngle -d.startAngle)/(2*Math.PI)*100
        if(percent<3){
          pos[1] += i*15
        }
        return [label.centroid(d), [o[0],pos[1]] , pos];
      })
      .style("fill", "none")
      .attr("stroke", (d,i) =>{ return this.colorScale(i); })
      .style("stroke-width", "1px");


      arcs.enter().append("text")
      .attr("transform", function(d) { return "translate(" + label.centroid(d) + ")"; })
      .attr("dy", "0.35em")
      .text(function(d) { return "" + ((d.endAngle -d.startAngle)/(2*Math.PI)*100).toFixed(2) +"%"; });
  }

  updateChart() {
    const duration=1000
    const yComponent = this.y;
    const xComponent = this.x;
    const pie = d3.pie()
      .sort(null)
      .value((d: any) => d[yComponent]);

    let arc_ = d3.arc()
      .outerRadius(this.radius * 0.9)
      .innerRadius(0.0);
    
    let key = function(d) { return d.data[xComponent]; };
    this.colorScale.domain(this.keys)
      
    this.chart.selectAll("text").remove()
    this.chart.selectAll("polyline").remove()
    this.chart.selectAll("g.arc").remove()
    this.chart.select('.chartArea').append("g")

    var arcs = this.chart.selectAll("g.arc")
      .data(pie(this.data), key)
    
      //arc transition function
    const transitionFunct =(b) => {
      b.innerRadius = 0;
      var i = d3.interpolate({startAngle: 2*Math.PI, endAngle: 2*Math.PI}, b);
      return (t) => arc_(i(t));
    }

  /*
    //remove existing arcs
    arcs.exit()
    .transition()
    .duration(duration)
    .attrTween("d", transitionFunct).remove();

    //update existing arcs
    this.chart.selectAll("g.arc path")
      .attr("fill", (d, i) => color(i))
      .transition()
      .duration(duration)
      .attrTween("d", transitionFunct)
*/
    //add new arcs

    arcs.enter().append("g")
      .attr("class", "arc")
      .append("path")
      .attr("fill", (d, i) => this.colorScale(i))
      .transition()
      .duration(duration)
      .attrTween("d",transitionFunct);

    this.addLegend(arcs, pie);

    //events
    this.chart.selectAll("g.arc")
    .on('click', (d) => {
      const elem:any = {};
      elem['pertcent'] = (d.endAngle -d.startAngle)/(2*Math.PI)*100;
      elem[this.x] = d.data[this.x];
      elem[this.y] = d.data[this.y];
      this.dataClick.emit(elem);
    });
  }

}
