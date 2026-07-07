import React, { useState } from 'react';
import { useStadiumState } from '../hooks/useStadiumState';
import { MapPin, Users, AlertTriangle, ShieldAlert } from 'lucide-react';

interface StadiumMapProps {
  state: ReturnType<typeof useStadiumState>;
}

interface ZoneDetails {
  id: string;
  name: string;
  type: 'gate' | 'stand' | 'concessions' | 'restrooms';
  metrics: string;
  status: 'low' | 'medium' | 'high' | 'alert';
}

export const StadiumMap: React.FC<StadiumMapProps> = ({ state }) => {
  const { metrics, incidents, staff, reportIncident, dispatchStaff } = state;
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  
  // Incident Form state (quick report)
  const [showQuickReport, setShowQuickReport] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickCategory, setQuickCategory] = useState<'security' | 'crowd' | 'maintenance' | 'medical'>('security');
  const [quickPriority, setQuickPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');

  // Quick Dispatch state
  const [dispatchTargetIncidentId, setDispatchTargetIncidentId] = useState<string | null>(null);

  // Map zone info mapping
  const getZoneInfo = (zoneId: string): ZoneDetails => {
    const activeIncidents = incidents.filter(i => i.zone === zoneId && i.status !== 'resolved');
    const zoneHasAlert = activeIncidents.length > 0;
    
    if (zoneId.startsWith('gate_')) {
      const level = metrics.gateCrowdLevel[zoneId] || 'low';
      return {
        id: zoneId,
        name: `Entry ${zoneId.replace('_', ' ').toUpperCase()}`,
        type: 'gate',
        metrics: `Wait Time: ~${level === 'high' ? '12' : level === 'medium' ? '6' : '2'} mins`,
        status: zoneHasAlert ? 'alert' : level,
      };
    }
    
    if (zoneId === 'concessions') {
      const waitTimes = Object.values(metrics.concessionQueueTimes);
      const avgWait = waitTimes.length ? Math.round(waitTimes.reduce((a,b) => a+b, 0) / waitTimes.length) : 5;
      return {
        id: zoneId,
        name: 'Concessions Concourse',
        type: 'concessions',
        metrics: `Average Queue: ${avgWait} mins`,
        status: zoneHasAlert ? 'alert' : avgWait > 10 ? 'high' : avgWait > 6 ? 'medium' : 'low',
      };
    }

    if (zoneId === 'restrooms') {
      const waitTimes = Object.values(metrics.restroomWaitTimes);
      const avgWait = waitTimes.length ? Math.round(waitTimes.reduce((a,b) => a+b, 0) / waitTimes.length) : 3;
      return {
        id: zoneId,
        name: 'Main Restrooms',
        type: 'restrooms',
        metrics: `Average Wait: ${avgWait} mins`,
        status: zoneHasAlert ? 'alert' : avgWait > 7 ? 'high' : avgWait > 4 ? 'medium' : 'low',
      };
    }

    // Seating stands
    const countIncidents = activeIncidents.length;
    let status: ZoneDetails['status'] = 'low';
    if (countIncidents > 0) status = 'alert';
    
    return {
      id: zoneId,
      name: zoneId === 'sect_100' ? 'Lower Tier (100 Level)' : 'Upper Tier (200 Level)',
      type: 'stand',
      metrics: `Current Density: ${zoneId === 'sect_100' ? '82%' : '68%'} capacity`,
      status,
    };
  };

  // Helper for fill color of SVG elements based on zone status
  const getZoneFillColor = (zoneId: string) => {
    const info = getZoneInfo(zoneId);
    if (selectedZone === zoneId) return 'rgba(0, 240, 255, 0.4)';
    
    switch (info.status) {
      case 'alert': return 'rgba(239, 68, 68, 0.4)'; // danger transparent
      case 'high': return 'rgba(245, 158, 11, 0.4)'; // amber transparent
      case 'medium': return 'rgba(59, 130, 246, 0.25)'; // blue transparent
      case 'low': 
      default:
        return 'rgba(16, 185, 129, 0.15)'; // green transparent
    }
  };

  const getZoneStrokeColor = (zoneId: string) => {
    const info = getZoneInfo(zoneId);
    if (selectedZone === zoneId) return '#00f0ff'; // glowing cyan
    
    switch (info.status) {
      case 'alert': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low':
      default:
        return 'rgba(255, 255, 255, 0.1)';
    }
  };

  const handleZoneClick = (zoneId: string) => {
    setSelectedZone(zoneId);
    setShowQuickReport(false);
    setDispatchTargetIncidentId(null);
  };

  const submitQuickReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;
    const ok = await reportIncident(quickTitle, quickDesc, quickCategory, quickPriority, selectedZone);
    if (ok) {
      setQuickTitle('');
      setQuickDesc('');
      setShowQuickReport(false);
    }
  };

  const activeZoneIncidents = selectedZone 
    ? incidents.filter(i => i.zone === selectedZone && i.status !== 'resolved')
    : [];

  const availableStaff = staff.filter(s => s.status === 'active');

  return (
    <div className="grid-2col" style={{ gridTemplateColumns: '1.2fr 0.8fr' }}>
      
      {/* SVG Arena Display */}
      <div className="glass-panel glass-panel-glow" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ alignSelf: 'flex-start', marginBottom: '16px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
            <MapPin style={{ color: 'var(--accent-cyan)' }} />
            Stadium Floor Map
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Select areas of the interactive floorplan to view telemetry and dispatch responders.
          </p>
        </div>

        {/* SVG Container */}
        <div style={{ width: '100%', maxWidth: '550px', position: 'relative', margin: '20px 0' }}>
          <svg viewBox="0 0 500 400" style={{ width: '100%', height: 'auto', display: 'block' }}>
            {/* Background Outer Border */}
            <ellipse cx="250" cy="200" rx="230" ry="170" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="4" />
            
            {/* Seating Upper Tier 200 Level */}
            <path 
              d="M 50,200 A 200,140 0 1,1 450,200 A 200,140 0 1,1 50,200 M 90,200 A 160,110 0 1,0 410,200 A 160,110 0 1,0 90,200" 
              fill={getZoneFillColor('sect_200')} 
              stroke={getZoneStrokeColor('sect_200')} 
              strokeWidth="2"
              style={{ cursor: 'pointer', transition: 'all 0.25s', outline: 'none' }}
              tabIndex={0}
              role="button"
              aria-label="Upper Tier 200 Level seating zone. Wait-times and telemetry metrics available."
              onClick={() => handleZoneClick('sect_200')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleZoneClick('sect_200');
                }
              }}
            />

            {/* Seating Lower Tier 100 Level */}
            <path 
              d="M 90,200 A 160,110 0 1,1 410,200 A 160,110 0 1,1 90,200 M 130,200 A 120,80 0 1,0 370,200 A 120,80 0 1,0 130,200" 
              fill={getZoneFillColor('sect_100')} 
              stroke={getZoneStrokeColor('sect_100')} 
              strokeWidth="2"
              style={{ cursor: 'pointer', transition: 'all 0.25s', outline: 'none' }}
              tabIndex={0}
              role="button"
              aria-label="Lower Tier 100 Level seating zone. Wait-times and telemetry metrics available."
              onClick={() => handleZoneClick('sect_100')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleZoneClick('sect_100');
                }
              }}
            />

            {/* Central Pitch Field */}
            <ellipse cx="250" cy="200" rx="100" ry="60" fill="#1b4d3e" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
            <line x1="250" y1="140" x2="250" y2="260" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
            <circle cx="250" cy="200" r="25" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />

            {/* Gate A (North) */}
            <path
              d="M 220,20 L 280,20 L 270,50 L 230,50 Z"
              fill={getZoneFillColor('gate_a')}
              stroke={getZoneStrokeColor('gate_a')}
              strokeWidth="2"
              style={{ cursor: 'pointer', transition: 'all 0.25s', outline: 'none' }}
              tabIndex={0}
              role="button"
              aria-label="Gate A North Entrance queue zone. Wait-times and bottlenecks detail available."
              onClick={() => handleZoneClick('gate_a')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleZoneClick('gate_a');
                }
              }}
            />
            <text x="250" y="40" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>GATE A</text>

            {/* Gate B (East) */}
            <path
              d="M 450,170 L 480,180 L 480,220 L 450,230 Z"
              fill={getZoneFillColor('gate_b')}
              stroke={getZoneStrokeColor('gate_b')}
              strokeWidth="2"
              style={{ cursor: 'pointer', transition: 'all 0.25s', outline: 'none' }}
              tabIndex={0}
              role="button"
              aria-label="Gate B East Entrance queue zone. Wait-times and bottlenecks detail available."
              onClick={() => handleZoneClick('gate_b')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleZoneClick('gate_b');
                }
              }}
            />
            <text x="465" y="204" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(90 465 204)" style={{ pointerEvents: 'none' }}>GATE B</text>

            {/* Gate C (South) */}
            <path
              d="M 220,380 L 280,380 L 270,350 L 230,350 Z"
              fill={getZoneFillColor('gate_c')}
              stroke={getZoneStrokeColor('gate_c')}
              strokeWidth="2"
              style={{ cursor: 'pointer', transition: 'all 0.25s', outline: 'none' }}
              tabIndex={0}
              role="button"
              aria-label="Gate C South Entrance queue zone. Wait-times and bottlenecks detail available."
              onClick={() => handleZoneClick('gate_c')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleZoneClick('gate_c');
                }
              }}
            />
            <text x="250" y="370" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>GATE C</text>

            {/* Gate D (West) */}
            <path
              d="M 50,170 L 20,180 L 20,220 L 50,230 Z"
              fill={getZoneFillColor('gate_d')}
              stroke={getZoneStrokeColor('gate_d')}
              strokeWidth="2"
              style={{ cursor: 'pointer', transition: 'all 0.25s', outline: 'none' }}
              tabIndex={0}
              role="button"
              aria-label="Gate D West Entrance queue zone. Wait-times and bottlenecks detail available."
              onClick={() => handleZoneClick('gate_d')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleZoneClick('gate_d');
                }
              }}
            />
            <text x="35" y="204" fill="white" fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(-90 35 204)" style={{ pointerEvents: 'none' }}>GATE D</text>

            {/* Restrooms Zone (Inner Lower Left) */}
            <rect 
              x="135" y="275" width="40" height="25" rx="5"
              fill={getZoneFillColor('restrooms')}
              stroke={getZoneStrokeColor('restrooms')}
              strokeWidth="2"
              style={{ cursor: 'pointer', transition: 'all 0.25s', outline: 'none' }}
              tabIndex={0}
              role="button"
              aria-label="WC Main Restrooms facility zone. Wait-time metrics available."
              onClick={() => handleZoneClick('restrooms')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleZoneClick('restrooms');
                }
              }}
            />
            <text x="155" y="291" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>WC</text>

            {/* Concessions Zone (Inner Lower Right) */}
            <rect 
              x="325" y="275" width="40" height="25" rx="5"
              fill={getZoneFillColor('concessions')}
              stroke={getZoneStrokeColor('concessions')}
              strokeWidth="2"
              style={{ cursor: 'pointer', transition: 'all 0.25s', outline: 'none' }}
              tabIndex={0}
              role="button"
              aria-label="Concessions Concourse food zone. Wait-time metrics available."
              onClick={() => handleZoneClick('concessions')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleZoneClick('concessions');
                }
              }}
            />
            <text x="345" y="291" fill="white" fontSize="9" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>FOOD</text>
          </svg>

          {/* Active alerts markers */}
          {incidents.filter(inc => inc.status !== 'resolved').map(inc => {
            let coords = { x: '50%', y: '50%' };
            if (inc.zone === 'gate_a') coords = { x: '50%', y: '12%' };
            else if (inc.zone === 'gate_b') coords = { x: '91%', y: '50%' };
            else if (inc.zone === 'gate_c') coords = { x: '50%', y: '88%' };
            else if (inc.zone === 'gate_d') coords = { x: '9%', y: '50%' };
            else if (inc.zone === 'sect_100') coords = { x: '50%', y: '31%' };
            else if (inc.zone === 'sect_200') coords = { x: '50%', y: '20%' };
            else if (inc.zone === 'restrooms') coords = { x: '31%', y: '72%' };
            else if (inc.zone === 'concessions') coords = { x: '69%', y: '72%' };

            return (
              <div 
                key={inc.id}
                style={{
                  position: 'absolute',
                  left: coords.x,
                  top: coords.y,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse-red 1.2s infinite'
                }}
              >
                <div style={{ backgroundColor: 'var(--danger)', borderRadius: '50%', padding: '4px', display: 'flex', border: '2px solid white' }}>
                  <ShieldAlert size={12} color="white" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '20px', fontSize: '0.8rem', marginTop: '10px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(16, 185, 129, 0.25)', border: '1px solid var(--success)' }}></span>
            Low Density / Nominal
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(245, 158, 11, 0.25)', border: '1px solid var(--warning)' }}></span>
            Medium Queue
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'rgba(239, 68, 68, 0.25)', border: '1px solid var(--danger)' }}></span>
            High Queue / Active Incident
          </div>
        </div>
      </div>

      {/* Side Detail & Action Panel */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {selectedZone ? (
          <>
            <div>
              <span className="badge badge-info" style={{ marginBottom: '8px' }}>
                {getZoneInfo(selectedZone).type.toUpperCase()}
              </span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {getZoneInfo(selectedZone).name}
              </h2>
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Live Zone Telemetry
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
                  <span className={`badge ${
                    getZoneInfo(selectedZone).status === 'alert' ? 'badge-danger' : 
                    getZoneInfo(selectedZone).status === 'high' ? 'badge-warning' :
                    getZoneInfo(selectedZone).status === 'medium' ? 'badge-info' : 'badge-success'
                  }`}>
                    {getZoneInfo(selectedZone).status.toUpperCase()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Operational Data:</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                    {getZoneInfo(selectedZone).metrics}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Alerts:</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500', color: activeZoneIncidents.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
                    {activeZoneIncidents.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Alerts in this Zone */}
            <div style={{ flexGrow: 1 }}>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Active Issues in Zone
              </h3>
              {activeZoneIncidents.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px 0', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
                  No active incidents in this area.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activeZoneIncidents.map(inc => (
                    <div 
                      key={inc.id}
                      style={{ 
                        borderLeft: `3px solid var(--${inc.priority === 'critical' ? 'danger' : inc.priority === 'high' ? 'warning' : 'accent-blue'})`,
                        backgroundColor: 'var(--bg-secondary)',
                        padding: '12px',
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.85rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                        <span>{inc.title}</span>
                        <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                          {inc.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0' }}>
                        {inc.description}
                      </p>
                      
                      {inc.status === 'open' ? (
                        <div style={{ marginTop: '8px' }}>
                          {dispatchTargetIncidentId === inc.id ? (
                            <div>
                              <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Responder:</label>
                              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                <select 
                                  className="form-select" 
                                  style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      dispatchStaff(inc.id, e.target.value);
                                      setDispatchTargetIncidentId(null);
                                    }
                                  }}
                                  defaultValue=""
                                >
                                  <option value="" disabled>Choose available staff...</option>
                                  {availableStaff.map(s => (
                                    <option key={s.id} value={s.id}>
                                      {s.name} ({s.role} - Active tasks: {s.assignedTasks})
                                    </option>
                                  ))}
                                </select>
                                <button className="btn btn-secondary btn-sm" onClick={() => setDispatchTargetIncidentId(null)}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button className="btn btn-primary btn-sm" onClick={() => setDispatchTargetIncidentId(inc.id)}>
                              Dispatch Guard
                            </button>
                          )}
                        </div>
                      ) : inc.status === 'dispatched' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <Users size={12} />
                          <span>Assigned: {staff.find(s => s.id === inc.staffAssigned)?.name}</span>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Report Section */}
            <div>
              {showQuickReport ? (
                <form onSubmit={submitQuickReport} className="glass-panel" style={{ padding: '16px', background: 'var(--bg-tertiary)' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertTriangle size={14} color="var(--warning)" />
                    Quick Report Incident
                  </h4>
                  
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label">Issue Title</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={quickTitle} 
                      onChange={e => setQuickTitle(e.target.value)}
                      placeholder="e.g. Broken lock on stall"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label">Description</label>
                    <textarea 
                      className="form-input" 
                      rows={2}
                      value={quickDesc} 
                      onChange={e => setQuickDesc(e.target.value)}
                      placeholder="Give details..."
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Category</label>
                      <select 
                        className="form-select" 
                        value={quickCategory}
                        onChange={e => setQuickCategory(e.target.value as any)}
                      >
                        <option value="security">Security</option>
                        <option value="crowd">Crowd</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="medical">Medical</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Priority</label>
                      <select 
                        className="form-select" 
                        value={quickPriority}
                        onChange={e => setQuickPriority(e.target.value as any)}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn btn-primary btn-sm" style={{ flexGrow: 1 }}>
                      Submit Report
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowQuickReport(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px' }}
                  onClick={() => setShowQuickReport(true)}
                >
                  <AlertTriangle size={16} />
                  Report Incident in this Zone
                </button>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'var(--text-muted)', gap: '12px', padding: '40px 0' }}>
            <MapPin size={40} strokeWidth={1} />
            <p style={{ textAlign: 'center', fontSize: '0.9rem' }}>
              Click any gate, seating tier, or concessions area on the map to review details, monitor live telemetry, or dispatch staff.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
