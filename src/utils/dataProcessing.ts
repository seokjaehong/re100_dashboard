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
      } else if (key !== 'datetime' && !key.startsWith('solar_') && !key.startsWith('wind_') && typeof value === 'number') {
        // solar_ 또는 wind_로 시작하지 않는 모든 숫자 필드는 수요로 간주
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

export const updateAggregatedData = (existingAggregated: any, rawData: CSVRow[]): any => {
  // 기존 aggregatedData를 복사
  const updated = { ...existingAggregated };
  
  // 기존 pieData에서 초기값 가져오기
  const solarPlants: { [key: string]: number } = {};
  const windPlants: { [key: string]: number } = {};
  const companies: { [key: string]: number } = {};
  
  // 기존 데이터 먼저 복사
  if (existingAggregated.pieData) {
    if (existingAggregated.pieData.solar_plants) {
      existingAggregated.pieData.solar_plants.forEach((plant: any) => {
        solarPlants[plant.name] = plant.value;
      });
    }
    if (existingAggregated.pieData.wind_plants) {
      existingAggregated.pieData.wind_plants.forEach((plant: any) => {
        windPlants[plant.name] = plant.value;
      });
    }
    if (existingAggregated.pieData.companies) {
      existingAggregated.pieData.companies.forEach((company: any) => {
        companies[company.name] = company.value;
      });
    }
  }
  
  // 새로운 rawData 추가
  rawData.forEach(row => {
    if (row.type === 'solar') {
      solarPlants[row.plant_name] = (solarPlants[row.plant_name] || 0) + row.value;
    } else if (row.type === 'wind') {
      windPlants[row.plant_name] = (windPlants[row.plant_name] || 0) + row.value;
    } else if (row.type === 'demand') {
      companies[row.plant_name] = (companies[row.plant_name] || 0) + row.value;
    }
  });
  
  // pieData 업데이트
  updated.pieData = {
    solar_plants: Object.entries(solarPlants).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100
    })),
    wind_plants: Object.entries(windPlants).map(([name, value]) => ({
      name,
      value: Math.round(value * 100) / 100
    })),
    companies: Object.entries(companies)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100
      }))
  };
  
  // 월별 데이터 - 기존 데이터와 병합
  const monthlyMap: { [key: string]: { solar: number; wind: number; demand: number } } = {};
  
  // 월 키 정규화 함수 (1월, 2월 형식으로 통일)
  const normalizeMonthKey = (key: string): string => {
    // "2024-01" 형식이면 "1월"로 변환
    if (key.includes('-')) {
      const monthNum = parseInt(key.split('-')[1]);
      return `${monthNum}월`;
    }
    // 이미 "1월" 형식이면 그대로 반환
    return key;
  };
  
  // 기존 월별 데이터 먼저 복사
  if (existingAggregated.monthlyData) {
    existingAggregated.monthlyData.forEach((month: any) => {
      const originalKey = month.monthLabel || month.month;
      const monthKey = normalizeMonthKey(originalKey);
      monthlyMap[monthKey] = {
        solar: month.totalSolar || 0,
        wind: month.totalWind || 0,
        demand: month.totalDemand || 0
      };
    });
  }
  
  // 새로운 데이터 추가 (기존 값에 누적)
  rawData.forEach(row => {
    const date = new Date(row.datetime);
    const monthKey = `${date.getMonth() + 1}월`;
    
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { solar: 0, wind: 0, demand: 0 };
    }
    
    if (row.type === 'solar') {
      monthlyMap[monthKey].solar += row.value;
    } else if (row.type === 'wind') {
      monthlyMap[monthKey].wind += row.value;
    } else if (row.type === 'demand') {
      monthlyMap[monthKey].demand += row.value;
    }
  });
  
  // monthlyData 업데이트
  updated.monthlyData = Object.entries(monthlyMap).map(([month, data]) => {
    const totalSupply = data.solar + data.wind;
    return {
      month: `2024-${month.replace('월', '').padStart(2, '0')}`,
      monthLabel: month,
      totalSolar: Math.round(data.solar * 100) / 100,
      totalWind: Math.round(data.wind * 100) / 100,
      totalSupply: Math.round(totalSupply * 100) / 100,
      totalDemand: Math.round(data.demand * 100) / 100,
      negativeDemand: -Math.round(data.demand * 100) / 100,
      externalPower: Math.round((totalSupply - data.demand) * 100) / 100,
      re100Rate: data.demand > 0 ? Math.min(100, Math.round((totalSupply / data.demand) * 10000) / 100) : 0
    };
  }).sort((a, b) => {
    const monthOrder = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    return monthOrder.indexOf(a.monthLabel) - monthOrder.indexOf(b.monthLabel);
  });
  
  // plantMonthly 업데이트 - 기존 데이터와 병합
  const plantMonthlyMap: { [key: string]: number } = {};
  
  // 기존 plantMonthly 데이터 먼저 복사
  if (existingAggregated.plantMonthly) {
    existingAggregated.plantMonthly.forEach((item: any) => {
      const key = `${item.month}_${item.type}_${item.plant}`;
      plantMonthlyMap[key] = item.value;
    });
  }
  
  // 새로운 데이터 추가
  rawData.forEach(row => {
    if (row.type === 'solar' || row.type === 'wind') {
      const date = new Date(row.datetime);
      const monthKey = `${date.getMonth() + 1}월`;
      const key = `${monthKey}_${row.type}_${row.plant_name}`;
      plantMonthlyMap[key] = (plantMonthlyMap[key] || 0) + row.value;
    }
  });
  
  updated.plantMonthly = Object.entries(plantMonthlyMap).map(([key, value]) => {
    const parts = key.split('_');
    return {
      month: parts[0],
      type: parts[1],
      plant: parts.slice(2).join('_'),
      value: Math.round(value * 100) / 100
    };
  });
  
  // companyMonthly 업데이트 - 기존 데이터와 병합
  const companyMonthlyMap: { [key: string]: number } = {};
  
  // 기존 companyMonthly 데이터 먼저 복사
  if (existingAggregated.companyMonthly) {
    existingAggregated.companyMonthly.forEach((item: any) => {
      const key = `${item.month}_${item.company}`;
      companyMonthlyMap[key] = item.value;
    });
  }
  
  // 새로운 데이터 추가
  rawData.forEach(row => {
    if (row.type === 'demand') {
      const date = new Date(row.datetime);
      const monthKey = `${date.getMonth() + 1}월`;
      const key = `${monthKey}_${row.plant_name}`;
      companyMonthlyMap[key] = (companyMonthlyMap[key] || 0) + row.value;
    }
  });
  
  updated.companyMonthly = Object.entries(companyMonthlyMap).map(([key, value]) => {
    const [month, ...companyParts] = key.split('_');
    return {
      month,
      company: companyParts.join('_'),
      value: Math.round(value * 100) / 100
    };
  });
  
  // ESS 용량 재계산
  let maxShortage = 0;
  Object.values(monthlyMap).forEach(data => {
    const shortage = data.demand - (data.solar + data.wind);
    if (shortage > maxShortage) {
      maxShortage = shortage;
    }
  });
  updated.essCapacity = Math.round(maxShortage * 100) / 100;
  
  // summary 업데이트
  const totalSolar = Object.values(solarPlants).reduce((sum, val) => sum + val, 0);
  const totalWind = Object.values(windPlants).reduce((sum, val) => sum + val, 0);
  const totalDemand = Object.values(companies).reduce((sum, val) => sum + val, 0);
  
  updated.summary = {
    totalSolar: Math.round(totalSolar * 100) / 100,
    totalWind: Math.round(totalWind * 100) / 100,
    totalDemand: Math.round(totalDemand * 100) / 100,
    avgRE100Rate: updated.monthlyData.length > 0 
      ? Math.round(updated.monthlyData.reduce((sum: number, m: any) => sum + m.re100Rate, 0) / updated.monthlyData.length * 100) / 100
      : 0
  };
  
  return updated;
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