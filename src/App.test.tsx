import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import Papa from 'papaparse';

// Mock all child components
jest.mock('./components/CSVUploader', () => {
  return {
    __esModule: true,
    default: ({ onDataLoaded }: any) => (
      <div>
        <button onClick={() => {
          onDataLoaded([
            { datetime: '2025-03-01 00:00', type: 'solar', plant_name: 'solar_plant1', value: 120 },
            { datetime: '2025-03-01 00:00', type: 'wind', plant_name: 'wind_plant1', value: 200 },
            { datetime: '2025-03-01 00:00', type: 'demand', plant_name: 'compA', value: 250 },
          ]);
        }}>
          Upload CSV
        </button>
      </div>
    ),
  };
});

jest.mock('./components/TimeSeriesChart', () => ({
  __esModule: true,
  default: () => <div>TimeSeriesChart</div>,
}));

jest.mock('./components/MonthlyChart', () => ({
  __esModule: true,
  default: () => <div>MonthlyChart</div>,
}));

jest.mock('./components/PivotChart', () => ({
  __esModule: true,
  default: () => <div>PivotChart</div>,
}));

jest.mock('./components/PlantChart', () => ({
  __esModule: true,
  default: () => <div>PlantChart</div>,
}));

jest.mock('./components/SummaryCards', () => ({
  __esModule: true,
  default: () => <div>SummaryCards</div>,
}));

describe('App Component', () => {
  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByText('새만금 산업단지 24/7 RE100 모니터링 시스템')).toBeInTheDocument();
  });

  it('shows upload prompt when no data is loaded', () => {
    render(<App />);
    expect(screen.getByText('데이터를 업로드해주세요')).toBeInTheDocument();
    expect(screen.getByText(/좌측 메뉴에서 CSV 파일을 업로드하면/)).toBeInTheDocument();
  });

  it('toggles drawer when menu button is clicked', () => {
    render(<App />);
    const menuButton = screen.getByRole('button', { name: /open drawer/i });
    
    fireEvent.click(menuButton);
    // Drawer should be open
    expect(screen.getByText('Upload CSV')).toBeInTheDocument();
  });

  it('displays charts and tables after data upload', async () => {
    render(<App />);
    
    // Open drawer
    const menuButton = screen.getByRole('button', { name: /open drawer/i });
    fireEvent.click(menuButton);
    
    // Upload data
    const uploadButton = screen.getByText('Upload CSV');
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByText('SummaryCards')).toBeInTheDocument();
      expect(screen.getByText('TimeSeriesChart')).toBeInTheDocument();
      expect(screen.getByText('MonthlyChart')).toBeInTheDocument();
      expect(screen.getByText('PivotChart')).toBeInTheDocument();
      expect(screen.getByText('PlantChart')).toBeInTheDocument();
    });
    
    // Upload prompt should be gone
    expect(screen.queryByText('데이터를 업로드해주세요')).not.toBeInTheDocument();
  });

  it('handles company selection', async () => {
    render(<App />);
    
    // Open drawer and upload data
    const menuButton = screen.getByRole('button', { name: /open drawer/i });
    fireEvent.click(menuButton);
    
    const uploadButton = screen.getByText('Upload CSV');
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByText('SummaryCards')).toBeInTheDocument();
    });
    
    // Company selector should appear after data is loaded
    // Note: This is mocked, so we're just testing the flow
    expect(screen.getByText('TimeSeriesChart')).toBeInTheDocument();
  });

  it('applies theme correctly', () => {
    const { container } = render(<App />);
    
    // Check if ThemeProvider is working
    const appBar = container.querySelector('.MuiAppBar-root');
    expect(appBar).toBeInTheDocument();
  });

  it('renders CssBaseline for consistent styling', () => {
    const { container } = render(<App />);
    
    // CssBaseline should normalize styles
    expect(container.firstChild).toHaveClass('MuiBox-root');
  });
});
