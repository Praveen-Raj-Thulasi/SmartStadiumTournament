import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { StaffShiftBoard } from './StaffShiftBoard';

describe('StaffShiftBoard Component Tests', () => {
  const mockStaff = [
    { id: 's1', name: 'Marcus Vance', role: 'security', status: 'active', assignedTasks: 1 },
    { id: 's2', name: 'Zoe Miller', role: 'technician', status: 'on_break', assignedTasks: 3 } // Overloaded
  ] as any[];

  const mockState = {
    staff: mockStaff,
    updateStaffStatus: vi.fn(),
    addStaffMember: vi.fn().mockResolvedValue(true),
    role: 'director',
    triggerError: vi.fn()
  } as any;

  it('should render roster cards and detect overloaded warnings', () => {
    render(
      <StaffShiftBoard 
        staff={mockState.staff}
        updateStaffStatus={mockState.updateStaffStatus}
        addStaffMember={mockState.addStaffMember}
        role={mockState.role}
        triggerError={mockState.triggerError}
      />
    );

    expect(screen.getByText('Marcus Vance')).toBeInTheDocument();
    expect(screen.getByText('Zoe Miller')).toBeInTheDocument();
    expect(screen.getByText('(Overloaded)')).toBeInTheDocument();
  });

  it('should trigger status change dropdown update', () => {
    render(
      <StaffShiftBoard 
        staff={mockState.staff}
        updateStaffStatus={mockState.updateStaffStatus}
        addStaffMember={mockState.addStaffMember}
        role={mockState.role}
        triggerError={mockState.triggerError}
      />
    );

    const select = screen.getByLabelText(/Change shift status for Marcus Vance/i);
    fireEvent.change(select, { target: { value: 'on_break' } });

    expect(mockState.updateStaffStatus).toHaveBeenCalledWith('s1', 'on_break');
  });

  it('should open register modal, input details, and save', async () => {
    render(
      <StaffShiftBoard 
        staff={mockState.staff}
        updateStaffStatus={mockState.updateStaffStatus}
        addStaffMember={mockState.addStaffMember}
        role={mockState.role}
        triggerError={mockState.triggerError}
      />
    );

    const openBtn = screen.getByRole('button', { name: /Register Staff/i });
    fireEvent.click(openBtn);

    const nameInput = screen.getByLabelText('Full Name');
    fireEvent.change(nameInput, { target: { value: 'Elena Rostova' } });

    const roleSelect = screen.getByLabelText(/Department \/ Operational Role/i);
    fireEvent.change(roleSelect, { target: { value: 'medical' } });

    const form = nameInput.closest('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });

    expect(mockState.addStaffMember).toHaveBeenCalledWith('Elena Rostova', 'medical');
  });
});
