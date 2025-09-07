import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Drawer,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  CssBaseline,
  ThemeProvider,
  createTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { CSVRow, WideFormatData, ProcessedData, MonthlyData } from './types';
import CSVUploader from './components/CSVUploader';
import TimeSeriesChart from './components/TimeSeriesChart';
import MonthlyChart from './components/MonthlyChart';
import PivotChart from './components/PivotChart';
import PlantChart from './components/PlantChart';
import SummaryCards from './components/SummaryCards';
import {
  convertToWideFormat,
  processData,
  calculateMonthlyData,
  calculateESSCapacity,
  getUniqueCompanies
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
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [essCapacity, setEssCapacity] = useState<number>(0);

  const handleDataLoaded = (data: CSVRow[]) => {
    setRawData(data);
    const wide = convertToWideFormat(data);
    setWideData(wide);
    
    const uniqueCompanies = getUniqueCompanies(data);
    setCompanies(uniqueCompanies);
    
    const processed = processData(wide, []);
    setProcessedData(processed);
    setMonthlyData(calculateMonthlyData(processed));
    setEssCapacity(calculateESSCapacity(processed));
    
    setDrawerOpen(false);
  };

  const handleCompanyChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const selected = typeof value === 'string' ? value.split(',') : value;
    setSelectedCompanies(selected);
    
    const processed = processData(wideData, selected);
    setProcessedData(processed);
    setMonthlyData(calculateMonthlyData(processed));
    setEssCapacity(calculateESSCapacity(processed));
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
              새만금 산업단지 24/7 RE100 모니터링 시스템
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
            
            {companies.length > 0 && (
              <FormControl fullWidth sx={{ mt: 3 }}>
                <InputLabel>기업 선택</InputLabel>
                <Select
                  multiple
                  value={selectedCompanies}
                  onChange={handleCompanyChange}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {companies.map((company) => (
                    <MenuItem key={company} value={company}>
                      {company}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </Drawer>
        
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
          <Container maxWidth="xl">
            {processedData.length > 0 ? (
              <>
                <SummaryCards processedData={processedData} essCapacity={essCapacity} />
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: 600 }}>
                    <TimeSeriesChart data={processedData} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 600 }}>
                    <MonthlyChart data={monthlyData} />
                  </Box>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <PivotChart rawData={rawData} wideData={wideData} />
                </Box>
                
                <PlantChart rawData={rawData} />
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
