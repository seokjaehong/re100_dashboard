import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CSVUploader from './CSVUploader';
import Papa from 'papaparse';

jest.mock('papaparse');

describe('CSVUploader', () => {
  const mockOnDataLoaded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload button and instructions', () => {
    render(<CSVUploader onDataLoaded={mockOnDataLoaded} />);
    
    expect(screen.getByText('CSV 데이터 업로드')).toBeInTheDocument();
    expect(screen.getByText(/datetime, type, plant_name, value 형식의 CSV 파일을 업로드하세요/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /CSV 파일 선택/i })).toBeInTheDocument();
  });

  it('handles file upload successfully', async () => {
    const mockData = [
      { datetime: '2025-03-01 00:00', type: 'solar', plant_name: 'solar_plant1', value: '120' },
      { datetime: '2025-03-01 00:00', type: 'wind', plant_name: 'wind_plant1', value: '200' },
    ];

    (Papa.parse as jest.Mock).mockImplementation((file, config) => {
      config.complete({ data: mockData });
    });

    render(<CSVUploader onDataLoaded={mockOnDataLoaded} />);
    
    const input = document.createElement('input');
    input.type = 'file';
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    const uploadButton = screen.getByRole('button', { name: /CSV 파일 선택/i });
    
    // Simulate file selection
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });
        fireEvent.change(fileInput);
      }
    });

    await waitFor(() => {
      expect(mockOnDataLoaded).toHaveBeenCalledWith([
        { datetime: '2025-03-01 00:00', type: 'solar', plant_name: 'solar_plant1', value: 120 },
        { datetime: '2025-03-01 00:00', type: 'wind', plant_name: 'wind_plant1', value: 200 },
      ]);
    });
  });

  it('shows error when CSV has invalid data', async () => {
    const mockData = [
      { invalid: 'data' },
    ];

    (Papa.parse as jest.Mock).mockImplementation((file, config) => {
      config.complete({ data: mockData });
    });

    render(<CSVUploader onDataLoaded={mockOnDataLoaded} />);
    
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    
    await waitFor(() => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });
        fireEvent.change(fileInput);
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/유효한 데이터가 없습니다/)).toBeInTheDocument();
    });
    
    expect(mockOnDataLoaded).not.toHaveBeenCalled();
  });

  it('handles parse error', async () => {
    (Papa.parse as jest.Mock).mockImplementation((file, config) => {
      config.error({ message: 'Parse error' });
    });

    render(<CSVUploader onDataLoaded={mockOnDataLoaded} />);
    
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    
    await waitFor(() => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });
        fireEvent.change(fileInput);
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/파일 읽기 오류: Parse error/)).toBeInTheDocument();
    });
    
    expect(mockOnDataLoaded).not.toHaveBeenCalled();
  });

  it('filters out invalid rows', async () => {
    const mockData = [
      { datetime: '2025-03-01 00:00', type: 'solar', plant_name: 'solar_plant1', value: '120' },
      { datetime: null, type: 'wind', plant_name: 'wind_plant1', value: '200' }, // Invalid
      { datetime: '2025-03-01 00:00', type: 'demand', plant_name: 'compA', value: '250' },
    ];

    (Papa.parse as jest.Mock).mockImplementation((file, config) => {
      config.complete({ data: mockData });
    });

    render(<CSVUploader onDataLoaded={mockOnDataLoaded} />);
    
    const file = new File(['test'], 'test.csv', { type: 'text/csv' });
    
    await waitFor(() => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        Object.defineProperty(fileInput, 'files', {
          value: [file],
          writable: false,
        });
        fireEvent.change(fileInput);
      }
    });

    await waitFor(() => {
      expect(mockOnDataLoaded).toHaveBeenCalledWith([
        { datetime: '2025-03-01 00:00', type: 'solar', plant_name: 'solar_plant1', value: 120 },
        { datetime: '2025-03-01 00:00', type: 'demand', plant_name: 'compA', value: 250 },
      ]);
    });
  });
});