import { Request, Response, NextFunction } from 'express';
import { MatchModel } from '../models/Match';

export const getMatches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const matches = await MatchModel.find().sort({ id: 1 }).lean();
    res.json(matches);
  } catch (err) {
    next(err);
  }
};

export const updateMatch = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const matchId = parseInt(req.params.id, 10);
  const { score1, score2, status } = req.body;

  if (isNaN(matchId)) {
    res.status(400).json({ error: 'Invalid Match ID parameter.' });
    return;
  }

  // Inputs Validation
  const s1 = parseInt(score1, 10);
  const s2 = parseInt(score2, 10);
  if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
    res.status(400).json({ error: 'Validation Error: Scores must be non-negative integers.' });
    return;
  }

  if (status === 'completed' && s1 === s2) {
    res.status(400).json({ error: 'Validation Error: Knockout tournament matches cannot end in a draw.' });
    return;
  }

  try {
    const match = await MatchModel.findOne({ id: matchId });
    if (!match) {
      res.status(404).json({ error: `Match #${matchId} not found.` });
      return;
    }

    if (!match.team1 || !match.team2) {
      res.status(400).json({ error: 'Cannot score a match until both qualifying teams are determined.' });
      return;
    }

    // Determine winner
    let winnerId: string | null = null;
    if (status === 'completed') {
      winnerId = s1 > s2 ? (match.team1.id || null) : (match.team2.id || null);
    }

    match.score1 = s1;
    match.score2 = s2;
    match.status = status;
    match.winnerId = winnerId;
    await match.save();

    // Progression logic
    if (status === 'completed' && winnerId) {
      const winningTeam = winnerId === match.team1.id ? match.team1 : match.team2;
      
      // Update next bracket links
      const nextMatch1 = await MatchModel.findOne({ prevMatch1Id: matchId });
      if (nextMatch1) {
        nextMatch1.team1 = winningTeam;
        nextMatch1.score1 = null;
        nextMatch1.score2 = null;
        nextMatch1.status = 'scheduled';
        nextMatch1.winnerId = null;
        await nextMatch1.save();
      }

      const nextMatch2 = await MatchModel.findOne({ prevMatch2Id: matchId });
      if (nextMatch2) {
        nextMatch2.team2 = winningTeam;
        nextMatch2.score2 = null;
        nextMatch2.score1 = null;
        nextMatch2.status = 'scheduled';
        nextMatch2.winnerId = null;
        await nextMatch2.save();
      }
    }

    res.json({ message: `Match #${matchId} updated successfully.`, match });
  } catch (err) {
    next(err);
  }
};
