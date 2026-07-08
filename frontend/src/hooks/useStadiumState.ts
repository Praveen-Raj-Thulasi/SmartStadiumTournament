import { useState, useEffect, useCallback } from 'react';

// Types
export type UserRole = 'director' | 'security' | 'guest_services';
export type DashboardView = 'overview' | 'matches' | 'map' | 'incidents' | 'staff' | 'analytics';

export interface Team {
  id: string;
  name: string;
  logoColor: string;
}

export interface Match {
  id: number;
  round: number; // 1: Quarterfinals, 2: Semifinals, 3: Finals
  team1: Team | null;
  team2: Team | null;
  score1: number | null;
  score2: number | null;
  status: 'scheduled' | 'live' | 'completed';
  winnerId: string | null;
  time: string;
  prevMatch1Id?: number;
  prevMatch2Id?: number;
}

export type IncidentCategory = 'security' | 'crowd' | 'maintenance' | 'medical';
export type IncidentPriority = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'dispatched' | 'resolved';

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  priority: IncidentPriority;
  status: IncidentStatus;
  zone: string;
  staffAssigned: string | null;
  reportedAt: string;
  resolvedAt?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'security' | 'medical' | 'janitorial' | 'technician';
  status: 'active' | 'inactive' | 'on_break';
  assignedTasks: number;
}

export interface StadiumMetrics {
  liveCapacity: number;
  maxCapacity: number;
  energyConsumption: number;
  avgGateTime: number;
  gateCrowdLevel: { [key: string]: 'low' | 'medium' | 'high' };
  restroomWaitTimes: { [key: string]: number };
  concessionQueueTimes: { [key: string]: number };
}

export interface UserSession {
  id: string;
  username: string;
  role: UserRole;
}

