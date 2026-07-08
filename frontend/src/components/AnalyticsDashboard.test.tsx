import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalyticsDashboard } from './AnalyticsDashboard';

// Mock Recharts responsive container to avoid size measurement issues in JSDOM
vi.mock('recharts', async () => {
  const original = await vi.importActual<any>('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>
  };
});

describe('AnalyticsDashboard Component Tests', () => {
  const mockMetrics = {
    liveCapacity: 34210,
    maxCapacity: 45000,
    energyConsumption: 1240,
    avgGateTime: 4.2,
    gateCrowdLevel: {},
    restroomWaitTimes: { west: 3, east: 8 },
    concessionQueueTimes: { booth_1: 4, booth_2: 12 }
  } as any;

  const mockIncidents = [
    { id: '1', category: 'security', priority: 'high', status: 'open' }
  ] as any[];

  it('should render capacity curve descriptions and titles', () => {
    render(
      <AnalyticsDashboard 
        metrics={mockMetrics}
        incidents={mockIncidents}
      />
    );

    expect(screen.getByText('Stadium Telemetry & Logistics Analytics')).toBeInTheDocument();
    expect(screen.getByText(/Ticket Scanning Throughput/i)).toBeInTheDocument();
    expect(screen.getByText(/Concession Queues/i)).toBeInTheDocument();
  });

  it('should list restroom and concessions telemetry', () => {
    render(
      <AnalyticsDashboard 
        metrics={mockMetrics}
        incidents={mockIncidents}
      />
    );

    expect(screen.getByText(/Monitors queue sensor delays/i)).toBeInTheDocument();
  });
});
