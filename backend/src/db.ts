import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MatchModel } from './models/Match';
import { StaffModel } from './models/Staff';
import { IncidentModel } from './models/Incident';
import { UserModel } from './models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/arenaflow';

export const connectDB = async () => {
  try {
    console.log(`Connecting to MongoDB at: ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected successfully.');
    
    // Seed data if empty
    await seedDatabase();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

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

const INITIAL_MATCHES = [
  { id: 1, round: 1, team1: INITIAL_TEAMS[0], team2: INITIAL_TEAMS[1], score1: null, score2: null, status: 'scheduled', winnerId: null, time: '14:00' },
  { id: 2, round: 1, team1: INITIAL_TEAMS[2], team2: INITIAL_TEAMS[3], score1: null, score2: null, status: 'scheduled', winnerId: null, time: '15:30' },
  { id: 3, round: 1, team1: INITIAL_TEAMS[4], team2: INITIAL_TEAMS[5], score1: null, score2: null, status: 'scheduled', winnerId: null, time: '17:00' },
  { id: 4, round: 1, team1: INITIAL_TEAMS[6], team2: INITIAL_TEAMS[7], score1: null, score2: null, status: 'scheduled', winnerId: null, time: '18:30' },
  { id: 5, round: 2, team1: null, team2: null, score1: null, score2: null, status: 'scheduled', winnerId: null, time: '20:00', prevMatch1Id: 1, prevMatch2Id: 2 },
  { id: 6, round: 2, team1: null, team2: null, score1: null, score2: null, status: 'scheduled', winnerId: null, time: '21:30', prevMatch1Id: 3, prevMatch2Id: 4 },
  { id: 7, round: 3, team1: null, team2: null, score1: null, score2: null, status: 'scheduled', winnerId: null, time: '23:00', prevMatch1Id: 5, prevMatch2Id: 6 },
];

const INITIAL_STAFF = [
  { id: 's1', name: 'Marcus Vance', role: 'security', status: 'active', assignedTasks: 0 },
  { id: 's2', name: 'Elena Rostova', role: 'security', status: 'active', assignedTasks: 0 },
  { id: 's3', name: 'Tariq Al-Fayed', role: 'security', status: 'active', assignedTasks: 0 },
  { id: 's4', name: 'Sarah Jenkins', role: 'medical', status: 'active', assignedTasks: 0 },
  { id: 's5', name: 'David Chen', role: 'janitorial', status: 'active', assignedTasks: 1 },
  { id: 's6', name: 'Liam O\'Connor', role: 'janitorial', status: 'on_break', assignedTasks: 0 },
  { id: 's7', name: 'Zoe Miller', role: 'technician', status: 'active', assignedTasks: 0 },
];

const INITIAL_INCIDENTS = [
  {
    id: 'inc-1',
    title: 'Gate C Crowding Bottleneck',
    description: 'High traffic surge at Gate C. Metal detectors queue exceeds 20 meters.',
    category: 'crowd',
    priority: 'high',
    status: 'open',
    zone: 'gate_c',
    staffAssigned: null,
    reportedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 'inc-2',
    title: 'Spill in West Concourse',
    description: 'Liquid spill near concession booth #3 causing a slip hazard.',
    category: 'maintenance',
    priority: 'medium',
    status: 'dispatched',
    zone: 'concessions',
    staffAssigned: 's5',
    reportedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'inc-3',
    title: 'Ankle Injury Section 104',
    description: 'Fan tripped on stairs and reports severe ankle pain.',
    category: 'medical',
    priority: 'high',
    status: 'resolved',
    zone: 'sect_100',
    staffAssigned: 's4',
    reportedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  }
];

const seedDatabase = async () => {
  try {
    const matchCount = await MatchModel.countDocuments();
    if (matchCount === 0) {
      console.log('Seeding matches collection...');
      await MatchModel.insertMany(INITIAL_MATCHES);
      console.log('Matches seeded successfully.');
    }

    const staffCount = await StaffModel.countDocuments();
    if (staffCount === 0) {
      console.log('Seeding staff collection...');
      await StaffModel.insertMany(INITIAL_STAFF);
      console.log('Staff seeded successfully.');
    }

    const incidentCount = await IncidentModel.countDocuments();
    if (incidentCount === 0) {
      console.log('Seeding incidents collection...');
      await IncidentModel.insertMany(INITIAL_INCIDENTS);
      console.log('Incidents seeded successfully.');
    }

    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      console.log('Seeding default user accounts...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      await UserModel.insertMany([
        { username: 'director', password: hashedPassword, role: 'director' },
        { username: 'security', password: hashedPassword, role: 'security' },
        { username: 'guest', password: hashedPassword, role: 'guest_services' }
      ]);
      console.log('User accounts seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding collections:', error);
  }
};
