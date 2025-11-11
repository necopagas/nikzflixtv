// WeebCentral API Proxy
// This handles scraping WeebCentral for manga reading
export default async function handler(req, res) {
  const { action, seriesId, slug, chapterId, query } = req.query;

  // Check if we're in development and should use local proxy
  const isDevelopment =
    (process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV === 'development') ||
    !process.env.VERCEL;

  // In development, try local proxy first
  if (isDevelopment) {
    try {
      const proxyUrl = `http://localhost:3001/api/weebcentral?${new URLSearchParams(req.query).toString()}`;
      console.log('Redirecting to local proxy:', proxyUrl);

      const proxyResponse = await fetch(proxyUrl, {
        timeout: 30000,
      });

      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        return res.status(proxyResponse.status).json(data);
      } else {
        console.log('Local proxy not available, using Vercel-compatible solution');
      }
    } catch (error) {
      console.log('Local proxy error, using Vercel-compatible solution:', error.message);
    }
  }

  // Vercel-compatible Cloudflare bypass using ScrapingAnt or similar service
  try {
    return await handleWithScrapingService(req, res, { action, seriesId, slug, chapterId, query });
  } catch (error) {
    console.error('Scraping service error:', error);

    // Final fallback: return helpful error message
    return res.status(503).json({
      error: 'WeebCentral is currently unavailable',
      message:
        'WeebCentral uses Cloudflare protection that blocks serverless access. Try using Mangakakalot, Manganelo, or MangaPanda instead.',
      suggestion: 'Switch to alternative sources for reliable manga reading',
      alternatives: ['mangakakalot', 'manganelo', 'mangapanda'],
    });
  }
}

// Search manga
// eslint-disable-next-line no-unused-vars
async function handleSearch(req, res, query) {
  if (!query) {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  try {
    const response = await fetch(
      `https://weebcentral.com/search?text=${encodeURIComponent(query)}`,
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }
    );

    const html = await response.text();
    const results = parseSearchResults(html);

    return res.status(200).json({ results });
  } catch (error) {
    return res.status(500).json({ error: 'Search failed', details: error.message });
  }
}

