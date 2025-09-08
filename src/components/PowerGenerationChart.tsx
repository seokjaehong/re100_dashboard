import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Paper, Typography, Box, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Stack } from '@mui/material';

interface PowerGenerationChartProps {
  aggregatedData: any;
}

const COLORS = ['#FFA726', '#FF7043', '#FFCA28', '#42A5F5', '#29B6F6', '#26C6DA'];

const PowerGenerationChart: React.FC<PowerGenerationChartProps> = ({ aggregatedData }) => {
  const [timeFilter, setTimeFilter] = useState<string>('total');
  const [pieData, setPieData] = useState<any[]>([]);

  useEffect(() => {
    if (!aggregatedData || !aggregatedData.pieData) return;

    let solarData = aggregatedData.pieData.solar_plants || [];
    let windData = aggregatedData.pieData.wind_plants || [];
    
    // 태양광과 풍력 데이터 합치기
    const combinedData = [
      ...solarData.map((item: any) => ({ ...item, type: 'solar' })),
      ...windData.map((item: any) => ({ ...item, type: 'wind' }))
    ];

    setPieData(combinedData);
  }, [aggregatedData, timeFilter]);

  const handleTimeFilterChange = (event: SelectChangeEvent) => {
    setTimeFilter(event.target.value);
  };

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <Paper sx={{ p: 2, width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h6">
          발전소별 발전량 (월별)
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>기간</InputLabel>
          <Select value={timeFilter} onChange={handleTimeFilterChange}>
            <MenuItem value="total">전체</MenuItem>
            <MenuItem value="monthly">월별</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => `${value.toFixed(2)} GWh`}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value: string) => value}
          />
        </PieChart>
      </ResponsiveContainer>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          총 발전량: {pieData.reduce((sum, item) => sum + item.value, 0).toFixed(1)} GWh
        </Typography>
      </Box>
    </Paper>
  );
};

export default PowerGenerationChart;