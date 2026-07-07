import { Schema, model } from 'mongoose';

const UserSchema = new Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    index: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    enum: ['director', 'security', 'guest_services'], 
    required: true 
  }
}, { 
  timestamps: true 
});

export const UserModel = model('User', UserSchema);
export type IUser = InstanceType<typeof UserModel>;
