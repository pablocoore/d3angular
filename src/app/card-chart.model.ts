import { ChartConfig } from "./shared/models/chart-config.model";

export class CardChart { 
    public generateData(){
        return [];
    }
    title= 'Card 2';
    cols= 1;
    rows: 1;
    debug=false;
    data=[];
    config: ChartConfig;
    constructor(type){
        this.config =new ChartConfig(type);
    }
}
