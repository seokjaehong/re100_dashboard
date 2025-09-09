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
  const [hourlyChartData, setHourlyChartData] = useState<any[]>([]);

  useEffect(() => {
    // monthly_aggregated_original.json에서 개별 발전소 데이터 로드
    console.log('PlantChart - Starting to fetch monthly data...');
    fetch('/agg_data/monthly_aggregated_original.json')
      .then(res => {
        console.log('PlantChart - Fetch response status:', res.status);
        return res.json();
      })
      .then(monthlyAggregated => {
        console.log('PlantChart - Monthly aggregated data received:', monthlyAggregated);
        // 월별 데이터 재구성 (평균값 계산)
        const monthlyData: { [key: string]: { [key: string]: { total: number; days: number } } } = {};
        const daysInMonth: { [key: string]: number } = {
          '1월': 31, '2월': 29, '3월': 31, '4월': 30, '5월': 31, '6월': 30,
          '7월': 31, '8월': 31, '9월': 30, '10월': 31, '11월': 30, '12월': 31
        };
        
        // 태양광 발전소별 데이터
        if (monthlyAggregated.solar) {
          Object.entries(monthlyAggregated.solar).forEach(([plantName, plantData]: [string, any]) => {
            if (plantName === 'total') return; // total 데이터는 제외
            
            Object.entries(plantData).forEach(([monthKey, value]: [string, any]) => {
              const monthLabel = monthKey.substring(5) === '01' ? '1월' : 
                                 monthKey.substring(5) === '02' ? '2월' :
                                 monthKey.substring(5) === '03' ? '3월' :
                                 monthKey.substring(5) === '04' ? '4월' :
                                 monthKey.substring(5) === '05' ? '5월' :
                                 monthKey.substring(5) === '06' ? '6월' :
                                 monthKey.substring(5) === '07' ? '7월' :
                                 monthKey.substring(5) === '08' ? '8월' :
                                 monthKey.substring(5) === '09' ? '9월' :
                                 monthKey.substring(5) === '10' ? '10월' :
                                 monthKey.substring(5) === '11' ? '11월' : '12월';
              
              if (!monthlyData[monthLabel]) {
                monthlyData[monthLabel] = {};
              }
              
              const days = daysInMonth[monthLabel] || 30;
              monthlyData[monthLabel][plantName] = { total: value, days: days }; // 원본 값 사용
            });
          });
        }
        
        // 풍력 발전소별 데이터
        if (monthlyAggregated.wind) {
          Object.entries(monthlyAggregated.wind).forEach(([plantName, plantData]: [string, any]) => {
            if (plantName === 'total') return; // total 데이터는 제외
            
            Object.entries(plantData).forEach(([monthKey, value]: [string, any]) => {
              const monthLabel = monthKey.substring(5) === '01' ? '1월' : 
                                 monthKey.substring(5) === '02' ? '2월' :
                                 monthKey.substring(5) === '03' ? '3월' :
                                 monthKey.substring(5) === '04' ? '4월' :
                                 monthKey.substring(5) === '05' ? '5월' :
                                 monthKey.substring(5) === '06' ? '6월' :
                                 monthKey.substring(5) === '07' ? '7월' :
                                 monthKey.substring(5) === '08' ? '8월' :
                                 monthKey.substring(5) === '09' ? '9월' :
                                 monthKey.substring(5) === '10' ? '10월' :
                                 monthKey.substring(5) === '11' ? '11월' : '12월';
              
              if (!monthlyData[monthLabel]) {
                monthlyData[monthLabel] = {};
              }
              
              const days = daysInMonth[monthLabel] || 30;
              monthlyData[monthLabel][plantName] = { total: value, days: days }; // 원본 값 사용
            });
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
        console.log('PlantChart - Monthly data loaded:', sortedData.length, 'months');
        console.log('PlantChart - Sample data:', sortedData[0]);
        console.log('PlantChart - All months:', sortedData.map(d => d.period));
      })
      .catch(err => {
        console.error('월별 집계 데이터 로드 실패:', err);
        // fallback to original logic
        setMonthlyChartData([]);
      });
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  useEffect(() => {
    // plant_hourly_aggregated_original.json에서 시간대별 개별 발전소 데이터 로드
    console.log('PlantChart - Starting to fetch hourly data...');
    fetch('/agg_data/plant_hourly_aggregated_original.json') // 원본 값 사용
      .then(res => {
        console.log('PlantChart - Hourly fetch response status:', res.status);
        return res.json();
      })
      .then(plantHourly => {
        console.log('PlantChart - Hourly data received:', plantHourly);
        const chartData = [];
        
        // 24시간 데이터 생성
        for (let hour = 0; hour < 24; hour++) {
          const hourKey = hour.toString();
          const periodKey = `${hour.toString().padStart(2, '0')}:00`;
          const hourData: any = { period: periodKey };
          
          // 태양광 발전소별 데이터 (25% 적용)
          if (plantHourly.solar) {
            Object.entries(plantHourly.solar).forEach(([plantName, plantData]: [string, any]) => {
              hourData[plantName] = (plantData[hourKey] || 0) / 1000; // GWh를 GW로 변환 (원본 값)
            });
          }
          
          // 풍력 발전소별 데이터 (25% 적용)
          if (plantHourly.wind) {
            Object.entries(plantHourly.wind).forEach(([plantName, plantData]: [string, any]) => {
              hourData[plantName] = (plantData[hourKey] || 0) / 1000; // GWh를 GW로 변환 (원본 값)
            });
          }
          
          chartData.push(hourData);
        }
        
        setHourlyChartData(chartData);
        console.log('PlantChart - Hourly data loaded:', chartData.length, 'hours');
        console.log('PlantChart - Sample hourly data:', chartData[0]);
      })
      .catch(err => {
        console.error('시간대별 집계 데이터 로드 실패:', err);
        setHourlyChartData([]);
      });
  }, []);

  const handleAggregationChange = (_: any, newValue: 'hourly' | 'monthly' | null) => {
    if (newValue) setAggregation(newValue);
  };

  const chartData = aggregation === 'monthly' ? monthlyChartData : hourlyChartData;
  const dataKeys = chartData && chartData.length > 0 
    ? Object.keys(chartData[0]).filter(key => key !== 'period')
    : [];

  const getColor = (key: string) => {
    // 태양광 발전소
    if (key === '육상태양광') return '#FFA726';
    if (key === '수상태양광1') return '#FF9800';
    if (key === '수상태양광2') return '#FFB74D';
    // 풍력 발전소
    if (key === '군산해상풍력') return '#42A5F5';
    if (key === '새만금해상풍력') return '#2196F3';
    if (key === '서남해해상풍력') return '#64B5F6';
    // 기본 색상
    return '#9E9E9E';
  };

  const formatValue = (value: number) => {
    return value ? value.toFixed(2) : '0';
  };

  console.log('PlantChart - Rendering with data:', {
    aggregation,
    chartDataLength: chartData.length,
    dataKeys: dataKeys,
    firstDataPoint: chartData.length > 0 ? chartData[0] : null
  });

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

      {chartData.length === 0 ? (
        <Box sx={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography color="textSecondary">
            데이터를 로딩 중입니다... "샘플 데이터 로드" 버튼을 클릭해주세요.
          </Typography>
        </Box>
      ) : (
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
      )}
    </Paper>
  );
};

export default PlantChart;