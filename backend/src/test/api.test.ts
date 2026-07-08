import dotenv from 'dotenv';
dotenv.config();
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn().mockResolvedValue(true),
    hash: vi.fn().mockResolvedValue('mock-hashed-password')
  },
  compare: vi.fn().mockResolvedValue(true),
  hash: vi.fn().mockResolvedValue('mock-hashed-password')
}));

// Mock DB module before importing anything else
vi.mock('../db', () => ({
  connectDB: vi.fn().mockResolvedValue(true)
}));

// Class-based Mongoose model mocks
vi.mock('../models/User', () => {
  const mockUser = {
    _id: 'mock-user-id',
    username: 'director',
    password: 'mock-hashed-password',
    role: 'director'
  };
  
  class MockUserModel {
    static findOne = vi.fn().mockImplementation((query) => {
      if (query.username === 'director') return Promise.resolve(mockUser);
      return Promise.resolve(null);
    });
    
    constructor(data: any) {
      Object.assign(this, data);
    }
    
    save = vi.fn().mockResolvedValue(this);
  }
  
  return { UserModel: MockUserModel };
});

vi.mock('../models/Match', () => {
  const mockMatches = [
    { id: 1, round: 1, team1: { id: '1', name: 'Cyber Knights' }, team2: { id: '2', name: 'Apex Wolves' }, score1: null, score2: null, status: 'scheduled' }
  ];
  
  class MockMatchModel {
    static find = vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockMatches)
      }),
      lean: vi.fn().mockResolvedValue(mockMatches)
    });
    
    static findOne = vi.fn().mockImplementation((query) => {
      if (query.id === 1) return Promise.resolve({
        id: 1,
        round: 1,
        team1: { id: '1', name: 'Cyber Knights' },
        team2: { id: '2', name: 'Apex Wolves' },
        score1: null,
        score2: null,
        status: 'scheduled',
        save: vi.fn().mockResolvedValue(true)
      });
      if (query.prevMatch1Id === 1 || query.prevMatch2Id === 1) return Promise.resolve({
        id: 5,
        team1: null,
        team2: null,
        save: vi.fn().mockResolvedValue(true)
      });
      return Promise.resolve(null);
    });
    
    constructor(data: any) {
      Object.assign(this, data);
    }
    
    save = vi.fn().mockResolvedValue(this);
  }
  
  return { MatchModel: MockMatchModel };
});

vi.mock('../models/Incident', () => {
  const mockIncidents = [
    { id: 'inc-1', title: 'Crowd surge', status: 'open', reportedAt: new Date().toISOString() }
  ];
  
  class MockIncidentModel {
    static find = vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockIncidents)
      }),
      lean: vi.fn().mockResolvedValue(mockIncidents)
    });
    
    static findOne = vi.fn().mockImplementation((query) => {
      if (query.id === 'inc-1') return Promise.resolve({
        id: 'inc-1',
        title: 'Crowd surge',
        status: 'open',
        save: vi.fn().mockResolvedValue(true)
      });
      return Promise.resolve(null);
    });
    
    constructor(data: any) {
      Object.assign(this, data);
    }
    
    save = vi.fn().mockResolvedValue(this);
  }
  
  return { IncidentModel: MockIncidentModel };
});

vi.mock('../models/Staff', () => {
  const mockStaff = [
    { id: 's1', name: 'Marcus Vance', role: 'security', status: 'active', assignedTasks: 0 }
  ];
  
  class MockStaffModel {
    static find = vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue(mockStaff)
    });
    
    static findOne = vi.fn().mockImplementation((query) => {
      if (query.id === 's1') return Promise.resolve({
        id: 's1',
        name: 'Marcus Vance',
        role: 'security',
        status: 'active',
        assignedTasks: 0,
        save: vi.fn().mockResolvedValue(true)
      });
      return Promise.resolve(null);
    });
    
    constructor(data: any) {
      Object.assign(this, data);
    }
    
    save = vi.fn().mockResolvedValue(this);
  }
  
  return { StaffModel: MockStaffModel };
});

import app from '../index';

const JWT_SECRET = process.env.JWT_SECRET || 'arenaflow_super_secret_jwt_key_2026_xyz';

describe('Smart Stadium Backend API Tests', () => {
  let directorToken: string;

  beforeEach(() => {
    directorToken = jwt.sign(
      { id: 'mock-user-id', username: 'director', role: 'director' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('1. Auth Routes', () => {
    it('POST /api/auth/login - should authenticate and return JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'director', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.role).toBe('director');
    });

    it('POST /api/auth/login - should return 401 on incorrect credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('2. Match Routes', () => {
    it('GET /api/matches - should retrieve bracket matches', async () => {
      const res = await request(app).get('/api/matches');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].team1.name).toBe('Cyber Knights');
    });

    it('PUT /api/matches/:id - should block unauthorized score edits', async () => {
      const res = await request(app)
        .put('/api/matches/1')
        .send({ score1: 3, score2: 1, status: 'completed' });

      expect(res.status).toBe(401);
    });

    it('PUT /api/matches/:id - should accept score edits for authorized roles', async () => {
      const res = await request(app)
        .put('/api/matches/1')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ score1: 3, score2: 1, status: 'completed' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('PUT /api/matches/:id - should block draw scores in completed knockout matches', async () => {
      const res = await request(app)
        .put('/api/matches/1')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({ score1: 2, score2: 2, status: 'completed' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('cannot end in a draw');
    });
  });

  describe('3. Incident Routes', () => {
    it('GET /api/incidents - should retrieve incident logs', async () => {
      const res = await request(app).get('/api/incidents');
      expect(res.status).toBe(200);
      expect(res.body[0].title).toBe('Crowd surge');
    });

    it('POST /api/incidents - should create new incident', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${directorToken}`)
        .send({
          title: 'Gate Bottleneck',
          description: 'Gate C queue is backed up',
          category: 'crowd',
          priority: 'high',
          zone: 'gate_c'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('incident');
    });
  });
});
