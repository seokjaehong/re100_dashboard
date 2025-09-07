import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MonthlyChart from './MonthlyChart';
import { MonthlyData } from '../types';

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  Bar: () => <div />,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

describe('MonthlyChart', () => {
  const mockData: MonthlyData[] = [
    {
      month: '2025-03',
      totalSupply: 750,
      totalDemand: 670,
      externalPower: 0,
      re100Rate: 100,
    },
    {
      month: '2025-04',
      totalSupply: 800,
      totalDemand: 700,
      externalPower: 0,
      re100Rate: 100,
    },
  ];

  it('renders chart title', () => {
    render(<MonthlyChart data={mockData} />);
    expect(screen.getByText('월별 RE100 달성 현황')).toBeInTheDocument();
  });

  it('renders composed chart component', () => {
    render(<MonthlyChart data={mockData} />);
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });

  it('handles empty data', () => {
    render(<MonthlyChart data={[]} />);
    expect(screen.getByText('월별 RE100 달성 현황')).toBeInTheDocument();
    expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
  });
});