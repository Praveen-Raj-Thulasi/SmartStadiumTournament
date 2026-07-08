import React from 'react';
import { Users, Flame, AlertTriangle, Activity, ShieldAlert, CheckCircle2, Trophy } from 'lucide-react';
import type { Match, Incident, Staff, StadiumMetrics, UserRole, DashboardView } from '../hooks/useStadiumState';

interface OverviewDashboardProps {
  matches: Match[];
  incidents: Incident[];
  staff: Staff[];
  metrics: StadiumMetrics;
  role: UserRole;
  resolveIncident: (incidentId: string) => Promise<void> | void;
  setView: (view: DashboardView) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = React.memo(({
  matches,
  incidents,
  staff,
  metrics,
  role,
  resolveIncident,
  setView
}) => {
  const liveMatches = matches.filter(m => m.status === 'live');
  const activeIncidents = incidents.filter(i => i.status !== 'resolved');
  const activeStaff = staff.filter(s => s.status === 'active');
  const capacityPercent = Math.round((metrics.liveCapacity / metrics.maxCapacity) * 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Core Quick Metrics */}
      <div className="stats-grid">
        
        <div className="glass-panel stat-card">
          <div className="stat-card-info">
            <span className="stat-card-label">Live Capacity</span>
            <span className="stat-card-value">{capacityPercent}%</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {metrics.liveCapacity.toLocaleString()} / {metrics.maxCapacity.toLocaleString()}
            </span>
          </div>
          <div className="stat-card-icon" style={{ color: 'var(--accent-cyan)' }}>
            <Users size={22} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-card-info">
            <span className="stat-card-label">Grid Load</span>
            <span className="stat-card-value">{metrics.energyConsumption} kW</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Stadium utilities active</span>
          </div>
          <div className="stat-card-icon" style={{ color: 'var(--success)' }}>
            <Flame size={22} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-card-info">
            <span className="stat-card-label">Active Incidents</span>
            <span className="stat-card-value" style={{ color: activeIncidents.length > 0 ? 'var(--danger)' : 'inherit' }}>
              {activeIncidents.length}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {activeIncidents.filter(i => i.status === 'open').length} unassigned
            </span>
          </div>
          <div className="stat-card-icon" style={{ color: 'var(--danger)' }}>
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-card-info">
            <span className="stat-card-label">Roster Ready</span>
            <span className="stat-card-value">{activeStaff.length}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {staff.filter(s => s.status === 'on_break').length} on break
            </span>
          </div>
          <div className="stat-card-icon" style={{ color: 'var(--accent-purple)' }}>
            <Activity size={22} />
          </div>
        </div>

      </div>

      {/* Dynamic Split Layout: Alerts list on left, Tournament Feed on right */}
      <div className="grid-2col" style={{ gridTemplateColumns: '1.1fr 0.9fr' }}>
        
        {/* Active safety log */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={16} color="var(--danger)" />
              Active Operations Incident Log
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setView('incidents')}>
              Manage Tickets
            </button>
          </div>

          {activeIncidents.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, padding: '40px 0', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={32} color="var(--success)" style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: '0.85rem' }}>All safety sectors reported nominal. No active logs.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeIncidents.map(inc => (
                <div 
                  key={inc.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `3px solid var(--${inc.priority === 'critical' ? 'danger' : inc.priority === 'high' ? 'warning' : 'accent-blue'})`,
                    borderRadius: '4px',
                    padding: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-danger" style={{ fontSize: '0.6rem', padding: '1px 4px', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                        {inc.priority.toUpperCase()}
                      </span>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: '600' }}>{inc.title}</h4>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Loc: {inc.zone.replace('_', ' ').toUpperCase()} | Status: <span style={{ textTransform: 'capitalize' }}>{inc.status}</span>
                    </p>
                  </div>

                  {/* Quick Resolve (Security/Director only) */}
                  {role !== 'guest_services' && inc.status === 'dispatched' && (
                    <button 
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', borderColor: 'var(--success)', color: 'var(--success)' }}
                      onClick={() => resolveIncident(inc.id)}
                    >
                      Resolve
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tournament Overview */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={16} color="var(--accent-cyan)" />
              Tournament Control Ticker
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setView('matches')}>
              View Bracket
            </button>
          </div>

          {liveMatches.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexGrow: 1, padding: '40px 0', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)' }}>
              <Trophy size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: '0.85rem' }}>No matches are currently active.</p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Open brackets to kick off quarterfinals matches.
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {liveMatches.map(m => (
                <div 
                  key={m.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '12px',
                    animation: 'pulse-green 3s infinite'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    <span>MATCH #{m.id} - LIVE ROUND {m.round}</span>
                    <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>LIVE</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: m.team1?.logoColor }}></span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{m.team1?.name}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>{m.score1}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: m.team2?.logoColor }}></span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{m.team2?.name}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 'bold' }}>{m.score2}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick check on gate statuses */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Gate Bottlenecks Check
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
              {Object.entries(metrics.gateCrowdLevel).map(([gate, level]) => (
                <div key={gate} style={{ background: 'var(--bg-tertiary)', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '500' }}>{gate.replace('gate_', '').toUpperCase()}</div>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 'bold', 
                    color: level === 'high' ? 'var(--danger)' : level === 'medium' ? 'var(--warning)' : 'var(--success)'
                  }}>
                    {level.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
});
