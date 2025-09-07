export interface CSVRow {
  datetime: string;
  type: 'solar' | 'wind' | 'demand';
  plant_name: string;
  value: number;
}

export interface WideFormatData {
  datetime: string;
  [key: string]: number | string;
}

export interface ProcessedData {
  datetime: string;
  solar: number;
  wind: number;
  totalSupply: number;
  demand: number;
  externalPower: number;
  re100Rate: number;
}

export interface MonthlyData {
  month: string;
  totalSupply: number;
  totalDemand: number;
  externalPower: number;
  re100Rate: number;
}

export interface HourlyData {
  hour: number;
  avgSupply: number;
  avgDemand: number;
  re100Rate: number;
}

export interface PivotData {
  name: string;
  [key: string]: number | string;
}