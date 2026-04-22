import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../Modal';

const mockFetchData = vi.fn();

vi.mock('../../utils/fetchData', () => ({
  fetchData: (...args) => mockFetchData(...args),
}));

vi.mock('../Poster', () => ({
  Poster: ({ item }) => <div data-testid="recommendation-poster">{item.title || item.name}</div>,
}));

vi.mock('../AddToPlaylistButton', () => ({
  AddToPlaylistButton: () => <button type="button">Add to Playlist</button>,
}));

vi.mock('../DownloadButton', () => ({
  default: () => <button type="button">Download</button>,
}));

describe('Modal Component', () => {
  const mockItem = {
    id: 123,
    title: 'Test Movie',
    overview: 'A test movie description',
    vote_average: 8.5,
    release_date: '2024-01-01',
  };

  const mockDetails = {
    ...mockItem,
    backdrop_path: '/backdrop.jpg',
    videos: { results: [] },
    runtime: 120,
  };

  beforeEach(() => {
    mockFetchData.mockReset();
    mockFetchData.mockResolvedValueOnce(mockDetails).mockResolvedValueOnce({ results: [] });
  });

  it('renders fetched details when opened', async () => {
    render(
      <Modal
        onClose={vi.fn()}
        item={mockItem}
        isItemInMyList={() => false}
        onToggleMyList={vi.fn()}
      />
    );

    expect(await screen.findByText('Test Movie')).toBeInTheDocument();
    expect(screen.getByText(/test movie description/i)).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const mockOnClose = vi.fn();
    render(
      <Modal
        onClose={mockOnClose}
        item={mockItem}
        isItemInMyList={() => false}
        onToggleMyList={vi.fn()}
      />
    );

    const closeBtn = await screen.findByLabelText(/close modal/i);
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
