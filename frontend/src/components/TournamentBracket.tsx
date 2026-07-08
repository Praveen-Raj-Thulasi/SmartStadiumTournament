import React, { useState } from 'react';
import type { Match, UserRole } from '../hooks/useStadiumState';
import { Trophy, Calendar, Pencil, ShieldAlert, Award } from 'lucide-react';

interface TournamentBracketProps {
  matches: Match[];
  updateMatchScore: (matchId: number, score1: number, score2: number, status: Match['status']) => Promise<boolean>;
  role: UserRole;
  triggerError: (msg: string) => void;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = React.memo(({
  matches,
  updateMatchScore,
  role,
  triggerError
}) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [score1Input, setScore1Input] = useState<string>('');
  const [score2Input, setScore2Input] = useState<string>('');
  const [matchStatus, setMatchStatus] = useState<Match['status']>('scheduled');

  const openScoreModal = (match: Match) => {
    if (role !== 'director') {
      // Role enforcement check
      triggerError('Access Denied: Only the Tournament Director can modify match schedules or scores.');
      return;
    }
    
    // Check if match teams are set
    if (!match.team1 || !match.team2) {
      triggerError('Cannot score a match until both qualifying teams are determined.');
      return;
    }

    setSelectedMatch(match);
    setScore1Input(match.score1 !== null ? match.score1.toString() : '0');
    setScore2Input(match.score2 !== null ? match.score2.toString() : '0');
    setMatchStatus(match.status);
  };

  const handleSaveScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatch) return;

    const s1 = parseInt(score1Input, 10);
    const s2 = parseInt(score2Input, 10);

    if (isNaN(s1) || isNaN(s2) || s1 < 0 || s2 < 0) {
      triggerError('Validation Failed: Scores must be non-negative integers.');
      return;
    }

    if (matchStatus === 'completed' && s1 === s2) {
      triggerError('Validation Failed: A knockout tournament match cannot end in a draw. Select a winner.');
      return;
    }

