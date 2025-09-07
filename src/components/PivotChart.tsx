import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Paper, Typography, ToggleButton, ToggleButtonGroup, Box, Collapse, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { CSVRow, WideFormatData } from '../types';
import { format, parseISO } from 'date-fns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface PivotChartProps {
  rawData: CSVRow[];
  wideData: WideFormatData[];
}

const PivotChart: React.FC<PivotChartProps> = ({ rawData, wideData }) => {
  const [aggregation, setAggregation] = useState<'daily' | 'monthly'>('monthly');
  const [viewType, setViewType] = useState<'plants' | 'companies'>('companies');
  const [showTable, setShowTable] = useState(false);

  const handleAggregationChange = (_: any, newValue: 'daily' | 'monthly' | null) => {
    if (newValue) setAggregation(newValue);
  };

  const handleViewChange = (_: any, newValue: 'plants' | 'companies' | null) => {
    if (newValue) setViewType(newValue);
  };

  const aggregateData = () => {
    const aggregated: { [key: string]: { [plantOrCompany: string]: number } } = {};

    rawData.forEach(row => {
      const date = parseISO(row.datetime);
      const periodKey = aggregation === 'monthly' 
        ? format(date, 'yyyy-MM')
        : format(date, 'yyyy-MM-dd');

      if (!aggregated[periodKey]) {
        aggregated[periodKey] = {};
      }

      if (viewType === 'plants' && row.type !== 'demand') {
        const key = `${row.type}_${row.plant_name}`;
        aggregated[periodKey][key] = (aggregated[periodKey][key] || 0) + row.value;
      } else if (viewType === 'companies' && row.type === 'demand') {
        aggregated[periodKey][row.plant_name] = (aggregated[periodKey][row.plant_name] || 0) + Math.abs(row.value);
      }
    });

    const chartData = Object.entries(aggregated).map(([period, values]) => ({
      period,
      ...values
    }));

    return chartData;
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
          {viewType === 'plants' ? '발전소별' : '기업별'} 전력량 비교
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ToggleButtonGroup
            value={aggregation}
            exclusive
            onChange={handleAggregationChange}
            size="small"
          >
            <ToggleButton value="daily">일별</ToggleButton>
            <ToggleButton value="monthly">월별</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={viewType}
            exclusive
            onChange={handleViewChange}
            size="small"
          >
            <ToggleButton value="plants">발전소</ToggleButton>
            <ToggleButton value="companies">기업</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
      
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" />
          <YAxis label={{ value: '전력량 (kWh)', angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Legend />
          {dataKeys.map((key, index) => (
            <Bar key={key} dataKey={key} stackId="a" fill={colors[index % colors.length]} />
          ))}
        </BarChart>
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
                  <TableCell>{aggregation === 'monthly' ? '월' : '일'}</TableCell>
                  {dataKeys.map(key => (
                    <TableCell key={key} align="right">{key.replace('_', ' ')}</TableCell>
                  ))}
                  <TableCell align="right">합계</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {chartData.map((row, index) => {
                  const total = dataKeys.reduce((sum, key) => sum + ((row as any)[key] || 0), 0);
                  return (
                    <TableRow key={index}>
                      <TableCell>{row.period}</TableCell>
                      {dataKeys.map(key => (
                        <TableCell key={key} align="right">
                          {((row as any)[key] || 0).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
                        </TableCell>
                      ))}
                      <TableCell align="right">
                        {total.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Collapse>
      </Box>
    </Paper>
  );
};

export default PivotChart;