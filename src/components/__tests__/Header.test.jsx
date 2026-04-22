import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../Header';

const mockNavigate = vi.fn();
const mockLogout = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({
    currentUser: null,
    logout: mockLogout,
  }),
}));

vi.mock('../LevelBadge', () => ({
  LevelBadge: () => <div data-testid="level-badge" />,
}));

describe('Header Component', () => {
  it('renders logo and navigation', () => {
    render(
      <BrowserRouter>
        <Header onOpenSettings={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getAllByText(/NikzFlix/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('navigation', { name: /primary navigation/i })).toBeInTheDocument();
  });

  it('calls onOpenSettings when settings button clicked', () => {
    const mockOpenSettings = vi.fn();
    render(
      <BrowserRouter>
        <Header theme="dark" toggleTheme={vi.fn()} onOpenSettings={mockOpenSettings} />
      </BrowserRouter>
    );

    const settingsBtn = screen.getAllByLabelText(/open settings/i)[0];
    fireEvent.click(settingsBtn);
    expect(mockOpenSettings).toHaveBeenCalled();
  });
});