    const success = await updateMatchScore(selectedMatch.id, s1, s2, matchStatus);
    if (success) {
      setSelectedMatch(null);
    }
  };

  // Group matches by rounds
  const qfs = matches.filter((m) => m.round === 1);
  const sfs = matches.filter((m) => m.round === 2);
  const finals = matches.filter((m) => m.round === 3);

  // Render a single match card
  const renderMatchCard = (match: Match) => {
    const isClickable = match.team1 && match.team2 && role === 'director';
    const isCompleted = match.status === 'completed';
    const isLive = match.status === 'live';

    return (
      <div 
        key={match.id}
        className={`glass-panel ${isClickable ? 'glass-panel-glow' : ''}`}
        style={{
          padding: '16px',
          margin: '12px 0',
          position: 'relative',
          borderLeft: isLive ? '3px solid var(--accent-cyan)' : isCompleted ? '3px solid var(--success)' : '1px solid var(--border-color)',
          cursor: isClickable ? 'pointer' : 'default',
          opacity: (match.team1 && match.team2) ? 1 : 0.6,
          minWidth: '220px',
          outline: 'none'
        }}
        tabIndex={isClickable ? 0 : -1}
        role={isClickable ? "button" : "region"}
        aria-label={`Match ${match.id}, ${match.team1 ? match.team1.name : 'TBD'} vs ${match.team2 ? match.team2.name : 'TBD'}. Status is ${match.status}.${isClickable ? ' Select to edit score.' : ''}`}
        onClick={() => (match.team1 && match.team2) && openScoreModal(match)}
        onKeyDown={(e) => {
          if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            openScoreModal(match);
          }
        }}
      >
        {/* Match Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '0.75rem' }}>
          <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} />
            Match #{match.id} | {match.time}
          </span>
          <span className={`badge ${isLive ? 'badge-danger' : isCompleted ? 'badge-success' : 'badge-info'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
            {match.status}
          </span>
        </div>

        {/* Team 1 Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: match.team1?.logoColor || '#64748b' }}></span>
            <span style={{ 
              fontWeight: isCompleted && match.winnerId === match.team1?.id ? '700' : 'normal',
              color: isCompleted && match.winnerId !== match.team1?.id ? 'var(--text-muted)' : 'var(--text-primary)',
              fontSize: '0.9rem'
            }}>
              {match.team1 ? match.team1.name : 'TBD'}
            </span>
          </div>
          <span style={{ 
            fontFamily: 'var(--font-display)', 
            fontWeight: '700', 
            fontSize: '1rem',
            color: isCompleted && match.winnerId === match.team1?.id ? 'var(--accent-cyan)' : 'var(--text-secondary)'
          }}>
            {match.score1 !== null ? match.score1 : '-'}
          </span>
        </div>

        {/* Team 2 Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: match.team2?.logoColor || '#64748b' }}></span>
            <span style={{ 
              fontWeight: isCompleted && match.winnerId === match.team2?.id ? '700' : 'normal',
              color: isCompleted && match.winnerId !== match.team2?.id ? 'var(--text-muted)' : 'var(--text-primary)',
              fontSize: '0.9rem'
            }}>
              {match.team2 ? match.team2.name : 'TBD'}
            </span>
          </div>
          <span style={{ 
            fontFamily: 'var(--font-display)', 
            fontWeight: '700', 
            fontSize: '1rem',
            color: isCompleted && match.winnerId === match.team2?.id ? 'var(--accent-cyan)' : 'var(--text-secondary)'
          }}>
            {match.score2 !== null ? match.score2 : '-'}
          </span>
        </div>

        {/* Floating Edit Icon for Director */}
        {isClickable && (
          <div style={{ position: 'absolute', right: '8px', bottom: '8px', opacity: 0.3, transition: 'opacity 0.2s' }} className="edit-indicator">
            <Pencil size={12} color="var(--text-primary)" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header Alert for Access Status */}
      <div 
        className="glass-panel" 
        style={{ 
          marginBottom: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderLeft: `3px solid var(--${role === 'director' ? 'success' : 'warning'})`
        }}
      >
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy style={{ color: 'var(--accent-cyan)' }} />
            Tournament Bracket Controller
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {role === 'director' 
              ? 'Authorized: Click any ready match to update scores and progress teams.' 
              : 'ReadOnly Mode: Only the Tournament Director role can edit scores.'}
          </p>
        </div>
        {role !== 'director' && (
          <span className="badge badge-warning" style={{ gap: '4px' }}>
            <ShieldAlert size={12} />
            ReadOnly
          </span>
        )}
      </div>

      {/* Bracket Tree Columns */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'stretch',
          gap: '20px',
          overflowX: 'auto',
          paddingBottom: '20px'
        }}
      >
        {/* Column 1: Quarterfinals */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--accent-cyan)', textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>
            QUARTERFINALS
          </h3>
          {qfs.map(renderMatchCard)}
        </div>

        {/* Column Divider Lines Mock (handled by margins in flex-justify) */}

        {/* Column 2: Semifinals */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--accent-purple)', textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>
            SEMIFINALS
          </h3>
          {sfs.map(renderMatchCard)}
        </div>

        {/* Column 3: Finals */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around', flex: 1 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--success)', textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '16px' }}>
            FINALS
          </h3>
          {finals.map(renderMatchCard)}
          
          {/* Winner display */}
          {matches[6].status === 'completed' && matches[6].winnerId && (
            <div 
              className="glass-panel"
              style={{
                marginTop: '20px',
                textAlign: 'center',
                border: '1px solid var(--success)',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)',
                background: 'rgba(16, 185, 129, 0.05)',
                animation: 'scale-up 0.3s ease-out'
              }}
            >
              <Award size={32} color="var(--success)" style={{ margin: '0 auto 8px' }} />
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Champion</h4>
              <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--success)' }}>
                {matches[6].winnerId === matches[6].team1?.id ? matches[6].team1?.name : matches[6].team2?.name}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Score Edit Modal */}
      {selectedMatch && (
        <div className="modal-overlay" onClick={() => setSelectedMatch(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={18} color="var(--accent-cyan)" />
                Update Match #{selectedMatch.id} Scores
              </h3>
              <button className="modal-close" onClick={() => setSelectedMatch(null)} aria-label="Close modal">&times;</button>
            </div>

            <form onSubmit={handleSaveScore}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                {/* Team 1 Score Input */}
                <div className="form-group">
                  <label className="form-label" htmlFor="team1-score">
                    {selectedMatch.team1?.name} Score
                  </label>
                  <input 
                    id="team1-score"
                    type="number" 
                    min="0"
                    step="1"
                    className="form-input" 
                    value={score1Input}
                    onChange={(e) => setScore1Input(e.target.value)}
                    required
                  />
                </div>

                {/* Team 2 Score Input */}
                <div className="form-group">
                  <label className="form-label" htmlFor="team2-score">
                    {selectedMatch.team2?.name} Score
                  </label>
                  <input 
                    id="team2-score"
                    type="number" 
                    min="0"
                    step="1"
                    className="form-input" 
                    value={score2Input}
                    onChange={(e) => setScore2Input(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Match Status Select */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" htmlFor="match-status">Match Status</label>
                <select 
                  id="match-status"
                  className="form-select" 
                  value={matchStatus}
                  onChange={(e) => setMatchStatus(e.target.value as Match['status'])}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live</option>
                  <option value="completed">Completed (Advances Winner)</option>
                </select>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedMatch(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});
