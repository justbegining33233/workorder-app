const testShopLogin = async () => {
  try {
    console.log('\n🧪 Testing shop login API...\n');
    
    const credentials = {
      username: 'joseruizvlla391@gmail.com',
      password: 'Password123!'
    };

    console.log('Attempting login with:', { 
      username: credentials.username,
      password: '***' 
    });

    const response = await fetch('http://localhost:3000/api/auth/shop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    console.log('\nResponse status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ Login successful!');
      console.log('Access token received:', !!data.accessToken);
    } else {
      console.log('\n❌ Login failed!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testShopLogin();
