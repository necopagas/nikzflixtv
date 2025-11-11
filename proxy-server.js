// Local Cloudflare Bypass Proxy Server
// This server runs locally and can bypass Cloudflare protection for manga scraping
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { HttpsProxyAgent } from 'https-proxy-agent';

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS
app.use(cors());
app.use(express.json());

// Cloudflare bypass headers
const CLOUDFLARE_BYPASS_HEADERS = {
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
};

// Enhanced Cloudflare bypass with retry logic
async function fetchWithCloudflareBypass(url, options = {}) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} to fetch: ${url}`);

      const response = await axios.get(url, {
        headers: {
          ...CLOUDFLARE_BYPASS_HEADERS,
          ...options.headers,
        },
        timeout: 30000,
        maxRedirects: 10,
        validateStatus: function (status) {
          return status < 500; // Accept all status codes below 500
        },
        ...options,
      });

      // Check if we got a Cloudflare challenge page
      if (response.data && typeof response.data === 'string') {
        if (
          response.data.includes('Just a moment') ||
          response.data.includes('challenge-platform') ||
          response.data.includes('cf-browser-verification')
        ) {
          console.log(`Cloudflare challenge detected on attempt ${attempt}`);

          if (attempt < maxRetries) {
            // Wait before retrying (exponential backoff)
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }
        }
      }

      return response;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

// WeebCentral scraping functions with Cloudflare bypass
async function scrapeWeebCentralPopular() {
  try {
    const response = await fetchWithCloudflareBypass('https://weebcentral.com/');
    const $ = cheerio.load(response.data);

    const results = [];

    // Parse popular manga from homepage
    $('.manga-card, .series-card').each((index, element) => {
      const $el = $(element);
      const title = $el.find('.manga-title, .series-title').text().trim();
      const link = $el.find('a').attr('href');
      const cover = $el.find('img').attr('src');

      if (title && link) {
        const id = link.split('/series/')[1]?.split('/')[0];
        if (id) {
          results.push({
            id,
            title,
            coverImage: cover || '',
          });
        }
      }
    });

    return results.slice(0, 20);
  } catch (error) {
    console.error('Error scraping WeebCentral popular:', error);
    throw error;
  }
}

async function scrapeWeebCentralSearch(query) {
  try {
    const searchUrl = `https://weebcentral.com/search?text=${encodeURIComponent(query)}`;
    const response = await fetchWithCloudflareBypass(searchUrl);
    const $ = cheerio.load(response.data);

    const results = [];

    // Parse search results
    $('.search-result, .manga-item').each((index, element) => {
      const $el = $(element);
      const title = $el.find('.title, .manga-title').text().trim();
      const link = $el.find('a').attr('href');
      const cover = $el.find('img').attr('src');

      if (title && link) {
        const id = link.split('/series/')[1]?.split('/')[0];
        if (id) {
          results.push({
            id,
            title,
            coverImage: cover || '',
          });
        }
      }
    });

    return results;
  } catch (error) {
    console.error('Error scraping WeebCentral search:', error);
    throw error;
  }
}

async function scrapeWeebCentralSeries(seriesId) {
  try {
    const response = await fetchWithCloudflareBypass(`https://weebcentral.com/series/${seriesId}`);
    const $ = cheerio.load(response.data);

    const title = $('.series-title, .manga-title').first().text().trim();
    const description = $('.description, .summary').first().text().trim();
    const coverImage = $('.cover img, .poster img').attr('src');

    return {
      title: title || 'Unknown Title',
      description: description || 'No description available',
      coverImage: coverImage || '',
      status: 'Ongoing',
    };
  } catch (error) {
    console.error('Error scraping WeebCentral series:', error);
    throw error;
  }
}

async function scrapeWeebCentralChapters(seriesId) {
  try {
    const response = await fetchWithCloudflareBypass(`https://weebcentral.com/series/${seriesId}`);
    const $ = cheerio.load(response.data);

    const chapters = [];

    // Parse chapters list
    $('.chapter-list a, .chapters a').each((index, element) => {
      const $el = $(element);
      const title = $el.text().trim();
      const link = $el.attr('href');

      if (link && link.includes('/chapter/')) {
        const chapterId = link.split('/chapter/')[1]?.split('/')[0];
        if (chapterId) {
          chapters.push({
            id: chapterId,
            title: title || `Chapter ${index + 1}`,
          });
        }
      }
    });

    return chapters.reverse(); // Latest first
  } catch (error) {
    console.error('Error scraping WeebCentral chapters:', error);
    throw error;
  }
}

async function scrapeWeebCentralPages(seriesSlug, chapterId) {
  try {
    const response = await fetchWithCloudflareBypass(
      `https://weebcentral.com/series/${seriesSlug}/chapter/${chapterId}`
    );
    const $ = cheerio.load(response.data);

    const pages = [];

    // Parse page images
    $('.page img, .chapter-page img').each((index, element) => {
      const $img = $(element);
      const imgSrc = $img.attr('src') || $img.attr('data-src');

      if (imgSrc) {
        pages.push({
          page: index + 1,
          img: imgSrc,
        });
      }
    });

    return pages;
  } catch (error) {
    console.error('Error scraping WeebCentral pages:', error);
    throw error;
  }
}

// API Routes
app.get('/api/weebcentral', async (req, res) => {
  const { action, seriesId, slug, chapterId, query } = req.query;

  try {
    let result;

    switch (action) {
      case 'popular':
        result = { results: await scrapeWeebCentralPopular() };
        break;
      case 'search':
        if (!query) {
          return res.status(400).json({ error: 'Query parameter required' });
        }
        result = { results: await scrapeWeebCentralSearch(query) };
        break;
      case 'series':
        if (!seriesId) {
          return res.status(400).json({ error: 'seriesId parameter required' });
        }
        result = { series: await scrapeWeebCentralSeries(seriesId) };
        break;
      case 'chapters':
        if (!seriesId) {
          return res.status(400).json({ error: 'seriesId parameter required' });
        }
        result = { chapters: await scrapeWeebCentralChapters(seriesId) };
        break;
      case 'pages':
        if (!slug || !chapterId) {
          return res.status(400).json({ error: 'slug and chapterId parameters required' });
        }
        result = { pages: await scrapeWeebCentralPages(slug, chapterId) };
        break;
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json(result);
  } catch (error) {
    console.error('WeebCentral proxy error:', error);
    res.status(500).json({
      error: 'Failed to fetch data',
      details: error.message,
      suggestion: 'Try again later or check if the site is accessible',
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Cloudflare Bypass Proxy Server running on http://localhost:${PORT}`);
  console.log(`📚 WeebCentral API available at http://localhost:${PORT}/api/weebcentral`);
  console.log(`💚 Health check at http://localhost:${PORT}/health`);
});

export default app;
