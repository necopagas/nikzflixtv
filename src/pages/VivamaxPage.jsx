import React, { useState } from 'react';
import { API_ENDPOINTS } from '../config';
import { Row } from '../components/Row';

export const VivamaxPage = ({ onOpenModal, isWatched }) => {
  const vivamaxEndpoint = '/api/vivamax?page=1';
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState(q);

  // debounce search input so we don't re-render/filter on every keystroke
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="pb-6">
      <header className="mb-6">
        <div className="px-6 max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">Vivamax</h1>
        </div>
      </header>

      <div className="space-y-1 px-6 max-w-7xl mx-auto">
        <div className="mb-4 max-w-xl">
          <label htmlFor="vivamax-search" className="sr-only">Search Vivamax</label>
          <div className="relative">
            <input
              id="vivamax-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Vivamax titles..."
              className="w-full pl-3 pr-10 py-2 text-sm rounded bg-[rgba(255,255,255,0.04)] placeholder:text-gray-400 text-white border border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            {q && (
              <button
                onClick={() => setQ('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-300"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <Row
          title="Vivamax"
          endpoint={vivamaxEndpoint}
          onOpenModal={onOpenModal}
          isWatched={isWatched}
          query={debouncedQ}
        />
      </div>
    </div>
  );
};

export default VivamaxPage;
