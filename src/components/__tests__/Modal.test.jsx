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

  it('defaults the player to 111movies when opened with autoplay', async () => {
    render(
      <Modal
        onClose={vi.fn()}
        item={mockItem}
        isItemInMyList={() => false}
        onToggleMyList={vi.fn()}
        playOnOpen
      />
    );

    const sourceButton = await screen.findByRole('button', { name: /111movies/i });
    expect(sourceButton).toHaveClass('active');
    expect(sourceButton).toHaveClass('bg-(--brand-color)');
  });

  it('requests fullscreen on the player wrapper when the fullscreen button is clicked', async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    const exitFullscreen = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    });
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: exitFullscreen,
    });
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => null,
    });

    render(
      <Modal
        onClose={vi.fn()}
        item={mockItem}
        isItemInMyList={() => false}
        onToggleMyList={vi.fn()}
        playOnOpen
      />
    );

    const fullscreenButton = await screen.findByRole('button', { name: /toggle fullscreen/i });
    fireEvent.click(fullscreenButton);

    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('toggles playback state and fullscreen with keyboard shortcuts', async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    });
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => null,
    });

    render(
      <Modal
        onClose={vi.fn()}
        item={mockItem}
        isItemInMyList={() => false}
        onToggleMyList={vi.fn()}
        playOnOpen
      />
    );

    const playerFrame = await screen.findByTitle('Video Player');
    const playerShell = playerFrame.closest('div');
    expect(playerShell).toHaveAttribute('data-playing', 'true');

    const spaceEvent = new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true });
    window.dispatchEvent(spaceEvent);
    expect(spaceEvent.defaultPrevented).toBe(true);
    expect(playerShell).toHaveAttribute('data-playing', 'false');

    const fEvent = new KeyboardEvent('keydown', { key: 'f', code: 'KeyF', bubbles: true });
    window.dispatchEvent(fEvent);
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('hides the source header while fullscreen mode is active', async () => {
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => null,
    });

    render(
      <Modal
        onClose={vi.fn()}
        item={mockItem}
        isItemInMyList={() => false}
        onToggleMyList={vi.fn()}
        playOnOpen
      />
    );

    expect(await screen.findByText(/source:/i)).toBeInTheDocument();

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => document.body,
    });
    fireEvent(document, new Event('fullscreenchange'));

    expect(screen.queryByText(/source:/i)).not.toBeInTheDocument();
  });
});
