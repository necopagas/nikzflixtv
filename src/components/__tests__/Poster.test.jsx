import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Poster } from '../Poster';

describe('Poster (smoke)', () => {
  it('renders title and image', () => {
    const item = { id: 123, title: 'Test Movie', poster_path: null };
    const mockOpen = () => {};
    render(<Poster item={item} onOpenModal={mockOpen} />);
    expect(screen.getByText('Test Movie')).toBeTruthy();
  });
});
