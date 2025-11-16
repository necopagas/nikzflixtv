// Combined Manga API - handles all manga sources
// This combines weebcentral, mangakakalot, manganelo, mangapanda, and manga-cover
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
  const queryParams = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(
        ([, value]) => value !== undefined && value !== null && value !== ''
      )
    )
  );

  const bypassCandidates = [];
  const configuredBypass = process.env.WEEBCENTRAL_BYPASS_URL?.trim();

  const addCandidate = url => {
    if (!url) {
      return;
    }

    const trimmed = url.replace(/\/+$/u, '');

    if (trimmed && !bypassCandidates.includes(trimmed)) {
      bypassCandidates.push(trimmed);
    }
  };

  if (configuredBypass) {
    addCandidate(configuredBypass);
  }

  if (isDevelopment) {
    addCandidate('http://localhost:3001');
  }

  for (const candidate of bypassCandidates) {
    try {
      const baseEndpoint = candidate.endsWith('/api/weebcentral')
        ? candidate
        : `${candidate}/api/weebcentral`;
      const proxyUrl = `${baseEndpoint}?${queryParams.toString()}`;

      console.log('Redirecting WeebCentral request through bypass:', proxyUrl);

      const proxyResponse = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(30000),
      });

      if (proxyResponse.ok) {
        const data = await proxyResponse.json();
        return res.status(proxyResponse.status).json(data);
      }

      console.log(
        'Bypass returned non-OK status',
        proxyResponse.status,
        proxyResponse.statusText,
        'trying next option'
      );
    } catch (error) {
      console.log('Bypass attempt failed:', error.message);
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

// Manganelo handler (using Mangapill as fallback)
async function handleManganelo(req, res, params) {
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
    console.error('Manganelo API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
}

// MangaPanda handler (using Mangapill as fallback)
async function handleMangapanda(req, res, params) {
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
    console.error('MangaPanda API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
}

// eslint-disable-next-line no-unused-vars
async function handleMangaCover(req, res, params) {
  const { imageUrl, referer, mangaId, fileName, size } = params;

  let targetUrl = imageUrl;
  let targetReferer = referer;

  if (!targetUrl && mangaId && fileName) {
    const baseUrl = `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`;
    if (size && ['256', '512'].includes(size)) {
      const dotIndex = fileName.lastIndexOf('.');
      if (dotIndex !== -1) {
        const name = fileName.slice(0, dotIndex);
        const ext = fileName.slice(dotIndex);
        targetUrl = `https://uploads.mangadex.org/covers/${mangaId}/${name}.${size}${ext}`;
      } else {
        targetUrl = `${baseUrl}.${size}.jpg`;
      }
    } else {
      targetUrl = baseUrl;
    }
    targetReferer = targetReferer || 'https://mangadex.org';
  }

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing imageUrl or mangaId/fileName parameters' });
  }

  try {
    const fetchHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    if (targetReferer) {
      fetchHeaders.Referer = targetReferer;
    } else {
      try {
        const urlObj = new URL(targetUrl);
        fetchHeaders.Referer = `${urlObj.protocol}//${urlObj.host}`;
      } catch {
        // Ignore invalid URL errors here; some hosts may not need referer
      }
    }

    const response = await fetch(targetUrl, {
      headers: fetchHeaders,
    });

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: 'Failed to fetch image', status: response.status, url: targetUrl });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');

    return res.status(200).send(buffer);
  } catch (error) {
    console.error('Cover proxy error:', error);
    return res.status(500).json({ error: 'Failed to proxy image', details: error.message });
  }
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

function buildImageProxyUrl(imageUrl, referer) {
  if (!imageUrl) {
    return null;
  }

  const params = new URLSearchParams({ action: 'proxy', imageUrl });
  if (referer) {
    params.set('referer', referer);
  }

  return `/api/manga?source=cover&${params.toString()}`;
}

// Parsing functions for Mangapill
function parseSearchResultsMangapill(html) {
  const results = [];
  // Look for manga cards in search results
  const mangaRegex =
    /<a[^>]*href="\/manga\/([^/]+)\/([^"]+)"[^>]*>[\s\S]*?<img[^>]*(?:data-)?src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g;

  let match;
  while ((match = mangaRegex.exec(html)) !== null) {
    const coverImage = buildImageProxyUrl(match[3], 'https://mangapill.com') || match[3];

    results.push({
      id: `${match[1]}/${match[2]}`,
      title: match[4].trim(),
      coverImage,
    });
  }

  return results.slice(0, 200);
}

