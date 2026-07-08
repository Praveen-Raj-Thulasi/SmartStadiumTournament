import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LoginPanel } from './LoginPanel';

describe('LoginPanel Component Tests', () => {
  const mockState = {
    loginUser: vi.fn().mockResolvedValue(true),
    registerUser: vi.fn().mockResolvedValue(true),
    triggerError: vi.fn(),
  } as any;

  it('should render the login panel with autofill options', () => {
    render(<LoginPanel state={mockState} />);
    
    expect(screen.getByText('ArenaFlow Authentication')).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByText('Access Command Center')).toBeInTheDocument();
    expect(screen.getByText('Live Evaluation Autofills')).toBeInTheDocument();
  });

  it('should switch tabs between Sign In and Register', () => {
    render(<LoginPanel state={mockState} />);
    
    const registerTabButton = screen.getByRole('button', { name: 'Register' });
    fireEvent.click(registerTabButton);
    
    expect(screen.getByLabelText(/Assigned Operations Role/i)).toBeInTheDocument();
    expect(screen.getByText('Create Credentials')).toBeInTheDocument();
    
    const signInTabButton = screen.getByRole('button', { name: 'Sign In' });
    fireEvent.click(signInTabButton);
    expect(screen.queryByLabelText(/Assigned Operations Role/i)).not.toBeInTheDocument();
  });

  it('should trigger loginUser on preset credentials click', async () => {
    render(<LoginPanel state={mockState} />);
    
    const directorAutofillButton = screen.getByText(/Autofill Tournament Director/i);
    await act(async () => {
      fireEvent.click(directorAutofillButton);
    });
    
    expect(mockState.loginUser).toHaveBeenCalledWith('director', 'password123');
  });

  it('should validate empty inputs and show error', async () => {
    render(<LoginPanel state={mockState} />);
    
    const form = screen.getByPlaceholderText('Enter username').closest('form')!;
    await act(async () => {
      fireEvent.submit(form);
    });
    
    expect(mockState.triggerError).toHaveBeenCalledWith('Please fill in all credentials fields.');
  });
});
