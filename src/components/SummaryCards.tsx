import React from 'react';
import { Card, CardContent, Typography, Box, LinearProgress, Tooltip } from '@mui/material';
import { ProcessedData } from '../types';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import SolarPowerIcon from '@mui/icons-material/SolarPower';
import AirIcon from '@mui/icons-material/Air';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface SummaryCardsProps {
  processedData: ProcessedData[];
  essCapacity: number;
  aggregatedData?: any;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ processedData, essCapacity, aggregatedData }) => {
  const calculateSummary = () => {
    // aggregatedData가 있으면 연간 데이터 사용, 없으면 processedData 사용
    if (aggregatedData && aggregatedData.summary) {
      return {
        totalSolar: aggregatedData.summary.totalSolar || 0,
        totalWind: aggregatedData.summary.totalWind || 0,
        totalSupply: (aggregatedData.summary.totalSolar || 0) + (aggregatedData.summary.totalWind || 0),
        totalDemand: aggregatedData.summary.totalDemand || 0,
        avgRE100Rate: aggregatedData.summary.avgRE100Rate || 0,
        currentRE100Rate: processedData.length > 0 ? processedData[processedData.length - 1].re100Rate : 0
      };
    }
    
    // 기존 로직 (fallback)
    if (processedData.length === 0) {
      return {
        totalSolar: 0,
        totalWind: 0,
        totalSupply: 0,
        totalDemand: 0,
        avgRE100Rate: 0,
        currentRE100Rate: 0
      };
    }

    const totalSolar = processedData.reduce((sum, d) => sum + d.solar, 0);
    const totalWind = processedData.reduce((sum, d) => sum + d.wind, 0);
    const totalSupply = processedData.reduce((sum, d) => sum + d.totalSupply, 0);
    const totalDemand = processedData.reduce((sum, d) => sum + d.demand, 0);
    const avgRE100Rate = processedData.reduce((sum, d) => sum + d.re100Rate, 0) / processedData.length;
    const currentRE100Rate = processedData[processedData.length - 1].re100Rate;

    return {
      totalSolar,
      totalWind,
      totalSupply,
      totalDemand,
      avgRE100Rate,
      currentRE100Rate
    };
  };

  const summary = calculateSummary();

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flex: '1 1 calc(25% - 16px)', minWidth: 200 }}>
          <Card sx={{ background: 'linear-gradient(135deg, #FFA726 30%, #FFB74D 90%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SolarPowerIcon sx={{ color: 'white', mr: 1 }} />
                <Typography variant="h6" sx={{ color: 'white' }}>
                  태양광 발전
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                {summary.totalSolar.toLocaleString('ko-KR', { maximumFractionDigits: 1 })} GWh
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 calc(25% - 16px)', minWidth: 200 }}>
          <Card sx={{ background: 'linear-gradient(135deg, #42A5F5 30%, #64B5F6 90%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AirIcon sx={{ color: 'white', mr: 1 }} />
                <Typography variant="h6" sx={{ color: 'white' }}>
                  풍력 발전
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                {summary.totalWind.toLocaleString('ko-KR', { maximumFractionDigits: 1 })} GWh
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 calc(25% - 16px)', minWidth: 200 }}>
          <Card sx={{ background: 'linear-gradient(135deg, #66BB6A 30%, #81C784 90%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ElectricBoltIcon sx={{ color: 'white', mr: 1 }} />
                <Typography variant="h6" sx={{ color: 'white' }}>
                  총 공급량
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                {summary.totalSupply.toLocaleString('ko-KR', { maximumFractionDigits: 1 })} GWh
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 calc(25% - 16px)', minWidth: 200 }}>
          <Card sx={{ background: 'linear-gradient(135deg, #EF5350 30%, #E57373 90%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ color: 'white', mr: 1 }} />
                <Typography variant="h6" sx={{ color: 'white' }}>
                  총 수요량
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                {summary.totalDemand.toLocaleString('ko-KR', { maximumFractionDigits: 1 })} GWh
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 calc(50% - 16px)', minWidth: 400 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                RE100 달성률
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      현재 달성률
                    </Typography>
                    <Tooltip title="가장 최근 시간대의 재생에너지 공급량을 전력 수요량으로 나눈 비율" arrow>
                      <HelpOutlineIcon sx={{ fontSize: 14, ml: 0.5, color: 'text.secondary' }} />
                    </Tooltip>
                  </Box>
                  <Typography variant="h4" color="primary">
                    {summary.currentRE100Rate.toFixed(1)}%
                  </Typography>
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      평균 달성률
                    </Typography>
                    <Tooltip title="전체 기간 동안의 재생에너지 총 공급량을 총 전력 수요량으로 나눈 평균 비율" arrow>
                      <HelpOutlineIcon sx={{ fontSize: 14, ml: 0.5, color: 'text.secondary' }} />
                    </Tooltip>
                  </Box>
                  <Typography variant="h4">
                    {summary.avgRE100Rate.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(summary.avgRE100Rate, 100)} 
                sx={{ height: 10, borderRadius: 5 }}
              />
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: '1 1 calc(50% - 16px)', minWidth: 400 }}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #7E57C2 30%, #9575CD 90%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BatteryChargingFullIcon sx={{ fontSize: 40, mr: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                  ESS 추천 용량
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ mb: 2, fontWeight: 'bold' }}>
                {essCapacity.toLocaleString('ko-KR', { maximumFractionDigits: 1 })} GWh
              </Typography>
              <Typography variant="body1">
                공급과 수요의 불균형을 ESS로 보완할 수 있습니다.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                부족한 부분의 최대값이 곧 ESS의 필요 용량이 됩니다.
                (ESS 용량 = 공급 {'<'} 수요 시의 최대 부족분)
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default SummaryCards;