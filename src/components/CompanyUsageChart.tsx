import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Paper, Typography, Box } from '@mui/material';

interface CompanyUsageChartProps {
  aggregatedData: any;
}

const COLORS = ['#EF5350', '#E91E63', '#AB47BC', '#7E57C2', '#5C6BC0', '#42A5F5', '#29B6F6', '#26A69A', '#66BB6A', '#9CCC65'];

const CompanyUsageChart: React.FC<CompanyUsageChartProps> = ({ aggregatedData }) => {
  const [pieData, setPieData] = useState<any[]>([]);

  useEffect(() => {
    if (!aggregatedData || !aggregatedData.pieData) return;

    const companyData = aggregatedData.pieData.companies || [];
    setPieData(companyData);
  }, [aggregatedData]);

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    
    // 5% 이상인 경우만 라벨 표시
    if (percent < 0.05) return null;
    
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
      <Typography variant="h6" gutterBottom>
        기업별 전력사용량 (Top 10)
      </Typography>
      
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
            height={60}
            formatter={(value: string) => value}
            wrapperStyle={{
              paddingTop: '10px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Top 10 총 사용량: {pieData.reduce((sum, item) => sum + item.value, 0).toFixed(1)} GWh
        </Typography>
      </Box>
    </Paper>
  );
};

export default CompanyUsageChart;