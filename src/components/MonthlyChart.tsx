import React, { useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MonthlyData } from '../types';
import { Paper, Typography, Collapse, IconButton, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface MonthlyChartProps {
  data: MonthlyData[];
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ data }) => {
  const [showTable, setShowTable] = useState(false);

  // 월 라벨 처리
  const formattedData = data.map(item => ({
    ...item,
    month: (item as any).monthLabel || item.month,
    negativeDemand: (item as any).negativeDemand || -(item.totalDemand || 0), // 수요를 음수로
    totalSolar: (item as any).totalSolar || 0,
    totalWind: (item as any).totalWind || 0
  }));

  return (
    <Paper sx={{ p: 2, width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        월별 RE100 달성 현황
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" label={{ value: '전력량 (GWh)', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'RE100 달성률 (%)', angle: 90, position: 'insideRight' }} />
          <Tooltip 
            formatter={(value: any, name: string) => {
              if (name === '수요 (음수)') {
                return [Math.abs(value).toFixed(1) + ' GWh', '수요'];
              }
              if (name === 'RE100 달성률') {
                return [value.toFixed(2) + '%', name];
              }
              return [value.toFixed(1) + ' GWh', name];
            }}
          />
          <Legend />
          <ReferenceLine y={0} stroke="#000" strokeWidth={1} />
          
          {/* 공급 데이터 - 양수 막대 */}
          <Bar yAxisId="left" dataKey="totalSolar" stackId="supply" fill="#FFA726" name="태양광" />
          <Bar yAxisId="left" dataKey="totalWind" stackId="supply" fill="#42A5F5" name="풍력" />
          
          {/* 수요 데이터 - 음수 막대 */}
          <Bar yAxisId="left" dataKey="negativeDemand" fill="#EF5350" name="수요 (음수)" />
          
          {/* 외부전력 (공급 - 수요) */}
          <Bar yAxisId="left" dataKey="externalPower" fill="#9E9E9E" name="외부전력" opacity={0.6} />
          
          {/* RE100 달성률 - 꺾은선 그래프 */}
          <Line yAxisId="right" type="monotone" dataKey="re100Rate" stroke="#FF9800" name="RE100 달성률" strokeWidth={3} dot={{ r: 4 }} />
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
                  <TableCell>월</TableCell>
                  <TableCell align="right">태양광 (GWh)</TableCell>
                  <TableCell align="right">풍력 (GWh)</TableCell>
                  <TableCell align="right">총 공급 (GWh)</TableCell>
                  <TableCell align="right">총 수요 (GWh)</TableCell>
                  <TableCell align="right">외부전력 (GWh)</TableCell>
                  <TableCell align="right">RE100 달성률 (%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formattedData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.month}</TableCell>
                    <TableCell align="right">{(row.totalSolar || 0).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}</TableCell>
                    <TableCell align="right">{(row.totalWind || 0).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}</TableCell>
                    <TableCell align="right">{(row.totalSupply || 0).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}</TableCell>
                    <TableCell align="right">{(row.totalDemand || 0).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}</TableCell>
                    <TableCell align="right">{(row.externalPower || 0).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}</TableCell>
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

export default MonthlyChart;