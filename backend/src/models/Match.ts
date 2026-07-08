import { Schema, model } from 'mongoose';

const TeamInfoSchema = new Schema({
  id: { type: String, default: null },
  name: { type: String, default: null },
  logoColor: { type: String, default: null }
}, { _id: false });

const MatchSchema = new Schema({
  id: { type: Number, required: true, unique: true },
  round: { type: Number, required: true, index: true },
  team1: { type: TeamInfoSchema, default: null },
  team2: { type: TeamInfoSchema, default: null },
  score1: { type: Number, default: null },
  score2: { type: Number, default: null },
  status: { type: String, enum: ['scheduled', 'live', 'completed'], default: 'scheduled', index: true },
  winnerId: { type: String, default: null },
  time: { type: String, required: true },
  prevMatch1Id: { type: Number, default: null },
  prevMatch2Id: { type: Number, default: null }
});

export const MatchModel = model('Match', MatchSchema);
