import { Request, Response, NextFunction } from 'express';
import { StaffModel } from '../models/Staff';

export const getStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const roster = await StaffModel.find().lean();
    res.json(roster);
  } catch (err) {
    next(err);
  }
};

export const createStaff = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { name, role } = req.body;
  const cleanName = name?.trim();

  if (!cleanName || !role) {
    res.status(400).json({ error: 'Validation Error: Name and role are required parameters.' });
    return;
  }

  try {
    const newStaff = new StaffModel({
      id: `s-${Date.now()}`,
      name: cleanName,
      role,
      status: 'active',
      assignedTasks: 0
    });

    await newStaff.save();
    res.status(201).json({ message: 'Responder registered successfully.', staff: newStaff });
  } catch (err) {
    next(err);
  }
};

export const updateStaffStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const staffId = String(req.params.id);
  const { status } = req.body;

  if (!status || !['active', 'inactive', 'on_break'].includes(status)) {
    res.status(400).json({ error: 'Validation Error: Valid shift status is required.' });
    return;
  }

  try {
    const responder = await StaffModel.findOne({ id: staffId });
    if (!responder) {
      res.status(404).json({ error: 'Staff record not found.' });
      return;
    }

    responder.status = status;
    await responder.save();

    res.json({ message: 'Shift status updated.', staff: responder });
  } catch (err) {
    next(err);
  }
};
