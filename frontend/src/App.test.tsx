import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App Layout Integration Tests', () => {
  it('should render LoginPanel if token is not present', async () => {
    // Clear localStorage token
    localStorage.removeItem('arena_token');
    localStorage.removeItem('arena_user');

    render(<App />);

    expect(await screen.findByText('ArenaFlow Authentication')).toBeInTheDocument();
    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
  });

  it('should render the dashboard layout if token is stored', async () => {
    // Set mock session token
    localStorage.setItem('arena_token', 'mock_jwt_token');
    localStorage.setItem('arena_user', JSON.stringify({ id: 'u1', username: 'director_admin', role: 'director' }));

    render(<App />);

    // Renders sidebar logotext
    expect(await screen.findByText('ArenaFlow')).toBeInTheDocument();
    expect(screen.getAllByText(/Tournament Director/i)[0]).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Overview/i })).toBeInTheDocument();
  });

  it('should perform navigation tab changes when clicking menu buttons', async () => {
    localStorage.setItem('arena_token', 'mock_jwt_token');
    localStorage.setItem('arena_user', JSON.stringify({ id: 'u1', username: 'director_admin', role: 'director' }));

    render(<App />);

    const liveMatchesTab = await screen.findByRole('tab', { name: /Live Matches/i });
    fireEvent.click(liveMatchesTab);

    // Verify tab class updates
    expect(liveMatchesTab).toHaveAttribute('aria-selected', 'true');
  });

  it('should clear token and logout user when clicking logout button', async () => {
    localStorage.setItem('arena_token', 'mock_jwt_token');
    localStorage.setItem('arena_user', JSON.stringify({ id: 'u1', username: 'director_admin', role: 'director' }));

    render(<App />);

    // Wait for the app layout to load
    await screen.findByText('ArenaFlow');

    const logoutBtn = await screen.findByRole('button', { name: /Sign Out/i });
    fireEvent.click(logoutBtn);

    expect(localStorage.getItem('arena_token')).toBeNull();
  });
});
