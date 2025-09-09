import React, { useRef, useState } from 'react';
import { Button, Box, Typography, Alert, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import Papa from 'papaparse';
import { CSVRow } from '../types';

interface CSVUploaderProps {
  onDataLoaded: (data: CSVRow[], aggregated?: any, append?: boolean) => void;
}

const CSVUploader: React.FC<CSVUploaderProps> = ({ onDataLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<CSVRow[] | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setFileName(file.name);
    
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        try {
          const parsedData = results.data as any[];
          const validData: CSVRow[] = parsedData
            .filter(row => row.datetime && row.type && row.plant_name && row.value !== undefined)
            .map(row => ({
              datetime: row.datetime,
              type: row.type as 'solar' | 'wind' | 'demand',
              plant_name: row.plant_name,
              value: parseFloat(row.value) / 1000000 // kWh to GWh conversion
            }));
          
          if (validData.length === 0) {
            setError('유효한 데이터가 없습니다. CSV 형식을 확인해주세요.');
            return;
          }
          
          // 파싱된 데이터를 임시 저장하고 확인 다이얼로그 표시
          setPendingData(validData);
          setConfirmDialog(true);
        } catch (err) {
          setError('CSV 파일 처리 중 오류가 발생했습니다.');
        }
      },
      error: (error) => {
        setError(`파일 읽기 오류: ${error.message}`);
      }
    });
    
    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirm = () => {
    if (pendingData) {
      // CSV 파일 선택은 기존 데이터에 추가
      onDataLoaded(pendingData, undefined, true);
      setPendingData(null);
    }
    setConfirmDialog(false);
  };

  const handleCancel = () => {
    setPendingData(null);
    setConfirmDialog(false);
  };

  const loadSampleData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // 1. plant_list.csv 읽기
      const plantListResponse = await fetch('/sample_data/plant_list.csv');
      if (!plantListResponse.ok) {
        throw new Error('plant_list.csv를 불러올 수 없습니다.');
      }
      
      const plantListText = await plantListResponse.text();
      const plantListResults = Papa.parse(plantListText, { header: true });
      const plantList = plantListResults.data as any[];
      
      // 2. 각 공급 데이터 파일 읽기
      let allSupplyData: CSVRow[] = [];
      
      console.log('Plant list:', plantList);
      
      for (const plant of plantList) {
        if (!plant.filename) continue;
        
        console.log(`Loading ${plant.filename}...`);
        
        try {
          const supplyResponse = await fetch(`/sample_data/${plant.filename}`);
          if (supplyResponse.ok) {
            const supplyText = await supplyResponse.text();
            const supplyResults = Papa.parse(supplyText, { header: true });
            const supplyData = supplyResults.data as any[];
            
            console.log(`Parsed ${plant.filename}: ${supplyData.length} rows`);
            
            const validSupplyData = supplyData
              .filter(row => row.datetime && row.type && row.plant_name && row.value !== undefined)
              .map(row => ({
                datetime: row.datetime,
                type: row.type as 'solar' | 'wind',
                plant_name: row.plant_name,
                value: parseFloat(row.value) / 1000000 // kWh to GWh conversion (원본 값 사용)
              }));
            
            allSupplyData = [...allSupplyData, ...validSupplyData];
            console.log(`${plant.filename} 로드 완료: ${validSupplyData.length}개 레코드`);
          } else {
            console.error(`${plant.filename} 로드 실패: HTTP ${supplyResponse.status}`);
          }
        } catch (err) {
          console.error(`${plant.filename} 로드 실패:`, err);
        }
      }
      
      // 3. 수요 데이터 읽기
      console.log('Loading demand data...');
      const demandResponse = await fetch('/sample_data/sample_data_integrated_2024_integrated.csv');
      if (!demandResponse.ok) {
        throw new Error('수요 데이터를 불러올 수 없습니다.');
      }
      
      const demandText = await demandResponse.text();
      const demandResults = Papa.parse(demandText, { header: true });
      const demandData = demandResults.data as any[];
      
      console.log(`Parsed demand data: ${demandData.length} rows`);
      if (demandData.length > 0) {
        console.log('First demand row:', demandData[0]);
      }
      
      const validDemandData = demandData
        .filter(row => row.datetime && row.type === 'demand' && row.plant_name && row.value !== undefined)
        .map(row => ({
          datetime: row.datetime,
          type: 'demand' as const,
          plant_name: row.plant_name,
          value: parseFloat(row.value) / 1000000 // kWh to GWh conversion (원본 값 사용)
        }));
      
      console.log(`수요 데이터 로드 완료: ${validDemandData.length}개 레코드`);
      
      // 4. 모든 데이터 합치기
      const allData = [...allSupplyData, ...validDemandData];
      
      if (allData.length === 0) {
        setError('유효한 데이터가 없습니다.');
        return;
      }
      
      console.log(`전체 로드 완료: ${allData.length}개 레코드`);
      
      // 집계된 월별 데이터 로드 (10% 적용된 데이터)
      try {
        const monthlyResponse = await fetch('/agg_data/monthly_aggregated_original.json');
        let aggregatedData = undefined;
        
        if (monthlyResponse.ok) {
          const monthlyAggregated = await monthlyResponse.json();
          
          // 월별 차트용 데이터 생성
          const monthlyData = [];
          for (let month = 1; month <= 12; month++) {
            const monthKey = `2024-${month.toString().padStart(2, '0')}`;
            const monthLabel = `${month}월`;
            
            const totalSolar = monthlyAggregated.solar?.total?.[monthKey] || 0; // 이미 10% 적용됨
            const totalWind = monthlyAggregated.wind?.total?.[monthKey] || 0; // 이미 10% 적용됨
            const totalDemand = monthlyAggregated.demand?.[monthKey] || 0; // 이미 10% 적용됨
            // Recalculate RE100 rate with adjusted values
            const re100Rate = totalDemand > 0 ? Math.min(((totalSolar + totalWind) / totalDemand) * 100, 100) : 0;
            
            monthlyData.push({
              month: monthLabel,
              monthLabel: monthLabel,
              totalSupply: totalSolar + totalWind,
              totalSolar: totalSolar,
              totalWind: totalWind,
              totalDemand: totalDemand,
              negativeDemand: -totalDemand,
              re100Rate: re100Rate,
              externalPower: Math.max(0, totalDemand - (totalSolar + totalWind))
            });
          }
          
          // ESS 용량 계산 (간단 예시)
          const essCapacity = Math.max(...monthlyData.map((m: any) => m.externalPower));
          
          // 기업별 월별 데이터 로드 (10% 적용된 데이터)
          let companyMonthlyData = [];
          try {
            const companyMonthlyResponse = await fetch('/agg_data/company_monthly_aggregated_original.json');
            if (companyMonthlyResponse.ok) {
              const companyMonthly = await companyMonthlyResponse.json();
              // 플랫 형식으로 변환 (원본 값 사용)
              for (const [company, monthData] of Object.entries(companyMonthly)) {
                if (company === 'total') continue; // total 제외
                for (const [monthKey, value] of Object.entries(monthData as any)) {
                  const monthNum = parseInt(monthKey.split('-')[1]);
                  companyMonthlyData.push({
                    company: company,
                    month: `${monthNum}월`,
                    value: value as number // 원본 값 사용
                  });
                }
              }
            }
          } catch (err) {
            console.log('기업별 월별 데이터 로드 실패:', err);
          }
          
          // pieData 생성 - 발전소별 및 기업별 데이터
          const solarPlants = [];
          const windPlants = [];
          const companies = [];
          
          // 발전소별 연간 총 발전량 계산
          if (monthlyAggregated.solar) {
            for (const [plantName, plantData] of Object.entries(monthlyAggregated.solar)) {
              if (plantName !== 'total' && typeof plantData === 'object') {
                const totalValue = Object.values(plantData as any).reduce((sum: number, val: any) => sum + val, 0);
                solarPlants.push({ name: plantName, value: totalValue });
              }
            }
          }
          
          if (monthlyAggregated.wind) {
            for (const [plantName, plantData] of Object.entries(monthlyAggregated.wind)) {
              if (plantName !== 'total' && typeof plantData === 'object') {
                const totalValue = Object.values(plantData as any).reduce((sum: number, val: any) => sum + val, 0);
                windPlants.push({ name: plantName, value: totalValue });
              }
            }
          }
          
          // 기업별 연간 총 사용량 계산 (Top 10)
          const companyTotals: { [key: string]: number } = {};
          companyMonthlyData.forEach((item: any) => {
            if (!companyTotals[item.company]) {
              companyTotals[item.company] = 0;
            }
            companyTotals[item.company] += item.value;
          });
          
          // 상위 10개 기업 선택
          const sortedCompanies = Object.entries(companyTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, value]) => ({ name, value }));
          
          aggregatedData = {
            monthlyData: monthlyData,
            hourlyData: [], // 빈 배열로 설정 (실제 데이터는 allData에서 처리)
            essCapacity: essCapacity,
            companyMonthly: companyMonthlyData,
            solar: monthlyAggregated.solar,
            wind: monthlyAggregated.wind,
            pieData: {
              solar_plants: solarPlants,
              wind_plants: windPlants,
              companies: sortedCompanies
            },
            summary: {
              totalSolar: Object.values(monthlyAggregated.solar?.total || {}).reduce((a: number, b: any) => a + b, 0), // 원본 값 사용
              totalWind: Object.values(monthlyAggregated.wind?.total || {}).reduce((a: number, b: any) => a + b, 0), // 원본 값 사용
              totalDemand: Object.values(monthlyAggregated.demand || {}).reduce((a: number, b: any) => a + b, 0), // 원본 값 사용
              avgRE100Rate: monthlyData.reduce((sum: number, m: any) => sum + m.re100Rate, 0) / monthlyData.length
            }
          };
          
          console.log('CSVUploader - Company monthly data loaded:', companyMonthlyData.length, 'entries');
          console.log('CSVUploader - Sample company data:', companyMonthlyData.slice(0, 3));
          console.log('CSVUploader - PieData created:', {
            solarPlants: solarPlants.length,
            windPlants: windPlants.length,
            companies: sortedCompanies.length
          });
          console.log('CSVUploader - Total solar:', solarPlants.reduce((sum: any, p: any) => sum + p.value, 0).toFixed(2), 'GWh');
          console.log('CSVUploader - Total wind:', windPlants.reduce((sum: any, p: any) => sum + p.value, 0).toFixed(2), 'GWh');
          console.log('CSVUploader - Top company:', sortedCompanies[0]);
        }
        
        // 샘플 데이터 로드는 기존 데이터를 대체
        onDataLoaded(allData, aggregatedData, false);
      } catch (aggErr) {
        console.error('집계 데이터 로드 실패:', aggErr);
        // 집계 데이터 없이 원본 데이터만 로드
        onDataLoaded(allData, undefined, false);
      }
    } catch (err) {
      setError('샘플 데이터 로드 실패: ' + (err as Error).message);
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        CSV 데이터 업로드
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        datetime, type, plant_name, value 형식의 CSV 파일을 업로드하세요.
      </Typography>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      <Button
        variant="contained"
        startIcon={<CloudUploadIcon />}
        onClick={handleButtonClick}
        fullWidth
        sx={{ mb: 2 }}
      >
        CSV 파일 선택
      </Button>
      <Button
        variant="outlined"
        startIcon={loading ? <CircularProgress size={20} /> : <PlayCircleOutlineIcon />}
        onClick={loadSampleData}
        fullWidth
        disabled={loading}
      >
        {loading ? '로딩 중...' : '샘플 데이터 로드'}
      </Button>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      <Dialog
        open={confirmDialog}
        onClose={handleCancel}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">
          데이터 추가 확인
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            {fileName} 파일의 데이터를 기존 데이터에 추가하시겠습니까?
            {pendingData && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  • 데이터 개수: {pendingData.length.toLocaleString()}개
                </Typography>
                {pendingData.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    • 데이터 유형: {pendingData[0].type === 'demand' ? '수요' : pendingData[0].type === 'solar' ? '태양광' : '풍력'}
                  </Typography>
                )}
                {pendingData.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    • 기업/발전소: {pendingData[0].plant_name}
                  </Typography>
                )}
              </Box>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="secondary">
            취소
          </Button>
          <Button onClick={handleConfirm} variant="contained" autoFocus>
            반영
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CSVUploader;