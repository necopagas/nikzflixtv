import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../Modal';

describe('Modal Component', () => {
  const mockItem = {
    title: 'Test Movie',
    overview: 'A test movie description',
    vote_average: 8.5,
    release_date: '2024-01-01',
  };

  it('renders when isOpen is true', () => {
    render(
      <Modal
        isOpen={true}
        onClose={vi.fn()}
        item={mockItem}
        isInMyList={false}
        onToggleMyList={vi.fn()}
      />
    );

    expect(screen.getByText('Test Movie')).toBeInTheDocument();
    expect(screen.getByText(/test movie description/i)).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal
        isOpen={false}
        onClose={vi.fn()}
        item={mockItem}
        isInMyList={false}
        onToggleMyList={vi.fn()}
      />
    );

    expect(screen.queryByText('Test Movie')).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const mockOnClose = vi.fn();
    render(
      <Modal
        isOpen={true}
        onClose={mockOnClose}
        item={mockItem}
        isInMyList={false}
        onToggleMyList={vi.fn()}
      />
    );

    const closeBtn = screen.getByLabelText(/close/i);
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
