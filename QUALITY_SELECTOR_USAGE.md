# Quality Selector - Complete Implementation Guide

## ✅ What's Implemented

### 1. **QualitySelector Component** (`src/components/QualitySelector.jsx`)

- ✅ Manual quality selection (360p, 480p, 720p, 1080p, Auto)
- ✅ Automatic quality based on network speed
- ✅ Real-time bandwidth monitoring
- ✅ Quality preference persistence (localStorage)
- ✅ Network Information API integration
- ✅ Fallback bandwidth measurement
- ✅ Smooth dropdown animations
- ✅ Visual indicators (check marks, recommended badge)
- ✅ Network speed display with color coding

### 2. **Enhanced Video Player Integration**

- ✅ QualitySelector added to EnhancedVideoPlayer
- ✅ Quality state management
- ✅ Quality change callback support
- ✅ Top-right overlay positioning
- ✅ Hover-to-show behavior

---

## 🚀 Usage Examples

### Basic Usage in EnhancedVideoPlayer

The quality selector is **already integrated** into `EnhancedVideoPlayer`:

```jsx
import { EnhancedVideoPlayer } from '../components/EnhancedVideoPlayer';

<EnhancedVideoPlayer
  src={videoUrl}
  availableQualities={['360p', '480p', '720p', '1080p']} // Optional
  onQualityChange={(quality, isAuto) => {
    console.log('Quality changed to:', quality);
    console.log('Is auto mode:', isAuto);
    // Update your video source here if needed
  }}
  onEnded={handleEnded}
  episodeId="episode-123"
/>;
```

### Standalone Quality Selector

Use independently in any component:

```jsx
import QualitySelector from '../components/QualitySelector';

const MyVideoPlayer = () => {
  const [quality, setQuality] = useState('auto');

  return (
    <div className="video-container">
      <video src={videoUrl} />

      <QualitySelector
        currentQuality={quality}
        onQualityChange={(newQuality, isAuto) => {
          setQuality(newQuality);
          // Switch video source based on quality
          updateVideoSource(newQuality);
        }}
        availableQualities={['360p', '480p', '720p', '1080p']}
        showBandwidthMonitor={true}
      />
    </div>
  );
};
```

### Using the Quality Manager Hook

```jsx
import { useQualityManager } from '../components/QualitySelector';

const VideoPage = () => {
  const { quality, bandwidth, updateQuality, measureBandwidth, getRecommendedQuality } =
    useQualityManager();

  useEffect(() => {
    // Measure bandwidth on mount
    measureBandwidth().then(speed => {
      if (quality === 'auto') {
        const recommended = getRecommendedQuality(speed);
        console.log(`Auto quality: ${recommended} (${speed.toFixed(2)} Mbps)`);
      }
    });
  }, []);

  return (
    <div>
      <p>Current Quality: {quality}</p>
      <p>Bandwidth: {bandwidth?.toFixed(2)} Mbps</p>
      <button onClick={() => updateQuality('1080p')}>Force 1080p</button>
    </div>
  );
};
```

### Quality Badge Component

Show current quality in video corner:

```jsx
import { QualityBadge } from '../components/QualitySelector';

<div className="video-player relative">
  <video src={videoUrl} />

  {/* Top-left corner badge */}
  <QualityBadge quality="720p" className="absolute top-4 left-4" />
</div>;
```

---

## 🎨 Component API Reference

### QualitySelector Props

| Prop                   | Type     | Default                             | Required | Description                                              |
| ---------------------- | -------- | ----------------------------------- | -------- | -------------------------------------------------------- |
| `currentQuality`       | string   | 'auto'                              | No       | Current selected quality                                 |
| `onQualityChange`      | function | null                                | No       | Callback when quality changes: `(quality, isAuto) => {}` |
| `availableQualities`   | array    | `['360p', '480p', '720p', '1080p']` | No       | List of available quality options                        |
| `showBandwidthMonitor` | boolean  | true                                | No       | Show network speed monitor                               |
| `className`            | string   | ''                                  | No       | Additional CSS classes                                   |

### useQualityManager Hook

Returns object with:

```typescript
{
  quality: string;              // Current quality setting
  bandwidth: number | null;     // Measured bandwidth in Mbps
  updateQuality: (quality: string) => void;
  measureBandwidth: () => Promise<number | null>;
  getRecommendedQuality: (bandwidthMbps: number) => string;
}
```

### QualityBadge Props

