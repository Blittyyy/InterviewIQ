import fetch from 'node-fetch';

async function testScraper() {
  try {
    const response = await fetch('http://localhost:3005/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://www.bynry.com/'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('Make sure the server is running on port 3005');
    }
  }
}

// Run the test
testScraper(); 