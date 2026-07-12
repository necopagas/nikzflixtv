import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SupportCard } from '../SupportCard';

describe('SupportCard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('unlocks the admin dashboard and saves an uploaded QR to localStorage', async () => {
    const file = new File(['dummy'], 'qr.png', { type: 'image/png' });

    const mockReader = {
      result: 'data:image/png;base64,abc123',
      onload: null,
      onerror: null,
      readAsDataURL: vi.fn(function () {
        if (this.onload) this.onload();
      }),
    };

    vi.stubGlobal(
      'FileReader',
      vi.fn(() => mockReader)
    );

    render(<SupportCard />);

    fireEvent.change(screen.getByPlaceholderText(/enter admin password/i), {
      target: { value: 'babe1010' },
    });
    fireEvent.click(screen.getByRole('button', { name: /unlock admin dashboard/i }));

    expect(await screen.findByLabelText(/upload qr code/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/upload qr code/i), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(localStorage.getItem('gcash_qr')).toBe('data:image/png;base64,abc123');
    });

    expect(await screen.findByText(/qr uploaded successfully/i)).toBeInTheDocument();
  });
});
