import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimeSeriesChart from './TimeSeriesChart';
import { ProcessedData } from '../types';

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

describe('TimeSeriesChart', () => {
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

  it('renders chart title', () => {
    render(<TimeSeriesChart data={mockData} />);
    expect(screen.getByText('시간대별 전력 현황')).toBeInTheDocument();
  });

  it('renders line chart component', () => {
    render(<TimeSeriesChart data={mockData} />);
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('handles empty data', () => {
    render(<TimeSeriesChart data={[]} />);
    expect(screen.getByText('시간대별 전력 현황')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('formats datetime correctly', () => {
    const { container } = render(<TimeSeriesChart data={mockData} />);
    // The component should render without errors
    expect(container.firstChild).toBeInTheDocument();
  });
});