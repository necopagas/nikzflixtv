// MangaPanda API Proxy
// This handles scraping MangaPanda for manga reading
export default async function handler(req, res) {
  const { action, mangaId, chapterId, query } = req.query;

  try {
    switch (action) {
      case 'search':
        return await handleSearch(req, res, query);
      case 'popular':
        return await handlePopular(req, res);
      case 'series':
        return await handleSeriesInfo(req, res, mangaId);
      case 'chapters':
        return await handleChapters(req, res, mangaId);
      case 'pages':
        return await handleChapterPages(req, res, chapterId);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('MangaPanda API Error:', error);
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
      `https://www.mangapanda.com/actions/search/?q=${encodeURIComponent(query)}`,
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
    const response = await fetch('https://www.mangapanda.com/manga', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    const results = parsePopularResults(html);

    return res.status(200).json({ results });
  } catch (error) {
    return res.status(500).json({ error: 'Popular fetch failed', details: error.message });
  }
}

// Get series info
async function handleSeriesInfo(req, res, mangaId) {
  if (!mangaId) {
    return res.status(400).json({ error: 'mangaId parameter required' });
  }

  try {
    const response = await fetch(`https://www.mangapanda.com/${mangaId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    const series = parseSeriesInfo(html);

    return res.status(200).json({ series });
  } catch (error) {
    return res.status(500).json({ error: 'Series info fetch failed', details: error.message });
  }
}

// Get chapters list
async function handleChapters(req, res, mangaId) {
  if (!mangaId) {
    return res.status(400).json({ error: 'mangaId parameter required' });
  }

  try {
    const response = await fetch(`https://www.mangapanda.com/${mangaId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    const chapters = parseChapters(html);

    return res.status(200).json({ chapters });
  } catch (error) {
    return res.status(500).json({ error: 'Chapters fetch failed', details: error.message });
  }
}

// Get chapter pages
async function handleChapterPages(req, res, chapterId) {
  if (!chapterId) {
    return res.status(400).json({ error: 'chapterId parameter required' });
  }

  try {
    const response = await fetch(`https://www.mangapanda.com/${chapterId}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    const pages = parseChapterPages(html);

    return res.status(200).json({ pages });
  } catch (error) {
    return res.status(500).json({ error: 'Chapter pages fetch failed', details: error.message });
  }
}

// Parse search results
function parseSearchResults(html) {
  const results = [];
  // MangaPanda search results structure
  const regex = /<a[^>]+href="\/([^"]+)"[^>]*class="[^"]*manga_title[^"]*"[^>]*>([^<]+)<\/a>/g;

  let match;
  while ((match = regex.exec(html)) !== null) {
    results.push({
      id: match[1],
      title: match[2].trim(),
      coverImage: '', // MangaPanda doesn't show covers in search
    });
  }

  return results;
}

// Parse popular results
function parsePopularResults(html) {
  const results = [];
  const regex = /<a[^>]+href="\/([^"]+)"[^>]*class="[^"]*manga_title[^"]*"[^>]*>([^<]+)<\/a>/g;

  let match;
  while ((match = regex.exec(html)) !== null) {
    results.push({
      id: match[1],
      title: match[2].trim(),
      coverImage: '',
    });
  }

  return results.slice(0, 20); // Limit to 20 results
}

// Parse series info
function parseSeriesInfo(html) {
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const descriptionMatch = html.match(/<p[^>]*class="[^"]*summary[^"]*"[^>]*>([\s\S]*?)<\/p>/);
  const coverMatch = html.match(/<img[^>]+src="([^"]+)"[^>]*class="[^"]*manga_cover[^"]*"/);

  return {
    title: titleMatch ? titleMatch[1].trim() : 'Unknown',
    description: descriptionMatch ? descriptionMatch[1].replace(/<[^>]+>/g, '').trim() : '',
    coverImage: coverMatch ? coverMatch[1] : '',
    status: 'Ongoing', // Default, could be parsed from HTML
  };
}

// Parse chapters
function parseChapters(html) {
  const chapters = [];
  const regex = /<a[^>]+href="\/([^"]+)"[^>]*class="[^"]*chapter_link[^"]*"[^>]*>([^<]+)<\/a>/g;

  let match;
  while ((match = regex.exec(html)) !== null) {
    chapters.push({
      id: match[1],
      title: match[2].trim(),
    });
  }

  return chapters.reverse(); // Reverse to show latest first
}

// Parse chapter pages
function parseChapterPages(html) {
  const pages = [];
  const regex = /<img[^>]+src="([^"]+)"[^>]*class="[^"]*page_image[^"]*"/g;

  let match;
  let pageNum = 1;
  while ((match = regex.exec(html)) !== null) {
    pages.push({
      page: pageNum,
      img: match[1],
    });
    pageNum++;
  }

  return pages;
}
