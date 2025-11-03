# 💰 NikzFlix TV - Monetization Guide

## Paano Makakwarta sa Ads (How to Make Money from Ads)

### 🎯 Current Setup

Naa na'y AdsterraBanner component nga ready na. Pero basin naay issues. Here's how to fix and maximize:

---

## 1️⃣ Adsterra Setup (Recommended - Easy Approval)

### Step 1: Sign Up
1. Go to https://publishers.adsterra.com
2. Create account (FREE)
3. Add your website: `https://nikzflixtv.web.app` (or your domain)
4. Wait for approval (usually 1-2 days)

### Step 2: Get Your Ad Codes
After approval, sa Adsterra dashboard:

**A. Banner Ads (300x250, 728x90)**
1. Sites & Zones → Add Zone
2. Choose "Banner"
3. Select size (recommended: 300x250 for mobile-friendly)
4. Copy the code

**B. Native Banners**
1. Sites & Zones → Add Zone
2. Choose "Native Banner"
3. Customize appearance
4. Copy the code

**C. Popunders (Highest Revenue)**
1. Sites & Zones → Add Zone
2. Choose "Popunder"
3. Set frequency (recommended: 1 per user per hour)
4. Copy the code

### Step 3: Update Your Codes

**Current AdsterraBanner.jsx naay 2 scripts:**
```javascript
'https://gainedspotsspun.com/61/b8/02/61b80217fd398dccf27a4a8ef563b396.js'
'https://gainedspotsspun.com/23/83/40/238340cef35e12605e283ef1a601c2fe.js'
```

**Replace with YOUR codes from Adsterra:**
1. Open `src/AdsterraBanner.jsx`
2. Find line ~36: `const AD_SCRIPTS = [`
3. Replace the URLs with YOUR ad zone codes
4. Save

### Step 4: Add More Ad Placements

Para mas daghan kwarta, add ads sa different pages:

**HomePage.jsx** - Already has AdsterraBanner ✓
**DramaPage.jsx** - Already has AdsterraBanner ✓
**AnimePage.jsx** - Already has AdsterraBanner ✓

**Add more:**
- Between rows of content
- Before/after video player
- In sidebar (desktop)

---

## 2️⃣ Google AdSense (Higher CPM but Strict)

### Pros:
- ✅ Higher earnings per click
- ✅ Better quality ads
- ✅ Trusted by advertisers

### Cons:
- ❌ Strict approval (may deny streaming sites)
- ❌ Longer approval time (1-2 weeks)
- ❌ Need original content

### Setup:
1. Sign up: https://adsense.google.com
2. Get your Publisher ID (ca-pub-XXXXXXXXXXXXXXXX)
3. Add this to `index.html`:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX"
     crossorigin="anonymous"></script>
```
4. Use the `AdSenseAd` component I created:
```jsx
import { AdSenseAd } from '../components/AdSenseAd';

<AdSenseAd slot="1234567890" />
```

---

## 3️⃣ PropellerAds (Alternative)

### Good For:
- 👥 Pop-unders (high revenue)
- 📱 Push notifications
- 🎬 Video ads

### Setup:
1. Sign up: https://propellerads.com
2. Similar to Adsterra
3. Get zone IDs
4. Add scripts

---

## 4️⃣ Multiple Ad Networks (Recommended Strategy)

**Best Combination:**
```
Adsterra (Primary)
├── Banner ads (bottom/sidebar)
├── Native ads (between content)
└── Popunder (1 per hour)

Google AdSense (If approved)
├── Auto ads (automatic placement)
└── In-article ads

