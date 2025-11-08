# Manga Extensions Feature 📚

## Overview

Gibutang na nato ang manga repository integration sa NIKZTV web app! This feature allows users to browse and download Tachiyomi manga extensions.

## What Was Added

### 1. **New Page: MangaExtensionsPage**

- **Location**: `src/pages/MangaExtensionsPage.jsx`
- **Features**:
  - Fetches manga extensions from: `https://raw.githubusercontent.com/yuzono/manga-repo/repo/index.min.json`
  - Displays 1,280+ manga extensions
  - Language filter (English, Japanese, Korean, Chinese, Vietnamese, etc.)
  - NSFW filter (All, Safe for Work, NSFW 18+)
  - Search functionality
  - Download APK buttons for each extension
  - Shows extension details: version, package name, sources, base URLs

### 2. **Route Added**

- **URL**: `/manga-extensions`
- **Access**: Click "More" → "Manga" in the navigation header

### 3. **Navigation Updated**

- Added "Manga" link in the Header's "More" dropdown menu

## How to Use

1. **Visit the page**: Navigate to http://localhost:5175/manga-extensions
2. **Browse extensions**: Scroll through 1,280+ manga extensions
3. **Filter by language**: Select from EN, JA, KO, ZH, VI, etc.
4. **Filter by content**: Choose All, Safe for Work, or NSFW
5. **Search**: Type manga name or source to find specific extensions
6. **Download**: Click "Download APK" to get the Tachiyomi extension

## Features

### Search & Filters

- **Search Bar**: Search by extension name or manga source
- **Language Filter**: Filter by language (All, EN, JA, KO, PT, VI, ZH, etc.)
- **Content Filter**:
  - All Content
  - Safe for Work (SFW)
  - NSFW (18+)

### Extension Cards

Each card displays:

- Extension name
- Language badge
- Version number
- 18+ badge (if NSFW)
- Package name
- Number of sources
- Source names and URLs
- Download APK button

## Data Source

The manga data comes from the Yuzono Manga Repository:

```
https://raw.githubusercontent.com/yuzono/manga-repo/repo/index.min.json
```

This repository contains Tachiyomi extensions for multiple languages and manga sources worldwide.

## Technical Details

### Files Modified/Created

1. ✅ `src/pages/MangaExtensionsPage.jsx` - New manga extensions page
2. ✅ `src/App.jsx` - Added route and lazy import
3. ✅ `src/components/Header.jsx` - Added navigation link

### Dependencies

- No new dependencies required
- Uses existing components: `LoadingSpinner`
- Uses existing icons from `lucide-react`

### Responsive Design

- Mobile-friendly grid layout
- Responsive cards that adapt to screen size
- Touch-friendly UI elements

## Future Enhancements

Possible improvements:

- [ ] Add favorites/bookmarks for extensions
- [ ] Show extension popularity or download counts
- [ ] Add categories/genres filter
- [ ] Integrate with actual manga reading (if desired)
- [ ] Add "recently updated" filter
- [ ] Show extension compatibility info

## Testing

To test the feature:

```bash
npm run dev
```

Then visit: http://localhost:5175/manga-extensions

## Notes

- All manga extensions are Tachiyomi APKs
- Extensions are organized by language
- NSFW content is clearly labeled
- Direct download links from GitHub repository
- No backend required - all data fetched from public JSON

---

**Completed**: November 8, 2025
**Developer**: GitHub Copilot
**Status**: ✅ Fully Functional
