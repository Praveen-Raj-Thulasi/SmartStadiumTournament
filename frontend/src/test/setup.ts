import '@testing-library/jest-dom';

// In-memory data store for tests
let store: { [key: string]: string } = {};

const localStorageMock = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => {
    store[key] = value.toString();
  },
  clear: () => {
    store = {};
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  length: 0,
  key: (_index: number) => '',
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock Initial Data for fetch interceptor
const INITIAL_TEAMS = [
  { id: '1', name: 'Cyber Knights', logoColor: '#00f0ff' },
  { id: '2', name: 'Apex Wolves', logoColor: '#ef4444' },
  { id: '3', name: 'Solar Titans', logoColor: '#f59e0b' },
  { id: '4', name: 'Hyper Strikers', logoColor: '#a855f7' },
  { id: '5', name: 'Quantum Phantoms', logoColor: '#10b981' },
  { id: '6', name: 'Shadow Eclipse', logoColor: '#3b82f6' },
  { id: '7', name: 'Neon Vipers', logoColor: '#ec4899' },
  { id: '8', name: 'Delta Rangers', logoColor: '#84cc16' },
];

let mockMatches: any[] = [];
let mockStaff: any[] = [];
let mockIncidents: any[] = [];

const resetMockDb = () => {
  mockMatches = [
    { id: 1, round: 1, team1: INITIAL_TEAMS[0], team2: INITIAL_TEAMS[1], score1: null, score2: null, status: 'scheduled', winnerId: null, time: '14:00' },
    { id: 2, round: 1, team1: INITIAL_TEAMS[2], team2: INITIAL_TEAMS[3], score1: null, score2: null, status: 'scheduled', winnerId: null, time: '15:30' },
    { id: 3, round: 1, team1: INITIAL_TEAMS[4], team2: INITIAL_TEAMS[5], score1: null, score2: null, status: 'scheduled', winnerId: null, time: '17:00' },
    { id: 4, round: 1, team1: INITIAL_TEAMS[6], team2: INITIAL_TEAMS[7], score1: null, score2: null, status: 'scheduled', winnerId: null, time: '18:30' },
    { id: 5, round: 2, team1: null, team2: null, score1: null, score2: null, status: 'scheduled', winnerId: null, time: '20:00', prevMatch1Id: 1, prevMatch2Id: 2 },
    { id: 6, round: 2, team1: null, team2: null, score1: null, score2: null, status: 'scheduled', winnerId: null, time: '21:30', prevMatch1Id: 3, prevMatch2Id: 4 },
    { id: 7, round: 3, team1: null, team2: null, score1: null, score2: null, status: 'scheduled', winnerId: null, time: '23:00', prevMatch1Id: 5, prevMatch2Id: 6 },
  ];

  mockStaff = [
    { id: 's1', name: 'Marcus Vance', role: 'security', status: 'active', assignedTasks: 0 },
    { id: 's2', name: 'Elena Rostova', role: 'security', status: 'active', assignedTasks: 0 },
    { id: 's3', name: 'Tariq Al-Fayed', role: 'security', status: 'active', assignedTasks: 0 },
    { id: 's4', name: 'Sarah Jenkins', role: 'medical', status: 'active', assignedTasks: 0 },
    { id: 's5', name: 'David Chen', role: 'janitorial', status: 'active', assignedTasks: 0 },
    { id: 's6', name: 'Liam O\'Connor', role: 'janitorial', status: 'on_break', assignedTasks: 0 },
    { id: 's7', name: 'Zoe Miller', role: 'technician', status: 'active', assignedTasks: 0 },
  ];

  mockIncidents = [
    {
      id: 'inc-1',
      title: 'Gate C Crowding Bottleneck',
      description: 'High traffic surge at Gate C.',
      category: 'crowd',
      priority: 'high',
      status: 'open',
      zone: 'gate_c',
      staffAssigned: null,
      reportedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    }
  ];
};

// Initial run
resetMockDb();

Object.defineProperty(globalThis, 'resetMockDb', {
  value: resetMockDb,
  writable: true
});

// Mock API Fetch Interceptor
const fetchMock = async (url: string, options?: any) => {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.parse(options.body) : null;
  const headers = options?.headers || {};
  let userRole = headers['x-user-role'];
  const authHeader = headers['Authorization'] || headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    if (token === 'mock-jwt-token-xyz' || token === 'mock-token-director') {
      userRole = 'director';
    } else if (token === 'mock-token-security') {
      userRole = 'security';
    } else {
      userRole = 'guest_services';
    }
  }

  // Router matching
  if (url === '/api/matches' && method === 'GET') {
    return {
      ok: true,
      json: async () => mockMatches,
    };
  }

  if (url.startsWith('/api/matches/') && method === 'PUT') {
    const id = parseInt(url.split('/').pop() || '', 10);
    
    // Check role auth mock
    if (userRole !== 'director') {
      return {
        ok: false,
        status: 403,
        json: async () => ({ error: 'Access Denied: Only the Tournament Director can modify match schedules or scores.' })
      };
    }

    const { score1, score2, status } = body;
    if (score1 < 0 || score2 < 0) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ error: 'Scores must be non-negative integers.' })
      };
    }
    if (status === 'completed' && score1 === score2) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ error: 'Elimination matches cannot end in a draw.' })
      };
    }

    mockMatches = mockMatches.map(m => {
      if (m.id === id) {
        let winnerId: string | null = null;
        if (status === 'completed') {
          winnerId = score1 > score2 ? (m.team1?.id || null) : (m.team2?.id || null);
        }
        return { ...m, score1, score2, status, winnerId };
      }
      return m;
    });

    // Advance winner logic
    const completedMatch = mockMatches.find(m => m.id === id);
    if (status === 'completed' && completedMatch?.winnerId) {
      const winnerTeam = completedMatch.winnerId === completedMatch.team1?.id ? completedMatch.team1 : completedMatch.team2;
      mockMatches = mockMatches.map(m => {
        if (m.prevMatch1Id === id) return { ...m, team1: winnerTeam };
        if (m.prevMatch2Id === id) return { ...m, team2: winnerTeam };
        return m;
      });
    }

    return {
      ok: true,
      json: async () => ({ message: 'Match score updated.', match: mockMatches.find(m => m.id === id) })
    };
  }

  if (url === '/api/incidents' && method === 'GET') {
    return {
      ok: true,
      json: async () => mockIncidents,
    };
  }

  if (url === '/api/incidents' && method === 'POST') {
    const { title, description, category, priority, zone } = body;
    if (!title || !description || !zone) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ error: 'Incident title, description, and zone are required.' })
      };
    }

    const newInc = {
      id: `inc-${Date.now()}`,
      title,
      description,
      category,
      priority,
      status: 'open' as const,
      zone,
      staffAssigned: null,
      reportedAt: new Date().toISOString()
    };
    mockIncidents = [newInc, ...mockIncidents];
    return {
      ok: true,
      json: async () => ({ message: 'Incident reported.', incident: newInc })
    };
  }

  if (url.endsWith('/dispatch') && method === 'PUT') {
    const segments = url.split('/');
    const incidentId = segments[segments.length - 2];
    const { staffId } = body;

    mockStaff = mockStaff.map(s => {
      if (s.id === staffId) return { ...s, assignedTasks: s.assignedTasks + 1 };
      return s;
    });

    mockIncidents = mockIncidents.map(inc => {
      if (inc.id === incidentId) return { ...inc, status: 'dispatched', staffAssigned: staffId };
      return inc;
    });

    return {
      ok: true,
      json: async () => ({ message: 'Staff dispatched.' })
    };
  }

  if (url.endsWith('/resolve') && method === 'PUT') {
    const segments = url.split('/');
    const incidentId = segments[segments.length - 2];

    const incident = mockIncidents.find(i => i.id === incidentId);
    if (incident?.staffAssigned) {
      const staffId = incident.staffAssigned;
      mockStaff = mockStaff.map(s => {
        if (s.id === staffId) return { ...s, assignedTasks: Math.max(0, s.assignedTasks - 1) };
        return s;
      });
    }

    mockIncidents = mockIncidents.map(inc => {
      if (inc.id === incidentId) return { ...inc, status: 'resolved', resolvedAt: new Date().toISOString() };
      return inc;
    });

    return {
      ok: true,
      json: async () => ({ message: 'Incident resolved.' })
    };
  }

  if (url === '/api/staff' && method === 'GET') {
    return {
      ok: true,
      json: async () => mockStaff,
    };
  }

  if (url === '/api/staff' && method === 'POST') {
    const { name, role } = body;
    if (!name) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ error: 'Staff name cannot be empty.' })
      };
    }
    const newStaff = {
      id: `s-${Date.now()}`,
      name,
      role,
      status: 'active' as const,
      assignedTasks: 0
    };
    mockStaff = [...mockStaff, newStaff];
    return {
      ok: true,
      json: async () => ({ message: 'Staff added.', staff: newStaff })
    };
  }

  if (url.endsWith('/status') && method === 'PUT') {
    const segments = url.split('/');
    const staffId = segments[segments.length - 2];
    const { status } = body;

    mockStaff = mockStaff.map(s => {
      if (s.id === staffId) return { ...s, status };
      return s;
    });

    return {
      ok: true,
      json: async () => ({ message: 'Staff status updated.' })
    };
  }

  if (url === '/api/metrics' && method === 'GET') {
    return {
      ok: true,
      json: async () => ({
        liveCapacity: 34210,
        maxCapacity: 45000,
        energyConsumption: 1240,
        avgGateTime: 4.2,
        gateCrowdLevel: {},
        restroomWaitTimes: {},
        concessionQueueTimes: {}
      }),
    };
  }

  if (url === '/api/metrics/consolidated' && method === 'GET') {
    return {
      ok: true,
      json: async () => ({
        metrics: {
          liveCapacity: 34210,
          maxCapacity: 45000,
          energyConsumption: 1240,
          avgGateTime: 4.2,
          gateCrowdLevel: {},
          restroomWaitTimes: {},
          concessionQueueTimes: {}
        },
        matches: mockMatches,
        incidents: mockIncidents,
        staff: mockStaff
      }),
    };
  }

  if (url === '/api/auth/login' && method === 'POST') {
    const { username } = body;
    return {
      ok: true,
      json: async () => ({
        token: 'mock-jwt-token-xyz',
        user: { id: 'mock-id', username, role: username === 'director' ? 'director' : 'security' }
      })
    };
  }

  if (url === '/api/auth/register' && method === 'POST') {
    return {
      ok: true,
      json: async () => ({ message: 'Registered successfully.' })
    };
  }

  return {
    ok: false,
    status: 404,
    json: async () => ({ error: 'Mock endpoint not found.' })
  };
};

Object.defineProperty(globalThis, 'fetch', {
  value: fetchMock,
  writable: true
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  value: ResizeObserverMock,
  writable: true
});
