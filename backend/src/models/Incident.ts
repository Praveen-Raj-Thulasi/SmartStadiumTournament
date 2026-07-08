import { Schema, model } from 'mongoose';

const IncidentSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['security', 'crowd', 'maintenance', 'medical'], required: true, index: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true, index: true },
  status: { type: String, enum: ['open', 'dispatched', 'resolved'], default: 'open', index: true },
  zone: { type: String, required: true, index: true },
  staffAssigned: { type: String, default: null, index: true },
  reportedAt: { type: String, required: true, index: true },
  resolvedAt: { type: String, default: null }
});

export const IncidentModel = model('Incident', IncidentSchema);
