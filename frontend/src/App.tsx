import { useState, lazy, Suspense } from 'react';
import { useStadiumState } from './hooks/useStadiumState';
import type { UserRole } from './hooks/useStadiumState';
import { 
  LayoutDashboard, Trophy, Map, AlertTriangle, Users, BarChart3, 
  Activity, ShieldAlert, CheckCircle2, ChevronRight, LogOut
} from 'lucide-react';

// Lazy loading all pages to optimize bundle splitting
const OverviewDashboard = lazy(() => import('./components/OverviewDashboard').then(m => ({ default: m.OverviewDashboard })));
const StadiumMap = lazy(() => import('./components/StadiumMap').then(m => ({ default: m.StadiumMap })));
const TournamentBracket = lazy(() => import('./components/TournamentBracket').then(m => ({ default: m.TournamentBracket })));
const IncidentManager = lazy(() => import('./components/IncidentManager').then(m => ({ default: m.IncidentManager })));
const StaffShiftBoard = lazy(() => import('./components/StaffShiftBoard').then(m => ({ default: m.StaffShiftBoard })));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const LoginPanel = lazy(() => import('./components/LoginPanel').then(m => ({ default: m.LoginPanel })));

function App() {
  const state = useStadiumState();
  const { 
    token, user, logoutUser, role, view, setView, matches, incidents, staff, metrics, 
    errorMsg, successMsg, resolveIncident 
  } = state;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Helper to format role names
  const formatRoleName = (r: UserRole) => {
    switch (r) {
      case 'director': return 'Tournament Director';
      case 'security': return 'Stadium Security Chief';
      case 'guest_services': return 'Guest Services Lead';
    }
  };

  // Helper to render the active panel using prop isolation
  const renderActiveView = () => {
    switch (view) {
      case 'matches':
        return (
          <TournamentBracket 
            matches={matches} 
            updateMatchScore={state.updateMatchScore} 
            role={role} 
            triggerError={state.triggerError} 
          />
        );
      case 'map':
        return (
          <StadiumMap 
            metrics={metrics} 
            incidents={incidents} 
            staff={staff} 
            reportIncident={state.reportIncident} 
            dispatchStaff={state.dispatchStaff} 
          />
        );
      case 'incidents':
        return (
          <IncidentManager 
            incidents={incidents} 
            staff={staff} 
            reportIncident={state.reportIncident} 
            dispatchStaff={state.dispatchStaff} 
            resolveIncident={resolveIncident} 
            role={role} 
            triggerError={state.triggerError} 
          />
        );
      case 'staff':
        return (
          <StaffShiftBoard 
            staff={staff} 
            updateStaffStatus={state.updateStaffStatus} 
            addStaffMember={state.addStaffMember} 
            role={role} 
            triggerError={state.triggerError} 
          />
        );
      case 'analytics':
        return (
          <AnalyticsDashboard 
            metrics={metrics} 
            incidents={incidents} 
          />
        );
      case 'overview':
      default:
        return (
          <OverviewDashboard 
            matches={matches} 
            incidents={incidents} 
            staff={staff} 
            metrics={metrics} 
            role={role} 
            resolveIncident={resolveIncident} 
            setView={setView} 
          />
        );
    }
  };

  // Loader block for lazy components
  const renderLoader = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: 'var(--text-secondary)' }}>
      <Activity size={32} className="pulse-green" style={{ marginBottom: '12px' }} />
      <span style={{ fontSize: '0.85rem', letterSpacing: '0.05em' }}>Loading Operations Portal...</span>
    </div>
  );

  if (!token) {
    return (
      <div className="app-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {successMsg && (
          <div 
            className="glass-panel"
            role="status"
            aria-live="polite"
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 1000,
              borderLeft: '4px solid var(--success)',
              background: 'rgba(16, 185, 129, 0.15)',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              borderRadius: '8px',
              animation: 'scale-up 0.2s ease-out'
            }}
          >
            <CheckCircle2 size={18} color="var(--success)" />
            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div 
            className="glass-panel"
            role="alert"
            aria-live="assertive"
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              zIndex: 1000,
              borderLeft: '4px solid var(--danger)',
              background: 'rgba(239, 68, 68, 0.15)',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 20px',
              borderRadius: '8px',
              animation: 'scale-up 0.2s ease-out'
            }}
          >
            <ShieldAlert size={18} color="var(--danger)" />
            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{errorMsg}</span>
          </div>
        )}
        <Suspense fallback={renderLoader()}>
          <LoginPanel 
            loginUser={state.loginUser} 
            registerUser={state.registerUser} 
            triggerError={state.triggerError} 
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* Toast Alert Popups */}
      {successMsg && (
        <div 
          className="glass-panel"
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            borderLeft: '4px solid var(--success)',
            background: 'rgba(16, 185, 129, 0.15)',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            borderRadius: '8px',
            animation: 'scale-up 0.2s ease-out'
          }}
        >
          <CheckCircle2 size={18} color="var(--success)" />
          <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div 
          className="glass-panel"
          role="alert"
          aria-live="assertive"
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            borderLeft: '4px solid var(--danger)',
            background: 'rgba(239, 68, 68, 0.15)',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 20px',
            borderRadius: '8px',
            animation: 'scale-up 0.2s ease-out'
          }}
        >
          <ShieldAlert size={18} color="var(--danger)" />
          <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>{errorMsg}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <nav className="sidebar" style={{ width: sidebarCollapsed ? '70px' : '260px', transition: 'width 0.25s ease' }}>
        <div className="sidebar-logo">
          <Activity size={24} color="var(--accent-cyan)" />
          {!sidebarCollapsed && <span className="logo-text">ArenaFlow</span>}
        </div>

        <ul className="nav-menu" role="tablist" aria-label="Operations Portal Navigation">
          <li className="nav-item" role="none">
            <button 
              id="nav-overview"
              role="tab"
              aria-selected={view === 'overview'}
              className={`nav-link ${view === 'overview' ? 'active' : ''}`}
              onClick={() => setView('overview')}
              title="Overview Dashboard"
            >
              <LayoutDashboard size={18} />
              {!sidebarCollapsed && <span>Overview</span>}
            </button>
          </li>
          <li className="nav-item" role="none">
            <button 
              id="nav-matches"
              role="tab"
              aria-selected={view === 'matches'}
              className={`nav-link ${view === 'matches' ? 'active' : ''}`}
              onClick={() => setView('matches')}
              title="Tournament Bracket"
            >
              <Trophy size={18} />
              {!sidebarCollapsed && <span>Live Matches</span>}
            </button>
          </li>
          <li className="nav-item" role="none">
            <button 
              id="nav-map"
              role="tab"
              aria-selected={view === 'map'}
              className={`nav-link ${view === 'map' ? 'active' : ''}`}
              onClick={() => setView('map')}
              title="Interactive Stadium Map"
            >
              <Map size={18} />
              {!sidebarCollapsed && <span>Venue Map</span>}
            </button>
          </li>
          <li className="nav-item" role="none">
            <button 
              id="nav-incidents"
              role="tab"
              aria-selected={view === 'incidents'}
              className={`nav-link ${view === 'incidents' ? 'active' : ''}`}
              onClick={() => setView('incidents')}
              title="Incident Management logs"
            >
              <AlertTriangle size={18} />
              {!sidebarCollapsed && <span>Incident Control</span>}
            </button>
          </li>
          <li className="nav-item" role="none">
            <button 
              id="nav-staff"
              role="tab"
              aria-selected={view === 'staff'}
              className={`nav-link ${view === 'staff' ? 'active' : ''}`}
              onClick={() => setView('staff')}
              title="Staffing Coordination board"
            >
              <Users size={18} />
              {!sidebarCollapsed && <span>Staffing Board</span>}
            </button>
          </li>
          <li className="nav-item" role="none">
            <button 
              id="nav-analytics"
              role="tab"
              aria-selected={view === 'analytics'}
              className={`nav-link ${view === 'analytics' ? 'active' : ''}`}
              onClick={() => setView('analytics')}
              title="Analytics Reports"
            >
              <BarChart3 size={18} />
              {!sidebarCollapsed && <span>Operations Analytics</span>}
            </button>
          </li>
        </ul>

        {/* Sidebar Footer - Settings (Collapsing toggle & role settings) */}
        <div className="sidebar-footer">
          <button 
            className="nav-link" 
            style={{ marginBottom: '12px', padding: '8px 16px', fontSize: '0.8rem' }}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-expanded={!sidebarCollapsed}
            aria-label="Toggle Sidebar Navigation"
          >
            <ChevronRight size={16} style={{ transform: sidebarCollapsed ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s' }} />
            {!sidebarCollapsed && <span>Collapse Sidebar</span>}
          </button>

          {!sidebarCollapsed && user && (
            <div className="role-tag-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="role-tag-label">Authenticated Profile</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                @{user.username}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Role: {formatRoleName(user.role)}
              </div>
              <button 
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginTop: '6px', gap: '6px', borderColor: 'var(--danger)', color: 'var(--danger)', padding: '6px 12px' }}
                onClick={logoutUser}
              >
                <LogOut size={12} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Pane */}
      <main className="main-content">
        
        {/* Top Ticker Status Bar */}
        <header className="top-bar">
          <div>
            <h1 className="dashboard-title" style={{ fontSize: '1rem', fontWeight: 700 }}>
              {view === 'overview' ? 'Shared Operational Picture' : view.toUpperCase() + ' PORTAL'}
            </h1>
          </div>

          <div className="status-ticks">
            <div className="status-tick-item">
              <span className="status-dot active"></span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Event Operations: ACTIVE
              </span>
            </div>

            <div className="status-tick-item">
              <span className="status-dot danger"></span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Open Incidents: {incidents.filter(i => i.status === 'open').length}
              </span>
            </div>

            <div className="status-tick-item" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
              <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-display)', color: 'var(--accent-cyan)' }}>
                {formatRoleName(role).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Content Body with Suspense fallback for split chunks */}
        <div className="content-body">
          <Suspense fallback={renderLoader()}>
            {renderActiveView()}
          </Suspense>
        </div>

      </main>

    </div>
  );
}

export default App;
