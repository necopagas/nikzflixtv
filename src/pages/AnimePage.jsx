import React from 'react';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// --- Components ---
const AnimeCard = ({ title, posterUrl }) => (
  <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 xl:w-1/5 p-2">
    <div className="bg-gray-800 rounded-lg overflow-hidden transform hover:scale-105 transition-transform duration-300 ease-in-out">
      <img src={posterUrl} alt={title} className="w-full h-auto object-cover" />
      <div className="p-4">
        <h3 className="text-white text-lg font-bold truncate">{title}</h3>
      </div>
    </div>
  </div>
);

const AnimeCategory = ({ title, animes }) => (
  <div className="mb-12">
    <h2 className="text-3xl font-bold text-white mb-6 border-l-4 border-red-500 pl-4">{title}</h2>
    <div className="flex flex-wrap -m-2">
      {animes.map((anime, index) => (
        <AnimeCard key={index} title={anime.title} posterUrl={anime.posterUrl} />
      ))}
    </div>
  </div>
);


// --- Main Page Component ---
const AnimePage = () => {
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    fade: true,
    cssEase: 'linear'
  };

  const bannerAnimes = [
    {
      title: "Demon Slayer",
      imageUrl: "https://images.alphacoders.com/133/1332823.jpeg",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Demon_Slayer_-_Kimetsu_no_Yaiba_logo.svg/2560px-Demon_Slayer_-_Kimetsu_no_Yaiba_logo.svg.png",
      description: "Humanity's last hope rests on the shoulders of a young boy who becomes a demon slayer after his family is slaughtered and his younger sister is turned into a demon."
    },
    {
      title: "Jujutsu Kaisen",
      imageUrl: "https://images.alphacoders.com/133/1331273.png",
      logoUrl: "https://upload.wikimedia.org/wikipedia/commons/2/29/Jujutsu_Kaisen_logo.png",
      description: "A boy swallows a cursed talisman - the finger of a demon - and becomes cursed himself. He enters a shaman's school to be able to locate the demon's other body parts and thus exorcise himself."
    },
    {
        title: "Attack on Titan",
        imageUrl: "https://images.alphacoders.com/133/1332463.png",
        logoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Attack_on_Titan_logo.svg/2560px-Attack_on_Titan_logo.svg.png",
        description: "In a world where humanity is on the brink of extinction, a young boy vows to exterminate the giant humanoids who threaten his home."
      },
    {
      title: "Spirited Away",
      imageUrl: "https://images6.alphacoders.com/593/593059.jpg",
      description: "A young girl, Chihiro, becomes trapped in a strange new world of spirits. When her parents undergo a mysterious transformation, she must call upon the courage she never knew she had to free herself and return her family to the outside world."
    },
  ];

  const popularAnimes = [
    { title: "One Piece", posterUrl: "https://image.tmdb.org/t/p/w500/e3NBGiAifW9Xt84dQwC3V4gmMVA.jpg" },
    { title: "Naruto Shippuden", posterUrl: "https://image.tmdb.org/t/p/w500/zAYRe2bJxpWTVrwwmBc00VFkAf4.jpg" },
    { title: "Bleach", posterUrl: "https://image.tmdb.org/t/p/w500/2EewmxXe72ogD0EaWM8gqa0hR3S.jpg" },
    { title: "My Hero Academia", posterUrl: "https://image.tmdb.org/t/p/w500/sy6oMsuTr8s5T3WlGk2BvJt4i5s.jpg" },
    { title: "Death Note", posterUrl: "https://image.tmdb.org/t/p/w500/iU0u2IunA2aPSzZxxBvXJQv3sV.jpg" },
  ];

  const topRatedAnimes = [
    { title: "Fullmetal Alchemist: Brotherhood", posterUrl: "https://image.tmdb.org/t/p/w500/5ZFUEOULaVml7pLg1HjAD6dfnJm.jpg" },
    { title: "Hunter x Hunter", posterUrl: "https://image.tmdb.org/t/p/w500/ucIKozmBqgQaxKSfHlE0JQ5QYxC.jpg" },
    { title: "Steins;Gate", posterUrl: "https://image.tmdb.org/t/p/w500/iDxr3cmFAmtkPS2p3sckj4a4eUa.jpg" },
    { title: "Vinland Saga", posterUrl: "https://image.tmdb.org/t/p/w500/4l65CO2y45JdI9d7PAcBgB6fMsz.jpg" },
    { title: "Code Geass", posterUrl: "https://image.tmdb.org/t/p/w500/gNkceTpcp0ztk2tph6a2n1b72w7.jpg" },
  ];

  const animeMovies = [
    { title: "Your Name.", posterUrl: "https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg" },
    { title: "A Silent Voice", posterUrl: "https://image.tmdb.org/t/p/w500/tuNdC3GfC7BIoQx1I4i2H60WpZm.jpg" },
    { title: "Princess Mononoke", posterUrl: "https://image.tmdb.org/t/p/w500/cDALDPm63r4eS0V5k89gG47d21.jpg" },
    { title: "Howl's Moving Castle", posterUrl: "https://image.tmdb.org/t/p/w500/tcrNJfy6I0L05a3iIu1i2WJ2DAb.jpg" },
    { title: "Akira", posterUrl: "https://image.tmdb.org/t/p/w500/AcrhEULTr3swD3W2F3s4jA2aP1.jpg" },
  ];

  return (
    <div className="bg-black min-h-screen">
      {/* --- Banner Section --- */}
      <div className="relative h-[600px] mb-12">
        <Slider {...sliderSettings}>
          {bannerAnimes.map((anime, index) => (
            <div key={index} className="relative h-[600px]">
              <div className="absolute inset-0 bg-black opacity-50 z-10"></div>
              <img src={anime.imageUrl} alt={anime.title} className="w-full h-full object-cover" />
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-start p-8 md:p-16 z-20">
                <div className="max-w-2xl text-white">
                  {anime.logoUrl && (
                    <img src={anime.logoUrl} alt={`${anime.title} Logo`} className="w-2/3 mb-6" />
                  )}
                  <p className="text-lg md:text-xl leading-relaxed mt-4">{anime.description}</p>
                   <button className="mt-8 bg-red-600 text-white font-bold py-3 px-8 rounded-full hover:bg-red-700 transition-colors duration-300">
                    Watch Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>
      
      {/* --- Content Section --- */}
      <div className="container mx-auto px-4">
        <AnimeCategory title="Popular Anime" animes={popularAnimes} />
        <AnimeCategory title="Top Rated Anime" animes={topRatedAnimes} />
        <AnimeCategory title="Anime Movies" animes={animeMovies} />
      </div>
    </div>
  );
};

export default AnimePage;

