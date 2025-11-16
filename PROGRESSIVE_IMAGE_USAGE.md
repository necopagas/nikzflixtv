# Progressive Image Loading - Implementation Guide

## ✅ Features Implemented

1. **ProgressiveImage Component** - Blur-up lazy loading with placeholder
2. **Skeleton Loading Components** - Beautiful loading states
3. **OptimizedPoster Component** - Ready-to-use poster with progressive loading
4. **Intersection Observer** - Lazy load images when they enter viewport

---

## 🚀 Quick Start

### 1. Replace Regular Images

**Before:**

```jsx
<img src={imageUrl} alt="Poster" className="w-full rounded-lg" />
```

**After:**

```jsx
import { ProgressiveImage } from '../components/ProgressiveImage';

<ProgressiveImage
  src={imageUrl}
  alt="Poster"
  className="w-full rounded-lg"
  placeholderSrc={lowQualityUrl} // Optional
  fallbackSrc="/placeholder.png"
/>;
```

---

### 2. Use OptimizedPoster for Movie/Anime Cards

**Before:**

```jsx
<div className="poster-card" onClick={() => handleClick(item)}>
  <img src={item.poster_path} alt={item.title} />
  <h3>{item.title}</h3>
</div>
```

**After:**

```jsx
import { OptimizedPoster } from '../components/ProgressiveImage';

<OptimizedPoster
  item={item}
  onClick={handleClick}
  isWatched={id => watchedHistory.includes(id)}
  showTitle={true}
  isLarge={false}
/>;
```

---

### 3. Add Loading Skeletons

**While data is loading:**

```jsx
import { RowSkeleton, PosterSkeleton, BannerSkeleton } from '../components/ProgressiveImage';

{
  isLoading ? (
    <RowSkeleton posterCount={6} />
  ) : (
    <div className="grid grid-cols-6 gap-4">
      {movies.map(movie => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}
```

**For Hero Banner:**

```jsx
{
  isLoading ? (
    <BannerSkeleton />
  ) : (
    <div className="hero-banner">
      <ProgressiveImage src={bannerImage} alt="Featured" />
    </div>
  );
}
```

---

### 4. Modal Loading States

```jsx
import { ModalSkeleton } from '../components/ProgressiveImage';

{
  isLoadingDetails ? (
    <ModalSkeleton />
  ) : (
    <div className="modal-content">{/* Your modal content */}</div>
  );
}
```

---

## 📦 Component API

### ProgressiveImage Props

| Prop             | Type     | Default            | Description                     |
| ---------------- | -------- | ------------------ | ------------------------------- |
| `src`            | string   | required           | Full-quality image URL          |
| `alt`            | string   | ''                 | Alt text for accessibility      |
| `className`      | string   | ''                 | Additional CSS classes          |
| `placeholderSrc` | string   | null               | Low-quality placeholder URL     |
| `fallbackSrc`    | string   | '/placeholder.png' | Fallback if image fails         |
| `onLoad`         | function | null               | Callback when image loads       |
| `onError`        | function | null               | Callback on error               |
| `threshold`      | number   | 0.01               | Intersection Observer threshold |
| `rootMargin`     | string   | '50px'             | Load images 50px before visible |

### OptimizedPoster Props

| Prop        | Type     | Default  | Description                         |
| ----------- | -------- | -------- | ----------------------------------- |
| `item`      | object   | required | Movie/anime object with poster_path |
| `onClick`   | function | null     | Click handler                       |
| `isWatched` | function | null     | Function to check if watched        |
| `isLarge`   | boolean  | false    | Use w500 instead of w300            |
| `showTitle` | boolean  | true     | Show title on hover                 |

### Skeleton Props

| Prop           | Type   | Default | Description        |
| -------------- | ------ | ------- | ------------------ |
| `width`        | string | '100%'  | Skeleton width     |
| `height`       | string | '200px' | Skeleton height    |
| `borderRadius` | string | '8px'   | Corner rounding    |
| `className`    | string | ''      | Additional classes |

---

## 🎨 Examples

### Example 1: HomePage Hero Section

