import React, { useRef } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import Papa from 'papaparse';
import { CSVRow } from '../types';

interface CSVUploaderProps {
  onDataLoaded: (data: CSVRow[]) => void;
}

const CSVUploader: React.FC<CSVUploaderProps> = ({ onDataLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string>('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    
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
              value: parseFloat(row.value)
            }));
          
          if (validData.length === 0) {
            setError('유효한 데이터가 없습니다. CSV 형식을 확인해주세요.');
            return;
          }
          
          onDataLoaded(validData);
        } catch (err) {
          setError('CSV 파일 처리 중 오류가 발생했습니다.');
        }
      },
      error: (error) => {
        setError(`파일 읽기 오류: ${error.message}`);
      }
    });
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
      >
        CSV 파일 선택
      </Button>
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default CSVUploader;