export const useStadiumState = () => {
  // Navigation & Identity state
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('arena_token') || null;
  });

  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('arena_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [view, setView] = useState<DashboardView>(() => {
    return (localStorage.getItem('arena_view') as DashboardView) || 'overview';
  });

  // Backend Synchronized States
  const [matches, setMatches] = useState<Match[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [metrics, setMetrics] = useState<StadiumMetrics>({
    liveCapacity: 0,
    maxCapacity: 45000,
    energyConsumption: 0,
    avgGateTime: 0,
    gateCrowdLevel: {},
    restroomWaitTimes: {},
    concessionQueueTimes: {}
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Computed active role
  const role: UserRole = user ? user.role : 'guest_services';

  // Sync view selection locally
  useEffect(() => {
    localStorage.setItem('arena_view', view);
  }, [view]);

  // Alert timers
  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const triggerSuccess = (msg: string) => {
    setErrorMsg(null);
    setSuccessMsg(msg);
  };

  const triggerError = (msg: string) => {
    setSuccessMsg(null);
    setErrorMsg(msg);
  };

  // --- API DATA FETCHERS ---

  const fetchConsolidatedData = useCallback(async () => {
    try {
      const res = await fetch('/api/metrics/consolidated');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics);
        setMatches(data.matches);
        setIncidents(data.incidents);
        setStaff(data.staff);
      }
    } catch (err) {
      console.error('Error loading consolidated dashboard data:', err);
    }
  }, []);

  // Initial loading
  useEffect(() => {
    fetchConsolidatedData();
  }, [fetchConsolidatedData]);

  // Poll for live metrics telemetry changes and updates (consolidated endpoint)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConsolidatedData();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchConsolidatedData]);

  // --- AUTH OPERATIONS ---

  const loginUser = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        triggerError(data.error || 'Login failed.');
        return false;
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('arena_token', data.token);
      localStorage.setItem('arena_user', JSON.stringify(data.user));
      triggerSuccess(`Successfully authenticated as ${data.user.username}`);
      return true;
    } catch {
      triggerError('Network error connecting to auth server.');
      return false;
    }
  }, []);

  const registerUser = useCallback(async (username: string, password: string, selectedRole: UserRole): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: selectedRole })
      });
      const data = await res.json();

      if (!res.ok) {
        triggerError(data.error || 'Registration failed.');
        return false;
      }

      triggerSuccess('Account created successfully. You can now login.');
      return true;
    } catch {
      triggerError('Network error connecting to auth server.');
      return false;
    }
  }, []);

  const logoutUser = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('arena_token');
    localStorage.removeItem('arena_user');
    triggerSuccess('Logged out successfully.');
  }, []);

  // --- API MUTATIONS ---

  const updateMatchScore = useCallback(async (
    matchId: number,
    score1: number,
    score2: number,
    status: Match['status']
  ) => {
    if (!token) {
      triggerError('Authorization Required: Please login to update match scores.');
      return false;
    }

    try {
      const res = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score1, score2, status })
      });

      const data = await res.json();
      
      if (!res.ok) {
        triggerError(data.error || 'Failed to update match score.');
        return false;
      }

      triggerSuccess(data.message || 'Match scores updated successfully.');
      fetchConsolidatedData();
      return true;
    } catch {
      triggerError('Network error connecting to backend server.');
      return false;
    }
  }, [token, fetchConsolidatedData]);

  const reportIncident = useCallback(async (
    title: string,
    description: string,
    category: IncidentCategory,
    priority: IncidentPriority,
    zone: string
  ) => {
    if (!token) {
      triggerError('Authorization Required: Please login to file incident reports.');
      return false;
    }

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, description, category, priority, zone })
      });

      const data = await res.json();

      if (!res.ok) {
        triggerError(data.error || 'Failed to file incident report.');
        return false;
      }

      triggerSuccess(data.message || 'Incident logged successfully.');
      fetchConsolidatedData();
      return true;
    } catch {
      triggerError('Network error connecting to backend server.');
      return false;
    }
  }, [token, fetchConsolidatedData]);

  const dispatchStaff = useCallback(async (incidentId: string, staffId: string) => {
    if (!token) {
      triggerError('Authorization Required: Please login to dispatch guards.');
      return;
    }

    try {
      const res = await fetch(`/api/incidents/${incidentId}/dispatch`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ staffId })
      });

      const data = await res.json();

      if (!res.ok) {
        triggerError(data.error || 'Failed to dispatch responder.');
        return;
      }

      triggerSuccess(data.message || 'Responder dispatched.');
      fetchConsolidatedData();
    } catch {
      triggerError('Network error connecting to backend server.');
    }
  }, [token, fetchConsolidatedData]);

  const resolveIncident = useCallback(async (incidentId: string) => {
    if (!token) {
      triggerError('Authorization Required: Please login to resolve incidents.');
      return;
    }

    try {
      const res = await fetch(`/api/incidents/${incidentId}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();

      if (!res.ok) {
        triggerError(data.error || 'Failed to resolve incident.');
        return;
      }

      triggerSuccess(data.message || 'Incident marked resolved.');
      fetchConsolidatedData();
    } catch {
      triggerError('Network error connecting to backend server.');
    }
  }, [token, fetchConsolidatedData]);

  const updateStaffStatus = useCallback(async (staffId: string, status: Staff['status']) => {
    if (!token) {
      triggerError('Authorization Required: Please login to update roster status.');
      return;
    }

    try {
      const res = await fetch(`/api/staff/${staffId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await res.json();

      if (!res.ok) {
        triggerError(data.error || 'Failed to update roster status.');
        return;
      }

      triggerSuccess(data.message || 'Staff roster shift status updated.');
      fetchConsolidatedData();
    } catch {
      triggerError('Network error connecting to backend server.');
    }
  }, [token, fetchConsolidatedData]);

  const addStaffMember = useCallback(async (name: string, roleVal: Staff['role']) => {
    if (!token) {
      triggerError('Authorization Required: Please login to register staff.');
      return false;
    }

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, role: roleVal })
      });

      const data = await res.json();

      if (!res.ok) {
        triggerError(data.error || 'Failed to register new staff member.');
        return false;
      }

      triggerSuccess(data.message || 'Staff registered.');
      fetchConsolidatedData();
      return true;
    } catch {
      triggerError('Network error connecting to backend server.');
      return false;
    }
  }, [token, fetchConsolidatedData]);

  return {
    token,
    user,
    role,
    view,
    setView,
    matches,
    incidents,
    staff,
    metrics,
    errorMsg,
    successMsg,
    loginUser,
    registerUser,
    logoutUser,
    updateMatchScore,
    reportIncident,
    dispatchStaff,
    resolveIncident,
    updateStaffStatus,
    addStaffMember,
    triggerError,
    triggerSuccess
  };
};
