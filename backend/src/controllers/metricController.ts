import { Request, Response, NextFunction } from 'express';
import { MatchModel } from '../models/Match';
import { StaffModel } from '../models/Staff';
import { IncidentModel } from '../models/Incident';
import { getCached, setCached } from '../utils/cache';

// In-Memory Telemetry State
export const telemetryState = {
  liveCapacity: 34210,
  maxCapacity: 45000,
  energyConsumption: 1240,
  avgGateTime: 4.2,
  gateCrowdLevel: { gate_a: 'low', gate_b: 'medium', gate_c: 'high', gate_d: 'low' },
  restroomWaitTimes: { west: 3, east: 8, north: 2, south: 5 },
  concessionQueueTimes: { booth_1: 4, booth_2: 12, booth_3: 8, booth_4: 3 }
};

// Start telemetry fluctuation loop
const intervalId = setInterval(() => {
  const deltaCap = Math.floor((Math.random() - 0.4) * 30);
  telemetryState.liveCapacity = Math.min(telemetryState.maxCapacity, Math.max(0, telemetryState.liveCapacity + deltaCap));

  const deltaEnergy = Math.floor((Math.random() - 0.5) * 15);
  telemetryState.energyConsumption = Math.max(800, telemetryState.energyConsumption + deltaEnergy);

  Object.keys(telemetryState.restroomWaitTimes).forEach(k => {
    const key = k as keyof typeof telemetryState.restroomWaitTimes;
    telemetryState.restroomWaitTimes[key] = Math.max(1, Math.min(25, telemetryState.restroomWaitTimes[key] + (Math.random() > 0.55 ? 1 : -1)));
  });

  Object.keys(telemetryState.concessionQueueTimes).forEach(k => {
    const key = k as keyof typeof telemetryState.concessionQueueTimes;
    telemetryState.concessionQueueTimes[key] = Math.max(1, Math.min(30, telemetryState.concessionQueueTimes[key] + (Math.random() > 0.55 ? 1 : -1)));
  });

  const gates: Array<keyof typeof telemetryState.gateCrowdLevel> = ['gate_a', 'gate_b', 'gate_c', 'gate_d'];
  if (Math.random() > 0.85) {
    const randGate = gates[Math.floor(Math.random() * gates.length)];
    const levels: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
    telemetryState.gateCrowdLevel[randGate] = levels[Math.floor(Math.random() * levels.length)];
  }
}, 8000);

// Unref timer in testing environment to allow clean process exit
if (typeof intervalId.unref === 'function') {
  intervalId.unref();
}

export const getMetrics = (req: Request, res: Response): void => {
  res.json(telemetryState);
};

export const getConsolidatedStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cached = getCached('consolidated') as Record<string, unknown> | null;
    if (cached) {
      cached.metrics = telemetryState;
      res.json(cached);
      return;
    }

    const [matches, incidents, staff] = await Promise.all([
      MatchModel.find().sort({ id: 1 }).lean(),
      IncidentModel.find().sort({ reportedAt: -1 }).lean(),
      StaffModel.find().lean()
    ]);
    
    const statusData = {
      metrics: telemetryState,
      matches,
      incidents,
      staff
    };

    setCached('consolidated', statusData);
    res.json(statusData);
  } catch (err) {
    next(err);
  }
};
