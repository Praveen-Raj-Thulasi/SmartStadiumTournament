import React, { useState } from 'react';
import { useStadiumState } from '../hooks/useStadiumState';
import type { IncidentCategory, IncidentPriority } from '../hooks/useStadiumState';
import { AlertCircle, Plus, Search, ShieldAlert, Send, CheckCircle2, Clock, MapPin, UserCheck, Filter } from 'lucide-react';

interface IncidentManagerProps {
  state: ReturnType<typeof useStadiumState>;
}

export const IncidentManager: React.FC<IncidentManagerProps> = ({ state }) => {
  const { incidents, staff, reportIncident, dispatchStaff, resolveIncident, role, triggerError } = state;
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // New Incident Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('security');
  const [priority, setPriority] = useState<IncidentPriority>('medium');
  const [zone, setZone] = useState('gate_a');

  // Staff Selection Dropdown State
  const [selectedStaffForIncident, setSelectedStaffForIncident] = useState<{ [incidentId: string]: string }>({});

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await reportIncident(title, description, category, priority, zone);
    if (success) {
      setTitle('');
      setDescription('');
      setShowAddForm(false);
    }
  };

  const handleDispatch = (incidentId: string) => {
    // Role-based auth check: Guest services can't dispatch security
    if (role === 'guest_services') {
      triggerError('Access Denied: Guest Services personnel cannot dispatch operational response teams.');
      return;
    }

    const staffId = selectedStaffForIncident[incidentId];
    if (!staffId) {
      triggerError('Please select a staff member to dispatch.');
      return;
    }

    dispatchStaff(incidentId, staffId);
    setSelectedStaffForIncident(prev => {
      const copy = { ...prev };
      delete copy[incidentId];
      return copy;
    });
  };

  const handleResolve = (incidentId: string) => {
    if (role === 'guest_services') {
      triggerError('Access Denied: Guest Services personnel cannot resolve security or maintenance logs.');
      return;
    }
    resolveIncident(incidentId);
  };

  // Filtered Incidents List
  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          inc.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = filterCategory === 'all' || inc.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || inc.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const availableStaff = staff.filter(s => s.status === 'active');

  const getPriorityColor = (p: IncidentPriority) => {
    switch (p) {
      case 'critical': return 'badge-danger';
      case 'high': return 'badge-warning';
      case 'medium': return 'badge-info';
      case 'low':
      default:
        return 'badge-success';
    }
  };

  const formatZoneName = (z: string) => {
    return z.replace('_', ' ').toUpperCase();
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Page Header */}
      <div 
        className="glass-panel" 
        style={{ 
          marginBottom: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderLeft: '3px solid var(--accent-cyan)'
        }}
      >
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle style={{ color: 'var(--danger)' }} />
            Safety & Incident Command Panel
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Report alerts, coordinate response officers, and log facility dispatches.
          </p>
        </div>
        <button 
          className="btn btn-primary"
          style={{ gap: '6px' }}
          onClick={() => setShowAddForm(true)}
        >
          <Plus size={16} />
          Report New Incident
        </button>
      </div>

      {/* Main Grid: Left Controls/Filters, Right Tickets */}
      <div className="grid-2col" style={{ gridTemplateColumns: '0.7fr 1.3fr' }}>
        
        {/* Filters and Stats Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Active stats */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Operational Statistics
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Open Incidents</span>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
                  {incidents.filter(i => i.status === 'open').length}
                </p>
              </div>
              <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dispatched</span>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)', fontFamily: 'var(--font-display)', marginTop: '4px' }}>
                  {incidents.filter(i => i.status === 'dispatched').length}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Avg Response Time:</span>
              <span style={{ fontWeight: '600', color: 'var(--success)' }}>3.8 minutes</span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} />
              Filter Tickets
            </h3>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="search-input">Search Keywords</label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  id="search-input"
                  type="text" 
                  className="form-input" 
                  style={{ paddingLeft: '34px' }}
                  placeholder="Search title, description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="filter-category">Category</label>
              <select 
                id="filter-category"
                className="form-select"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="security">Security</option>
                <option value="crowd">Crowd / Traffic</option>
                <option value="maintenance">Maintenance</option>
                <option value="medical">Medical Response</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="filter-status">Status</label>
              <select 
                id="filter-status"
                className="form-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open (Unassigned)</option>
                <option value="dispatched">Dispatched</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <button 
              className="btn btn-secondary btn-sm"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => {
                setSearchQuery('');
                setFilterCategory('all');
                setFilterStatus('all');
              }}
            >
              Reset Filters
            </button>
          </div>

        </div>

        {/* Tickets Roster Column */}
        <div className="glass-panel" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>
            Active Tickets ({filteredIncidents.length})
          </h3>
          
          {filteredIncidents.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--text-muted)', gap: '8px', padding: '40px 0' }}>
              <CheckCircle2 size={36} color="var(--success)" />
              <p style={{ fontSize: '0.9rem' }}>No matching incidents logged.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredIncidents.map(inc => (
                <div 
                  key={inc.id}
                  className="glass-panel"
                  style={{ 
                    padding: '16px', 
                    background: 'var(--bg-secondary)', 
                    borderLeft: `4px solid var(--${inc.priority === 'critical' ? 'danger' : inc.priority === 'high' ? 'warning' : 'accent-blue'})`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  {/* Top line Info */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${getPriorityColor(inc.priority)}`}>
                        {inc.priority}
                      </span>
                      <span className="badge badge-info" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                        {inc.category.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <Clock size={12} />
                      <span>{new Date(inc.reportedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className={`badge ${
                        inc.status === 'resolved' ? 'badge-success' : 
                        inc.status === 'dispatched' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {inc.status}
                      </span>
                    </div>
                  </div>

                  {/* Incident Description */}
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>
                      {inc.title}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {inc.description}
                    </p>
                  </div>

                  {/* Incident Zone Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MapPin size={14} color="var(--accent-cyan)" />
                      {formatZoneName(inc.zone)}
                    </span>
                    
                    {inc.status === 'dispatched' && inc.staffAssigned && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <UserCheck size={14} color="var(--success)" />
                        Assigned: {staff.find(s => s.id === inc.staffAssigned)?.name}
                      </span>
                    )}
                  </div>

                  {/* Dispatch Controls (only if user role permits) */}
                  {inc.status === 'open' && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label className="form-label" style={{ marginBottom: 0 }} htmlFor={`staff-select-${inc.id}`}>Dispatch Responder:</label>
                        <select 
                          id={`staff-select-${inc.id}`}
                          className="form-select"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', width: '200px' }}
                          value={selectedStaffForIncident[inc.id] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSelectedStaffForIncident(prev => ({ ...prev, [inc.id]: val }));
                          }}
                        >
                          <option value="">Choose active staff...</option>
                          {availableStaff.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.role} - Tasks: {s.assignedTasks})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <button 
                        className="btn btn-primary btn-sm"
                        style={{ gap: '4px' }}
                        onClick={() => handleDispatch(inc.id)}
                      >
                        <Send size={12} />
                        Dispatch
                      </button>
                    </div>
                  )}

                  {/* Resolve Actions */}
                  {inc.status === 'dispatched' && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        className="btn btn-success btn-sm"
                        style={{ backgroundColor: 'var(--success)', color: 'black', fontWeight: '600', gap: '4px' }}
                        onClick={() => handleResolve(inc.id)}
                      >
                        <CheckCircle2 size={12} />
                        Resolve Incident
                      </button>
                    </div>
                  )}

                  {/* Closed timestamp */}
                  {inc.status === 'resolved' && inc.resolvedAt && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', fontStyle: 'italic' }}>
                      Resolved at {new Date(inc.resolvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Incident Dialog Overlay */}
      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="var(--warning)" />
                File Safety or Security Incident
              </h3>
              <button className="modal-close" onClick={() => setShowAddForm(false)} aria-label="Close modal">&times;</button>
            </div>

            <form onSubmit={handleCreateIncident}>
              <div className="form-group">
                <label className="form-label" htmlFor="incident-title">Incident Title</label>
                <input 
                  id="incident-title"
                  type="text" 
                  className="form-input" 
                  placeholder="Briefly state the issue..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="incident-desc">Details & Description</label>
                <textarea 
                  id="incident-desc"
                  className="form-input" 
                  rows={3}
                  placeholder="Provide explicit operational details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="incident-zone">Location / Zone</label>
                <select 
                  id="incident-zone"
                  className="form-select"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                >
                  <option value="gate_a">Gate A (North Entrance)</option>
                  <option value="gate_b">Gate B (East Entrance)</option>
                  <option value="gate_c">Gate C (South Entrance)</option>
                  <option value="gate_d">Gate D (West Entrance)</option>
                  <option value="sect_100">Lower Seating Tier (100)</option>
                  <option value="sect_200">Upper Seating Tier (200)</option>
                  <option value="concessions">Concession Concourse</option>
                  <option value="restrooms">Restrooms Area</option>
                  <option value="parking">North Parking Lot</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="incident-category">Category</label>
                  <select 
                    id="incident-category"
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as IncidentCategory)}
                  >
                    <option value="security">Security</option>
                    <option value="crowd">Crowd / Traffic</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="medical">Medical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="incident-priority">Priority Level</label>
                  <select 
                    id="incident-priority"
                    className="form-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as IncidentPriority)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Log Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
