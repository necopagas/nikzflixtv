// Combined Manga API - handles all manga sources
// This combines weebcentral, mangakakalot, manganelo, mangapanda, mangadex, and manga-cover
export default async function handler(req, res) {
  const { source, action, ...params } = req.query;

  try {
    switch (source) {
      case 'weebcentral':
        return await handleWeebCentral(req, res, { action, ...params });
      case 'mangakakalot':
        return await handleMangakakalot(req, res, { action, ...params });
      case 'manganelo':
        return await handleManganelo(req, res, { action, ...params });
      case 'mangapanda':
        return await handleMangapanda(req, res, { action, ...params });
      case 'mangadex':
        return await handleMangadex(req, res, { action, ...params });
      case 'cover':
        return await handleMangaCover(req, res, { action, ...params });
      default:
        return res.status(400).json({ error: 'Invalid manga source' });
    }
  } catch (error) {
    console.error('Manga API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
}

// Import and adapt the existing handlers
// WeebCentral handler
async function handleWeebCentral(req, res, params) {
  // eslint-disable-next-line no-unused-vars
  const { action, seriesId, slug, chapterId, query } = params;

  // Check if we're in development and should use local proxy
  const isDevelopment =
    (process.env.NODE_ENV !== 'production' && process.env.VERCEL_ENV === 'development') ||
    !process.env.VERCEL;

  // In development, try local proxy first
  if (isDevelopment) {
    try {
      const proxyUrl = `http://localhost:3001/api/weebcentral?${new URLSearchParams(params).toString()}`;
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
    return await handleWithScrapingService(req, res, params);
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

// Mangapill handler (replacement for Mangakakalot)
async function handleMangakakalot(req, res, params) {
  const { action, mangaId, chapterId, query } = params;

  try {
    switch (action) {
      case 'search':
        return await handleSearchMangapill(req, res, query);
      case 'popular':
        return await handlePopularMangapill(req, res);
      case 'series':
        return await handleSeriesInfoMangapill(req, res, mangaId);
      case 'chapters':
        return await handleChaptersMangapill(req, res, mangaId);
      case 'pages':
        return await handleChapterPagesMangapill(req, res, chapterId);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Mangapill API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
}

// Simplified handlers for other sources - they return empty results for now
async function handleManganelo(req, res, _params) {
  return res.status(200).json({ results: [] });
}

async function handleMangapanda(req, res, _params) {
  return res.status(200).json({ results: [] });
}

async function handleMangadex(req, res, _params) {
  return res.status(200).json({ results: [] });
}

async function handleMangaCover(req, res, _params) {
  return res.status(200).json({ cover: null });
}

// Include the actual Mangapill implementations (replacement for Mangakakalot)
async function handleSearchMangapill(req, res, query) {
  if (!query) {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  try {
    const response = await fetch(`https://mangapill.com/search?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    const results = parseSearchResultsMangapill(html);

    return res.status(200).json({ results });
  } catch (error) {
    return res.status(500).json({ error: 'Search failed', details: error.message });
  }
}

async function handlePopularMangapill(req, res) {
  try {
    const response = await fetch('https://mangapill.com/mangas/new', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    const results = parsePopularResultsMangapill(html);

    return res.status(200).json({ results });
  } catch (error) {
    return res.status(500).json({ error: 'Popular fetch failed', details: error.message });
  }
}

async function handleSeriesInfoMangapill(req, res, mangaId) {
  if (!mangaId) {
    return res.status(400).json({ error: 'mangaId parameter required' });
  }

  try {
    const response = await fetch(`https://mangapill.com/manga/${mangaId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    const series = parseSeriesInfoMangapill(html);

    return res.status(200).json({ series });
  } catch (error) {
    return res.status(500).json({ error: 'Series info fetch failed', details: error.message });
  }
}

async function handleChaptersMangapill(req, res, mangaId) {
  if (!mangaId) {
    return res.status(400).json({ error: 'mangaId parameter required' });
  }

  try {
    const response = await fetch(`https://mangapill.com/manga/${mangaId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    const chapters = parseChaptersMangapill(html);

    return res.status(200).json({ chapters });
  } catch (error) {
    return res.status(500).json({ error: 'Chapters fetch failed', details: error.message });
  }
}

async function handleChapterPagesMangapill(req, res, chapterId) {
  if (!chapterId) {
    return res.status(400).json({ error: 'chapterId parameter required' });
  }

  try {
    const response = await fetch(`https://mangapill.com/chapters/${chapterId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    const pages = parseChapterPagesMangapill(html);

    return res.status(200).json({ pages });
  } catch (error) {
    return res.status(500).json({ error: 'Chapter pages fetch failed', details: error.message });
  }
}

// Parsing functions for Mangapill
function parseSearchResultsMangapill(html) {
  const results = [];
  // Look for manga cards in search results
  const mangaRegex =
    /<a[^>]*href="\/manga\/([^/]+)\/([^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g;

  let match;
  while ((match = mangaRegex.exec(html)) !== null) {
    results.push({
      id: `${match[1]}/${match[2]}`,
      title: match[4].trim(),
      coverImage: match[3],
    });
  }

  return results.slice(0, 20);
}

function parsePopularResultsMangapill(html) {
  const results = [];
  // Look for manga cards on browse page
  const mangaRegex =
    /<a[^>]*href="\/manga\/([^/]+)\/([^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g;

  let match;
  while ((match = mangaRegex.exec(html)) !== null) {
    results.push({
      id: `${match[1]}/${match[2]}`,
      title: match[4].trim(),
      coverImage: match[3],
    });
  }

  return results.slice(0, 20);
}

function parseSeriesInfoMangapill(html) {
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const descriptionMatch = html.match(
    /<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/
  );
  const coverMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*class="[^"]*cover[^"]*"/);

  return {
    title: titleMatch ? titleMatch[1].trim() : 'Unknown',
    description: descriptionMatch ? descriptionMatch[1].replace(/<[^>]+>/g, '').trim() : '',
    coverImage: coverMatch ? coverMatch[1] : '',
    status: 'Ongoing',
  };
}

function parseChaptersMangapill(html) {
  const chapters = [];
  // Look for chapter links
  const chapterRegex = /<a[^>]*href="\/chapters\/([^"]+)"[^>]*>([^<]+)<\/a>/g;

  let match;
  while ((match = chapterRegex.exec(html)) !== null) {
    chapters.push({
      id: match[1],
      title: match[2].trim(),
    });
  }

  return chapters.reverse();
}

function parseChapterPagesMangapill(html) {
  const pages = [];
  // Look for image sources in chapter pages
  const imageRegex = /<img[^>]*src="([^"]*)"[^>]*class="[^"]*page[^"]*"/g;

  let match;
  let pageNum = 1;
  while ((match = imageRegex.exec(html)) !== null) {
    pages.push({
      page: pageNum,
      img: match[1],
    });
    pageNum++;
  }

  return pages;
}
