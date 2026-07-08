import { Request, Response, NextFunction } from 'express';

/**
 * Validates the authentication payload for register and login requests.
 */
export const validateAuth = (isRegister: boolean) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { username, password, role } = req.body;

    const u = typeof username === 'string' ? username.trim() : '';
    const p = typeof password === 'string' ? password.trim() : '';

    if (!u || !p) {
      res.status(400).json({ error: 'Validation Error: Username and password are required fields.' });
      return;
    }

    if (u.length < 3 || u.length > 30) {
      res.status(400).json({ error: 'Validation Error: Username must be between 3 and 30 characters.' });
      return;
    }

    if (p.length < 6) {
      res.status(400).json({ error: 'Validation Error: Password must be at least 6 characters.' });
      return;
    }

    if (isRegister) {
      if (!role || !['director', 'security', 'guest_services'].includes(role)) {
        res.status(400).json({ error: 'Validation Error: Invalid or missing role selection.' });
        return;
      }
    }

    // Override req.body with trimmed strings
    req.body.username = u;
    req.body.password = p;
    next();
  };
};

/**
 * Validates incident creation payload.
 */
export const validateIncidentCreate = (req: Request, res: Response, next: NextFunction): void => {
  const { title, description, category, priority, zone } = req.body;

  const t = typeof title === 'string' ? title.trim() : '';
  const d = typeof description === 'string' ? description.trim() : '';
  const z = typeof zone === 'string' ? zone.trim() : '';

  if (!t || !d || !z || !category || !priority) {
    res.status(400).json({ error: 'Validation Error: Title, description, category, priority, and zone are required fields.' });
    return;
  }

  if (!['security', 'crowd', 'maintenance', 'medical'].includes(category)) {
    res.status(400).json({ error: 'Validation Error: Invalid incident category.' });
    return;
  }

  if (!['low', 'medium', 'high', 'critical'].includes(priority)) {
    res.status(400).json({ error: 'Validation Error: Invalid incident priority level.' });
    return;
  }

  req.body.title = t;
  req.body.description = d;
  req.body.zone = z;
  next();
};

/**
 * Validates incident dispatch payload.
 */
export const validateIncidentDispatch = (req: Request, res: Response, next: NextFunction): void => {
  const { staffId } = req.body;
  const s = typeof staffId === 'string' ? staffId.trim() : '';

  if (!s) {
    res.status(400).json({ error: 'Validation Error: Responder Staff ID is required for dispatch.' });
    return;
  }

  req.body.staffId = s;
  next();
};

/**
 * Validates match score updates.
 */
export const validateMatchUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { score1, score2, status } = req.body;

  const s1 = parseInt(String(score1), 10);
  const s2 = parseInt(String(score2), 10);

  if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
    res.status(400).json({ error: 'Validation Error: Scores must be non-negative integers.' });
    return;
  }

  if (!status || !['scheduled', 'live', 'completed'].includes(status)) {
    res.status(400).json({ error: 'Validation Error: Invalid match status.' });
    return;
  }

  if (status === 'completed' && s1 === s2) {
    res.status(400).json({ error: 'Validation Error: Knockout tournament matches cannot end in a draw.' });
    return;
  }

  req.body.score1 = s1;
  req.body.score2 = s2;
  next();
};

/**
 * Validates staff creation payload.
 */
export const validateStaffCreate = (req: Request, res: Response, next: NextFunction): void => {
  const { name, role } = req.body;
  const n = typeof name === 'string' ? name.trim() : '';

  if (!n || !role) {
    res.status(400).json({ error: 'Validation Error: Name and role are required parameters.' });
    return;
  }

  if (!['security', 'medical', 'janitorial', 'technician'].includes(role)) {
    res.status(400).json({ error: 'Validation Error: Invalid staff operational role.' });
    return;
  }

  req.body.name = n;
  next();
};

/**
 * Validates staff shift status updates.
 */
export const validateStaffStatusUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { status } = req.body;

  if (!status || !['active', 'inactive', 'on_break'].includes(status)) {
    res.status(400).json({ error: 'Validation Error: Valid shift status is required.' });
    return;
  }

  next();
};
