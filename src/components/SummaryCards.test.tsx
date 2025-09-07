import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SummaryCards from './SummaryCards';
import { ProcessedData } from '../types';

describe('SummaryCards', () => {
  const mockData: ProcessedData[] = [
    {
      datetime: '2025-03-01 00:00',
      solar: 200,
      wind: 200,
      totalSupply: 400,
      demand: 350,
      externalPower: 0,
      re100Rate: 100,
    },
    {
      datetime: '2025-03-01 01:00',
      solar: 170,
      wind: 180,
      totalSupply: 350,
      demand: 320,
      externalPower: 0,
      re100Rate: 100,
    },
  ];

  it('renders all summary cards', () => {
    render(<SummaryCards processedData={mockData} essCapacity={50} />);
    
    expect(screen.getByText('태양광 발전')).toBeInTheDocument();
    expect(screen.getByText('풍력 발전')).toBeInTheDocument();
    expect(screen.getByText('총 공급량')).toBeInTheDocument();
    expect(screen.getByText('총 수요량')).toBeInTheDocument();
    expect(screen.getByText('RE100 달성률')).toBeInTheDocument();
    expect(screen.getByText('ESS 필요 용량')).toBeInTheDocument();
  });

  it('calculates and displays correct totals', () => {
    render(<SummaryCards processedData={mockData} essCapacity={50} />);
    
    // Total solar: 200 + 170 = 370
    expect(screen.getByText('370 kWh')).toBeInTheDocument();
    
    // Total wind: 200 + 180 = 380
    expect(screen.getByText('380 kWh')).toBeInTheDocument();
    
    // Total supply: 400 + 350 = 750
    expect(screen.getByText('750 kWh')).toBeInTheDocument();
    
    // Total demand: 350 + 320 = 670
    expect(screen.getByText('670 kWh')).toBeInTheDocument();
  });

  it('displays ESS capacity', () => {
    render(<SummaryCards processedData={mockData} essCapacity={150} />);
    
    expect(screen.getByText('150 kWh')).toBeInTheDocument();
    expect(screen.getByText(/공급과 수요의 불균형을 ESS로 보완할 수 있습니다/)).toBeInTheDocument();
  });

  it('calculates RE100 rates correctly', () => {
    render(<SummaryCards processedData={mockData} essCapacity={50} />);
    
    // Both current and average should be 100%
    expect(screen.getByText('현재 달성률')).toBeInTheDocument();
    expect(screen.getByText('평균 달성률')).toBeInTheDocument();
    // Check for percentage values
    const percentElements = screen.getAllByText(/100\.0%/);
    expect(percentElements.length).toBeGreaterThan(0);
  });

  it('handles empty data', () => {
    render(<SummaryCards processedData={[]} essCapacity={0} />);
    
    // There are multiple "0 kWh" elements, check for at least one
    const zeroElements = screen.getAllByText('0 kWh');
    expect(zeroElements.length).toBeGreaterThan(0);
    
    // Check for percentage elements
    const percentElements = screen.getAllByText('0.0%');
    expect(percentElements.length).toBeGreaterThan(0);
  });

  it('renders LinearProgress component', () => {
    const { container } = render(<SummaryCards processedData={mockData} essCapacity={50} />);
    const progressBar = container.querySelector('.MuiLinearProgress-root');
    expect(progressBar).toBeInTheDocument();
  });

  it('displays ESS explanation text', () => {
    render(<SummaryCards processedData={mockData} essCapacity={100} />);
    
    expect(screen.getByText(/부족한 부분의 최대값이 곧 ESS의 필요 용량이 됩니다/)).toBeInTheDocument();
    expect(screen.getByText(/ESS 용량 = 공급 < 수요 시의 최대 부족분/)).toBeInTheDocument();
  });
});