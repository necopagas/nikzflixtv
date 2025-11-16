// Test script to verify Vivamax API endpoint
import axios from 'axios';

const testVivamaxAPI = async () => {
  try {
    console.log('Testing Vivamax API endpoint...\n');

    const response = await axios.get('http://localhost:5174/api/vivamax?page=1', {
      timeout: 10000,
    });

    console.log('✅ API Response Status:', response.status);
    console.log('📊 Results Count:', response.data.results?.length || 0);
    console.log('📄 Page:', response.data.page);
    console.log('📚 Total Results:', response.data.total_results);
    console.log('📖 Total Pages:', response.data.total_pages);
    console.log('💾 Cached:', response.data.cached || false);

    if (response.data.results && response.data.results.length > 0) {
      console.log('\n🎬 First 5 Movies:');
      response.data.results.slice(0, 5).forEach((movie, index) => {
        console.log(
          `  ${index + 1}. ${movie.title || movie.name} (${movie.release_date?.substring(0, 4) || 'N/A'})`
        );
      });
    } else {
      console.log('\n⚠️ No movies found in response');
    }
  } catch (error) {
    console.error('❌ Error testing Vivamax API:');
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    } else if (error.request) {
      console.error('   No response received');
    } else {
      console.error('   Error:', error.message);
    }
  }
};

testVivamaxAPI();
