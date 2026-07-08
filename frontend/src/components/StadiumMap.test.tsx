import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StadiumMap } from './StadiumMap';

describe('StadiumMap Component Tests', () => {
  const mockMetrics = {
    liveCapacity: 34210,
    maxCapacity: 45000,
    energyConsumption: 1240,
    avgGateTime: 4.2,
    gateCrowdLevel: { gate_a: 'low', gate_b: 'medium', gate_c: 'high', gate_d: 'low' },
    restroomWaitTimes: { west: 3 },
    concessionQueueTimes: { booth_1: 4 }
  } as any;

  const mockIncidents = [
    { id: 'inc-1', title: 'Crowd surge', status: 'open', reportedAt: new Date().toISOString(), zone: 'gate_c' }
  ] as any[];

  const mockStaff = [
    { id: 's1', name: 'Marcus Vance', role: 'security', status: 'active', assignedTasks: 0 }
  ] as any[];

  const mockState = {
    metrics: mockMetrics,
    incidents: mockIncidents,
    staff: mockStaff,
    reportIncident: vi.fn().mockResolvedValue(true),
    dispatchStaff: vi.fn().mockResolvedValue(true)
  } as any;

  it('should render interactive SVG elements with unique IDs', () => {
    const { container } = render(
      <StadiumMap 
        metrics={mockState.metrics}
        incidents={mockState.incidents}
        staff={mockState.staff}
        reportIncident={mockState.reportIncident}
        dispatchStaff={mockState.dispatchStaff}
      />
    );

    expect(container.querySelector('#map-zone-gate_a')).toBeInTheDocument();
    expect(container.querySelector('#map-zone-gate_c')).toBeInTheDocument();
    expect(container.querySelector('#map-zone-sect_100')).toBeInTheDocument();
  });

  it('should render details side panel when a zone is clicked', () => {
    render(
      <StadiumMap 
        metrics={mockState.metrics}
        incidents={mockState.incidents}
        staff={mockState.staff}
        reportIncident={mockState.reportIncident}
        dispatchStaff={mockState.dispatchStaff}
      />
    );

    const gateAZone = screen.getByLabelText(/Gate A North Entrance queue zone/i);
    fireEvent.click(gateAZone);

    expect(screen.getByText('Entry GATE A')).toBeInTheDocument();
    expect(screen.getByText('Wait Time: ~2 mins')).toBeInTheDocument();
  });

  it('should open quick report form, validate, and invoke callback on submit', async () => {
    render(
      <StadiumMap 
        metrics={mockState.metrics}
        incidents={mockState.incidents}
        staff={mockState.staff}
        reportIncident={mockState.reportIncident}
        dispatchStaff={mockState.dispatchStaff}
      />
    );

    // Click a zone to show quick report button
    const gateAZone = screen.getByLabelText(/Gate A North Entrance queue zone/i);
    fireEvent.click(gateAZone);

    const reportButton = screen.getByRole('button', { name: /Report Incident in this Zone/i });
    fireEvent.click(reportButton);

    const titleInput = screen.getByLabelText(/Issue Title/i);
    const descTextarea = screen.getByLabelText(/Description/i);

    fireEvent.change(titleInput, { target: { value: 'Broken latch' } });
    fireEvent.change(descTextarea, { target: { value: 'Gate latch is cracked' } });

    const form = titleInput.closest('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });

    expect(mockState.reportIncident).toHaveBeenCalledWith(
      'Broken latch',
      'Gate latch is cracked',
      'security',
      'high',
      'gate_a'
    );
  });
});
