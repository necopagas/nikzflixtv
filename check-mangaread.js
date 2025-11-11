// Check if Mangaread is working now
async function checkMangaread() {
  try {
    console.log('Checking Mangaread...');
    const response = await fetch('https://mangaread.org/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'manual',
    });

    console.log('Status:', response.status);
    console.log('Redirect:', response.headers.get('location'));

    if (response.status === 200) {
      const html = await response.text();
      console.log('HTML length:', html.length);

      const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      console.log('Title:', title ? title[1] : 'No title');

      const mangaLinks = html.match(/href="\/manga\/[^"]+"/g);
      console.log('Manga links found:', mangaLinks ? mangaLinks.length : 0);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMangaread();