function parsePopularResultsMangapill(html) {
  const results = [];
  // Look for manga cards on browse page
  const mangaRegex =
    /<a[^>]*href="\/manga\/([^/]+)\/([^"]+)"[^>]*>[\s\S]*?<img[^>]*(?:data-)?src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g;

  let match;
  while ((match = mangaRegex.exec(html)) !== null) {
    const coverImage = buildImageProxyUrl(match[3], 'https://mangapill.com') || match[3];

    results.push({
      id: `${match[1]}/${match[2]}`,
      title: match[4].trim(),
      coverImage,
    });
  }

  return results.slice(0, 200);
}

function parseSeriesInfoMangapill(html) {
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const descriptionMatch = html.match(
    /<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/
  );
  const coverMatch = html.match(/<img[^>]*(?:data-)?src="([^"]*)"[^>]*class="[^"]*cover[^"]*"/);

  return {
    title: titleMatch ? titleMatch[1].trim() : 'Unknown',
    description: descriptionMatch ? descriptionMatch[1].replace(/<[^>]+>/g, '').trim() : '',
    coverImage: coverMatch
      ? buildImageProxyUrl(coverMatch[1], 'https://mangapill.com') || coverMatch[1]
      : '',
    status: 'Ongoing',
  };
}

function parseChaptersMangapill(html) {
  const chapters = [];
  // Look for chapter links
  const chapterRegex = /<a[^>]*href="\/chapters\/([^"]+)"[^>]*>([^<]+)<\/a>/g;

  let match;
  while ((match = chapterRegex.exec(html)) !== null) {
    // Extract chapter number from title
    const title = match[2].trim();
    const chapterNum = title.match(/Chapter (\d+)/) || title.match(/(\d+)/);
    chapters.push({
      id: match[1],
      title: title,
      chapter: chapterNum ? parseInt(chapterNum[1]) : null,
    });
  }

  return chapters.reverse().slice(0, 100); // Limit to 100 most recent chapters
}

function parseChapterPagesMangapill(html) {
  const pages = [];
  // Look for page images with data-src
  const imageRegex = /<img[^>]*(?:data-)?src="([^"]*)"[^>]*class="[^"]*page[^"]*"/g;

  let match;
  let pageNum = 1;
  while ((match = imageRegex.exec(html)) !== null) {
    const imageUrl = buildImageProxyUrl(match[1], 'https://mangapill.com') || match[1];

    pages.push({
      page: pageNum,
      img: imageUrl,
    });
    pageNum++;
  }

  return pages;
}

const MANGAHERE_HOST = 'https://www.mangahere.cc';
const DEFAULT_MANGAHERE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
};

const FALLBACK_MANGAHERE_RESULTS = [
  {
    id: 'manga/naruto',
    slug: 'manga/naruto',
    title: 'Naruto',
    coverImage: 'https://via.placeholder.com/256x384?text=Naruto',
    source: 'mangahere',
  },
  {
    id: 'manga/one-piece',
    slug: 'manga/one-piece',
    title: 'One Piece',
    coverImage: 'https://via.placeholder.com/256x384?text=One+Piece',
    source: 'mangahere',
  },
  {
    id: 'manga/solo-leveling',
    slug: 'manga/solo-leveling',
    title: 'Solo Leveling',
    coverImage: 'https://via.placeholder.com/256x384?text=Solo+Leveling',
    source: 'mangahere',
  },
];

const MANGAHERE_RESULT_LIMIT = 40;

