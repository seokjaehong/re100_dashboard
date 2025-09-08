import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Drawer,
  IconButton,
  CssBaseline,
  ThemeProvider,
  createTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { CSVRow, WideFormatData, ProcessedData, MonthlyData } from './types';
import CSVUploader from './components/CSVUploader';
import TimeSeriesChart from './components/TimeSeriesChart';
import MonthlyChart from './components/MonthlyChart';
import PlantChart from './components/PlantChart';
import PowerGenerationChart from './components/PowerGenerationChart';
import CompanyUsageChart from './components/CompanyUsageChart';
import CompanyDemandChart from './components/CompanyDemandChart';
import SummaryCards from './components/SummaryCards';
import {
  convertToWideFormat,
  processData,
  calculateMonthlyData,
  calculateESSCapacity,
  getUniqueCompanies,
  updateAggregatedData
} from './utils/dataProcessing';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const drawerWidth = 300;

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rawData, setRawData] = useState<CSVRow[]>([]);
  const [wideData, setWideData] = useState<WideFormatData[]>([]);
  const [processedData, setProcessedData] = useState<ProcessedData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [essCapacity, setEssCapacity] = useState<number>(0);
  const [aggregatedData, setAggregatedData] = useState<any>(null);

  const handleDataLoaded = (data: CSVRow[], aggregated?: any, append?: boolean) => {
    let finalData = data;
    
    // append가 true면 기존 데이터에 추가
    if (append && rawData.length > 0) {
      finalData = [...rawData, ...data];
    }
    
    setRawData(finalData);
    
    if (aggregated && !append) {
      // 집계된 데이터 사용 (초기 로드 시에만)
      setAggregatedData(aggregated);
      setProcessedData(aggregated.hourlyJan1 || aggregated.hourlyData || []);
      setMonthlyData(aggregated.monthlyData || []);
      setEssCapacity(aggregated.essCapacity || 0);
      
      // 기업 목록 설정
      const uniqueCompanies = aggregated.companyData ? 
        aggregated.companyData.map((c: any) => c.name) : 
        aggregated.pieData?.companies?.map((c: any) => c.name) || [];
      setCompanies(uniqueCompanies);
    } else {
      // 기존 방식대로 처리 (CSV 추가 시에도 처리)
      const wide = convertToWideFormat(finalData);
      setWideData(wide);
      
      const uniqueCompanies = getUniqueCompanies(finalData);
      setCompanies(uniqueCompanies);
      
      const processed = processData(wide, []);
      setProcessedData(processed);
      setMonthlyData(calculateMonthlyData(processed));
      setEssCapacity(calculateESSCapacity(processed));
      
      // append 모드일 때는 aggregatedData를 재계산
      if (append && aggregatedData) {
        // 기존 aggregatedData를 업데이트 - 새로 추가된 데이터만 전달
        const updatedAggregated = updateAggregatedData(aggregatedData, data);
        setAggregatedData(updatedAggregated);
        // 업데이트된 월별 데이터도 설정
        setMonthlyData(updatedAggregated.monthlyData || []);
      } else if (!append) {
        setAggregatedData(null);
      }
    }
    
    setDrawerOpen(false);
  };


  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex' }}>
        <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={toggleDrawer}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              새만금 산업단지 24/7 RE100 분석 프로그램
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Drawer
          variant="temporary"
          open={drawerOpen}
          onClose={toggleDrawer}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              mt: 8
            },
          }}
        >
          <Box sx={{ p: 2 }}>
            <CSVUploader onDataLoaded={handleDataLoaded} />
          </Box>
        </Drawer>
        
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
          <Container maxWidth="xl">
            {processedData.length > 0 ? (
              <>
                <SummaryCards processedData={processedData} essCapacity={essCapacity} aggregatedData={aggregatedData} />
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: 600 }}>
                    <TimeSeriesChart data={processedData} aggregatedData={aggregatedData} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 600 }}>
                    <MonthlyChart data={monthlyData} />
                  </Box>
                </Box>
                
                {aggregatedData && (
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: 1, minWidth: 500 }}>
                      <PowerGenerationChart aggregatedData={aggregatedData} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 500 }}>
                      <CompanyUsageChart aggregatedData={aggregatedData} />
                    </Box>
                  </Box>
                )}
                
                <PlantChart rawData={rawData} aggregatedData={aggregatedData} />
                
                <Box sx={{ mt: 2 }}>
                  <CompanyDemandChart rawData={rawData} aggregatedData={aggregatedData} />
                </Box>
              </>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                minHeight: '60vh' 
              }}>
                <Typography variant="h5" color="text.secondary" gutterBottom>
                  데이터를 업로드해주세요
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  좌측 메뉴에서 CSV 파일을 업로드하면 모니터링을 시작할 수 있습니다.
                </Typography>
              </Box>
            )}
          </Container>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
