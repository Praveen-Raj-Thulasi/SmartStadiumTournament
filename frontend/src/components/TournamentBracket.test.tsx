import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TournamentBracket } from './TournamentBracket';

describe('TournamentBracket Component Tests', () => {
  const mockMatches = [
    { id: 1, round: 1, team1: { id: '1', name: 'Cyber Knights', logoColor: '#00f0ff' }, team2: { id: '2', name: 'Apex Wolves', logoColor: '#ef4444' }, score1: null, score2: null, status: 'scheduled', winnerId: null, time: '14:00' },
    { id: 2, round: 1, team1: { id: '3', name: 'Solar Titans', logoColor: '#f59e0b' }, team2: { id: '4', name: 'Hyper Strikers', logoColor: '#a855f7' }, score1: null, score2: null, status: 'scheduled', winnerId: null, time: '15:30' },
    { id: 3, round: 1, team1: { id: '5', name: 'Quantum Phantoms', logoColor: '#10b981' }, team2: { id: '6', name: 'Shadow Eclipse', logoColor: '#3b82f6' }, score1: null, score2: null, status: 'scheduled', winnerId: null, time: '17:00' },
    { id: 4, round: 1, team1: { id: '7', name: 'Neon Vipers', logoColor: '#ec4899' }, team2: { id: '8', name: 'Delta Rangers', logoColor: '#84cc16' }, score1: null, score2: null, status: 'scheduled', winnerId: null, time: '18:30' },
    { id: 5, round: 2, team1: null, team2: null, score1: null, score2: null, status: 'scheduled', winnerId: null, time: '20:00' },
    { id: 6, round: 2, team1: null, team2: null, score1: null, score2: null, status: 'scheduled', winnerId: null, time: '21:30' },
    { id: 7, round: 3, team1: null, team2: null, score1: null, score2: null, status: 'scheduled', winnerId: null, time: '23:00' },
  ] as any[];

  const mockState = {
    matches: mockMatches,
    updateMatchScore: vi.fn().mockResolvedValue(true),
    role: 'director',
    triggerError: vi.fn(),
  } as any;

  it('should render the bracket headers and match cards', () => {
    render(
      <TournamentBracket 
        matches={mockState.matches} 
        updateMatchScore={mockState.updateMatchScore} 
        role={mockState.role} 
        triggerError={mockState.triggerError} 
      />
    );
    
    expect(screen.getByText('Tournament Bracket Controller')).toBeInTheDocument();
    expect(screen.getByText('QUARTERFINALS')).toBeInTheDocument();
    expect(screen.getByText('SEMIFINALS')).toBeInTheDocument();
    expect(screen.getByText('FINALS')).toBeInTheDocument();
    
    expect(screen.getByText('Cyber Knights')).toBeInTheDocument();
    expect(screen.getByText('Apex Wolves')).toBeInTheDocument();
  });

  it('should open edit score modal when director clicks a ready match', () => {
    render(
      <TournamentBracket 
        matches={mockState.matches} 
        updateMatchScore={mockState.updateMatchScore} 
        role={mockState.role} 
        triggerError={mockState.triggerError} 
      />
    );
    
    const matchCard = screen.getByLabelText(/Match 1, Cyber Knights vs Apex Wolves/i);
    fireEvent.click(matchCard);
    
    expect(screen.getByText('Update Match #1 Scores')).toBeInTheDocument();
  });

  it('should block score changes if the user is not a director', () => {
    const readOnlyState = { ...mockState, role: 'security' };
    render(
      <TournamentBracket 
        matches={readOnlyState.matches} 
        updateMatchScore={readOnlyState.updateMatchScore} 
        role={readOnlyState.role} 
        triggerError={readOnlyState.triggerError} 
      />
    );
    
    const matchCard = screen.getByLabelText(/Match 1, Cyber Knights vs Apex Wolves/i);
    fireEvent.click(matchCard);
    
    expect(readOnlyState.triggerError).toHaveBeenCalledWith(
      'Access Denied: Only the Tournament Director can modify match schedules or scores.'
    );
  });
});
