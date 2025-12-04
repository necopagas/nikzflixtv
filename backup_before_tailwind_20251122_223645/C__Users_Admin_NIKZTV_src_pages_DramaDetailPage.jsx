// src/pages/DramaDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// --- GI-TANGGAL ANG IMPORT KAY WALA NA GIGAMIT ---
// import { getDramaDetails } from '../utils/consumetApi';
// --- GIDUGANG NGA IMPORT KAY TMDB NA ATONG GAMITON ---
import { fetchData } from '../utils/fetchData';
import { API_ENDPOINTS, BACKDROP_PATH } from '../config'; // Import needed config
import ProgressiveImage from '../components/ProgressiveImage';

export const DramaDetailPage = () => {
  const { dramaId } = useParams();
  const navigate = useNavigate();
  const [drama, setDrama] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- GI-UPDATE PARA MOGAMIT OG TMDB ---
  useEffect(() => {
    setIsLoading(true);
    // I-assume nato nga TV Show ni gikan sa TMDB
    fetchData(API_ENDPOINTS.details('tv', dramaId))
      .then(data => {
        if (data && data.id) {
          // Check kung valid ba ang response
          // I-map nato ang TMDB data para similar sa expected structure
          const formattedData = {
            id: data.id,
            title: data.name,
            image: data.poster_path ? `${BACKDROP_PATH}${data.poster_path}` : null, // Gamiton ang poster path
            otherNames: data.alternative_titles?.results?.map(t => t.title) || [],
            genres: data.genres?.map(g => g.name) || [],
            description: data.overview,
            // I-process ang seasons ug episodes gikan sa TMDB details
            seasons: data.seasons,
            numberOfSeasons: data.number_of_seasons,
          };
          setDrama(formattedData);
        } else {
          setDrama(null); // Set to null kung naay error or walay ID
        }
      })
      .catch(error => {
        console.error('Failed to fetch drama details from TMDB:', error);
        setDrama(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [dramaId]);

  // --- ANG PAG-HANDLE SA EPISODE KAY NAA NA SA MODAL ---
  // Dili na ta moadto sa separate player page
  // const handleEpisodeClick = (episodeId) => {
  //     navigate(`/drama/watch/${episodeId}`);
  // };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="player-loading"></div>
      </div>
    );
  }

  if (!drama) {
    return (
      <div className="text-center py-16 pt-28">
        <p className="text-xl text-(--text-secondary)">Drama details not found.</p>
        <button onClick={() => navigate('/drama')} className="mt-4 px-4 py-2 bg-red-600 rounded">
          Back to Dramas
        </button>
      </div>
    );
  }

  // --- TANGGALON NATO ANG EPISODE LIST KAY NAA NA SA MODAL ---
  // --- MAGFOKUS LANG TA SA DETAILS PAGE ITSELF ---

  return (
    <div className="px-4 sm:px-8 md:px-16 pt-28 pb-20">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3 flex-shrink-0">
          {drama.image ? (
            <ProgressiveImage
              src={drama.image}
              placeholder={'/no-image.svg'}
              alt={drama.title}
              imgProps={{ className: 'w-full rounded-lg shadow-lg aspect-[2/3] object-cover' }}
            />
          ) : (
            <div className="w-full rounded-lg shadow-lg aspect-2/3 bg-(--bg-tertiary) flex items-center justify-center">
              <span className="text-(--text-secondary)">No Image</span>
            </div>
          )}
        </div>
        <div className="md:w-2/3">
          <h1 className="text-4xl font-extrabold mb-2">{drama.title}</h1>
          {drama.otherNames && drama.otherNames.length > 0 && (
            <p className="text-lg text-[var(--text-secondary)] mb-4">
              Also known as: {drama.otherNames.slice(0, 3).join(', ')}{' '}
              {/* Limit alternative titles */}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            {drama.genres?.map(genre => (
              <span key={genre} className="bg-[var(--bg-tertiary)] text-sm px-3 py-1 rounded-full">
                {genre}
              </span>
            ))}
          </div>
          {drama.numberOfSeasons && (
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {drama.numberOfSeasons} Season{drama.numberOfSeasons > 1 ? 's' : ''}
            </p>
          )}
          <p className="text-[var(--text-primary)] leading-relaxed">
            {drama.description || 'No description available.'}
          </p>

          {/* Optional: Add button to open in Modal for Playback */}
          {/* <button 
                        // onClick={() => onOpenModal({ id: drama.id, title: drama.title, name: drama.title, poster_path: drama.image, media_type: 'tv' })} // Need to pass onOpenModal prop from App.jsx if used
                        className="mt-6 px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700"
                    >
                        View Episodes & Play
                    </button> */}
        </div>
      </div>

      {/* --- GITANGGAL ANG EPISODE LIST SECTION --- */}
      {/* <div className="mt-12">
                 <h2 className="text-3xl font-bold mb-6 border-b border-[var(--border-color)] pb-2">Episodes</h2>
                 <p className="text-[var(--text-secondary)]">Episodes can be viewed by clicking the poster on the main Drama page.</p> 
            </div> 
            */}
    </div>
  );
};
