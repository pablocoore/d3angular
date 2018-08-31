import { Component, OnInit, OnChanges, ViewChild, ElementRef, Input, ViewEncapsulation, ChangeDetectorRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import * as d3 from 'd3';
import { ValueFn } from 'd3';
import { distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
    selector: 'app-brushable-bars',
    templateUrl: './brushable-bars.component.html',
    styleUrls: ['./brushable-bars.component.css'],
})
export class BrushableBarsComponent implements OnInit, OnChanges, OnDestroy {
    // ViewChild allows the component to directly access the native element (which D3 needs)
    @ViewChild('chart') private chartContainer: ElementRef;
    @Input() private data: Array<any>;
    @Input() private showXAxis = true;

    @Input("color-list") private color_list = ['red', 'blue'];
    @Input("threshold-list") private threshold_list: number[] = [];//ordered list of thresholds: [5.4, 27, 45]

    @Input('transition-duration') private transitionDuration: number = 200;
    @Output() public selection = new EventEmitter(true)
    margin = { top: 20, bottom: 20, left: 20, right: 20 };

    public mouse = { x: 0, y: 0 };
    public selectedInterval = [];
    private chart: any;
    private width: number;
    private height: number;
    private xScale: any;
    private yScale: any;
    private gBrush: any;
    private colors: any;
    private xAxis: any;

    private changeSource = new Subject<any>();

    constructor(private ref: ChangeDetectorRef) { }

    triangle = d3.symbol()
        .size(100)
        .type(d3.symbolTriangle)

    brush = (thisReference) => {
        let elem = this.chart.select('gBrush')
        let brushing = () => {

            let filteredDomain = (scale, min, max) => {
                let dif = scale(d3.min(scale.domain())) - scale.range()[0],
                    iMin = (min - dif) < 0 ? 0 : Math.round((min - dif) / this.xScale.step()),
                    iMax = Math.round((max - dif) / this.xScale.step());
                if (iMax == iMin)--iMin; // It happens with empty selections.

                return scale.domain().slice(iMin, iMax)
            }


            let snappedSelection = (bandScale, domain) => {
                const min = d3.min(domain),
                    max = d3.max(domain);
                return [bandScale(min), bandScale(max) + bandScale.bandwidth()]
            }

            // based on: https://bl.ocks.org/mbostock/6232537
            if (!d3.event.selection && !d3.event.sourceEvent) return;
            const s0 = d3.event.selection ? d3.event.selection : [1, 2].fill(d3.event.sourceEvent.offsetX),
                d0 = filteredDomain(this.xScale, s0[0], s0[1]);
            let s1 = s0;

            if (d3.event.sourceEvent && d3.event.type === 'end') {
                s1 = snappedSelection(this.xScale, d0);
                this.chart.select('gBrush').transition().call(d3.event.target.move, s1);
            }

            // move handlers
            d3.selectAll('g.handles')
                .attr('transform', d => {
                    const x = d == 'handle--o' ? s1[0] : s1[1];
                    return `translate(${x}, 0)`;
                });

            // update labels
            d3.selectAll('g.handles').selectAll('text')
                .attr('dx', d0.length > 1 ? 0 : 6)
                .text((d, i) => {
                    let year;
                    if (d0.length > 1) {
                        year = d == 'handle--o' ? d3.min(d0) : d3.max(d0);
                    } else {
                        year = d == 'handle--o' ? d3.min(d0) : '';
                    }
                    return year;
                })

            // update bars
            thisReference.chart.selectAll('.bar')
                .attr('opacity', (d: any) => d0.includes(d.year) ? 1 : 0.2);

            //emit new values
            //thisReference.selection.emit([d3.min(d0), d3.max(d0)]);
            thisReference.changeSource.next([d3.min(d0), d3.max(d0)])
        }

        return d3.brushX()
            .handleSize(8)
            .extent([[0, 0], [this.width, this.height]])
            .on('start brush end', brushing)
    }