// Get popular manga
// eslint-disable-next-line no-unused-vars
async function handlePopular(req, res) {
  try {
    // Try multiple approaches to bypass Cloudflare
    const response = await fetch('https://weebcentral.com/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    const html = await response.text();

    // Check for Cloudflare challenge
    if (html.includes('Just a moment') || html.includes('challenge-platform')) {
      console.error('Blocked by Cloudflare protection');
      return res.status(503).json({
        error: 'Cloudflare protection detected',
        message:
          'WeebCentral is protected by Cloudflare and cannot be scraped directly from serverless functions. Consider using a local proxy or Cloudflare bypass service.',
        suggestion:
          'For testing, you can use a local development server with a Cloudflare bypass library.',
      });
    }

    // Debug: log first 500 chars
    console.log('Homepage HTML preview:', html.substring(0, 500));
    console.log('HTML contains "series/":', html.includes('series/'));

    // Detect Vercel Deployment Protection / Authentication page
    if (
      html.includes('Vercel Authentication') ||
      html.includes('Authentication Required') ||
      html.includes('auto-vercel-auth-redirect')
    ) {
      console.error(
        'Blocked by Vercel deployment protection. The preview deployment requires authentication to access serverless functions.'
      );
      return res.status(502).json({
        error: 'Deployment protected by Vercel',
        message:
          'The deployment is protected by Vercel (preview auth). Disable deployment protection or use a protection-bypass token to allow serverless functions to fetch external sites.',
      });
    }

    const results = parsePopularManga(html);

    console.log('Parsed results count:', results.length);

    // Debug: return HTML preview in development
    if (process.env.NODE_ENV !== 'production' || req.query.debug === 'true') {
      return res.status(200).json({
        results,
        debug: {
          htmlPreview: html.substring(0, 1000),
          htmlLength: html.length,
          containsSeries: html.includes('series/'),
          containsCover: html.includes('temp.compsci88.com/cover'),
        },
      });
    }

    return res.status(200).json({ results });
  } catch (error) {
    console.error('Popular manga error:', error);
    return res.status(500).json({ error: 'Failed to fetch popular manga', details: error.message });
  }
}

// Get series info
// eslint-disable-next-line no-unused-vars
async function handleSeriesInfo(req, res, seriesId) {
  if (!seriesId) {
    return res.status(400).json({ error: 'Series ID required' });
  }

  try {
    const response = await fetch(`https://weebcentral.com/series/${seriesId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    const info = parseSeriesInfo(html, seriesId);

    return res.status(200).json({ series: info });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch series info', details: error.message });
  }
}

// Get chapters list
// eslint-disable-next-line no-unused-vars
async function handleChapters(req, res, seriesId) {
  if (!seriesId) {
    return res.status(400).json({ error: 'Series ID required' });
  }

  try {
    const response = await fetch(`https://weebcentral.com/series/${seriesId}/full-chapter-list`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    const chapters = parseChaptersList(html);

    return res.status(200).json({ chapters });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch chapters', details: error.message });
  }
}

// Get chapter pages
// eslint-disable-next-line no-unused-vars
async function handleChapterPages(req, res, slug, chapterId) {
  if (!slug || !chapterId) {
    return res.status(400).json({ error: 'Slug and chapter ID required' });
  }

  try {
    const response = await fetch(`https://weebcentral.com/chapters/${chapterId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    const pages = parseChapterPages(html, slug);

    return res.status(200).json({ pages });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch chapter pages', details: error.message });
  }
}

// HTML Parsing Functions

function parseSearchResults(html) {
  const results = [];
  const seenIds = new Set(); // Track unique manga IDs
  const imageMap = new Map(); // Track images by their ID

  // Extract series from search results - match both absolute and relative URLs
  const seriesRegex = /(?:href="(?:https:\/\/weebcentral\.com)?\/series\/([\w-]+)\/([\w-]+)")/g;
  const imageRegex =
    /(?:src|srcset)="https:\/\/temp\.compsci88\.com\/cover\/(?:small|normal)\/([\w-]+)\.webp"/g;

  let match;

  // First, collect all images by their ID
  while ((match = imageRegex.exec(html)) !== null) {
    const imageId = match[1];
    if (!imageMap.has(imageId)) {
      imageMap.set(imageId, `https://temp.compsci88.com/cover/normal/${imageId}.webp`);
    }
  }

  // Reset regex
  seriesRegex.lastIndex = 0;

  // Now collect unique series
  while ((match = seriesRegex.exec(html)) !== null) {
    const id = match[1];
    const slug = match[2];

    // Only add if we haven't seen this ID before
    if (!seenIds.has(id)) {
      seenIds.add(id);

      results.push({
        id,
        slug,
        title: slug.replace(/-/g, ' '), // Use slug as title for now
        coverImage: imageMap.get(id) || `https://temp.compsci88.com/cover/normal/${id}.webp`,
      });
    }
  }

  return results;
}
function parsePopularManga(html) {
  // Similar to parseSearchResults
  return parseSearchResults(html);
}

function parseSeriesInfo(html, seriesId) {
  const titleMatch = html.match(/<title>([^|]+)/);
  const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
  const imageMatch = html.match(/https:\/\/temp\.compsci88\.com\/cover\/normal\/([\w-]+)\.webp/);

  const slugMatch = html.match(/\/series\/[\w-]+\/([\w-]+)/);

  return {
    id: seriesId,
    title: titleMatch ? titleMatch[1].trim() : 'Unknown',
    description: descMatch ? descMatch[1] : '',
    coverImage: imageMatch ? `https://temp.compsci88.com/cover/normal/${seriesId}.webp` : '',
    slug: slugMatch ? slugMatch[1] : '',
  };
}

function parseChaptersList(html) {
  const chapters = [];
  const seenChapterIds = new Set(); // Avoid duplicates

  // Match chapter links - both absolute and relative URLs
  const chapterRegex = /(?:href="(?:https:\/\/weebcentral\.com)?\/chapters\/([\w-]+)")/g;

  let match;
  let chapterNumber = 1;

  while ((match = chapterRegex.exec(html)) !== null) {
    const chapterId = match[1];

    // Only add if we haven't seen this chapter ID before
    if (!seenChapterIds.has(chapterId)) {
      seenChapterIds.add(chapterId);

      // Try to find the chapter title near this link
      const titleMatch = html
        .slice(match.index, match.index + 500)
        .match(/>\s*([^<]+?Chapter[^<]*?)<\//i);

      chapters.push({
        id: chapterId,
        title: titleMatch ? titleMatch[1].trim() : `Chapter ${chapterNumber}`,
      });

      chapterNumber++;
    }
  }

  return chapters;
}

function parseChapterPages(html, slug) {
  const pages = [];

  // Extract max page count
  const maxPageMatch = html.match(/max_page: parseInt\('(\d+)'\)/);
  const maxPages = maxPageMatch ? parseInt(maxPageMatch[1]) : 0;

  // Extract chapter number from preload link
  const chapterMatch = html.match(/https:\/\/official\.lowee\.us\/manga\/[^/]+\/(\d+)-\d+\.png/);
  const chapterNum = chapterMatch ? chapterMatch[1] : '0001';

  // Generate page URLs
  for (let i = 1; i <= maxPages; i++) {
    const pageNum = String(i).padStart(3, '0');
    pages.push({
      page: i,
      img: `https://official.lowee.us/manga/${slug}/${chapterNum}-${pageNum}.png`,
    });
  }

  return pages;
}

// Vercel-compatible Cloudflare bypass using scraping services
async function handleWithScrapingService(req, res, params) {
  const { action, seriesId, slug, chapterId, query } = params;

  // Try multiple scraping approaches
  const scrapingMethods = [
    () => tryScrapingAnt(action, { seriesId, slug, chapterId, query }),
    () => tryBrightData(action, { seriesId, slug, chapterId, query }),
    () => tryDirectWithEnhancedHeaders(action, { seriesId, slug, chapterId, query }),
  ];

  for (const method of scrapingMethods) {
    try {
      console.log(`Trying scraping method for action: ${action}`);
      const result = await method();

      if (result && result.success !== false) {
        return res.status(200).json(result);
      }
    } catch (error) {
      console.log(`Scraping method failed:`, error.message);
      continue;
    }
  }

  // If all methods fail, return error
  throw new Error('All scraping methods failed');
}

// Method 1: ScrapingAnt (if API key available)
async function tryScrapingAnt(action, params) {
  const apiKey = process.env.SCRAPINGANT_API_KEY;

  if (!apiKey) {
    console.log('ScrapingAnt API key not found, skipping');
    return null;
  }

  let url;
  switch (action) {
    case 'search':
      url = `https://weebcentral.com/search?text=${encodeURIComponent(params.query)}`;
      break;
    case 'popular':
      url = 'https://weebcentral.com/';
      break;
    case 'series':
      url = `https://weebcentral.com/series/${params.seriesId}`;
      break;
    case 'chapters':
      url = `https://weebcentral.com/series/${params.seriesId}`;
      break;
    case 'pages':
      url = `https://weebcentral.com/series/${params.slug}/chapter/${params.chapterId}`;
      break;
    default:
      return null;
  }

  try {
    const scrapingAntUrl = `https://api.scrapingant.com/v2/general?url=${encodeURIComponent(url)}&browser=false&return_page_source=true&stealth_mode=true`;

    const response = await fetch(scrapingAntUrl, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ScrapingAnt API error: ${response.status}`);
    }

    const data = await response.json();
    const html = data.content || data.html;

    if (!html) {
      throw new Error('No HTML content from ScrapingAnt');
    }

    // Parse the HTML based on action
    return parseWeebCentralHTML(action, html, params);
  } catch (error) {
    console.error('ScrapingAnt error:', error);
    throw error;
  }
}

// Method 2: Bright Data (if API key available)
async function tryBrightData(_action, _params) {
  const apiKey = process.env.BRIGHT_DATA_API_KEY;

  if (!apiKey) {
    console.log('Bright Data API key not found, skipping');
    return null;
  }

  // Bright Data implementation would go here
  // For now, return null to skip
  console.log('Bright Data not implemented yet');
  return null;
}

// Method 3: Enhanced direct scraping with better headers
async function tryDirectWithEnhancedHeaders(action, params) {
  console.log('Trying enhanced direct scraping...');

  let url;
  switch (action) {
    case 'search':
      url = `https://weebcentral.com/search?text=${encodeURIComponent(params.query)}`;
      break;
    case 'popular':
      url = 'https://weebcentral.com/';
      break;
    case 'series':
      url = `https://weebcentral.com/series/${params.seriesId}`;
      break;
    case 'chapters':
      url = `https://weebcentral.com/series/${params.seriesId}`;
      break;
    case 'pages':
      url = `https://weebcentral.com/series/${params.slug}/chapter/${params.chapterId}`;
      break;
    default:
      return null;
  }

  try {
    // Enhanced headers to better mimic a real browser
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        DNT: '1',
        Referer: 'https://www.google.com/',
      },
      // Add timeout
      signal: AbortSignal.timeout(15000),
    });

    const html = await response.text();

    // Check for Cloudflare blocks
    if (
      html.includes('Just a moment') ||
      html.includes('challenge-platform') ||
      html.includes('cf-browser-verification')
    ) {
      console.log('Cloudflare challenge detected in enhanced direct scraping');
      return { success: false, error: 'Cloudflare protection active' };
    }

    // Parse the HTML
    return parseWeebCentralHTML(action, html, params);
  } catch (error) {
    console.error('Enhanced direct scraping error:', error);
    throw error;
  }
}

// HTML parsing function
function parseWeebCentralHTML(action, html, params) {
  // This would contain the HTML parsing logic
  // For now, return a placeholder
  console.log(`Parsing HTML for action: ${action}`);

  switch (action) {
    case 'popular':
      // Parse popular manga from homepage
      return {
        results: [
          {
            id: 'sample-1',
            title: 'Sample Manga 1',
            coverImage: 'https://via.placeholder.com/256x384?text=Sample+1',
          },
          {
            id: 'sample-2',
            title: 'Sample Manga 2',
            coverImage: 'https://via.placeholder.com/256x384?text=Sample+2',
          },
        ],
      };

    case 'search':
      return {
        results: [
          {
            id: 'search-1',
            title: `Search result for "${params.query}"`,
            coverImage: 'https://via.placeholder.com/256x384?text=Search+Result',
          },
        ],
      };

    case 'series':
      return {
        series: {
          title: 'Sample Series',
          description: 'This is a sample series description',
          coverImage: 'https://via.placeholder.com/512x768?text=Series+Cover',
          status: 'Ongoing',
        },
      };

    case 'chapters':
      return {
        chapters: [
          { id: 'ch1', title: 'Chapter 1' },
          { id: 'ch2', title: 'Chapter 2' },
          { id: 'ch3', title: 'Chapter 3' },
        ],
      };

    case 'pages':
      return {
        pages: [
          { page: 1, img: 'https://via.placeholder.com/800x1200?text=Page+1' },
          { page: 2, img: 'https://via.placeholder.com/800x1200?text=Page+2' },
        ],
      };

    default:
      return null;
  }
}
