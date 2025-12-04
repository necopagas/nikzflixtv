import React from 'react';

export const GenreFilter = ({ genres, selectedGenre, onGenreSelect }) => {
  return (
    <div className="genre-filter my-8">
      {genres.map(genre => (
        <button
          key={genre.id}
          className={`genre-button ${selectedGenre === genre.id ? 'active' : ''}`}
          onClick={() => onGenreSelect(genre.id)}
        >
          {genre.name}
        </button>
      ))}
    </div>
  );
};
