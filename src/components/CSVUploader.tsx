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
      // 1. 최적화된 데이터 먼저 로드 시도 (빠른 로딩)
      let useOptimized = false;
      try {
        const optimizedResponse = await fetch('/sample_data/optimized_data_2024.json');
        if (optimizedResponse.ok) {
          console.log('최적화된 데이터 사용 (1.7MB)');
          useOptimized = true;
        }
      } catch (e) {
        console.log('최적화된 데이터 없음, 기존 데이터 사용');
      }
      
      // 2. 집계된 JSON 데이터 로드
      const response = await fetch('/sample_data/aggregated_full_year.json');
      if (!response.ok) {
        throw new Error('샘플 데이터를 불러올 수 없습니다.');
      }
      
      const aggregatedData = await response.json();
      
      // 3. CSV 데이터 로드 전략 결정
      let csvUrl = '/sample_data/sample_data_integrated_2024.csv';
      if (useOptimized) {
        // 최적화된 시간별 데이터 사용 (0.39MB vs 35MB)
        csvUrl = '/sample_data/optimized_hourly_2024.csv';
        console.log('최적화된 CSV 사용 (0.39MB vs 35MB)');
      }
      
      // 원본 또는 최적화된 CSV 데이터 로드
      const csvResponse = await fetch(csvUrl);
      if (!csvResponse.ok) {
        throw new Error('CSV 데이터를 불러올 수 없습니다.');
      }
      
      const text = await csvResponse.text();
      
      Papa.parse(text, {
        header: true,
        complete: (results) => {
          try {
            const parsedData = results.data as any[];
            let validData: CSVRow[] = [];
            
            if (useOptimized) {
              // 최적화된 데이터는 이미 집계되어 있으므로 변환 필요
              validData = parsedData
                .filter(row => row.datetime)
                .flatMap(row => {
                  const result: CSVRow[] = [];
                  // 태양광 데이터
                  if (row.total_solar && parseFloat(row.total_solar) > 0) {
                    result.push({
                      datetime: row.datetime,
                      type: 'solar' as const,
                      plant_name: 'aggregated_solar',
                      value: parseFloat(row.total_solar) // 이미 GWh
                    });
                  }
                  // 풍력 데이터
                  if (row.total_wind && parseFloat(row.total_wind) > 0) {
                    result.push({
                      datetime: row.datetime,
                      type: 'wind' as const,
                      plant_name: 'aggregated_wind',
                      value: parseFloat(row.total_wind) // 이미 GWh
                    });
                  }
                  // 수요 데이터
                  if (row.total_demand && parseFloat(row.total_demand) > 0) {
                    result.push({
                      datetime: row.datetime,
                      type: 'demand' as const,
                      plant_name: 'aggregated_demand',
                      value: parseFloat(row.total_demand) // 이미 GWh
                    });
                  }
                  return result;
                });
            } else {
              // 원본 데이터 처리
              validData = parsedData
                .filter(row => row.datetime && row.type && row.plant_name && row.value !== undefined)
                .map(row => ({
                  datetime: row.datetime,
                  type: row.type as 'solar' | 'wind' | 'demand',
                  plant_name: row.plant_name,
                  value: parseFloat(row.value) / 1000000 // kWh to GWh conversion
                }));
            }
            
            if (validData.length === 0) {
              setError('샘플 데이터에 유효한 데이터가 없습니다.');
              return;
            }
            
            console.log(`로드 완료: ${validData.length}개 레코드`);
            
            // 샘플 데이터 로드는 기존 데이터를 대체
            onDataLoaded(validData, aggregatedData, false);
          } catch (err) {
            setError('샘플 데이터 처리 중 오류가 발생했습니다.');
          }
        },
        error: (error: any) => {
          setError(`샘플 데이터 파싱 오류: ${error.message}`);
        }
      });
    } catch (err) {
      setError('샘플 데이터 로드 실패');
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