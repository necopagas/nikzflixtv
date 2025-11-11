// Inspect the popular page structure more carefully
async function inspectPopularPageStructure() {
  try {
    console.log('Fetching popular page...');
    const response = await fetch('https://mangapill.com/mangas/new', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    const html = await response.text();
    console.log('HTML length:', html.length);

    // Look for manga cards with different patterns
    const patterns = [
      /<a[^>]*href="\/manga\/[^"]*"[^>]*>[\s\S]*?<img[^>]*data-src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>[\s\S]*?<\/a>/g,
      /<div[^>]*class="[^"]*card[^"]*"[^>]*>[\s\S]*?<a[^>]*href="\/manga\/([^/]+)\/([^"]+)"[^>]*>[\s\S]*?<img[^>]*data-src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/g,
      /href="\/manga\/([^/]+)\/([^"]+)"[\s\S]*?data-src="([^"]*)"[\s\S]*?alt="([^"]*)"/g,
    ];

    patterns.forEach((pattern, i) => {
      const matches = html.match(pattern);
      console.log(`Pattern ${i + 1} matches:`, matches ? matches.length : 0);
      if (matches && matches.length > 0) {
        console.log(`Sample match ${i + 1}:`, matches[0].substring(0, 200) + '...');
      }
    });

    // Look for data-src attributes
    const dataSrcImages = html.match(/data-src="[^"]*"/g);
    console.log('data-src images found:', dataSrcImages ? dataSrcImages.length : 0);
    if (dataSrcImages && dataSrcImages.length > 0) {
      console.log('Sample data-src:', dataSrcImages.slice(0, 3));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

inspectPopularPageStructure();
