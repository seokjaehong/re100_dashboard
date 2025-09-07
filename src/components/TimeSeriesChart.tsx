import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush } from 'recharts';
import { ProcessedData } from '../types';
import { Paper, Typography, Collapse, IconButton, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { format, parseISO } from 'date-fns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface TimeSeriesChartProps {
  data: ProcessedData[];
}

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data }) => {
  const [showTable, setShowTable] = useState(false);

  const formattedData = data.map(item => ({
    ...item,
    time: format(parseISO(item.datetime), 'MM/dd HH:mm')
  }));

  return (
    <Paper sx={{ p: 2, width: '100%' }}>
      <Typography variant="h6" gutterBottom>
        시간대별 RE100 달성 현황
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis yAxisId="left" label={{ value: '전력량 (kWh)', angle: -90, position: 'insideLeft' }} />
          <YAxis yAxisId="right" orientation="right" label={{ value: 'RE100 달성률 (%)', angle: 90, position: 'insideRight' }} />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="solar" stroke="#FFA726" name="태양광" strokeWidth={2} />
          <Line yAxisId="left" type="monotone" dataKey="wind" stroke="#42A5F5" name="풍력" strokeWidth={2} />
          <Line yAxisId="left" type="monotone" dataKey="totalSupply" stroke="#66BB6A" name="총 공급" strokeWidth={2} />
          <Line yAxisId="left" type="monotone" dataKey="demand" stroke="#EF5350" name="수요" strokeWidth={2} />
          <Line yAxisId="right" type="monotone" dataKey="re100Rate" stroke="#9C27B0" name="RE100 달성률 (%)" strokeWidth={2} strokeDasharray="5 5" />
          <Brush dataKey="time" height={30} stroke="#8884d8" />
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
                  <TableCell>시간</TableCell>
                  <TableCell align="right">태양광 (kWh)</TableCell>
                  <TableCell align="right">풍력 (kWh)</TableCell>
                  <TableCell align="right">총 공급 (kWh)</TableCell>
                  <TableCell align="right">수요 (kWh)</TableCell>
                  <TableCell align="right">RE100 달성률 (%)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {formattedData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.time}</TableCell>
                    <TableCell align="right">{row.solar.toFixed(2)}</TableCell>
                    <TableCell align="right">{row.wind.toFixed(2)}</TableCell>
                    <TableCell align="right">{row.totalSupply.toFixed(2)}</TableCell>
                    <TableCell align="right">{row.demand.toFixed(2)}</TableCell>
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

export default TimeSeriesChart;