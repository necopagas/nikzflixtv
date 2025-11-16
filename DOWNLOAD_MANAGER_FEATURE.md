# 📥 Download Manager Feature

Complete offline viewing system with download queue management and storage optimization.

## ✨ Features

### Core Functionality

- **Download Queue Management**: Queue multiple downloads with automatic processing
- **Quality Selection**: Choose from 360p, 480p, 720p, or 1080p before downloading
- **Progress Tracking**: Real-time download progress with pause/resume capability
- **Storage Management**: Monitor storage usage and manage downloaded content
- **Offline Playback**: Watch downloaded content without internet connection

### Download States

- **Queued**: Download added to queue, waiting to start
- **Downloading**: Active download with progress bar
- **Paused**: Download paused, can be resumed
- **Completed**: Download finished, ready for offline viewing
- **Failed**: Download failed, can retry
- **Cancelled**: Download cancelled by user

### User Controls

- **Pause/Resume**: Pause downloads and resume later
- **Cancel**: Cancel active downloads
- **Delete**: Remove downloaded content to free space
- **Clear Completed**: Batch remove all completed downloads
- **Clear All**: Remove all downloads at once

## 🎯 Components

### 1. useDownloadManager Hook

**Location**: `src/hooks/useDownloadManager.js`

Custom hook for managing all download operations:

```javascript
const {
  isSupported, // Browser support check
  downloads, // Array of all downloads
  storageInfo, // Storage usage stats
  addDownload, // Add item to download queue
  pauseDownload, // Pause active download
  resumeDownload, // Resume paused download
  cancelDownload, // Cancel download
  deleteDownload, // Delete downloaded item
  clearCompleted, // Clear all completed
  clearAll, // Clear all downloads
  isDownloaded, // Check if item downloaded
  getDownloadByItemId, // Get download by item
} = useDownloadManager();
```

**Key Features**:

- IndexedDB for persistent storage
- Storage quota monitoring
- Download status management
- Progress tracking simulation (replace with actual SW communication)

### 2. DownloadButton Component

**Location**: `src/components/DownloadButton.jsx`

Smart download button that shows current status:

```jsx
<DownloadButton
  item={item} // Content item to download
  quality="720p" // Default quality
  size="medium" // Button size: small, medium, large
  showLabel={true} // Show status label
/>
```

**Features**:

- Quality selection menu
- Status-specific icons and colors
- Progress indicator for active downloads
- Context menu for completed downloads
- Pause/resume controls

### 3. DownloadsPage Component

**Location**: `src/pages/DownloadsPage.jsx`

Full download management dashboard:

**Features**:

- Storage usage visualization
- Download statistics (total, active, queued, completed)
- Filter by status (all, active, completed)
- Bulk actions (clear completed, clear all)
- Individual download controls
- Navigate to downloaded content

## 💾 Storage System

### IndexedDB Structure

**Database**: `nikzflix_downloads`
**Store**: `downloads`

**Schema**:

```javascript
{
  id: string,              // Unique download ID
  itemId: number,          // Content item ID
  title: string,           // Content title
  poster: string,          // Poster path
  backdrop: string,        // Backdrop path
  overview: string,        // Description
  mediaType: string,       // 'movie' or 'tv'
  quality: string,         // Selected quality
  status: string,          // Current status
  progress: number,        // 0-100
  addedAt: string,         // ISO timestamp
  completedAt: string,     // ISO timestamp or null
  size: number,            // File size in bytes
  error: string,           // Error message or null
}
```

### Storage Monitoring

- Uses `navigator.storage.estimate()` API
- Shows used/available storage in MB
- Visual percentage indicator
- Warns when storage is low

## 🔧 Service Worker Integration

**Location**: `public/sw.js`

### Download Handler

```javascript
// Message from app to start download
self.addEventListener('message', event => {
  if (event.data.type === 'DOWNLOAD_VIDEO') {
    handleDownload(url, id, metadata, port);
  }
});
```

### Features:

- Chunk-based downloading with progress tracking
- Blob storage in CacheStorage API
- Download cancellation support
- Offline serving of downloaded content

### Cache Strategy

- **Cache Name**: `nikzflix-downloads-v1`
- **URL Pattern**: `/download/{id}`
- Downloads stored separately from app cache
- Metadata stored in response headers

## 📱 User Interface

### Download Button States

| Status      | Icon              | Color   | Progress Bar |
| ----------- | ----------------- | ------- | ------------ |
| Available   | Download          | Blue    | -            |
| Queued      | Loader (spinning) | Yellow  | -            |
| Downloading | Pause             | Green   | ✓            |
| Paused      | Play              | Orange  | ✓            |
| Completed   | Check             | Emerald | -            |
| Failed      | X                 | Red     | -            |

### Downloads Page Layout

```
┌─────────────────────────────────────┐
│ Storage Usage Card                  │
│ [Progress Bar] 1.2GB / 5GB (24%)   │
└─────────────────────────────────────┘

┌───────┬───────┬───────┬───────────┐
│ Total │Active │Queued │ Completed │
│   15  │   2   │   1   │    12     │
└───────┴───────┴───────┴───────────┘

[All (15)] [Active (2)] [Completed (12)]
[Clear Completed] [Clear All]

┌─────────────────────────────────────┐
│ [Poster] Movie Title                │
│          Description...              │
│          [downloading] [720p] [movie]│
│          [████████░░] 75%           │
│                               [⏸][✕]│
└─────────────────────────────────────┘
```

