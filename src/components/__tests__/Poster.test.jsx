import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Poster } from '../Poster';
import { SettingsProvider } from '../../context/SettingsContext';

describe('Poster (smoke)', () => {
  it('renders title and image', () => {
    const item = { id: 123, title: 'Test Movie', poster_path: null };
    const mockOpen = () => {};
    render(
      <SettingsProvider>
        <Poster item={item} onOpenModal={mockOpen} />
      </SettingsProvider>
    );
    expect(screen.getAllByText('Test Movie').length).toBeGreaterThan(0);
    expect(screen.getByAltText('Test Movie')).toBeInTheDocument();
  });
});
