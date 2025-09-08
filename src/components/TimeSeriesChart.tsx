import React, { useState, useEffect } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, ReferenceLine } from 'recharts';
import { ProcessedData } from '../types';
import { Paper, Typography, Collapse, IconButton, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { format, parseISO } from 'date-fns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface TimeSeriesChartProps {
  data: ProcessedData[];
  aggregatedData?: any;
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data, aggregatedData }) => {
  const [showTable, setShowTable] = useState(false);
  const [fullYearData, setFullYearData] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('01'); // 기본값 1월
  const [selectedWeek, setSelectedWeek] = useState<string>('1'); // 기본값 1주차
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [weekOptions, setWeekOptions] = useState<string[]>(['1', '2', '3', '4', '5']);
  
  useEffect(() => {
    // 2024년 전체 데이터 로드
    fetch('/sample_data/hourly_data_2024.json')
      .then(res => res.json())
      .then(hourlyData => {
        const formatted = hourlyData.map((item: any) => {
          const date = new Date(item.datetime);
          const day = date.getDate();
          const week = Math.ceil(day / 7);
          
          return {
            ...item,
            time: item.datetime.substring(5, 16), // "2024-01-01 00:00" -> "01-01 00:00"
            month: item.datetime.substring(5, 7), // 월 추출
            week: week.toString(), // 주차 계산
            negativeDemand: -(item.demand || 0),
            externalPower: Math.abs(item.externalPower || 0) // Take absolute value
          };
        });
        setFullYearData(formatted);
      })
      .catch(() => {
        // fallback to provided data
        const formatted = data.map((item: any) => {
          const dateStr = item.datetime.includes('T') ? item.datetime : item.datetime + 'T00:00:00';
          const date = new Date(dateStr);
          const day = date.getDate();
          const week = Math.ceil(day / 7);
          
          return {
            ...item,
            time: item.datetime.includes('T') ? 
              format(parseISO(item.datetime), 'MM/dd HH:mm') : 
              item.datetime.substring(5, 16),
            month: item.datetime.includes('T') ? 
              format(parseISO(item.datetime), 'MM') : 
              item.datetime.substring(5, 7),
            week: week.toString(),
            negativeDemand: item.negativeDemand || -(item.demand || 0)
          };
        });
        setFullYearData(formatted);
      });
  }, [data]);

  useEffect(() => {
    // 선택된 월과 주차의 데이터만 필터링
    const monthWeekData = fullYearData.filter(item => 
      item.month === selectedMonth && item.week === selectedWeek
    );
    setFilteredData(monthWeekData);
    
    // 선택된 월에 따라 주차 옵션 업데이트
    const monthData = fullYearData.filter(item => item.month === selectedMonth);
    const uniqueWeeks = Array.from(new Set(monthData.map(item => item.week))).sort();
    if (uniqueWeeks.length > 0) {
      setWeekOptions(uniqueWeeks);
      // 선택된 주차가 새 월에 없으면 첫 번째 주차로 리셋
      if (!uniqueWeeks.includes(selectedWeek)) {
        setSelectedWeek(uniqueWeeks[0]);
      }
    }
  }, [fullYearData, selectedMonth, selectedWeek]);

  const handleMonthChange = (event: SelectChangeEvent) => {
    setSelectedMonth(event.target.value);
  };
  
  const handleWeekChange = (event: SelectChangeEvent) => {
    setSelectedWeek(event.target.value);
  };

  const chartData = filteredData.length > 0 ? filteredData : fullYearData.length > 0 ? fullYearData : data.map((item: any) => ({
    ...item,
    time: item.datetime.includes('T') ? 
      format(parseISO(item.datetime), 'MM/dd HH:mm') : 
      item.datetime.substring(5, 16),
    negativeDemand: item.negativeDemand || -(item.demand || 0)
  }));

  return (
    <Paper sx={{ p: 2, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          시간대별 RE100 달성 현황 (2024년)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>월 선택</InputLabel>
            <Select
              value={selectedMonth}
              onChange={handleMonthChange}
              label="월 선택"
            >
              <MenuItem value="01">1월</MenuItem>
              <MenuItem value="02">2월</MenuItem>
              <MenuItem value="03">3월</MenuItem>
              <MenuItem value="04">4월</MenuItem>
              <MenuItem value="05">5월</MenuItem>
              <MenuItem value="06">6월</MenuItem>
              <MenuItem value="07">7월</MenuItem>
              <MenuItem value="08">8월</MenuItem>
              <MenuItem value="09">9월</MenuItem>
              <MenuItem value="10">10월</MenuItem>
              <MenuItem value="11">11월</MenuItem>
              <MenuItem value="12">12월</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>주차 선택</InputLabel>
            <Select
              value={selectedWeek}
              onChange={handleWeekChange}
              label="주차 선택"
            >
              {weekOptions.map(week => (
                <MenuItem key={week} value={week}>{week}주차</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis yAxisId="left" label={{ value: '전력량 (GWh)', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'RE100 달성률 (%)', angle: 90, position: 'insideRight' }} />
          <Tooltip 
            formatter={(value: any, name: string) => {
              if (name === '수요') {
                return [Math.abs(value).toFixed(3) + ' GWh', name];
              }
              if (name === 'RE100 달성률') {
                return [value.toFixed(2) + '%', name];
              }
              return [value.toFixed(3) + ' GWh', name];
            }}
          />
          <Legend />
          <ReferenceLine y={0} stroke="#000" strokeWidth={1} />
          
          {/* 공급 데이터 - 막대 */}
          <Bar yAxisId="left" dataKey="solar" stackId="supply" fill="#FFA726" name="태양광" />
          <Bar yAxisId="left" dataKey="wind" stackId="supply" fill="#42A5F5" name="풍력" />
          
          {/* 수요 데이터 - 막대 */}
          <Bar yAxisId="left" dataKey="negativeDemand" fill="#EF5350" name="수요" />
          
          {/* RE100 달성률 - 꺾은선 그래프 */}
          <Line yAxisId="right" type="monotone" dataKey="re100Rate" stroke="#9C27B0" name="RE100 달성률" strokeWidth={2} dot={false} />
          
          {/* Brush는 선택된 월의 첫날 데이터를 보이도록 설정 */}
          <Brush 
            dataKey="time" 
            height={30} 
            stroke="#8884d8"
            startIndex={0}
            endIndex={Math.min(23, chartData.length - 1)} // 첫날 24시간 또는 데이터 끝까지
          />
        </ComposedChart>
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
                  <TableCell>시간</TableCell>
                  <TableCell align="right">태양광 (GWh)</TableCell>
                  <TableCell align="right">풍력 (GWh)</TableCell>
                  <TableCell align="right">총 공급 (GWh)</TableCell>
                  <TableCell align="right">수요 (GWh)</TableCell>
                  <TableCell align="right">외부전력 (GWh)</TableCell>
                  <TableCell align="right">RE100 달성률 (%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {chartData.slice(0, 100).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.time}</TableCell>
                    <TableCell align="right">{(row.solar || 0).toFixed(3)}</TableCell>
                    <TableCell align="right">{(row.wind || 0).toFixed(3)}</TableCell>
                    <TableCell align="right">{(row.totalSupply || 0).toFixed(3)}</TableCell>
                    <TableCell align="right">{(row.demand || 0).toFixed(3)}</TableCell>
                    <TableCell align="right">{(row.externalPower || 0).toFixed(3)}</TableCell>
                    <TableCell align="right">{(row.re100Rate || 0).toFixed(2)}%</TableCell>
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

export default TimeSeriesChart;