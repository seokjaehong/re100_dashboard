import { calculateMonthlyData, calculateHourlyData, calculateESSCapacity } from './dataProcessing';
import { ProcessedData } from '../types';

describe('dataProcessing - Additional Coverage', () => {
  it('calculateMonthlyData handles months with partial data', () => {
    const processedData: ProcessedData[] = [
      {
        datetime: '2025-03-01 00:00',
        solar: 200,
        wind: 300,
        totalSupply: 500,
        demand: 400,
        externalPower: 0,
        re100Rate: 100,
      },
      {
        datetime: '2025-03-15 12:00',
        solar: 250,
        wind: 350,
        totalSupply: 600,
        demand: 450,
        externalPower: 0,
        re100Rate: 100,
      },
      // Add data for different month
      {
        datetime: '2025-04-01 00:00',
        solar: 100,
        wind: 200,
        totalSupply: 300,
        demand: 350,
        externalPower: 50,
        re100Rate: 85.71,
      },
    ];

    const result = calculateMonthlyData(processedData);
    
    expect(result).toHaveLength(2);
    expect(result[0].month).toBe('2025-03');
    expect(result[1].month).toBe('2025-04');
    
    // Check that totals are calculated correctly
    expect(result[0].totalSupply).toBe(1100); // 500 + 600
    expect(result[0].totalDemand).toBe(850); // 400 + 450
    expect(result[1].totalSupply).toBe(300);
    expect(result[1].externalPower).toBe(50);
  });

  it('calculateHourlyData handles all 24 hours', () => {
    const processedData: ProcessedData[] = [];
    
    // Generate data for all 24 hours
    for (let hour = 0; hour < 24; hour++) {
      processedData.push({
        datetime: `2025-03-01 ${hour.toString().padStart(2, '0')}:00`,
        solar: hour * 10,
        wind: hour * 15,
        totalSupply: hour * 25,
        demand: hour * 20,
        externalPower: 0,
        re100Rate: 100,
      });
      // Add duplicate hour for averaging
      processedData.push({
        datetime: `2025-03-02 ${hour.toString().padStart(2, '0')}:00`,
        solar: hour * 10 + 5,
        wind: hour * 15 + 5,
        totalSupply: hour * 25 + 10,
        demand: hour * 20 + 10,
        externalPower: 0,
        re100Rate: 100,
      });
    }

    const result = calculateHourlyData(processedData);
    
    expect(result).toHaveLength(24);
    
    // Check first hour
    expect(result[0].hour).toBe(0);
    expect(result[0].avgSupply).toBe(5); // (0 + 10) / 2
    
    // Check last hour
    expect(result[23].hour).toBe(23);
    expect(result[23].avgSupply).toBe(23 * 25 + 5); // (23*25 + 23*25+10) / 2
  });

  it('calculateESSCapacity handles edge cases with no deficit', () => {
    const processedData: ProcessedData[] = [
      {
        datetime: '2025-03-01 00:00',
        solar: 500,
        wind: 500,
        totalSupply: 1000,
        demand: 500, // Supply > Demand
        externalPower: 0,
        re100Rate: 100,
      },
      {
        datetime: '2025-03-01 01:00',
        solar: 600,
        wind: 600,
        totalSupply: 1200,
        demand: 600, // Supply > Demand
        externalPower: 0,
        re100Rate: 100,
      },
    ];

    const result = calculateESSCapacity(processedData);
    
    // When there's no deficit (supply always >= demand), ESS capacity should be 0
    expect(result).toBe(0);
  });

  it('handles string dates with different formats', () => {
    const processedData: ProcessedData[] = [
      {
        datetime: '2025-03-01T00:00:00', // ISO format
        solar: 100,
        wind: 100,
        totalSupply: 200,
        demand: 150,
        externalPower: 0,
        re100Rate: 100,
      },
      {
        datetime: '2025-03-01T12:30:45', // ISO with seconds
        solar: 150,
        wind: 150,
        totalSupply: 300,
        demand: 250,
        externalPower: 0,
        re100Rate: 100,
      },
    ];

    const monthlyResult = calculateMonthlyData(processedData);
    expect(monthlyResult).toHaveLength(1);
    expect(monthlyResult[0].month).toBe('2025-03');

    const hourlyResult = calculateHourlyData(processedData);
    expect(hourlyResult.find(h => h.hour === 0)).toBeDefined();
    expect(hourlyResult.find(h => h.hour === 12)).toBeDefined();
  });
});