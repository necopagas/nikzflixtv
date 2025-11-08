# Phase 1: Quick Wins 🚀

## 1. Add Environment Variables

Create `.env` file:

```bash
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_SENTRY_DSN=your_sentry_dsn_here
```

## 2. Run Development Server

```bash
npm run dev
```

## 3. Test New Features

- Check console for Sentry initialization
- Open DevTools → Application → Service Workers
- See TanStack Query DevTools (bottom left)

---

# Phase 2: Migrate to Zustand Stores 📦

## Priority Components to Migrate:

### 1. SettingsModal.jsx

Replace old localStorage with `useSettingsStore`:

```javascript
// OLD
import { useTheme } from '../hooks/useTheme';

// NEW
import { useSettingsStore } from '@store/settingsStore';

// In component
const { theme, toggleTheme, updateSetting } = useSettingsStore();
```

### 2. App.jsx

Replace MyList hook:

```javascript
// OLD
import { useMyList } from './hooks/useMyList';

// NEW
import { useMyListStore } from '@store/myListStore';

// In component
const { myList, toggleMyList, isInMyList } = useMyListStore();
```

### 3. Replace Continue Watching

```javascript
// OLD
import { useContinueWatching } from './hooks/useContinueWatching';

// NEW
import { useWatchProgressStore } from '@store/watchProgressStore';
```

---

# Phase 3: Write Tests 🧪

## Create tests for key components:

### Header.test.jsx (✅ Done)

### Modal.test.jsx (✅ Done)

### Create more tests:

```bash
# Create test files
src/components/__tests__/Poster.test.jsx
src/components/__tests__/Row.test.jsx
src/store/__tests__/settingsStore.test.js
```

### Run tests

```bash
npm test              # Watch mode
npm run test:ui       # Visual UI
npm run test:coverage # Check coverage
```

---

# Phase 4: Add API Layer with TanStack Query 🌐

## Create API hooks:

### src/hooks/useMovies.js

```javascript
import { useQuery } from '@tanstack/react-query';
import { fetchTMDB } from '@utils/fetchData';

export const useMovies = category => {
  return useQuery({
    queryKey: ['movies', category],
    queryFn: () => fetchTMDB(category),
    staleTime: 5 * 60 * 1000,
  });
};
```

### Usage in components:

```javascript
const { data: movies, isLoading, error } = useMovies('trending');
```

---

# Phase 5: Improve Bundle Size 📦

## 1. Analyze current bundle

```bash
npm run build
npm run analyze
```

## 2. Implement virtual scrolling for Row.jsx

```javascript
import { FixedSizeList } from 'react-window';
```

## 3. Optimize images

- Convert to WebP
- Add blur placeholders
- Implement progressive loading

---

# Phase 6: Enhance Accessibility ♿

## Add ARIA labels:

### Header.jsx

```javascript
<button aria-label="Open settings" onClick={onOpenSettings}>
  <FiSettings />
</button>
```

### Modal.jsx

```javascript
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
>
```

---

# Phase 7: Security Hardening 🔒

## 1. Use DOMPurify for user content

```javascript
import { sanitizeHTML } from '@utils/security';

<div
  dangerouslySetInnerHTML={{
    __html: sanitizeHTML(userContent),
  }}
/>;
```

## 2. Add rate limiting to API calls

```javascript
import { RateLimiter } from '@utils/security';

const limiter = new RateLimiter(10, 60000);
if (!limiter.isAllowed(userId)) {
  throw new Error('Rate limit exceeded');
}
```

---

# Phase 8: PWA Enhancement 📱

## 1. Add manifest.json updates

```json
{
  "name": "NikzFlix TV",
  "short_name": "NikzFlix",
  "theme_color": "#e50914",
  "background_color": "#141414",
  "display": "standalone"
}
```

## 2. Test offline mode

- Disconnect internet
- App should show offline page
- Cached content should still load

---

# Phase 9: Mobile Features 📱

## Test Capacitor features:

```bash
npm run build
npx cap sync
npx cap open android
```

## Add push notification handler

```javascript
// In a component
useEffect(() => {
  const { addListener } = PushNotifications;

  addListener('pushNotificationReceived', notification => {
    showToast(`New: ${notification.title}`, 'info');
  });
}, []);
```

---

# Phase 10: Documentation 📚

## 1. Component documentation with Storybook

```bash
npm run storybook
```

## 2. Create stories for components:

```javascript
// Poster.stories.jsx
export default {
  title: 'Components/Poster',
  component: Poster,
};

export const Default = {
  args: {
    item: mockMovie,
    onClick: () => {},
  },
};
```

---

# Quick Action Items (Do Now) ⚡

1. ✅ Create `.env` file with API keys
2. ✅ Run `npm run dev` and test
3. ✅ Replace one hook with Zustand (start with settings)
4. ✅ Write 2-3 new tests
5. ✅ Run `npm run analyze` to see bundle

---

# Commands Reference 📝

```bash
# Development
npm run dev              # Start dev server
npm run build           # Production build
npm run preview         # Preview build

# Testing
npm test                # Run tests
npm run test:ui         # Vitest UI
npm run test:coverage   # Coverage report

# Code Quality
npm run lint            # Check linting
npm run lint:fix        # Fix linting
npm run format          # Format code

# Bundle Analysis
npm run analyze         # See bundle size

# Storybook
npm run storybook       # Start Storybook
npm run build-storybook # Build Storybook

# Mobile
npx cap sync           # Sync to Android
npx cap open android   # Open in Android Studio
```
