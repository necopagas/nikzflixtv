# Cloudflare Bypass Solution for WeebCentral

## Problem

WeebCentral (https://weebcentral.com/) uses Cloudflare protection that blocks automated scraping from serverless functions like Vercel. This protection serves "Just a moment" pages and challenge screens that prevent direct HTTP requests from succeeding.

## Solution Overview

This project implements a multi-layered approach to handle Cloudflare protection:

### 1. **Local Development Proxy** (`proxy-server.js`)

- Runs a local Express server on port 3001
- Uses enhanced headers and retry logic to bypass Cloudflare
- Implements HTML parsing with Cheerio for reliable data extraction
- Provides the same API endpoints as the serverless functions

### 2. **Hybrid API Approach** (`api/weebcentral.js`)

- In development: Redirects requests to the local proxy server
- In production: Falls back to alternative sources with clear error messages
- Provides seamless switching between environments

### 3. **Alternative Sources**

- **Mangakakalot** - No Cloudflare protection
- **Manganelo** - No Cloudflare protection
- **MangaPanda** - No Cloudflare protection
- **MangaDex** - Official API (no scraping needed)

## Setup Instructions

### For Development (Full WeebCentral Access)

1. **Install Dependencies:**

   ```bash
   npm install cheerio concurrently cors https-proxy-agent
   ```

2. **Run with Proxy:**

   ```bash
   npm run dev:with-proxy
   ```

   This starts both the Vite dev server and the Cloudflare bypass proxy simultaneously.

3. **Alternative Manual Start:**

   ```bash
   # Terminal 1: Start proxy server
   npm run proxy

   # Terminal 2: Start dev server
   npm run dev
   ```

### Hosted or remote bypass services

If you already have a Cloudflare bypass endpoint (for example a remote proxy you control or a paid scraping service), point the API at that host by setting the `WEEBCENTRAL_BYPASS_URL` environment variable. The handler automatically routes WeebCentral requests through that URL before trying direct scraping.

For example:

```bash
WEEBCENTRAL_BYPASS_URL="https://my-bypass-service.example/api/weebcentral" npm run build
```

Or when working locally you can still point to the local proxy explicitly:

```bash
WEEBCENTRAL_BYPASS_URL="http://localhost:3001" npm run dev
```

The server will try every configured host in order, so you can rely on the local proxy during development and fall back to a hosted bypass in other environments.

### For Production

The app automatically detects the production environment and:

- Shows clear error messages for Cloudflare-protected sources
- Suggests alternative sources that work reliably
- Provides fallback options for users

## Technical Details

### Proxy Server Features

- **Enhanced Headers:** Mimics real browser requests
- **Retry Logic:** Automatic retries with exponential backoff
- **HTML Parsing:** Robust Cheerio-based parsing
- **Error Handling:** Graceful fallbacks and detailed logging
- **CORS Support:** Full cross-origin request support

### API Endpoints

All endpoints mirror the serverless API:

```
GET /api/weebcentral?action=popular
GET /api/weebcentral?action=search&query={query}
GET /api/weebcentral?action=series&seriesId={id}
GET /api/weebcentral?action=chapters&seriesId={id}
GET /api/weebcentral?action=pages&slug={slug}&chapterId={id}
```

### Environment Detection

The system automatically detects the environment:

```javascript
const isDevelopment =
  (process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV === 'development') ||
  !process.env.VERCEL;
```

## Troubleshooting

### Proxy Server Won't Start

- Ensure port 3001 is available
- Check for Node.js version compatibility
- Verify all dependencies are installed

### Still Getting Cloudflare Errors

- Try restarting the proxy server
- Check your internet connection
- WeebCentral may have updated their protection

### Production Issues

- Switch to alternative sources (Mangakakalot, Manganelo, MangaPanda)
- Check browser console for detailed error messages
- Consider using MangaDex for reliable API access

## Alternative Solutions

If the proxy approach doesn't work:

1. **Browser Automation:** Use Puppeteer/Playwright (heavier, may not work on Vercel)
2. **Residential Proxies:** Use services like Bright Data or Oxylabs
3. **API Alternatives:** Look for official WeebCentral API or partner APIs
4. **User Browser Extension:** Create a browser extension that bypasses Cloudflare

## Security Considerations

- The proxy server should only run in development
- Never deploy proxy credentials to production
- Monitor for rate limiting and IP blocking
- Respect website terms of service

## Future Improvements

- Implement browser automation fallback
- Add rotating proxy support
- Create Docker container for easier deployment
- Add monitoring and health checks
- Implement caching to reduce requests