| Prop        | Type   | Default  | Description                                  |
| ----------- | ------ | -------- | -------------------------------------------- |
| `quality`   | string | required | Quality to display (360p, 480p, 720p, 1080p) |
| `className` | string | ''       | Additional CSS classes                       |

---

## 🔧 How It Works

### 1. **Bandwidth Detection**

The component uses two methods:

#### Network Information API (Chrome/Edge)

```javascript
const connection = navigator.connection;
const downlink = connection.downlink; // Mbps
```

#### Fallback: Download Speed Test

```javascript
// Measures time to download Google's favicon
const startTime = performance.now();
await fetch('https://www.google.com/favicon.ico');
const endTime = performance.now();
// Calculate Mbps from duration and file size
```

### 2. **Quality Recommendations**

| Bandwidth  | Recommended Quality |
| ---------- | ------------------- |
| ≥ 5 Mbps   | 1080p (Full HD)     |
| ≥ 2.5 Mbps | 720p (HD)           |
| ≥ 1 Mbps   | 480p (SD)           |
| < 1 Mbps   | 360p                |

### 3. **Auto Mode**

When "Auto" is selected:

1. Measures network speed every 30 seconds
2. Automatically recommends best quality
3. Calls `onQualityChange` with recommended quality
4. Shows "Auto (720p)" label indicating current selection

### 4. **Persistence**

Quality preference is saved in localStorage:

```javascript
localStorage.setItem('preferredQuality', '1080p');
```

---

## 🎯 Integration Checklist

### For Existing Video Players

- [x] **EnhancedVideoPlayer** - ✅ Already integrated!
- [ ] **IPTVPlayer** - Add quality selector overlay
- [ ] **DramaPlayerPage** - Add to drama video player
- [ ] **AnimePlayerPage** - Add to anime player
- [ ] **VivamaxPlayer** - Add to Vivamax player

### Implementation Steps for Each Player

1. **Import the component**

```jsx
import QualitySelector from '../components/QualitySelector';
```

2. **Add state management**

```jsx
const [quality, setQuality] = useState('auto');
const [availableQualities, setAvailableQualities] = useState([]);
```

3. **Handle quality changes**

```jsx
const handleQualityChange = (newQuality, isAuto) => {
  setQuality(newQuality);

  // Update video source
  const qualityUrl = getVideoUrlForQuality(videoId, newQuality);
  videoRef.current.src = qualityUrl;

  // Resume playback
  videoRef.current.currentTime = currentTime;
  videoRef.current.play();
};
```

4. **Add to JSX**

```jsx
<div className="video-container relative">
  <video ref={videoRef} />

  <div className="absolute top-4 right-4 z-40">
    <QualitySelector
      currentQuality={quality}
      onQualityChange={handleQualityChange}
      availableQualities={availableQualities}
    />
  </div>
</div>
```

---

## 📊 Quality Mapping Examples

### For TMDB/Movie APIs

```jsx
const getVideoUrlForQuality = (videoId, quality) => {
  const qualityMap = {
    '360p': `https://api.example.com/video/${videoId}/360p.m3u8`,
    '480p': `https://api.example.com/video/${videoId}/480p.m3u8`,
    '720p': `https://api.example.com/video/${videoId}/720p.m3u8`,
    '1080p': `https://api.example.com/video/${videoId}/1080p.m3u8`,
  };

  return qualityMap[quality] || qualityMap['480p'];
};
```

### For HLS Adaptive Streams

```jsx
const handleQualityChange = quality => {
  if (hlsInstance && quality !== 'auto') {
    // Force specific quality level
    const levelIndex = hlsInstance.levels.findIndex(level => level.height === parseInt(quality));

    if (levelIndex >= 0) {
      hlsInstance.currentLevel = levelIndex;
    }
  } else {
    // Enable auto quality
    hlsInstance.currentLevel = -1; // -1 = auto
  }
};
```

### For DASH Streams

```jsx
const handleQualityChange = quality => {
  if (dashPlayer) {
    if (quality === 'auto') {
      dashPlayer.updateSettings({
        streaming: {
          abr: { autoSwitchBitrate: { video: true } },
        },
      });
    } else {
      // Force specific bitrate
      const qualityBitrates = {
        '360p': 500000,
        '480p': 1000000,
        '720p': 2500000,
        '1080p': 5000000,
      };

      dashPlayer.updateSettings({
        streaming: {
          abr: {
            autoSwitchBitrate: { video: false },
            initialBitrate: { video: qualityBitrates[quality] },
          },
        },
      });
    }
  }
};
```

---

## 🎨 Customization

### Change Colors

```jsx
<QualitySelector
  currentQuality={quality}
  onQualityChange={handleQualityChange}
  className="custom-quality-selector" // Add custom class