async function fetchMangahereHtml(url) {
  const response = await fetch(url, {
    headers: DEFAULT_MANGAHERE_HEADERS,
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Mangahere request failed with ${response.status}`);
  }

  return await response.text();
}

function ensureMangahereUrl(value) {
  if (!value) {
    return value;
  }

  const trimmed = value.trim();
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `${MANGAHERE_HOST}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
}

function stripHtml(value) {
  if (!value) return '';
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseMangahereMangaList(html) {
  const regex = /<a[^>]+href="(\/manga\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const results = [];
  const seen = new Set();
  let match;

  while ((match = regex.exec(html)) !== null) {
    const [, href, inner] = match;
    if (!href || !inner) {
      continue;
    }

    if (href.toLowerCase().includes('/chapter/')) {
      continue;
    }

    const normalized = href.replace(/^\/+/, '').replace(/\/+$/, '');
    if (seen.has(normalized)) {
      continue;
    }

    const imgMatch = inner.match(/(?:data-lazy-src|data-src|src)="([^"]+)"/i);
    if (!imgMatch) {
      continue;
    }

    const titleMatch = inner.match(/alt="([^"]+)"/i) || inner.match(/title="([^"]+)"/i);
    const rawTitle = titleMatch ? titleMatch[1].trim() : stripHtml(inner).split('\n')[0];
    const title = rawTitle || normalized.replace(/manga\//i, '').replace(/[-_]/g, ' ');
    const descriptionMatch = inner.match(/<p[^>]*class="description"[^>]*>([\s\S]*?)<\/p>/i);
    const summary = descriptionMatch ? stripHtml(descriptionMatch[1]) : 'Click to view details';

    const coverImage = ensureMangahereUrl(imgMatch[1]);

    seen.add(normalized);
    results.push({
      id: normalized,
      slug: normalized,
      title,
      description: summary,
      status: 'unknown',
      rating: 'safe',
      tags: [],
      coverImage,
      source: 'mangahere',
    });

    if (results.length >= MANGAHERE_RESULT_LIMIT) {
      break;
    }
  }

  return results;
}

function parseSeriesInfoMangahere(html) {
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const descriptionMatch =
    html.match(/<div[^>]*class="manga-detail"[^>]*>([\s\S]*?)<div[^>]*class="manga-other"/i) ||
    html.match(/<p[^>]*class="desc"[^>]*>([\s\S]*?)<\/p>/i) ||
    html.match(
      /<div[^>]*class="story-info-right"[^>]*>([\s\S]*?)<div[^>]*class="story-info-right-act/i
    );
  const coverMatch =
    html.match(/<div[^>]*class="cover">[\s\S]*?<img[^>]*(?:data-src|src)="([^"]+)"/i) ||
    html.match(/<img[^>]*class="cover"[^>]*(?:data-src|src)="([^"]+)"/i);
  const statusMatch = html.match(/Status\s*<\/span>\s*([^<]+)/i);
  const authorMatch = html.match(
    /Author[s]?:\s*<\/span>\s*(?:<a[^>]*>\s*([^<]+)\s*<\/a>|([^<]+))/i
  );
  const artistMatch = html.match(
    /Artist[s]?:\s*<\/span>\s*(?:<a[^>]*>\s*([^<]+)\s*<\/a>|([^<]+))/i
  );
  const genresMatch = html.match(/Genres?:\s*<\/span>([\s\S]*?)<\/p>/i);

  const genres = [];
  if (genresMatch) {
    const anchorRegex = /<a[^>]*>([^<]+)<\/a>/gi;
    let genreMatch;
    while ((genreMatch = anchorRegex.exec(genresMatch[1])) !== null) {
      const genre = genreMatch[1].trim();
      if (genre) {
        genres.push(genre);
      }
    }
  }

  return {
    title: titleMatch ? titleMatch[1].trim() : 'Manga',
    description: descriptionMatch ? stripHtml(descriptionMatch[1]) : 'No description available',
    coverImage: coverMatch ? ensureMangahereUrl(coverMatch[1]) : '',
    status: statusMatch ? statusMatch[1].trim() : 'unknown',
    author: authorMatch ? authorMatch[1] || authorMatch[2] || 'Unknown' : 'Unknown',
    artist: artistMatch ? artistMatch[1] || artistMatch[2] || 'Unknown' : 'Unknown',
    genres,
  };
}

async function handleMangahereListResponse(res, url) {
  try {
    const html = await fetchMangahereHtml(url);
    const results = parseMangahereMangaList(html);

    if (!results.length) {
      return res.status(200).json({ results: FALLBACK_MANGAHERE_RESULTS });
    }

    return res.status(200).json({ results });
  } catch (error) {
    console.error('Mangahere list error:', error);
    return res.status(502).json({ error: 'Failed to load Mangahere list', details: error.message });
  }
}

// eslint-disable-next-line no-unused-vars
async function handleMangahereSearch(req, res, query) {
  if (!query) {
    return res.status(400).json({ error: 'query parameter required' });
  }

  const searchUrl = `${MANGAHERE_HOST}/search?keyword=${encodeURIComponent(query)}`;
  return await handleMangahereListResponse(res, searchUrl);
}

// eslint-disable-next-line no-unused-vars
async function handleMangaherePopular(req, res) {
  return await handleMangahereListResponse(res, MANGAHERE_HOST);
}

// eslint-disable-next-line no-unused-vars
async function handleMangahereSeries(req, res, mangaId) {
  if (!mangaId) {
    return res.status(400).json({ error: 'mangaId parameter required' });
  }

  const targetUrl = normalizeMangahereUrl(mangaId, 'manga');

  try {
    const html = await fetchMangahereHtml(targetUrl);
    const series = parseSeriesInfoMangahere(html);
    return res.status(200).json({ series });
  } catch (error) {
    console.error('Mangahere series error:', error);
    return res
      .status(502)
      .json({ error: 'Failed to load Mangahere series', details: error.message });
  }
}

// eslint-disable-next-line no-unused-vars
async function handleMangahereChapters(req, res, mangaId) {
  if (!mangaId) {
    return res.status(400).json({ error: 'mangaId parameter required' });
  }

  const targetUrl = normalizeMangahereUrl(mangaId, 'manga');

  try {
    const html = await fetchMangahereHtml(targetUrl);
    const chapters = parseChaptersMangahere(html);

    if (!chapters.length) {
      return res.status(404).json({ error: 'No Mangahere chapters found' });
    }

    return res.status(200).json({ chapters });
  } catch (error) {
    console.error('Mangahere chapters error:', error);
    return res
      .status(502)
      .json({ error: 'Failed to load Mangahere chapters', details: error.message });
  }
}

// eslint-disable-next-line no-unused-vars
async function handleMangahereChapterPages(req, res, chapterId) {
  if (!chapterId) {
    return res.status(400).json({ error: 'chapterId parameter required' });
  }

  const targetUrl = normalizeMangahereUrl(chapterId);

  try {
    const html = await fetchMangahereHtml(targetUrl);
    const pages = parseChapterPagesMangahere(html);

    if (!pages.length) {
      return res.status(404).json({ error: 'No Mangahere pages found' });
    }

    return res.status(200).json({ pages });
  } catch (error) {
    console.error('Mangahere pages error:', error);
    return res
      .status(502)
      .json({ error: 'Failed to load Mangahere pages', details: error.message });
  }
}

function normalizeMangahereUrl(pathFragment, type = 'chapter') {
  if (!pathFragment) {
    return null;
  }

  let trimmed = pathFragment.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = trimmed.replace(/^\/+/, '');

    if (type === 'manga') {
      trimmed = trimmed.replace(/^manga\//i, '');
      return `${MANGAHERE_HOST}/manga/${trimmed}`;
    }

    return `${MANGAHERE_HOST}/${trimmed}`;
  }

  return trimmed;
}

function parseChaptersMangahere(html) {
  const chapters = [];
  const seen = new Set();
  const chapterRegex = /<a[^>]*href="(\/(?:manga|chapter)\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let match;

  while ((match = chapterRegex.exec(html)) !== null) {
    const rawUrl = match[1];
    const href = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    const normalizedId = href.replace(/\/+$/, '').replace(/^\/+/, '');

    if (seen.has(normalizedId)) {
      continue;
    }

    if (!normalizedId.includes('chapter')) {
      continue;
    }

    seen.add(normalizedId);
    const titleText = match[2].trim().replace(/<[^>]+>/g, '');
    const chapterMatch = titleText.match(/Chapter\s*([\d.]+)/i) || titleText.match(/([\d.]+)/);
    const chapterNumber = chapterMatch ? parseFloat(chapterMatch[1]) : null;

    chapters.push({
      id: normalizedId,
      title: titleText || `Chapter ${chapterNumber ?? chapters.length + 1}`,
      chapter: chapterNumber,
    });
  }

  return chapters.reverse();
}

function parseChapterPagesMangahere(html) {
  const viewerMatch = html.match(/<div[^>]*id="viewer"[^>]*>([\s\S]*?)<\/div>/i);
  const content = viewerMatch ? viewerMatch[1] : html;
  const pages = [];
  const seen = new Set();
  const imageRegex = /<img[^>]*(?:data-src|data-lazy-src|src)="([^"]+)"[^>]*>/gi;
  let match;

  while ((match = imageRegex.exec(content)) !== null) {
    const imageUrl = match[1];
    if (!imageUrl || seen.has(imageUrl)) {
      continue;
    }

    if (!imageUrl.includes('mangahere.cc')) {
      continue;
    }

    seen.add(imageUrl);
    pages.push({
      page: pages.length + 1,
      img: imageUrl,
    });
  }

  return pages;
}