```jsx
import { ProgressiveImage, BannerSkeleton } from '../components/ProgressiveImage';

const HomePage = () => {
  const { data: featured, isLoading } = useQuery(['featured']);

  return (
    <>
      {isLoading ? (
        <BannerSkeleton />
      ) : (
        <div className="hero relative h-[600px]">
          <ProgressiveImage
            src={`https://image.tmdb.org/t/p/original${featured.backdrop_path}`}
            placeholderSrc={`https://image.tmdb.org/t/p/w92${featured.backdrop_path}`}
            className="w-full h-full object-cover"
            alt={featured.title}
          />
          <div className="absolute bottom-0 left-0 p-8">
            <h1>{featured.title}</h1>
            <p>{featured.overview}</p>
          </div>
        </div>
      )}
    </>
  );
};
```

### Example 2: Grid of Movies

```jsx
import { OptimizedPoster, PosterSkeleton } from '../components/ProgressiveImage';

const MoviesGrid = ({ movies, isLoading, onMovieClick }) => {
  const watchedHistory = JSON.parse(localStorage.getItem('watchedHistory') || '[]');

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <PosterSkeleton count={12} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {movies.map(movie => (
        <OptimizedPoster
          key={movie.id}
          item={movie}
          onClick={onMovieClick}
          isWatched={id => watchedHistory.some(h => h.id === id)}
          showTitle={true}
        />
      ))}
    </div>
  );
};
```

### Example 3: Manga Cover

```jsx
import { ProgressiveImage } from '../components/ProgressiveImage';

const MangaCover = ({ manga }) => {
  return (
    <ProgressiveImage
      src={manga.coverArt}
      alt={manga.title}
      className="w-full h-[400px] object-cover rounded-lg shadow-xl"
      placeholderSrc={manga.coverArt + '?quality=low'}
      fallbackSrc="/manga-placeholder.png"
      onLoad={() => console.log('Cover loaded!')}
    />
  );
};
```

---

## 🔧 Customization

### Change Animation Duration

```jsx
<ProgressiveImage
  src={imageUrl}
  className="transition-all duration-700" // Change from default 500ms
/>
```

### Custom Blur Effect

```jsx
<ProgressiveImage
  src={imageUrl}
  className={`${isLoading ? 'blur-xl' : 'blur-0'}`} // Stronger blur
/>
```

### Change Loading Spinner

```jsx
{
  isLoading && (
    <div className="absolute inset-0 flex items-center justify-center">
      <YourCustomSpinner />
    </div>
  );
}
```

---

## 🚀 Performance Benefits

1. **Lazy Loading**: Images load only when needed (viewport detection)
2. **Blur-up Effect**: Show low-quality placeholder instantly
3. **Bandwidth Savings**: Load w300 thumbnails instead of w500 when possible
4. **Better UX**: Skeleton screens instead of blank spaces
5. **Error Handling**: Automatic fallback to placeholder on failure

---

## 📝 Next Steps

1. **Update all pages** to use `OptimizedPoster` instead of regular `<img>`
2. **Add skeletons** to loading states in HomePage, AnimePage, DramaPage, MangaPage
3. **Implement virtual scrolling** for long lists (use react-window)
4. **Add blur hash** for even faster perceived load times

---

## 🎯 Pages to Update

- [ ] HomePage - Hero banner + movie rows
- [ ] AnimePage - Anime posters grid
- [ ] DramaPage - Drama cards
- [ ] MangaPage - Manga covers
- [ ] SearchPage - Search results
- [ ] MyListPage - User's saved content
- [ ] VivamaxPage - Vivamax content
- [ ] IPTVPage - Channel logos

---

## 💡 Pro Tips

1. **Generate placeholders server-side** for better performance
2. **Use WebP format** when available (TMDB supports it)
3. **Preload critical images** using `<link rel="preload">`
4. **Use blurhash library** for even smoother placeholders
5. **Monitor bundle size** - react-intersection-observer is lightweight (2.5KB)

---

## 🐛 Troubleshooting

**Images not loading?**

- Check network tab for 404 errors
- Verify TMDB API paths are correct
- Ensure fallbackSrc exists in public folder

**Blur effect not working?**

- Make sure Tailwind blur utilities are enabled
- Check transition duration is set
- Verify isLoading state changes correctly

**Performance issues?**

- Increase rootMargin to load images earlier
- Reduce placeholder quality (use w92 instead of w154)
- Implement virtual scrolling for 100+ images
