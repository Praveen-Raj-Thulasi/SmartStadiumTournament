import React from 'react';
import { useStadiumState } from '../hooks/useStadiumState';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Clock, ShieldAlert, Sparkles, Activity } from 'lucide-react';

interface AnalyticsDashboardProps {
  state: ReturnType<typeof useStadiumState>;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ state }) => {
  const { metrics, incidents } = state;

  // 1. Data mapping for Concessions Wait Times
  const concessionsData = Object.entries(metrics.concessionQueueTimes).map(([key, val]) => ({
    name: key.replace('booth_', 'Booth '),
    minutes: val,
  }));

  // 2. Data mapping for Restroom Wait Times
  const restroomData = Object.entries(metrics.restroomWaitTimes).map(([key, val]) => ({
    name: `${key.charAt(0).toUpperCase() + key.slice(1)} Wing`,
    minutes: val,
  }));

  // 3. Data mapping for Incident Breakdown by Category
  const categoryCounts = incidents.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  const categories = ['security', 'crowd', 'maintenance', 'medical'];
  const incidentChartData = categories.map(c => ({
    name: c.charAt(0).toUpperCase() + c.slice(1),
    value: categoryCounts[c] || 0,
  })).filter(item => item.value > 0);

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

  // 4. Capacity vs Max Capacity Gauge percentage
  const occupancyPercent = Math.round((metrics.liveCapacity / metrics.maxCapacity) * 100);

  // Mock data for ticket scanning throughput curve
  const throughputData = [
    { hour: '18:00', scans: 1200 },
    { hour: '18:30', scans: 4500 },
    { hour: '19:00', scans: 12200 },
    { hour: '19:30', scans: 24500 },
    { hour: '20:00', scans: 31000 },
    { hour: '20:30', scans: metrics.liveCapacity }, // link to live cap
  ];

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Overview Stats Cards */}
      <div 
        className="glass-panel" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderLeft: '3px solid var(--accent-cyan)'
        }}
      >
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity style={{ color: 'var(--accent-cyan)' }} />
            Stadium Telemetry & Logistics Analytics
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Real-time charts plotting crowd entry rates, concession bottlenecks, and response tracking.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span className="badge badge-success" style={{ gap: '4px' }}>
            <Sparkles size={12} />
            Live Ticker Active
          </span>
        </div>
      </div>

      {/* Grid: Occupancy scan line & Concession queue comparisons */}
      <div className="grid-2col">
        {/* Occupancy flow chart */}
        <div className="glass-panel" style={{ minHeight: '340px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={16} color="var(--accent-cyan)" />
              Ticket Scanning Throughput (Cumulative Entry)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Shows scan rates leading up to kickoff. Current load is {occupancyPercent}% ({metrics.liveCapacity.toLocaleString()} / {metrics.maxCapacity.toLocaleString()} seats filled).
            </p>
          </div>
          
          <div style={{ flexGrow: 1, width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={throughputData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }} 
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="scans" stroke="var(--accent-cyan)" strokeWidth={2} fillOpacity={1} fill="url(#scanGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Concessions Queue times */}
        <div className="glass-panel" style={{ minHeight: '340px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="var(--warning)" />
              Concession Queues (Average Delays)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Compares wait-times across stadium concession nodes. Alert levels trigger if wait-time exceeds 10 mins.
            </p>
          </div>

          <div style={{ flexGrow: 1, width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={concessionsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} unit="m" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }} 
                />
                <Bar dataKey="minutes" fill="var(--warning)" radius={[4, 4, 0, 0]}>
                  {concessionsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.minutes > 10 ? 'var(--danger)' : 'var(--warning)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Restroom waiting times & Incident log category distribution */}
      <div className="grid-2col" style={{ gridTemplateColumns: '0.9fr 1.1fr' }}>
        
        {/* Incident breakdown by category */}
        <div className="glass-panel" style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={16} color="var(--danger)" />
              Incident Reports Distribution
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Ratios of safety, security, and facility issues reported during this event session.
            </p>
          </div>

          {incidentChartData.length === 0 ? (
            <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No incidents logged yet to plot.
            </div>
          ) : (
            <div style={{ display: 'flex', flexGrow: 1, justifyContent: 'space-around', alignItems: 'center' }}>
              <div style={{ width: '150px', height: '150px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incidentChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {incidentChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legends details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                {incidentChartData.map((entry, index) => (
                  <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: COLORS[index % COLORS.length] }}></span>
                    <span style={{ fontWeight: '500' }}>{entry.name}:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{entry.value} ticket(s)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Restroom queue performance */}
        <div className="glass-panel" style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="var(--accent-cyan)" />
              Restroom Wait Time Telemetry
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Monitors queue sensor delays to prompt cleaning schedules or gate directions.
            </p>
          </div>

          <div style={{ flexGrow: 1, width: '100%', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={restroomData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} />
                <YAxis stroke="var(--text-muted)" fontSize={11} unit="m" />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }} 
                />
                <Bar dataKey="minutes" fill="var(--accent-cyan)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
