// WeebCentral API Proxy
// This handles scraping WeebCentral for manga reading
export default async function handler(req, res) {
  const { action, seriesId, slug, chapterId, query } = req.query;

  try {
    switch (action) {
      case 'search':
        return await handleSearch(req, res, query);
      case 'popular':
        return await handlePopular(req, res);
      case 'series':
        return await handleSeriesInfo(req, res, seriesId);
      case 'chapters':
        return await handleChapters(req, res, seriesId);
      case 'pages':
        return await handleChapterPages(req, res, slug, chapterId);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('WeebCentral API Error:', error);
    return res.status(500).json({ error: 'Failed to fetch data', details: error.message });
  }
}

// Search manga
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
async function handlePopular(req, res) {
  try {
    const response = await fetch('https://weebcentral.com/', {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    const html = await response.text();

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

    return res.status(200).json({ results });
  } catch (error) {
    console.error('Popular manga error:', error);
    return res.status(500).json({ error: 'Failed to fetch popular manga', details: error.message });
  }
}

// Get series info
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
