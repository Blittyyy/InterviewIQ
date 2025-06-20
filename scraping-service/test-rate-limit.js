import fetch from 'node-fetch';

async function testRateLimit() {
  console.log('Testing rate limiting...');
  
  const baseUrl = 'http://localhost:3005';
  const testUrl = 'https://example.com';
  
  // Test 1: Make a single request to check if service is running
  try {
    console.log('\n1. Testing single request...');
    const response = await fetch(`${baseUrl}/scrape?url=${encodeURIComponent(testUrl)}`);
    console.log(`Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', data.success ? 'Success' : 'Error');
    }
  } catch (error) {
    console.error('Error making single request:', error.message);
    return;
  }
  
  // Test 2: Make multiple rapid requests to trigger rate limiting
  console.log('\n2. Testing rate limiting with multiple rapid requests...');
  const promises = [];
  
  for (let i = 0; i < 15; i++) {
    promises.push(
      fetch(`${baseUrl}/scrape?url=${encodeURIComponent(testUrl)}`)
        .then(async (response) => {
          const data = await response.json();
          return {
            request: i + 1,
            status: response.status,
            success: data.success,
            error: data.error
          };
        })
        .catch((error) => ({
          request: i + 1,
          status: 'ERROR',
          success: false,
          error: error.message
        }))
    );
  }
  
  const results = await Promise.all(promises);
  
  console.log('\nResults:');
  results.forEach(result => {
    const status = result.status === 429 ? 'RATE LIMITED' : result.status;
    console.log(`Request ${result.request}: ${status} - ${result.success ? 'Success' : result.error}`);
  });
  
  const rateLimitedCount = results.filter(r => r.status === 429).length;
  console.log(`\nSummary: ${rateLimitedCount} out of ${results.length} requests were rate limited`);
}

// Run the test
testRateLimit().catch(console.error); 