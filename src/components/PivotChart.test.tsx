import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import PivotChart from './PivotChart';
import { CSVRow, WideFormatData } from '../types';

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

describe('PivotChart', () => {
  const mockRawData: CSVRow[] = [
    { datetime: '2025-03-01 00:00', type: 'solar', plant_name: 'solar_plant1', value: 120 },
    { datetime: '2025-03-01 00:00', type: 'solar', plant_name: 'solar_plant2', value: 80 },
    { datetime: '2025-03-01 00:00', type: 'wind', plant_name: 'wind_plant1', value: 200 },
    { datetime: '2025-03-01 00:00', type: 'demand', plant_name: 'compA', value: 250 },
    { datetime: '2025-03-01 00:00', type: 'demand', plant_name: 'compB', value: 100 },
  ];

  const mockWideData: WideFormatData[] = [
    {
      datetime: '2025-03-01 00:00',
      solar_solar_plant1: 120,
      solar_solar_plant2: 80,
      wind_wind_plant1: 200,
      compA: 250,
      compB: 100,
    },
  ];

  it('renders chart title with default view', () => {
    render(<PivotChart rawData={mockRawData} wideData={mockWideData} />);
    expect(screen.getByText('발전소별 전력량 비교')).toBeInTheDocument();
  });

  it('renders toggle buttons', () => {
    render(<PivotChart rawData={mockRawData} wideData={mockWideData} />);
    
    expect(screen.getByRole('button', { name: '일별' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '월별' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '발전소' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '기업' })).toBeInTheDocument();
  });

  it('toggles between daily and monthly aggregation', () => {
    render(<PivotChart rawData={mockRawData} wideData={mockWideData} />);
    
    const dailyButton = screen.getByRole('button', { name: '일별' });
    const monthlyButton = screen.getByRole('button', { name: '월별' });
    
    // Click daily
    fireEvent.click(dailyButton);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    
    // Click monthly
    fireEvent.click(monthlyButton);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('toggles between plants and companies view', () => {
    render(<PivotChart rawData={mockRawData} wideData={mockWideData} />);
    
    const plantsButton = screen.getByRole('button', { name: '발전소' });
    const companiesButton = screen.getByRole('button', { name: '기업' });
    
    // Click companies
    fireEvent.click(companiesButton);
    expect(screen.getByText('기업별 전력량 비교')).toBeInTheDocument();
    
    // Click plants
    fireEvent.click(plantsButton);
    expect(screen.getByText('발전소별 전력량 비교')).toBeInTheDocument();
  });

  it('renders bar chart component', () => {
    render(<PivotChart rawData={mockRawData} wideData={mockWideData} />);
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('handles empty data', () => {
    render(<PivotChart rawData={[]} wideData={[]} />);
    expect(screen.getByText('발전소별 전력량 비교')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });
});