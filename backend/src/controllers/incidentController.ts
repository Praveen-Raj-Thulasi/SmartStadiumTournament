import { Request, Response } from 'express';
import { IncidentModel } from '../models/Incident';
import { StaffModel } from '../models/Staff';

export const getIncidents = async (req: Request, res: Response): Promise<void> => {
  try {
    const incidents = await IncidentModel.find().sort({ reportedAt: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: 'Server error retrieving safety logs.' });
  }
};

export const createIncident = async (req: Request, res: Response): Promise<void> => {
  const { title, description, category, priority, zone } = req.body;

  // Inputs validation
  const cleanTitle = title?.trim();
  const cleanDesc = description?.trim();

  if (!cleanTitle || !cleanDesc || !category || !priority || !zone) {
    res.status(400).json({ error: 'Validation Error: Title, description, category, priority, and zone are required fields.' });
    return;
  }

  try {
    const newIncident = new IncidentModel({
      id: `inc-${Date.now()}`,
      title: cleanTitle,
      description: cleanDesc,
      category,
      priority,
      status: 'open',
      zone,
      staffAssigned: null,
      reportedAt: new Date().toISOString()
    });

    await newIncident.save();
    res.status(201).json({ message: 'Incident ticket registered.', incident: newIncident });
  } catch (err) {
    res.status(500).json({ error: 'Server error logging new incident ticket.' });
  }
};

export const dispatchIncident = async (req: Request, res: Response): Promise<void> => {
  const incidentId = String(req.params.id);
  const staffId = req.body.staffId ? String(req.body.staffId) : '';

  if (!staffId) {
    res.status(400).json({ error: 'Responder Staff ID is required for dispatch.' });
    return;
  }

  try {
    const incident = await IncidentModel.findOne({ id: incidentId });
    if (!incident) {
      res.status(404).json({ error: 'Incident ticket not found.' });
      return;
    }

    if (incident.status !== 'open') {
      res.status(400).json({ error: 'Incident is already dispatched or resolved.' });
      return;
    }

    const responder = await StaffModel.findOne({ id: staffId });
    if (!responder) {
      res.status(404).json({ error: 'Responder staff record not found.' });
      return;
    }

    // Allocate task load
    responder.assignedTasks += 1;
    if (responder.status === 'on_break') {
      responder.status = 'active';
    }
    await responder.save();

    // Assign incident
    incident.status = 'dispatched';
    incident.staffAssigned = staffId;
    await incident.save();

    res.json({ message: 'Responder dispatched successfully.', incident, staff: responder });
  } catch (err) {
    res.status(500).json({ error: 'Server error dispatching responder.' });
  }
};

export const resolveIncident = async (req: Request, res: Response): Promise<void> => {
  const incidentId = String(req.params.id);

  try {
    const incident = await IncidentModel.findOne({ id: incidentId });
    if (!incident) {
      res.status(404).json({ error: 'Incident ticket not found.' });
      return;
    }

    if (incident.status === 'resolved') {
      res.status(400).json({ error: 'Incident is already marked resolved.' });
      return;
    }

    // Decrement responder load
    if (incident.staffAssigned) {
      const responder = await StaffModel.findOne({ id: incident.staffAssigned });
      if (responder) {
        responder.assignedTasks = Math.max(0, responder.assignedTasks - 1);
        await responder.save();
      }
    }

    incident.status = 'resolved';
    incident.resolvedAt = new Date().toISOString();
    await incident.save();

    res.json({ message: 'Incident resolved.', incident });
  } catch (err) {
    res.status(500).json({ error: 'Server error resolving incident.' });
  }
};
