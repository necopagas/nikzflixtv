// Test the updated Mangapill parsing
async function testUpdatedMangapillParsing() {
  try {
    console.log('Testing updated Mangapill parsing...');

    // Test popular
    console.log('\n1. Testing popular...');
    const popularResponse = await fetch('https://mangapill.com/mangas/new', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const popularHtml = await popularResponse.text();
    const popularResults = parsePopularResultsMangapill(popularHtml);
    console.log('Popular results:', popularResults.length);
    if (popularResults.length > 0) {
      console.log('First result:', popularResults[0]);
    }

    // Test series
    console.log('\n2. Testing series...');
    const seriesResponse = await fetch('https://mangapill.com/manga/2/one-piece', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    const seriesHtml = await seriesResponse.text();
    const seriesInfo = parseSeriesInfoMangapill(seriesHtml);
    console.log('Series info:', seriesInfo);

    // Test chapters
    console.log('\n3. Testing chapters...');
    const chapters = parseChaptersMangapill(seriesHtml);
    console.log('Chapters found:', chapters.length);
    if (chapters.length > 0) {
      console.log('First 3 chapters:', chapters.slice(0, 3));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Copy the parsing functions
function parsePopularResultsMangapill(html) {
  const results = [];
  const mangaRegex =
    /<a[^>]*href="\/manga\/([^/]+)\/([^"]+)"[^>]*>[\s\S]*?<img[^>]*data-src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g;

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
  const coverMatch = html.match(/<img[^>]*data-src="([^"]*)"[^>]*class="[^"]*cover[^"]*"/);

  return {
    title: titleMatch ? titleMatch[1].trim() : 'Unknown',
    description: descriptionMatch ? descriptionMatch[1].replace(/<[^>]+>/g, '').trim() : '',
    coverImage: coverMatch ? coverMatch[1] : '',
    status: 'Ongoing',
  };
}

function parseChaptersMangapill(html) {
  const chapters = [];
  const chapterRegex = /<a[^>]*href="\/chapters\/([^"]+)"[^>]*>([^<]+)<\/a>/g;

  let match;
  while ((match = chapterRegex.exec(html)) !== null) {
    const title = match[2].trim();
    const chapterNum = title.match(/Chapter (\d+)/) || title.match(/(\d+)/);
    chapters.push({
      id: match[1],
      title: title,
      chapter: chapterNum ? parseInt(chapterNum[1]) : null,
    });
  }

  return chapters.reverse().slice(0, 100);
}

testUpdatedMangapillParsing();