/>
```

```css
.custom-quality-selector button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.custom-quality-selector button:hover {
  background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
}
```

### Disable Bandwidth Monitor

```jsx
<QualitySelector
  showBandwidthMonitor={false} // Hide speed indicator
  currentQuality={quality}
  onQualityChange={handleQualityChange}
/>
```

### Custom Available Qualities

```jsx
// Only show HD options
<QualitySelector
  availableQualities={['720p', '1080p']}
  currentQuality={quality}
  onQualityChange={handleQualityChange}
/>

// All qualities including 4K
<QualitySelector
  availableQualities={['360p', '480p', '720p', '1080p', '4K']}
  currentQuality={quality}
  onQualityChange={handleQualityChange}
/>
```

---

## 🐛 Troubleshooting

### Quality not changing?

**Issue**: Quality selector shows different quality but video doesn't change.

**Solution**: Implement `onQualityChange` callback properly:

```jsx
const handleQualityChange = async (newQuality, isAuto) => {
  const currentTime = videoRef.current.currentTime;
  const wasPlaying = !videoRef.current.paused;

  // Update source
  videoRef.current.src = getVideoUrlForQuality(videoId, newQuality);

  // Restore position and playback state
  videoRef.current.currentTime = currentTime;
  if (wasPlaying) {
    await videoRef.current.play();
  }
};
```

### Bandwidth showing as null?

**Issue**: Network speed not detected.

**Reasons**:

- Browser doesn't support Network Information API
- Fetch request blocked by CORS
- User offline

**Solution**: Provide fallback or use default quality:

```jsx
if (bandwidth === null) {
  // Default to 480p if can't measure
  setQuality('480p');
}
```

### Auto mode not working?

**Issue**: Quality doesn't switch automatically.

**Solution**: Ensure you're handling the callback:

```jsx
const handleQualityChange = (quality, isAuto) => {
  if (isAuto) {
    // Auto mode recommends this quality
    console.log('Auto-selected:', quality);
  }

  // Apply the quality
  updateVideoQuality(quality);
};
```

---

## 📈 Performance Tips

1. **Cache Quality Preference**
   - Quality is automatically saved to localStorage
   - No need to implement your own persistence

2. **Debounce Quality Changes**
   - Avoid rapid quality switching
   - Use a small delay before applying quality change

3. **Preload Quality Variants**
   - Preload next quality level for smooth transitions
   - Use `<link rel="preload">` for manifest files

4. **Monitor Bandwidth Sparingly**
   - Default: measures every 30 seconds
   - Adjust if needed for your use case

---

## 🎯 Next Steps

1. **Add to IPTVPlayer** - Integrate with HLS/DASH quality levels
2. **Implement 4K support** - Add 2160p option for supported content
3. **Add quality change notification** - Toast message "Switched to 720p"
4. **Analytics tracking** - Track which qualities users prefer
5. **Smart quality buffering** - Preload multiple qualities

---

## 💡 Pro Features to Add

### 1. Quality Change Animation

```jsx
const [isChangingQuality, setIsChangingQuality] = useState(false);

const handleQualityChange = async quality => {
  setIsChangingQuality(true);
  await switchQuality(quality);
  setIsChangingQuality(false);
};

// In JSX
{
  isChangingQuality && (
    <div className="quality-change-overlay">
      <div className="spinner" />
      <p>Switching to {quality}...</p>
    </div>
  );
}
```

### 2. Data Saver Mode

```jsx
const enableDataSaver = () => {
  // Force lowest quality
  setQuality('360p');

  // Reduce preload
  videoRef.current.preload = 'metadata';

  // Disable autoplay
  setAutoplay(false);
};
```

### 3. Quality History

```jsx
const trackQualityUsage = quality => {
  const history = JSON.parse(localStorage.getItem('qualityHistory') || '[]');
  history.push({
    quality,
    timestamp: Date.now(),
    bandwidth: currentBandwidth,
  });

  localStorage.setItem('qualityHistory', JSON.stringify(history));
};
```

---

## 🎉 Summary

✅ **QualitySelector** component is production-ready  
✅ **EnhancedVideoPlayer** already integrated  
✅ **Bandwidth monitoring** with auto-quality  
✅ **localStorage persistence** for preferences  
✅ **Smooth UI** with animations and indicators

**Result**: Users can now manually select or auto-detect the best video quality for their connection! 🚀
