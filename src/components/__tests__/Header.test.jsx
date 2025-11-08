import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Header } from '../Header';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Header Component', () => {
  it('renders logo and navigation', () => {
    render(
      <BrowserRouter>
        <Header onOpenSettings={vi.fn()} />
      </BrowserRouter>
    );

    expect(screen.getByText(/NikzFlix/i)).toBeInTheDocument();
  });

  it('calls onOpenSettings when settings button clicked', () => {
    const mockOpenSettings = vi.fn();
    render(
      <BrowserRouter>
        <Header onOpenSettings={mockOpenSettings} />
      </BrowserRouter>
    );

    const settingsBtn = screen.getByLabelText(/settings/i);
    fireEvent.click(settingsBtn);
    expect(mockOpenSettings).toHaveBeenCalled();
  });
});
