async function testStatsAPI() {
  try {
    // Get shop admin token (assuming test_prism1 shop)
    const loginResponse = await fetch('http://localhost:3000/api/shop/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@test.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (!loginData.token) {
      console.error('Failed to get token');
      return;
    }
    
    const token = loginData.token;
    const shopId = loginData.shop.id;
    
    console.log('\nShop ID:', shopId);
    console.log('Token:', token.substring(0, 20) + '...');
    
    // Fetch stats
    const statsResponse = await fetch(`http://localhost:3000/api/shop/stats?shopId=${shopId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const statsData = await statsResponse.json();
    console.log('\n=== Stats API Response ===');
    console.log(JSON.stringify(statsData, null, 2));
    
    console.log('\n=== Currently Clocked In ===');
    console.log(`Total clocked in: ${statsData.team.clockedIn}`);
    if (statsData.team.currentlyWorking) {
      statsData.team.currentlyWorking.forEach(emp => {
        console.log(`- ${emp.name} (${emp.role})`);
        console.log(`  Clocked in at: ${emp.clockedInAt}`);
        console.log(`  Duration: ${emp.duration} minutes`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testStatsAPI();
