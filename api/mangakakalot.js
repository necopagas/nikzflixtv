// Mangakakalot API Proxy
// This handles scraping Mangakakalot for manga reading
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
    console.error('Mangakakalot API Error:', error);
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
      `https://mangakakalot.com/search/story/${encodeURIComponent(query)}`,
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
    const response = await fetch(
      'https://mangakakalot.com/manga_list?type=topview&category=all&state=all&page=1',
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }
    );

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
    const response = await fetch(`https://mangakakalot.com/manga/${mangaId}`, {
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
    const response = await fetch(`https://mangakakalot.com/manga/${mangaId}`, {
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
    const response = await fetch(`https://mangakakalot.com/chapter/${chapterId}`, {
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
  const regex =
    /<div class="story_item">[\s\S]*?<a href="\/manga\/([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?<\/div>/g;

  let match;
  while ((match = regex.exec(html)) !== null) {
    results.push({
      id: match[1],
      title: match[2].trim(),
      coverImage: match[3],
    });
  }

  return results;
}

// Parse popular results
function parsePopularResults(html) {
  const results = [];
  const regex =
    /<div class="story_item">[\s\S]*?<a href="\/manga\/([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?<\/div>/g;

  let match;
  while ((match = regex.exec(html)) !== null) {
    results.push({
      id: match[1],
      title: match[2].trim(),
      coverImage: match[3],
    });
  }

  return results.slice(0, 20); // Limit to 20 results
}

// Parse series info
function parseSeriesInfo(html) {
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const descriptionMatch = html.match(/<div[^>]*class="summary"[^>]*>([\s\S]*?)<\/div>/);
  const coverMatch = html.match(/<img[^>]+src="([^"]+)"[^>]*class="manga-info-pic"/);

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
  const regex = /<a[^>]+href="\/chapter\/([^"]+)"[^>]*>([^<]+)<\/a>/g;

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
  const regex = /<img[^>]+src="([^"]+)"[^>]*class="img-loading"/g;

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
