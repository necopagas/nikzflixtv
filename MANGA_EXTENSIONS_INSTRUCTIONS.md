# Manga Extensions Page - Paano Gamitin

## Overview

Ang Manga Extensions page nag-display ug manga sources from Keiyoushi Extensions Repository (successor sa Tachiyomi). Users makaka-browse, search, ug download manga extensions para sa Aniyomi/Tachiyomi apps.

---

## Para sa Users: Unsaon Pag-Gamit

### 1. **Access ang Manga Extensions Page**

- Open ang NIKZTV app
- Navigate to **Manga Extensions** page (usually sa menu or navigation)

### 2. **Browse Manga Sources**

- Makita nimo ang list sa tanan available manga extensions
- Each extension naa:
  - **Name** - Ngalan sa extension
  - **Language** - Language badge (EN, JA, etc.)
  - **18+ Badge** - If NSFW content
  - **Version** - Current version number
  - **Package Name** - Technical identifier
  - **Sources** - List of manga websites included

### 3. **Search Extensions**

```
🔍 Search box sa top:
- Type ka diri para search sa extension name
- Example: "MangaDex", "Mangasee", etc.
```

### 4. **Filter by Language**

```
🌐 Language Dropdown:
- Select "All Languages" - para makita tanan
- Select specific language (EN, JA, ES, etc.) - para specific language lang
```

### 5. **Filter by Content Type**

```
🔞 Content Filter:
- "All Content" - Show everything
- "Safe for Work" - SFW only
- "NSFW (18+)" - Adult content only
```

### 6. **Download & Use Extensions**

#### Option 1: Download APK (Para sa Mobile)

1. Click ang **"Download APK"** button (purple gradient)
2. Save ang APK file sa imo phone
3. Install ang APK (enable "Install from Unknown Sources" if needed)
4. Open Aniyomi/Tachiyomi app
5. Go to **Browse → Extensions**
6. The installed extension should appear

#### Option 2: Visit Source Website

1. Click ang **"Visit Source"** button (gray button)
2. Ma-redirect ka sa manga website
3. Pwede ka direct browse sa website mismo

---

## Para sa Developers: Setup & Configuration

### 1. **Repository Source**

```javascript
const MANGA_REPO_URL = 'https://raw.githubusercontent.com/keiyoushi/extensions/repo/index.min.json';
```

- **Keiyoushi** - Active fork/successor sa Tachiyomi extensions
- Repository structure: `https://raw.githubusercontent.com/keiyoushi/extensions/repo/`

### 2. **Data Structure**

Ang API returns array of extensions with this format:

```javascript
{
  name: "Tachiyomi: MangaDex",
  pkg: "eu.kanade.tachiyomi.extension.en.mangadex",
  apk: "tachiyomi-en.mangadex-v1.2.3.apk",
  lang: "en",
  version: "1.2.3",
  nsfw: 0, // 0 = SFW, 1 = NSFW
  sources: [
    {
      name: "MangaDex",
      baseUrl: "https://mangadex.org"
    }
  ]
}
```

### 3. **Features Implemented**

- ✅ Real-time search filtering
- ✅ Language filtering
- ✅ NSFW content filtering
- ✅ Direct APK downloads
- ✅ Source website links
- ✅ Responsive grid layout
- ✅ Loading states
- ✅ Error handling

### 4. **APK Download Links**

```javascript
https://raw.githubusercontent.com/keiyoushi/extensions/repo/apk/${manga.apk}
```

### 5. **Testing Locally**

```bash
# Run development server
npm run dev

# Navigate to manga extensions page
# Check if data loads properly
# Test all filters ug search
```

### 6. **Deployment**

```bash
# Build for production
npm run build

# Deploy to Vercel/Netlify/etc
git add .
git commit -m "Update manga extensions to Keiyoushi"
git push
```

---

## Troubleshooting

### Problem: "Failed to fetch manga data"

**Solution:**

- Check internet connection
- Verify ang Keiyoushi repository URL is accessible
- Check console for CORS errors
- If CORS issue, setup proxy sa `/api/manga.js`

### Problem: APK downloads dili mo work

**Solution:**

- Verify ang APK filename format is correct
- Check if `manga.apk` property exists sa data
- Test direct link sa browser

### Problem: Sources wala mo appear

**Solution:**

- Check if `manga.sources` array exists
- Verify `baseUrl` is valid
- Some extensions might not have sources listed

### Problem: Filters dili mo work

**Solution:**

- Check if `manga.lang` ug `manga.nsfw` properties exist
- Verify filter state management sa `useEffect`
- Check console for JavaScript errors

---

## Important Notes

### Why Keiyoushi?

- Original **Tachiyomiorg** nag-shutdown na sa January 2024 (legal issues)
- **Keiyoushi** is the community-maintained successor
- Actively updated with new extensions ug bug fixes

### Legal Disclaimer

- This page provides links to extensions para sa Aniyomi/Tachiyomi
- Users are responsible for their own usage
- Recommend supporting official manga sources ug creators

### Compatible Apps

- ✅ Aniyomi (Anime + Manga)
- ✅ Tachiyomi (Manga only)
- ✅ Forks: TachiyomiSY, Neko, etc.

---

## Future Enhancements (Optional)

1. **Add Statistics**
   - Total extensions count
   - Extensions per language breakdown
   - Most popular sources

2. **Add Favorites**
   - Users can save favorite extensions
   - Quick access to frequently used sources

3. **Add Installation Guide**
   - Step-by-step tutorial for first-time users
   - Video tutorial embed

4. **Add Extension Updates**
   - Show which extensions have updates
   - "Last updated" timestamp

5. **Add Reviews/Ratings**
   - User ratings for extensions
   - Comments section

---

## Support

If naa kay questions or issues:

1. Check ang browser console for errors
2. Verify ang network requests sa DevTools
3. Test ang Keiyoushi repository URL directly
4. Check if naa updates sa repository structure

**Repository:** https://github.com/keiyoushi/extensions
**Documentation:** https://keiyoushi.github.io/

---

_Last Updated: November 16, 2025_
_Powered by: Keiyoushi Extensions Repository_
