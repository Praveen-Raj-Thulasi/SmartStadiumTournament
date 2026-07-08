import { Schema, model } from 'mongoose';

const StaffSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['security', 'medical', 'janitorial', 'technician'], required: true, index: true },
  status: { type: String, enum: ['active', 'inactive', 'on_break'], default: 'active', index: true },
  assignedTasks: { type: Number, default: 0 }
});

export const StaffModel = model('Staff', StaffSchema);