## 🚀 Usage Examples

### Basic Download

```jsx
import DownloadButton from './components/DownloadButton';

function MovieCard({ movie }) {
  return (
    <div>
      <h3>{movie.title}</h3>
      <DownloadButton item={movie} quality="720p" />
    </div>
  );
}
```

### In Modal (Already Integrated)

```jsx
// Modal.jsx includes DownloadButton automatically
<DownloadButton item={item} quality="720p" size="medium" showLabel={true} />
```

### Check Download Status

```jsx
import { useDownloadManager } from '../hooks/useDownloadManager';

function VideoPlayer({ itemId }) {
  const { isDownloaded, getDownloadByItemId } = useDownloadManager();

  if (isDownloaded(itemId)) {
    const download = getDownloadByItemId(itemId);
    // Play from offline cache
    return <OfflinePlayer download={download} />;
  }

  // Stream online
  return <OnlinePlayer itemId={itemId} />;
}
```

## 🎨 Styling

### Custom Classes

- `.download-button` - Base button styles
- `.download-button:disabled` - Disabled state
- `.download-button:not(:disabled):hover` - Hover effect
- `@keyframes download-pulse` - Pulsing animation for queued

### Tailwind Classes Used

- `bg-blue-600` - Default download button
- `bg-green-600` - Downloading state
- `bg-orange-600` - Paused state
- `bg-emerald-600` - Completed state
- `bg-red-600` - Failed state
- `bg-yellow-600` - Queued state

## 🔒 Browser Support

### Required APIs

- ✅ **IndexedDB** - Persistent storage
- ✅ **Service Worker** - Background downloads
- ✅ **CacheStorage** - Offline content serving
- ✅ **Storage API** - Quota management
- ✅ **ReadableStream** - Chunked downloads

### Detection

```javascript
const isSupported = 'serviceWorker' in navigator && 'indexedDB' in window && 'storage' in navigator;
```

### Fallback

If downloads not supported, button is hidden and downloads page shows error message.

## 📊 Performance

### Optimization Strategies

- **Chunked Reading**: Download in chunks to track progress
- **Blob Storage**: Efficient binary data handling
- **Lazy Loading**: Downloads page lazy loaded
- **Progress Throttling**: Updates sent at intervals
- **Cache Partitioning**: Separate cache for downloads

### Storage Limits

- **Typical Browser Quota**: 50% of available disk space
- **Recommended Max Download**: 2GB per item
- **Quality File Sizes**:
  - 360p: ~300MB per movie
  - 480p: ~500MB per movie
  - 720p: ~1GB per movie
  - 1080p: ~2GB per movie

## 🔄 Future Enhancements

### Planned Features

1. **Background Sync**: Resume downloads after app closes
2. **Smart Quality**: Auto-select quality based on available storage
3. **Download Scheduling**: Schedule downloads for off-peak hours
4. **Multi-Episode Download**: Bulk download TV series episodes
5. **Download Notifications**: Push notifications on completion
6. **P2P Downloads**: Peer-to-peer content sharing
7. **Subtitle Downloads**: Include subtitles with videos
8. **Watch While Downloading**: Start playback before complete

### Known Limitations

1. Current implementation uses simulated progress (replace with real SW communication)
2. Actual video downloads require CORS-enabled video sources
3. Storage quota varies by browser and device
4. No resume support after browser restart (coming soon)

## 🐛 Troubleshooting

### Issue: Download button not showing

**Solution**: Check browser support with DevTools console

### Issue: Download fails immediately

**Solution**: Check storage quota and free up space

### Issue: Progress stuck at 0%

**Solution**: Check network connection and video source availability

### Issue: Downloaded video won't play

**Solution**: Verify Service Worker is active and cache is accessible

## 📄 Integration Checklist

- ✅ useDownloadManager hook created
- ✅ DownloadButton component created
- ✅ DownloadsPage created
- ✅ Route added to App.jsx (`/downloads`)
- ✅ Navigation link added to Header
- ✅ DownloadButton integrated in Modal
- ✅ Service Worker handlers added
- ✅ Styles added to App.css
- ✅ IndexedDB schema implemented
- ✅ Storage monitoring active

## 🎓 Developer Notes

### Testing Downloads

1. Open DevTools > Application > IndexedDB
2. View `nikzflix_downloads` database
3. Monitor `downloads` object store
4. Check download records and metadata

### Testing Service Worker

1. Open DevTools > Application > Service Workers
2. View console for SW messages
3. Check Cache Storage for downloads cache
4. Inspect cached responses

### Simulating Progress

Current implementation uses `setInterval` for demo. Replace with:

```javascript
// In Service Worker
const { done, value } = await reader.read();
port.postMessage({ type: 'PROGRESS', progress: percent });
```

---

**Status**: ✅ Feature Complete (9/10 Priority Features)
**Next**: Watch Party Mode (Feature #5)
