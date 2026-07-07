import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useStadiumState } from './useStadiumState';

describe('useStadiumState Hook Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('arena_token', 'mock-jwt-token-xyz');
    localStorage.setItem('arena_user', JSON.stringify({ id: 'mock-id', username: 'director', role: 'director' }));
    if (typeof (globalThis as any).resetMockDb === 'function') {
      (globalThis as any).resetMockDb();
    }
  });

  it('should initialize with default states', async () => {
    const { result } = renderHook(() => useStadiumState());
    
    // Wait for the async API loads
    await waitFor(() => {
      expect(result.current.matches.length).toBe(7);
    });

    expect(result.current.role).toBe('director');
    expect(result.current.view).toBe('overview');
    expect(result.current.incidents.length).toBeGreaterThan(0);
    expect(result.current.staff.length).toBeGreaterThan(0);
  });

  it('should handle login, logout and view updates', async () => {
    const { result } = renderHook(() => useStadiumState());

    act(() => {
      result.current.setView('map');
    });
    expect(result.current.view).toBe('map');

    let success = false;
    await act(async () => {
      success = await result.current.loginUser('security', 'password123');
    });

    expect(success).toBe(true);
    expect(result.current.role).toBe('security');
    expect(result.current.user?.username).toBe('security');

    act(() => {
      result.current.logoutUser();
    });

    expect(result.current.role).toBe('guest_services');
    expect(result.current.user).toBeNull();
  });

  it('should report incidents with validation', async () => {
    const { result } = renderHook(() => useStadiumState());
    
    await waitFor(() => {
      expect(result.current.incidents.length).toBeGreaterThan(0);
    });

    const initialSize = result.current.incidents.length;

    // Report a valid incident
    let success = false;
    await act(async () => {
      success = await result.current.reportIncident(
        'Broken seats',
        'Seats 12 and 13 in Sect 100 are broken',
        'maintenance',
        'low',
        'sect_100'
      );
    });

    expect(success).toBe(true);
    
    await waitFor(() => {
      expect(result.current.incidents.length).toBe(initialSize + 1);
    });
    
    expect(result.current.incidents[0].title).toBe('Broken seats');
    expect(result.current.incidents[0].status).toBe('open');

    // Attempt reporting invalid incident (empty title)
    await act(async () => {
      success = await result.current.reportIncident(
        '',
        'No details',
        'security',
        'low',
        'gate_a'
      );
    });

    expect(success).toBe(false);
    expect(result.current.incidents.length).toBe(initialSize + 1); // no change
  });

  it('should update match scores and advance teams in brackets', async () => {
    const { result } = renderHook(() => useStadiumState());

    await waitFor(() => {
      expect(result.current.matches.length).toBe(7);
    });

    const match1 = result.current.matches.find(m => m.id === 1);
    expect(match1?.team1?.name).toBe('Cyber Knights');
    expect(match1?.team2?.name).toBe('Apex Wolves');

    // Complete Match 1 with Cyber Knights winning (5 - 3)
    let success = false;
    await act(async () => {
      success = await result.current.updateMatchScore(1, 5, 3, 'completed');
    });

    expect(success).toBe(true);

    await waitFor(() => {
      const updatedMatch = result.current.matches.find(m => m.id === 1);
      expect(updatedMatch?.status).toBe('completed');
    });

    const updatedMatch1 = result.current.matches.find(m => m.id === 1);
    expect(updatedMatch1?.score1).toBe(5);
    expect(updatedMatch1?.score2).toBe(3);
    expect(updatedMatch1?.winnerId).toBe('1'); // Cyber Knights

    // Verify Cyber Knights advanced to Match 5 (Semifinal 1) as team1
    const match5 = result.current.matches.find(m => m.id === 5);
    expect(match5?.team1?.name).toBe('Cyber Knights');
  });

  it('should prevent draws in completed knockout tournament matches', async () => {
    const { result } = renderHook(() => useStadiumState());

    await waitFor(() => {
      expect(result.current.matches.length).toBe(7);
    });

    // Try setting a draw score for completed match
    let success = false;
    await act(async () => {
      success = await result.current.updateMatchScore(1, 2, 2, 'completed');
    });

    expect(success).toBe(false);
    const updatedMatch1 = result.current.matches.find(m => m.id === 1);
    expect(updatedMatch1?.status).toBe('scheduled'); // didn't complete
  });

  it('should handle incident lifecycle (open -> dispatched -> resolved)', async () => {
    const { result } = renderHook(() => useStadiumState());

    await waitFor(() => {
      expect(result.current.incidents.length).toBeGreaterThan(0);
    });

    // Register a new incident
    await act(async () => {
      await result.current.reportIncident(
        'Water Leak',
        'Water leaking near concessions booth #2',
        'maintenance',
        'medium',
        'concessions'
      );
    });

    await waitFor(() => {
      expect(result.current.incidents[0].title).toBe('Water Leak');
    });

    const newInc = result.current.incidents[0];
    expect(newInc.status).toBe('open');
    expect(newInc.staffAssigned).toBeNull();

    const staffMember = result.current.staff.find(s => s.id === 's5');
    const initialTasks = staffMember?.assignedTasks || 0;

    // Dispatch staff Member s5
    await act(async () => {
      await result.current.dispatchStaff(newInc.id, 's5');
    });

    await waitFor(() => {
      const dispatchedInc = result.current.incidents.find(i => i.id === newInc.id);
      expect(dispatchedInc?.status).toBe('dispatched');
    });

    const dispatchedInc = result.current.incidents.find(i => i.id === newInc.id);
    expect(dispatchedInc?.staffAssigned).toBe('s5');

    const updatedStaff = result.current.staff.find(s => s.id === 's5');
    expect(updatedStaff?.assignedTasks).toBe(initialTasks + 1);

    // Resolve the incident
    await act(async () => {
      await result.current.resolveIncident(newInc.id);
    });

    await waitFor(() => {
      const resolvedInc = result.current.incidents.find(i => i.id === newInc.id);
      expect(resolvedInc?.status).toBe('resolved');
    });

    const finalStaff = result.current.staff.find(s => s.id === 's5');
    expect(finalStaff?.assignedTasks).toBe(initialTasks); // decremented back to normal
  });

  it('should add and manage workforce roster shifts', async () => {
    const { result } = renderHook(() => useStadiumState());

    await waitFor(() => {
      expect(result.current.staff.length).toBeGreaterThan(0);
    });

    const initialRosterCount = result.current.staff.length;

    // Register a new staff member
    let success = false;
    await act(async () => {
      success = await result.current.addStaffMember('Officer Jenny', 'security');
    });

    expect(success).toBe(true);

    await waitFor(() => {
      expect(result.current.staff.length).toBe(initialRosterCount + 1);
    });
    
    const newStaff = result.current.staff.find(s => s.name === 'Officer Jenny');
    expect(newStaff).toBeDefined();
    expect(newStaff?.role).toBe('security');
    expect(newStaff?.status).toBe('active');

    // Update status to on_break
    await act(async () => {
      await result.current.updateStaffStatus(newStaff!.id, 'on_break');
    });

    await waitFor(() => {
      const breakStaff = result.current.staff.find(s => s.name === 'Officer Jenny');
      expect(breakStaff?.status).toBe('on_break');
    });
  });
});
