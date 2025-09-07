import { CSVRow, WideFormatData, ProcessedData, MonthlyData, HourlyData } from '../types';
import { format, parseISO } from 'date-fns';

export const convertToWideFormat = (data: CSVRow[]): WideFormatData[] => {
  const pivoted: { [key: string]: any } = {};
  
  data.forEach(row => {
    if (!pivoted[row.datetime]) {
      pivoted[row.datetime] = { datetime: row.datetime };
    }
    const columnName = row.type === 'demand' ? row.plant_name : `${row.type}_${row.plant_name}`;
    pivoted[row.datetime][columnName] = row.value;
  });
  
  return Object.values(pivoted);
};

export const processData = (wideData: WideFormatData[], selectedCompanies: string[]): ProcessedData[] => {
  return wideData.map(row => {
    let solar = 0;
    let wind = 0;
    let demand = 0;
    
    Object.entries(row).forEach(([key, value]) => {
      if (key.startsWith('solar_') && typeof value === 'number') {
        solar += value;
      } else if (key.startsWith('wind_') && typeof value === 'number') {
        wind += value;
      } else if (!key.includes('_') && key !== 'datetime' && typeof value === 'number') {
        if (selectedCompanies.length === 0 || selectedCompanies.includes(key)) {
          demand += Math.abs(value);  // 음수로 들어온 수요를 양수로 변환
        }
      }
    });
    
    const totalSupply = solar + wind;
    const externalPower = Math.max(0, demand - totalSupply);
    const re100Rate = demand > 0 ? Math.min((totalSupply / demand) * 100, 100) : 0;
    
    return {
      datetime: row.datetime,
      solar,
      wind,
      totalSupply,
      demand,
      externalPower,
      re100Rate
    };
  });
};

export const calculateMonthlyData = (processedData: ProcessedData[]): MonthlyData[] => {
  const monthlyMap: { [key: string]: { supply: number; demand: number; count: number } } = {};
  
  processedData.forEach(row => {
    const month = format(parseISO(row.datetime), 'yyyy-MM');
    if (!monthlyMap[month]) {
      monthlyMap[month] = { supply: 0, demand: 0, count: 0 };
    }
    monthlyMap[month].supply += row.totalSupply;
    monthlyMap[month].demand += row.demand;
    monthlyMap[month].count += 1;
  });
  
  return Object.entries(monthlyMap).map(([month, data]) => {
    const externalPower = Math.max(0, data.demand - data.supply);
    const re100Rate = data.demand > 0 ? Math.min((data.supply / data.demand) * 100, 100) : 0;
    return {
      month,
      totalSupply: data.supply,
      totalDemand: data.demand,
      externalPower,
      re100Rate
    };
  }).sort((a, b) => a.month.localeCompare(b.month));
};

export const calculateHourlyData = (processedData: ProcessedData[]): HourlyData[] => {
  const hourlyMap: { [key: number]: { supply: number; demand: number; count: number } } = {};
  
  processedData.forEach(row => {
    const hour = new Date(row.datetime).getHours();
    if (!hourlyMap[hour]) {
      hourlyMap[hour] = { supply: 0, demand: 0, count: 0 };
    }
    hourlyMap[hour].supply += row.totalSupply;
    hourlyMap[hour].demand += row.demand;
    hourlyMap[hour].count += 1;
  });
  
  return Object.entries(hourlyMap).map(([hour, data]) => {
    const avgSupply = data.supply / data.count;
    const avgDemand = data.demand / data.count;
    const re100Rate = avgDemand > 0 ? Math.min((avgSupply / avgDemand) * 100, 100) : 0;
    return {
      hour: parseInt(hour),
      avgSupply,
      avgDemand,
      re100Rate
    };
  }).sort((a, b) => a.hour - b.hour);
};

export const calculateESSCapacity = (processedData: ProcessedData[]): number => {
  // ESS 용량 = 공급(양수)과 수요(음수)의 절대값 차이 중 최대값
  let maxDifference = 0;
  processedData.forEach(row => {
    const difference = Math.abs(row.totalSupply - row.demand);
    if (difference > maxDifference) {
      maxDifference = difference;
    }
  });
  return maxDifference;
};

export const getUniqueCompanies = (data: CSVRow[]): string[] => {
  const companies = new Set<string>();
  data.forEach(row => {
    if (row.type === 'demand') {
      companies.add(row.plant_name);
    }
  });
  return Array.from(companies);
};

export const getUniquePlants = (data: CSVRow[]): { solar: string[], wind: string[] } => {
  const solarPlants = new Set<string>();
  const windPlants = new Set<string>();
  
  data.forEach(row => {
    if (row.type === 'solar') {
      solarPlants.add(row.plant_name);
    } else if (row.type === 'wind') {
      windPlants.add(row.plant_name);
    }
  });
  
  return {
    solar: Array.from(solarPlants),
    wind: Array.from(windPlants)
  };
};