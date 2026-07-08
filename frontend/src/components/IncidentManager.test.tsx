import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { IncidentManager } from './IncidentManager';

describe('IncidentManager Component Tests', () => {
  const mockIncidents = [
    { id: 'inc-1', title: 'Gate C Bottleneck', description: 'Crowd issues', category: 'crowd', priority: 'high', status: 'open', zone: 'gate_c', staffAssigned: null, reportedAt: new Date().toISOString() },
    { id: 'inc-2', title: 'Water Leak West', description: 'Pipe leak', category: 'maintenance', priority: 'low', status: 'resolved', zone: 'restrooms', staffAssigned: 's1', reportedAt: new Date().toISOString() }
  ] as any[];

  const mockStaff = [
    { id: 's1', name: 'Marcus Vance', role: 'security', status: 'active', assignedTasks: 0 }
  ] as any[];

  const mockState = {
    incidents: mockIncidents,
    staff: mockStaff,
    reportIncident: vi.fn().mockResolvedValue(true),
    dispatchStaff: vi.fn().mockResolvedValue(true),
    resolveIncident: vi.fn().mockResolvedValue(true),
    role: 'director',
    triggerError: vi.fn()
  } as any;

  it('should render page title, stats, and search fields', () => {
    render(
      <IncidentManager 
        incidents={mockState.incidents}
        staff={mockState.staff}
        reportIncident={mockState.reportIncident}
        dispatchStaff={mockState.dispatchStaff}
        resolveIncident={mockState.resolveIncident}
        role={mockState.role}
        triggerError={mockState.triggerError}
      />
    );

    expect(screen.getByText('Safety & Incident Command Panel')).toBeInTheDocument();
    expect(screen.getByText('Gate C Bottleneck')).toBeInTheDocument();
    expect(screen.getByText('Water Leak West')).toBeInTheDocument();
  });

  it('should filter incidents by search queries', () => {
    render(
      <IncidentManager 
        incidents={mockState.incidents}
        staff={mockState.staff}
        reportIncident={mockState.reportIncident}
        dispatchStaff={mockState.dispatchStaff}
        resolveIncident={mockState.resolveIncident}
        role={mockState.role}
        triggerError={mockState.triggerError}
      />
    );

    const searchInput = screen.getByLabelText(/Search Keywords/i);
    fireEvent.change(searchInput, { target: { value: 'Leak' } });

    expect(screen.queryByText('Gate C Bottleneck')).not.toBeInTheDocument();
    expect(screen.getByText('Water Leak West')).toBeInTheDocument();
  });

  it('should open new incident report form overlay and save', async () => {
    render(
      <IncidentManager 
        incidents={mockState.incidents}
        staff={mockState.staff}
        reportIncident={mockState.reportIncident}
        dispatchStaff={mockState.dispatchStaff}
        resolveIncident={mockState.resolveIncident}
        role={mockState.role}
        triggerError={mockState.triggerError}
      />
    );

    const reportBtn = screen.getByRole('button', { name: /Report New Incident/i });
    fireEvent.click(reportBtn);

    const titleInput = screen.getByLabelText('Incident Title');
    const descTextarea = screen.getByLabelText('Details & Description');

    fireEvent.change(titleInput, { target: { value: 'Fainting' } });
    fireEvent.change(descTextarea, { target: { value: 'Fan fainted in stand' } });

    const form = titleInput.closest('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });

    expect(mockState.reportIncident).toHaveBeenCalledWith(
      'Fainting',
      'Fan fainted in stand',
      'security',
      'medium',
      'gate_a'
    );
  });

  it('should allow dispatcher selection and assign personnel', () => {
    render(
      <IncidentManager 
        incidents={mockState.incidents}
        staff={mockState.staff}
        reportIncident={mockState.reportIncident}
        dispatchStaff={mockState.dispatchStaff}
        resolveIncident={mockState.resolveIncident}
        role={mockState.role}
        triggerError={mockState.triggerError}
      />
    );

    // Get the dropdown for inc-1
    const staffSelect = screen.getByLabelText('Dispatch Responder:');
    fireEvent.change(staffSelect, { target: { value: 's1' } });

    const dispatchBtn = screen.getByRole('button', { name: /Dispatch/i });
    fireEvent.click(dispatchBtn);

    expect(mockState.dispatchStaff).toHaveBeenCalledWith('inc-1', 's1');
  });
});
