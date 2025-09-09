import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Typography, ToggleButton, ToggleButtonGroup, Box, Collapse, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { CSVRow } from '../types';
import { format, parseISO } from 'date-fns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface PlantChartProps {
  rawData: CSVRow[];
  aggregatedData?: any;
}

const PlantChart: React.FC<PlantChartProps> = ({ rawData, aggregatedData }) => {
  const [aggregation, setAggregation] = useState<'hourly' | 'monthly'>('hourly');
  const [showTable, setShowTable] = useState(false);
  const [monthlyChartData, setMonthlyChartData] = useState<any[]>([]);

  useEffect(() => {
    // aggregatedData가 있으면 사용, 없으면 rawData에서 계산
    if ((aggregatedData && aggregatedData.plantMonthly) || (rawData && rawData.length > 0)) {
      // 월별 데이터 재구성 (평균값 계산)
      const monthlyData: { [key: string]: { [key: string]: { total: number; days: number } } } = {};
      const daysInMonth: { [key: string]: number } = {
        '1월': 31, '2월': 29, '3월': 31, '4월': 30, '5월': 31, '6월': 30,
        '7월': 31, '8월': 31, '9월': 30, '10월': 31, '11월': 30, '12월': 31
      };
      
      if (aggregatedData && aggregatedData.plantMonthly) {
        aggregatedData.plantMonthly.forEach((item: any) => {
          if (!monthlyData[item.month]) {
            monthlyData[item.month] = {};
          }
          // 타입별로만 집계 (개별 발전소 구분 제거)
          const key = item.type;
          const days = daysInMonth[item.month] || 30;
          if (!monthlyData[item.month][key]) {
            monthlyData[item.month][key] = { total: 0, days: days };
          }
          monthlyData[item.month][key].total += item.value;
        });
      } else if (rawData && rawData.length > 0) {
        // rawData에서 직접 월별 데이터 계산
        const plantData = rawData.filter(row => row.type === 'solar' || row.type === 'wind');
        plantData.forEach(row => {
          const date = parseISO(row.datetime);
          const monthKey = `${date.getMonth() + 1}월`;
          
          if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {};
          }
          
          // 타입별로만 집계
          const key = row.type;
          if (!monthlyData[monthKey][key]) {
            monthlyData[monthKey][key] = { total: 0, days: daysInMonth[monthKey] || 30 };
          }
          monthlyData[monthKey][key].total += row.value;
        });
      }
      
      // 평균값 계산하여 배열로 변환
      const avgMonthlyData = Object.entries(monthlyData).map(([month, plants]) => {
        const avgData: any = { period: month };
        Object.entries(plants).forEach(([plantKey, data]) => {
          // 월 총 발전량을 (일수 * 24시간)으로 나누어 평균 시간당 출력(GW) 계산
          avgData[plantKey] = data.total / (data.days * 24);
        });
        return avgData;
      });
      
      // 정렬
      const sortedData = avgMonthlyData.sort((a: any, b: any) => {
        const monthOrder = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
        return monthOrder.indexOf(a.period) - monthOrder.indexOf(b.period);
      });
      
      setMonthlyChartData(sortedData);
    }
  }, [aggregatedData]);

  const handleAggregationChange = (_: any, newValue: 'hourly' | 'monthly' | null) => {
    if (newValue) setAggregation(newValue);
  };

  const aggregateHourlyData = () => {
    if (!rawData || rawData.length === 0) {
      return [];
    }
    
    const aggregated: { [key: string]: { [plantType: string]: { total: number; count: number } } } = {};
    
    // 발전소만 필터링 (demand 제외)
    const plantData = rawData.filter(row => row.type !== 'demand');

    plantData.forEach(row => {
      const date = parseISO(row.datetime);
      const periodKey = format(date, 'HH:00');

      if (!aggregated[periodKey]) {
        aggregated[periodKey] = {};
      }

      // 발전소 타입별로 집계 (solar 또는 wind)
      const key = row.type;
      if (!aggregated[periodKey][key]) {
        aggregated[periodKey][key] = { total: 0, count: 0 };
      }
      aggregated[periodKey][key].total += row.value;
      aggregated[periodKey][key].count += 1;
    });

    // 평균 계산 및 GWh를 GW로 변환 (시간당 평균이므로 단위 변환 불필요)
    const chartData = Object.entries(aggregated).map(([period, values]) => {
      const avgValues: any = { period };
      Object.entries(values).forEach(([key, data]) => {
        avgValues[key] = data.count > 0 ? data.total / data.count : 0;
      });
      return avgValues;
    });

    return chartData.sort((a, b) => a.period.localeCompare(b.period));
  };

  const chartData = aggregation === 'monthly' ? monthlyChartData : aggregateHourlyData();
  const dataKeys = chartData && chartData.length > 0 
    ? Object.keys(chartData[0]).filter(key => key !== 'period')
    : [];

  const getColor = (key: string) => {
    if (key.includes('solar')) return '#FFA726';
    if (key.includes('wind')) return '#42A5F5';
    return '#9E9E9E';
  };

  const formatValue = (value: number) => {
    return value ? value.toFixed(2) : '0';
  };

  return (
    <Paper sx={{ p: 2, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          발전소별 평균 발전 현황
        </Typography>
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

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis label={{ value: '평균출력 (GW)', angle: -90, position: 'insideLeft' }} />
          <Tooltip formatter={(value: number) => `${formatValue(value)} GW`} />
          <Legend />
          {dataKeys.map(key => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={getColor(key)}
              name={key.replace('_', ' ')}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

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
                      {key.replace('_', ' ')} (GW)
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
    </Paper>
  );
};

export default PlantChart;