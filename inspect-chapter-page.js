// Inspect a chapter page to see how images are structured
async function inspectChapterPage() {
  try {
    console.log('Fetching a chapter page...');
    const response = await fetch(
      'https://mangapill.com/chapters/2-11165000/one-piece-chapter-1165',
      {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }
    );

    const html = await response.text();
    console.log('Response status:', response.status);
    console.log('HTML length:', html.length);

    // Look for page images
    const images = html.match(/<img[^>]*src="[^"]*"/g);
    console.log('Images with src found:', images ? images.length : 0);

    const dataSrcImages = html.match(/data-src="[^"]*"/g);
    console.log('Images with data-src found:', dataSrcImages ? dataSrcImages.length : 0);

    if (dataSrcImages && dataSrcImages.length > 0) {
      console.log('Sample data-src images:', dataSrcImages.slice(0, 3));
    }

    // Look for page containers
    const pageContainers = html.match(/class="[^"]*page[^"]*"/g);
    console.log('Page containers found:', pageContainers ? pageContainers.length : 0);
  } catch (error) {
    console.error('Error:', error);
  }
}

inspectChapterPage();
