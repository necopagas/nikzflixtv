# 🎯 Ads Fix Checklist - Atong Buhaton

## ✅ Na-human na (Completed)

1. ✅ **Improved AdsterraBanner.jsx**
   - Removed desktop-only restriction (mobile na pud mo-kita)
   - Added better error handling
   - Added status tracking (loading/loaded/error)
   - Faster loading (500ms instead of 1000ms)
   - Better debug info

2. ✅ **Created Additional Components**
   - `AdSenseAd.jsx` - Para sa Google AdSense
   - `InlineAd.jsx` - Para sa ads between content

3. ✅ **Documentation**
   - Complete `MONETIZATION_GUIDE.md`
   - Step-by-step Adsterra setup
   - Revenue estimates
   - Troubleshooting guide

## 🔧 Imong Buhaton (Your Action Items)

### Step 1: Check Current Ads
1. Run `npm run dev`
2. Open http://localhost:5173
3. Check browser console (F12)
4. Look for `[AdsterraBanner]` logs:
   - ✓ Should see: "✓ Loaded: ..." (GOOD)
   - ✗ If error: Scripts might be invalid

### Step 2: Get YOUR Adsterra Codes

**Kung wala pa ka account:**
1. Go to https://publishers.adsterra.com
2. Sign up (FREE)
3. Add your site
4. Wait approval (1-2 days)

**Kung naa na account:**
1. Login to Adsterra dashboard
2. Go to "Sites & Zones"
3. Click "Add Zone"
4. Choose "Banner" or "Native Banner"
5. Copy the script URL (looks like: `https://gainedspotsspun.com/XX/XX/XX/...`)
6. Repeat for 2nd ad zone

### Step 3: Update Ad Codes

1. Open `src/AdsterraBanner.jsx`
2. Find line ~36:
   ```javascript
   const AD_SCRIPTS = [
     {
       src: 'https://gainedspotsspun.com/61/b8/02/...',  // ← REPLACE THIS
       type: 'banner'
     },
     {
       src: 'https://gainedspotsspun.com/23/83/40/...',  // ← REPLACE THIS
       type: 'native'
     }
   ];
   ```
3. Replace with YOUR ad zone codes from Adsterra
4. Save file

### Step 4: Test

1. Run `npm run dev`
2. Open browser
3. Check if ads appear at bottom
4. If blocked by AdBlock, disable it temporarily
5. Check browser console for logs

### Step 5: Deploy

1. `npm run build`
2. `firebase deploy`
3. Wait for impressions
4. Check Adsterra dashboard for stats

## 🔍 Troubleshooting

### "Ads not showing"

**Try this:**
1. Open browser console (F12)
2. Check for errors
3. Type: `localStorage.removeItem('nikz_ads_hidden')`
4. Refresh page
5. Ads should appear

**Still not showing?**
1. Check if ad codes are correct
2. Verify Adsterra zone is "Active"
3. Wait 5-10 minutes (ads need time to populate)
4. Try different browser (without ad blocker)

### "Scripts failing to load"

**Possible causes:**
1. Wrong ad codes
2. Adsterra zone not approved yet
3. Network blocking scripts
4. Browser ad blocker active

**Solution:**
1. Double-check codes from Adsterra
2. Wait for zone approval
3. Test on different network
4. Disable all ad blockers

## 📊 Where Ads Appear

Current placement:
- ✅ HomePage - Bottom banner (AdsterraBanner)
- ✅ DramaPage - Bottom banner (AdsterraBanner)
- ✅ AnimePage - Bottom banner (AdsterraBanner)

**Recommended additions:**
- Add `<InlineAd />` between content rows
- Add before/after video player
- Add in sidebar (desktop)

Example:
```jsx
<Row title="Trending Now" data={trending} />
<InlineAd type="placeholder" position="center" /> {/* ← ADD THIS */}
<Row title="Popular Dramas" data={dramas} />
```

## 💰 Expected Earnings

**With current setup (3 pages with ads):**
- 100 visitors/day: $1-3/day → $30-90/month
- 500 visitors/day: $5-15/day → $150-450/month
- 1000 visitors/day: $10-30/day → $300-900/month
- 5000 visitors/day: $50-150/day → $1500-4500/month

**Factors:**
- Traffic quality (real users)
- User engagement (time on site)
- Ad placement (visible but not annoying)
- Geographic location (US/EU traffic = higher CPM)

## 🎯 Next Steps

1. [ ] Get Adsterra account (or login)
2. [ ] Create 2 ad zones (Banner + Native)
3. [ ] Copy YOUR ad codes
4. [ ] Replace codes in `AdsterraBanner.jsx`
5. [ ] Test locally (`npm run dev`)
6. [ ] Deploy to Firebase
7. [ ] Monitor Adsterra dashboard
8. [ ] Check earnings after 24 hours
9. [ ] Optimize based on performance

## 📞 Need Help?

**If ads still not working:**
1. Share screenshot of browser console
2. Share Adsterra zone settings
3. Check if zone is "Active" in Adsterra
4. Verify site is approved

**Adsterra Support:**
- Email: publishers@adsterra.com
- Live chat sa dashboard (fast response!)

---

## 🚀 Quick Commands

**Development:**
```bash
npm run dev          # Test locally
```

**Build & Deploy:**
```bash
npm run build        # Build for production
firebase deploy      # Deploy to hosting
```

**Clear ads hidden flag:**
```javascript
// Sa browser console (F12):
localStorage.removeItem('nikz_ads_hidden')
```

---

**Maayo-ng swerte! Sige lang, makakwarta na ka ani! 💰✨**
