import {
  convertToWideFormat,
  processData,
  calculateMonthlyData,
  calculateHourlyData,
  calculateESSCapacity,
  getUniqueCompanies,
  getUniquePlants
} from './dataProcessing';
import { CSVRow, WideFormatData, ProcessedData } from '../types';

describe('Data Processing Utils', () => {
  const sampleCSVData: CSVRow[] = [
    { datetime: '2025-03-01 00:00', type: 'solar', plant_name: 'solar_plant1', value: 120 },
    { datetime: '2025-03-01 00:00', type: 'solar', plant_name: 'solar_plant2', value: 80 },
    { datetime: '2025-03-01 00:00', type: 'wind', plant_name: 'wind_plant1', value: 200 },
    { datetime: '2025-03-01 00:00', type: 'demand', plant_name: 'compA', value: 250 },
    { datetime: '2025-03-01 00:00', type: 'demand', plant_name: 'compB', value: 100 },
    { datetime: '2025-03-01 01:00', type: 'solar', plant_name: 'solar_plant1', value: 100 },
    { datetime: '2025-03-01 01:00', type: 'solar', plant_name: 'solar_plant2', value: 70 },
    { datetime: '2025-03-01 01:00', type: 'wind', plant_name: 'wind_plant1', value: 180 },
    { datetime: '2025-03-01 01:00', type: 'demand', plant_name: 'compA', value: 230 },
    { datetime: '2025-03-01 01:00', type: 'demand', plant_name: 'compB', value: 90 },
  ];

  describe('convertToWideFormat', () => {
    it('should convert CSV data to wide format', () => {
      const result = convertToWideFormat(sampleCSVData);
      
      expect(result).toHaveLength(2);
      expect(result[0].datetime).toBe('2025-03-01 00:00');
      expect(result[0].solar_solar_plant1).toBe(120);
      expect(result[0].solar_solar_plant2).toBe(80);
      expect(result[0].wind_wind_plant1).toBe(200);
      expect(result[0].compA).toBe(250);
      expect(result[0].compB).toBe(100);
    });

    it('should handle empty data', () => {
      const result = convertToWideFormat([]);
      expect(result).toEqual([]);
    });
  });

  describe('processData', () => {
    it('should process wide format data correctly', () => {
      const wideData = convertToWideFormat(sampleCSVData);
      const result = processData(wideData, []);
      
      expect(result).toHaveLength(2);
      
      const firstRow = result[0];
      expect(firstRow.solar).toBe(200); // 120 + 80
      expect(firstRow.wind).toBe(200);
      expect(firstRow.totalSupply).toBe(400); // 200 + 200
      expect(firstRow.demand).toBe(350); // 250 + 100
      expect(firstRow.externalPower).toBe(0); // max(0, 350 - 400) = 0
      expect(firstRow.re100Rate).toBeCloseTo(100, 1); // (400/350) * 100 > 100, capped at 100
    });

    it('should filter companies when selected', () => {
      const wideData = convertToWideFormat(sampleCSVData);
      const result = processData(wideData, ['compA']);
      
      expect(result[0].demand).toBe(250); // Only compA
      expect(result[1].demand).toBe(230); // Only compA
    });

    it('should calculate external power when demand exceeds supply', () => {
      const testData: WideFormatData[] = [{
        datetime: '2025-03-01 00:00',
        solar_plant1: 50,
        wind_plant1: 50,
        compA: 200
      }];
      
      const result = processData(testData, []);
      expect(result[0].externalPower).toBe(100); // 200 - 100 = 100
    });
  });

  describe('calculateMonthlyData', () => {
    it('should aggregate data by month', () => {
      const wideData = convertToWideFormat(sampleCSVData);
      const processedData = processData(wideData, []);
      const result = calculateMonthlyData(processedData);
      
      expect(result).toHaveLength(1);
      expect(result[0].month).toBe('2025-03');
      expect(result[0].totalSupply).toBe(750); // Sum of all supply
      expect(result[0].totalDemand).toBe(670); // Sum of all demand
    });
  });

  describe('calculateHourlyData', () => {
    it('should calculate average data by hour', () => {
      const wideData = convertToWideFormat(sampleCSVData);
      const processedData = processData(wideData, []);
      const result = calculateHourlyData(processedData);
      
      expect(result).toHaveLength(2);
      expect(result[0].hour).toBe(0);
      expect(result[0].avgSupply).toBe(400);
      expect(result[0].avgDemand).toBe(350);
      
      expect(result[1].hour).toBe(1);
      expect(result[1].avgSupply).toBe(350);
      expect(result[1].avgDemand).toBe(320);
    });
  });

  describe('calculateESSCapacity', () => {
    it('should calculate maximum deficit', () => {
      const processedData: ProcessedData[] = [
        { datetime: '2025-03-01 00:00', solar: 100, wind: 100, totalSupply: 200, demand: 300, externalPower: 100, re100Rate: 66.67 },
        { datetime: '2025-03-01 01:00', solar: 100, wind: 100, totalSupply: 200, demand: 250, externalPower: 50, re100Rate: 80 },
        { datetime: '2025-03-01 02:00', solar: 100, wind: 100, totalSupply: 200, demand: 350, externalPower: 150, re100Rate: 57.14 },
      ];
      
      const result = calculateESSCapacity(processedData);
      expect(result).toBe(150); // Maximum deficit
    });

    it('should return 0 when supply always exceeds demand', () => {
      const processedData: ProcessedData[] = [
        { datetime: '2025-03-01 00:00', solar: 200, wind: 200, totalSupply: 400, demand: 300, externalPower: 0, re100Rate: 100 },
      ];
      
      const result = calculateESSCapacity(processedData);
      expect(result).toBe(0);
    });
  });

  describe('getUniqueCompanies', () => {
    it('should extract unique company names', () => {
      const result = getUniqueCompanies(sampleCSVData);
      
      expect(result).toEqual(['compA', 'compB']);
    });

    it('should return empty array when no demand data', () => {
      const solarOnlyData: CSVRow[] = [
        { datetime: '2025-03-01 00:00', type: 'solar', plant_name: 'solar_plant1', value: 120 },
      ];
      
      const result = getUniqueCompanies(solarOnlyData);
      expect(result).toEqual([]);
    });
  });

  describe('getUniquePlants', () => {
    it('should extract unique plant names by type', () => {
      const result = getUniquePlants(sampleCSVData);
      
      expect(result.solar).toEqual(['solar_plant1', 'solar_plant2']);
      expect(result.wind).toEqual(['wind_plant1']);
    });

    it('should handle data with no plants', () => {
      const demandOnlyData: CSVRow[] = [
        { datetime: '2025-03-01 00:00', type: 'demand', plant_name: 'compA', value: 250 },
      ];
      
      const result = getUniquePlants(demandOnlyData);
      expect(result.solar).toEqual([]);
      expect(result.wind).toEqual([]);
    });
  });
});