const BASE_URL = 'http://localhost:3000';
let authToken = null;
let shopId = null;
let techId = null;

async function testEndpoint(name, method, url, body = null, token = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`   ${method} ${url}`);
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Success (${response.status})`);
      console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 200));
      return { success: true, data, status: response.status };
    } else {
      console.log(`   ❌ Failed (${response.status})`);
      console.log(`   Error:`, data.error || data);
      return { success: false, error: data.error, status: response.status };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🔍 ENDPOINT TESTING SUITE\n');
  console.log('=' .repeat(50));
  
  // Test 1: Manager Login
  console.log('\n📋 TEST 1: Manager Authentication');
  const loginResult = await testEndpoint(
    'Manager Login',
    'POST',
    `${BASE_URL}/api/auth/tech`,
    {
      identifier: 'jr1@gmail.com',
      password: 'password123'
    }
  );
  
  if (loginResult.success) {
    authToken = loginResult.data.token;
    shopId = loginResult.data.user.shopId;
    techId = loginResult.data.user.id;
    console.log(`   🔑 Token obtained: ${authToken.substring(0, 20)}...`);
    console.log(`   🏪 Shop ID: ${shopId}`);
    console.log(`   👤 Tech ID: ${techId}`);
  } else {
    console.log('\n❌ Cannot continue without authentication');
    return;
  }
  
  // Test 2: Get Shop Details
  console.log('\n📋 TEST 2: Get Shop Details');
  await testEndpoint(
    'Get Shop',
    'GET',
    `${BASE_URL}/api/shop?shopId=${shopId}`,
    null,
    authToken
  );
  
  // Test 3: Get Shop Settings
  console.log('\n📋 TEST 3: Get Shop Settings');
  await testEndpoint(
    'Get Shop Settings',
    'GET',
    `${BASE_URL}/api/shop/settings?shopId=${shopId}`,
    null,
    authToken
  );
  
  // Test 4: Get Techs List
  console.log('\n📋 TEST 4: Get Techs/Managers List');
  await testEndpoint(
    'Get Techs',
    'GET',
    `${BASE_URL}/api/techs`,
    null,
    authToken
  );
  
  // Test 5: Get Time Tracking Entries
  console.log('\n📋 TEST 5: Get Time Tracking Entries');
  const today = new Date().toISOString().split('T')[0];
  await testEndpoint(
    'Get Time Entries',
    'GET',
    `${BASE_URL}/api/time-tracking?techId=${techId}&startDate=${today}`,
    null,
    authToken
  );
  
  // Test 6: Get Inventory Requests
  console.log('\n📋 TEST 6: Get Inventory Requests');
  await testEndpoint(
    'Get Inventory Requests',
    'GET',
    `${BASE_URL}/api/shop/inventory-requests?shopId=${shopId}`,
    null,
    authToken
  );
  
  // Test 7: Get Shop Stats
  console.log('\n📋 TEST 7: Get Shop Stats');
  await testEndpoint(
    'Get Shop Stats',
    'GET',
    `${BASE_URL}/api/shop/stats?shopId=${shopId}`,
    null,
    authToken
  );
  
  // Test 8: Test without token (should fail)
  console.log('\n📋 TEST 8: Protected Endpoint Without Token (Should Fail)');
  await testEndpoint(
    'Get Shop Without Auth',
    'GET',
    `${BASE_URL}/api/shop?shopId=${shopId}`,
    null,
    null
  );
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Testing Complete!\n');
}

// Check if server is running
console.log('🚀 Checking if server is running on localhost:3000...\n');

fetch(`${BASE_URL}/api/health`)
  .then(() => {
    console.log('✅ Server is running\n');
    runTests();
  })
  .catch(() => {
    console.log('❌ Server is not running. Please start with: npm run dev\n');
    process.exit(1);
  });