PropellerAds (Backup)
└── Push notifications
```

---

## 🚀 Maximize Revenue

### A. Strategic Ad Placement

**Homepage:**
```jsx
<Banner /> // Hero section
<Row title="Trending" /> 
<InlineAd /> // ← ADD HERE (between rows)
<Row title="Popular Dramas" />
<InlineAd /> // ← ADD HERE
<AdsterraBanner /> // ✓ Already added (bottom)
```

**Video Player Page:**
```jsx
<EnhancedVideoPlayer />
<InlineAd /> // ← ADD BELOW VIDEO
<EpisodeList />
```

**Drama Detail Page:**
```jsx
<PosterSection />
<InlineAd /> // ← ADD HERE
<EpisodesList />
```

### B. Optimization Tips

1. **Don't Overload**
   - Max 3-4 ads per page
   - Too many = user annoyance = less traffic

2. **Mobile Optimization**
   - Use responsive ad sizes (300x250, 320x50)
   - Current AdsterraBanner is mobile-friendly ✓

3. **User Experience**
   - Ads should complement, not interrupt
   - Allow users to close/minimize
   - Current implementation has X button ✓

4. **A/B Testing**
   - Try different ad positions
   - Monitor which pages earn most
   - Adjust placement accordingly

---

## 📊 Revenue Estimates

**Based on 1000 daily visitors:**

| Ad Type | CPM | Daily Views | Est. Daily | Monthly |
|---------|-----|-------------|------------|---------|
| Banner | $1-3 | 3000 | $3-9 | $90-270 |
| Native | $2-5 | 2000 | $4-10 | $120-300 |
| Popunder | $3-8 | 1000 | $3-8 | $90-240 |
| **Total** | | | **$10-27** | **$300-810** |

**With 5000+ daily visitors:**
- Potential: $1000-3000/month
- With AdSense: $1500-4000/month

---

## 🔧 Implementation Checklist

### Current Status:
- ✅ AdsterraBanner component created
- ✅ Already added to HomePage, DramaPage, AnimePage
- ✅ Responsive design
- ✅ Close button
- ✅ localStorage to remember dismissal

### To Do:
- [ ] Get Adsterra account (if you don't have)
- [ ] Replace ad codes with YOUR codes
- [ ] Test if ads display
- [ ] Add InlineAd between content rows
- [ ] Apply for Google AdSense (optional)
- [ ] Monitor earnings in Adsterra dashboard

---

## 🐛 Troubleshooting

### "Ads not showing"

**Check 1: Are codes correct?**
- Open `src/AdsterraBanner.jsx`
- Verify the URLs are YOUR Adsterra codes
- Should look like: `gainedspotsspun.com/XX/XX/XX/...`

**Check 2: Browser Console**
- Press F12 → Console tab
- Look for `[AdsterraBanner]` logs
- Should see: "✓ Loaded" messages

**Check 3: Ad Blockers**
- Disable AdBlock/uBlock
- Refresh page
- Ads should appear

**Check 4: Adsterra Dashboard**
- Check if zone is "Active"
- Verify site is approved
- Check for any warnings

**Check 5: Clear localStorage**
- Open Console (F12)
- Type: `localStorage.removeItem('nikz_ads_hidden')`
- Refresh page

### "Low earnings"

**Increase Traffic:**
- Share on social media
- SEO optimization
- Create viral content
- Submit to directories

**Optimize Ads:**
- Add more strategic placements
- Try different ad formats
- Test different positions
- Use high-CPM networks

**Improve CTR (Click-Through Rate):**
- Make ads visible but not intrusive
- Blend with design
- Place near high-engagement areas

---

## 📱 Mobile vs Desktop

**Current AdsterraBanner:**
- Shows on ALL devices now (I removed desktop-only restriction)
- Responsive sizing
- Touch-friendly controls

**Recommendations:**
- Mobile: 320x50, 300x250
- Desktop: 728x90, 300x600 (sidebar)
- Both: Native ads (auto-adjust)

---

## 💡 Pro Tips

1. **Start with Adsterra**
   - Easiest approval
   - Good for streaming sites
   - Fast payments

2. **Apply to AdSense later**
   - After you have good traffic
   - Better chance of approval
   - Higher revenue potential

3. **Use Multiple Networks**
   - Don't rely on one
   - Compare earnings
   - Switch if needed

4. **Monitor Analytics**
   - Track which pages earn most
   - Double down on those
   - Remove low-performing ads

5. **Stay Compliant**
   - Don't click own ads
   - No fake traffic
   - Follow network policies
   - Risk = ban = no money

---

## 🎯 Quick Start (Adsterra)

**5 Minutes Setup:**

1. Sign up: https://publishers.adsterra.com
2. Add site, wait approval
3. Create 2 zones (Banner + Native)
4. Copy the codes
5. Replace in `AdsterraBanner.jsx`:
   ```javascript
   const AD_SCRIPTS = [
     {
       src: 'YOUR_BANNER_CODE_HERE.js',
       type: 'banner'
     },
     {
       src: 'YOUR_NATIVE_CODE_HERE.js',
       type: 'native'
     }
   ];
   ```
6. Deploy to Firebase
7. Wait for impressions
8. **MAKAKWARTA NA!** 💰

---

## 📞 Support

**Adsterra Support:**
- Email: publishers@adsterra.com
- Live chat sa dashboard

**Need Help?**
- Check Adsterra Knowledge Base
- Join publisher communities
- Ask sa Adsterra support (responsive sila)

---

## 🎉 Expected Timeline

**Week 1:**
- Sign up → Approval → Setup codes
- First impressions
- $0-5 earnings (testing phase)

**Week 2-4:**
- Optimize placement
- Increase traffic
- $10-50 earnings

**Month 2+:**
- Established traffic
- Better CTR
- $100-500+ earnings

---

**Remember:**
- Quality content = More visitors = More money
- Don't spam ads = Better UX = More returning visitors
- Patience = Key to success

**Maayo-ng swerte sa pag-kwarta! Good luck! 💰🚀**
