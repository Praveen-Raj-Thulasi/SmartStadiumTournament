import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OverviewDashboard } from './OverviewDashboard';

describe('OverviewDashboard Component Tests', () => {
  const mockMatches = [
    { id: 1, round: 1, team1: { id: '1', name: 'Cyber Knights' }, team2: { id: '2', name: 'Apex Wolves' }, score1: 3, score2: 2, status: 'live' }
  ] as any[];

  const mockIncidents = [
    { id: 'inc-1', title: 'Power Failure Section A', description: 'Transformer blew', category: 'maintenance', priority: 'critical', status: 'dispatched', zone: 'sect_100', staffAssigned: 's1', reportedAt: new Date().toISOString() }
  ] as any[];

  const mockStaff = [
    { id: 's1', name: 'Marcus Vance', role: 'security', status: 'active', assignedTasks: 1 }
  ] as any[];

  const mockMetrics = {
    liveCapacity: 22500,
    maxCapacity: 45000,
    energyConsumption: 1200,
    avgGateTime: 4.5,
    gateCrowdLevel: { gate_a: 'low' },
    restroomWaitTimes: {},
    concessionQueueTimes: {}
  } as any;

  const mockState = {
    matches: mockMatches,
    incidents: mockIncidents,
    staff: mockStaff,
    metrics: mockMetrics,
    role: 'director',
    resolveIncident: vi.fn(),
    setView: vi.fn()
  } as any;

  it('should render occupancy percentage and stats cards', () => {
    render(
      <OverviewDashboard 
        matches={mockState.matches}
        incidents={mockState.incidents}
        staff={mockState.staff}
        metrics={mockState.metrics}
        role={mockState.role}
        resolveIncident={mockState.resolveIncident}
        setView={mockState.setView}
      />
    );

    expect(screen.getByText('50%')).toBeInTheDocument(); // 22500/45000
    expect(screen.getByText('1200 kW')).toBeInTheDocument();
    const incidentCard = screen.getByText('Active Incidents').closest('.stat-card');
    expect(incidentCard).toHaveTextContent('1');
  });

  it('should navigate to incidents and matches portals on button clicks', () => {
    render(
      <OverviewDashboard 
        matches={mockState.matches}
        incidents={mockState.incidents}
        staff={mockState.staff}
        metrics={mockState.metrics}
        role={mockState.role}
        resolveIncident={mockState.resolveIncident}
        setView={mockState.setView}
      />
    );

    const manageTicketsButton = screen.getByRole('button', { name: /Manage Tickets/i });
    fireEvent.click(manageTicketsButton);
    expect(mockState.setView).toHaveBeenCalledWith('incidents');

    const viewBracketButton = screen.getByRole('button', { name: /View Bracket/i });
    fireEvent.click(viewBracketButton);
    expect(mockState.setView).toHaveBeenCalledWith('matches');
  });

  it('should trigger resolveIncident when authorized user clicks resolve', () => {
    render(
      <OverviewDashboard 
        matches={mockState.matches}
        incidents={mockState.incidents}
        staff={mockState.staff}
        metrics={mockState.metrics}
        role={mockState.role}
        resolveIncident={mockState.resolveIncident}
        setView={mockState.setView}
      />
    );

    const resolveButton = screen.getByRole('button', { name: /Resolve/i });
    fireEvent.click(resolveButton);
    expect(mockState.resolveIncident).toHaveBeenCalledWith('inc-1');
  });
});
