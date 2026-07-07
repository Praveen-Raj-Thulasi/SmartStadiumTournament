import React, { useState } from 'react';
import { useStadiumState } from '../hooks/useStadiumState';
import type { Staff } from '../hooks/useStadiumState';
import { Users, UserPlus, Shield, HeartPulse, Trash2, KeyRound } from 'lucide-react';

interface StaffShiftBoardProps {
  state: ReturnType<typeof useStadiumState>;
}

export const StaffShiftBoard: React.FC<StaffShiftBoardProps> = ({ state }) => {
  const { staff, updateStaffStatus, addStaffMember, role, triggerError } = state;
  
  // New Staff member form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState<Staff['role']>('security');

  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await addStaffMember(staffName, staffRole);
    if (success) {
      setStaffName('');
      setShowAddForm(false);
    }
  };

  const handleStatusChange = (staffId: string, newStatus: Staff['status']) => {
    // Role validation: only security lead or director can manage roster
    if (role === 'guest_services') {
      triggerError('Access Denied: Guest Services personnel cannot change roster shift statuses.');
      return;
    }
    updateStaffStatus(staffId, newStatus);
  };

  const getRoleIcon = (r: Staff['role']) => {
    switch (r) {
      case 'security': return <Shield size={16} color="var(--accent-cyan)" />;
      case 'medical': return <HeartPulse size={16} color="var(--danger)" />;
      case 'janitorial': return <Trash2 size={16} color="var(--warning)" />;
      case 'technician': return <KeyRound size={16} color="var(--accent-purple)" />;
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header bar */}
      <div 
        className="glass-panel" 
        style={{ 
          marginBottom: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderLeft: '3px solid var(--accent-purple)'
        }}
      >
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users style={{ color: 'var(--accent-purple)' }} />
            Workforce Shifts & Roster Coordination
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage staff check-ins, check active task loads, and update response teams.
          </p>
        </div>
        <button 
          className="btn btn-primary"
          style={{ gap: '6px' }}
          onClick={() => setShowAddForm(true)}
        >
          <UserPlus size={16} />
          Register Staff
        </button>
      </div>

      {/* Staff Grid cards */}
      <div className="grid-3col">
        {staff.map(s => {
          const isOverloaded = s.assignedTasks >= 3;
          return (
            <div 
              key={s.id} 
              className="glass-panel"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                borderLeft: `3px solid var(--${
                  s.status === 'active' ? 'success' : s.status === 'on_break' ? 'warning' : 'border-color'
                })`
              }}
            >
              {/* Top Row: Name and Role */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: '600' }}>{s.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {getRoleIcon(s.role)}
                    <span style={{ textTransform: 'capitalize' }}>{s.role}</span>
                  </div>
                </div>
                
                <span className={`badge ${
                  s.status === 'active' ? 'badge-success' : s.status === 'on_break' ? 'badge-warning' : 'badge-danger'
                }`}>
                  {s.status.replace('_', ' ')}
                </span>
              </div>

              {/* Stats Row: Task Load */}
              <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Tasks:</span>
                <span style={{ 
                  fontSize: '1rem', 
                  fontWeight: '700', 
                  fontFamily: 'var(--font-display)',
                  color: isOverloaded ? 'var(--danger)' : s.assignedTasks > 0 ? 'var(--warning)' : 'var(--success)'
                }}>
                  {s.assignedTasks}
                  {isOverloaded && <span style={{ fontSize: '0.65rem', marginLeft: '4px', fontWeight: 'normal', color: 'var(--danger)' }}>(Overloaded)</span>}
                </span>
              </div>

              {/* Status Action Controls */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', gap: '8px' }}>
                <select 
                  className="form-select"
                  style={{ padding: '6px 10px', fontSize: '0.8rem', flexGrow: 1 }}
                  value={s.status}
                  aria-label={`Change shift status for ${s.name}`}
                  onChange={(e) => handleStatusChange(s.id, e.target.value as Staff['status'])}
                >
                  <option value="active">Active Duty</option>
                  <option value="on_break">On Break</option>
                  <option value="inactive">Checked Out</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Staff Modal */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} color="var(--accent-purple)" />
                Register New Responder / Staff
              </h3>
              <button className="modal-close" onClick={() => setShowAddForm(false)} aria-label="Close modal">&times;</button>
            </div>

            <form onSubmit={handleSubmitStaff}>
              <div className="form-group">
                <label className="form-label" htmlFor="staff-name">Full Name</label>
                <input 
                  id="staff-name"
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Captain Miller..."
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" htmlFor="staff-role-select">Department / Operational Role</label>
                <select 
                  id="staff-role-select"
                  className="form-select"
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value as Staff['role'])}
                >
                  <option value="security">Security Team</option>
                  <option value="medical">Medical First Responder</option>
                  <option value="janitorial">Janitorial / Maintenance</option>
                  <option value="technician">VAR / Technician Staff</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Responder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