    ngOnInit() {
        this.changeSource.asObservable()
            .pipe(distinctUntilChanged((data1, data2)=> data1[0]===data2[0] && data1[1]===data2[1])) 
            .subscribe(data => {
                this.selection.emit(data)
            })

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

    ngOnDestroy() {
        this.changeSource.unsubscribe()
    }

    createChart() {
        const element = this.chartContainer.nativeElement;
        this.width = element.offsetWidth - this.margin.left - this.margin.right;
        this.height = element.offsetHeight - this.margin.top - this.margin.bottom - 5;

        const svg = d3.select(element).append('svg')
            .attr('width', element.offsetWidth)
            .attr('height', element.offsetHeight);

        // chart plot area
        this.chart = svg.append('g')
            .attr('class', 'bars')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        // create scales
        this.xScale = d3.scaleBand()
            .domain(this.data.map(d => d.year))
            .range([0, this.width])
            .padding(0.2)

        this.yScale = d3.scaleLinear()
            .domain(d3.extent(this.data, d => d.value))
            .range([this.height, 0])
        // bar colors

        this.colors = ({ handle: d3.schemeDark2[6], bar: d3.schemeDark2[5] })

        // x & y axis
        if (this.showXAxis) {
            this.xAxis = svg.append('g')
                .attr('class', 'axis axis-x')
                .attr('transform', `translate(${this.margin.left}, ${this.margin.top + this.height + 5})`);

            this.xAxis.call(d3.axisBottom(this.xScale)
                .tickValues(this.xScale.domain().filter((d, i) => !(i % 3))));

            this.xAxis.select('.domain').remove()
        }

    }
    brushesUpdate(){
        // Append brush
        this.gBrush=this.chart.selectAll('.gBrush').data([0])
        this.gBrush=this.gBrush.enter()
                    .append('g')
                    .attr('class', 'gBrush');  
        this.gBrush.call(this.brush(this))
            .call(this.brush(this).move, [0, this.width])
        // Custom handlers
        // Handle group
        const gHandles = this.gBrush.selectAll('g.handles')
            .data(['handle--o', 'handle--e'])
            .enter()
            .append('g')
            .attr('class', d => `handles ${d}`)
            .attr('fill', this.colors.handle)
            .attr('transform', d => {
                const x = d == 'handle--o' ? 0 : this.width;
                return `translate(${x}, 0)`;
            });

        // Label
        const labels=gHandles.selectAll('text')
            .data(d => [d])

        //update
        gHandles.selectAll('text')
            .text(d => d == 'handle--o' ? d3.min(this.xScale.domain()) : d3.max(this.xScale.domain()));
        
        //add
        labels.enter()
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', -10)
            .text(d => d == 'handle--o' ? d3.min(this.xScale.domain()) : d3.max(this.xScale.domain()));

        // Triangle
        gHandles.selectAll('.triangle')
            .data(d => [d])
            .enter()
            .append('path')
            .attr('class', d => `triangle ${d}`)
            .attr('d', this.triangle)
            .attr('transform', d => {
                const x = d == 'handle--o' ? -6 : 6,
                    rot = d == 'handle--o' ? -90 : 90;
                return `translate(${x}, ${this.height / 2}) rotate(${rot})`;
            });

        // Visible Line
        const lines=gHandles.selectAll('.line')
            .data(d => [d])

        lines.enter()
            .append('line')
            .attr('class', d => `line ${d}`)
            .attr('x1', 0)
            .attr('y1', -5)
            .attr('x2', 0)
            .attr('y2', this.height + 5)
            .attr('stroke', this.colors.handle);
    }

    updateChart() {
        // create scales
        this.xScale = this.xScale.domain(this.data.map(d => d.year))
        if (this.showXAxis) {
            this.xAxis.call(d3.axisBottom(this.xScale)
                .tickValues(this.xScale.domain().filter((d, i) => !(i % 3))));
            this.xAxis.select('.domain').remove()
        }
        this.yScale = this.yScale.domain(d3.extent(this.data, d => d.value))

        // Bars
        //barchart = {...
        const update = this.chart.selectAll('.bar')
            .data(this.data)
        
        //remove
        update.exit().remove()

        //update
        this.chart.selectAll('.bar')
            .attr('x', d => this.xScale(d.year))
            .attr('y', d => this.height - this.yScale(d.value))
            .attr('width', this.xScale.bandwidth())
            .attr('height', d => this.yScale(d.value))
            .attr('fill', this.colors.bar)
            .attr('opacity', 1);

        //add
        update.enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => this.xScale(d.year))
            .attr('y', d => this.height - this.yScale(d.value))
            .attr('width', this.xScale.bandwidth())
            .attr('height', d => this.yScale(d.value))
            .attr('fill', this.colors.bar)
            .attr('opacity', 1);
        
        this.brushesUpdate();

        //chart styling
        this.chart.selectAll('text')
            .style('font-family', 'sans-serif')
            .style('font-weight', 'bold')
            .style('font-size', '90%')
        this.chart.select('.selection')
            .style('opacity', 0)

        this.chart.selectAll('.tick text')
            .style('font-weight', 'normal')

        
    }
}
