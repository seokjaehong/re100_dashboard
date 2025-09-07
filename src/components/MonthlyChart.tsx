import React, { useState } from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MonthlyData } from '../types';
import { Paper, Typography, Collapse, IconButton, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface MonthlyChartProps {
  data: MonthlyData[];
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ data }) => {
  const [showTable, setShowTable] = useState(false);

  return (
    <Paper sx={{ p: 2, width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        월별 RE100 달성 현황
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis yAxisId="left" label={{ value: '전력량 (kWh)', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'RE100 달성률 (%)', angle: 90, position: 'insideRight' }} />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="totalSupply" fill="#66BB6A" name="총 공급" />
          <Bar yAxisId="left" dataKey="totalDemand" fill="#EF5350" name="총 수요" />
          <Bar yAxisId="left" dataKey="externalPower" fill="#9E9E9E" name="외부전력" />
          <Line yAxisId="right" type="monotone" dataKey="re100Rate" stroke="#FF9800" name="RE100 달성률 (%)" strokeWidth={3} />
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
                  <TableCell align="right">총 공급 (kWh)</TableCell>
                  <TableCell align="right">총 수요 (kWh)</TableCell>
                  <TableCell align="right">외부전력 (kWh)</TableCell>
                  <TableCell align="right">RE100 달성률 (%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.month}</TableCell>
                    <TableCell align="right">{row.totalSupply.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}</TableCell>
                    <TableCell align="right">{row.totalDemand.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}</TableCell>
                    <TableCell align="right">{row.externalPower.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}</TableCell>
                    <TableCell align="right">{row.re100Rate.toFixed(2)}%</TableCell>
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