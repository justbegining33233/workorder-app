// Test the API endpoint
async function testAPI() {
  try {
    console.log('Testing /api/shops/pending endpoint...\n');
    
    const response = await fetch('http://localhost:3000/api/shops/pending');
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const data = await response.json();
    console.log('\nResponse data:');
    console.log('Number of shops:', data.length || 0);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('\nPending shops:');
      data.forEach((shop, i) => {
        console.log(`${i + 1}. ${shop.shopName || shop.name} (${shop.email})`);
      });
    } else {
      console.log('\n❌ No shops returned from API');
      console.log('Full response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
