import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Typography, ToggleButton, ToggleButtonGroup, Box, Collapse, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { CSVRow } from '../types';
import { format, parseISO } from 'date-fns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface PlantChartProps {
  rawData: CSVRow[];
}

const PlantChart: React.FC<PlantChartProps> = ({ rawData }) => {
  const [aggregation, setAggregation] = useState<'hourly' | 'monthly'>('hourly');
  const [showTable, setShowTable] = useState(false);

  const handleAggregationChange = (_: any, newValue: 'hourly' | 'monthly' | null) => {
    if (newValue) setAggregation(newValue);
  };

  const aggregateData = () => {
    const aggregated: { [key: string]: { [plantName: string]: number } } = {};
    
    // 발전소만 필터링 (demand 제외)
    const plantData = rawData.filter(row => row.type !== 'demand');

    plantData.forEach(row => {
      const date = parseISO(row.datetime);
      const periodKey = aggregation === 'monthly' 
        ? format(date, 'yyyy-MM')
        : format(date, 'HH:00');

      if (!aggregated[periodKey]) {
        aggregated[periodKey] = {};
      }

      const key = `${row.type}_${row.plant_name}`;
      aggregated[periodKey][key] = (aggregated[periodKey][key] || 0) + row.value;
    });

    const chartData = Object.entries(aggregated).map(([period, values]) => ({
      period,
      ...values
    }));

    return chartData.sort((a, b) => a.period.localeCompare(b.period));
  };

  const chartData = aggregateData();
  const dataKeys = chartData.length > 0 
    ? Object.keys(chartData[0]).filter(key => key !== 'period')
    : [];

  const colors = [
    '#FFA726', '#42A5F5', '#66BB6A', '#EF5350', '#AB47BC',
    '#26C6DA', '#FFA1B5', '#7E57C2', '#FF7043', '#8D6E63'
  ];

  return (
    <Paper sx={{ p: 2, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          발전소별 발전 현황
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
          <YAxis label={{ value: '전력량 (kWh)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          {dataKeys.map((key, index) => (
            <Line 
              key={key} 
              type="monotone" 
              dataKey={key} 
              stroke={colors[index % colors.length]} 
              strokeWidth={2}
              name={key.replace('_', ' ')}
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
                    <TableCell key={key} align="right">{key.replace('_', ' ')}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {chartData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.period}</TableCell>
                    {dataKeys.map(key => (
                      <TableCell key={key} align="right">
                        {((row as any)[key] || 0).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
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