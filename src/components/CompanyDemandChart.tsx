import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Typography, ToggleButton, ToggleButtonGroup, Box, Collapse, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Chip } from '@mui/material';
import { CSVRow } from '../types';
import { format, parseISO } from 'date-fns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface CompanyDemandChartProps {
  rawData: CSVRow[];
  aggregatedData?: any;
}

const CompanyDemandChart: React.FC<CompanyDemandChartProps> = ({ rawData, aggregatedData }) => {
  const [aggregation, setAggregation] = useState<'hourly' | 'monthly'>('hourly');
  const [showTable, setShowTable] = useState(false);
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [allCompanies, setAllCompanies] = useState<string[]>([]);

  useEffect(() => {
    // 전체 기업 목록 추출 (가나다순)
    const companies = new Set<string>();
    
    if (rawData && rawData.length > 0) {
      rawData.filter(row => row.type === 'demand').forEach(row => {
        companies.add(row.plant_name);
      });
    }
    
    if (aggregatedData?.companyMonthly) {
      aggregatedData.companyMonthly.forEach((item: any) => {
        companies.add(item.company);
      });
    }
    
    const sortedCompanies = Array.from(companies).sort();
    setAllCompanies(sortedCompanies);
    
    // 초기값: 가나다순 상위 10개 기업
    if (selectedCompanies.length === 0 && sortedCompanies.length > 0) {
      setSelectedCompanies(sortedCompanies.slice(0, 10));
      console.log('Selected companies:', sortedCompanies.slice(0, 10));
    }
    
    // 디버깅 로그
    console.log('CompanyDemandChart - Raw data count:', rawData?.length || 0);
    console.log('CompanyDemandChart - Company monthly data:', aggregatedData?.companyMonthly?.length || 0);
    console.log('CompanyDemandChart - All companies:', sortedCompanies);
  }, [rawData, aggregatedData]);

  useEffect(() => {
    if (aggregatedData && aggregatedData.companyMonthly && selectedCompanies.length > 0) {
      // 월별 데이터 재구성 (평균값 계산)
      const monthlyData: { [key: string]: { [key: string]: { total: number; days: number } } } = {};
      const daysInMonth: { [key: string]: number } = {
        '1월': 31, '2월': 29, '3월': 31, '4월': 30, '5월': 31, '6월': 30,
        '7월': 31, '8월': 31, '9월': 30, '10월': 31, '11월': 30, '12월': 31
      };
      
      // 기업별 월별 데이터 집계 (선택된 기업만)
      if (aggregatedData.companyMonthly) {
        aggregatedData.companyMonthly.forEach((item: any) => {
          if (!selectedCompanies.includes(item.company)) return;
          if (!monthlyData[item.month]) {
            monthlyData[item.month] = {};
          }
          const key = item.company;
          const days = daysInMonth[item.month] || 30;
          monthlyData[item.month][key] = { 
            total: item.value, 
            days: days 
          };
        });
      } else if (aggregatedData.pieData && aggregatedData.pieData.companies) {
        // 대체 데이터 소스 사용
        const filteredCompanies = aggregatedData.pieData.companies
          .filter((c: any) => selectedCompanies.includes(c.name));
        const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        
        months.forEach(month => {
          monthlyData[month] = {};
          filteredCompanies.forEach((company: any) => {
            // 임시로 전체 값을 12개월로 나누어 할당
            monthlyData[month][company.name] = {
              total: company.value / 12,
              days: daysInMonth[month] || 30
            };
          });
        });
      }
      
      // 월별 합계 데이터로 변환
      const monthlyTotalData = Object.entries(monthlyData).map(([month, companies]) => {
        const totalData: any = { period: month };
        Object.entries(companies).forEach(([companyKey, data]) => {
          // 월별 합계 사용량(GWh) - 이미 value에 합계가 들어있음
          totalData[companyKey] = data.total;
        });
        return totalData;
      });
      
      // 정렬
      const sortedData = monthlyTotalData.sort((a: any, b: any) => {
        const monthOrder = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        return monthOrder.indexOf(a.period) - monthOrder.indexOf(b.period);
      });
      
      setMonthlyChartData(sortedData);
      console.log('CompanyDemandChart - Monthly chart data updated:', sortedData.length, 'entries');
      if (sortedData.length > 0) {
        console.log('CompanyDemandChart - Chart data keys:', Object.keys(sortedData[0]));
        console.log('CompanyDemandChart - First data point:', sortedData[0]);
      }
    }
  }, [aggregatedData, selectedCompanies]);

  const handleAggregationChange = (_: any, newValue: 'hourly' | 'monthly' | null) => {
    if (newValue) setAggregation(newValue);
  };

  const aggregateHourlyData = () => {
    if (!rawData || rawData.length === 0) {
      return [];
    }
    
    const aggregated: { [key: string]: { [companyName: string]: { total: number; count: number } } } = {};
    
    // 기업 수요 데이터만 필터링
    const demandData = rawData.filter(row => row.type === 'demand');

    demandData.forEach(row => {
      if (!selectedCompanies.includes(row.plant_name)) return;
      
      const date = parseISO(row.datetime);
      const periodKey = format(date, 'HH:00');

      if (!aggregated[periodKey]) {
        aggregated[periodKey] = {};
      }

      const key = row.plant_name;
      if (!aggregated[periodKey][key]) {
        aggregated[periodKey][key] = { total: 0, count: 0 };
      }
      aggregated[periodKey][key].total += row.value;
      aggregated[periodKey][key].count += 1;
    });

    // 평균 계산
    const chartData = Object.entries(aggregated).map(([period, values]) => {
      const avgValues: any = { period };
      Object.entries(values).forEach(([key, data]) => {
        avgValues[key] = data.count > 0 ? data.total / data.count : 0;
      });
      return avgValues;
    });

    return chartData.sort((a, b) => a.period.localeCompare(b.period));
  };

  const handleCompanyChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const selected = typeof value === 'string' ? value.split(',') : value;
    setSelectedCompanies(selected);
  };

  const chartData = aggregation === 'monthly' ? monthlyChartData : aggregateHourlyData();
  const dataKeys = chartData && chartData.length > 0 
    ? Object.keys(chartData[0]).filter(key => key !== 'period')
    : [];

  const getColor = (index: number) => {
    const colors = ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', 
                    '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39'];
    return colors[index % colors.length];
  };

  const formatValue = (value: number) => {
    return value ? value.toFixed(3) : '0';
  };

  console.log('CompanyDemandChart - Rendering with:', {
    aggregation,
    chartDataLength: chartData.length,
    dataKeys: dataKeys,
    selectedCompaniesCount: selectedCompanies.length,
    hasAggregatedData: !!aggregatedData
  });

  return (
    <Paper sx={{ p: 2, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6">
          기업별 {aggregation === 'monthly' ? '월별 합계' : '시간대별 평균'} 전력사용량 현황
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 300 }}>
            <InputLabel>기업 선택</InputLabel>
            <Select
              multiple
              value={selectedCompanies}
              onChange={handleCompanyChange}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.length > 3 ? (
                    <Chip size="small" label={`${selected.length}개 기업 선택됨`} />
                  ) : (
                    selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))
                  )}
                </Box>
              )}
            >
              {allCompanies.map((company) => (
                <MenuItem key={company} value={company}>
                  {company}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <ToggleButtonGroup
            value={aggregation}
            exclusive
            onChange={handleAggregationChange}
            size="small"
          >
            <ToggleButton value="hourly">시간대별</ToggleButton>
            <ToggleButton value="monthly">월별</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {chartData.length === 0 ? (
        <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="textSecondary">
            {selectedCompanies.length === 0 
              ? '기업을 선택해주세요.'
              : '데이터를 로딩 중입니다... "샘플 데이터 로드" 버튼을 클릭해주세요.'}
          </Typography>
        </Box>
      ) : (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis label={{ value: '전력 사용량 (GWh)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value: number) => `${formatValue(value)} GWh`} />
          <Legend />
          {dataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={getColor(index)}
              name={key}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      )}

      {chartData.length > 0 && (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowTable(!showTable)}>
          <IconButton size="small">
            {showTable ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <Typography variant="subtitle1">
            데이터 테이블 {showTable ? '접기' : '펼치기'}
          </Typography>
        </Box>
        
        <Collapse in={showTable}>
          <TableContainer sx={{ maxHeight: 400, mt: 2 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{aggregation === 'monthly' ? '월' : '시간'}</TableCell>
                  {dataKeys.map(key => (
                    <TableCell key={key} align="right">
                      {key} (GWh)
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {chartData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.period}</TableCell>
                    {dataKeys.map(key => (
                      <TableCell key={key} align="right">
                        {formatValue(row[key])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Collapse>
      </Box>
      )}
    </Paper>
  );
};

export default CompanyDemandChart;