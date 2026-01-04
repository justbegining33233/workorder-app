// Test shop login via API
const testLogin = async () => {
  try {
    console.log('\n🧪 Testing Shop Login API...\n');
    
    const response = await fetch('http://localhost:3000/api/auth/shop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'joseruizvlla391@gmail.com',
        password: 'Password123!',
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ LOGIN SUCCESSFUL!');
      console.log('Access token received:', data.accessToken ? 'YES' : 'NO');
      console.log('Shop ID:', data.id);
      console.log('Shop Name:', data.shopName);
    } else {
      console.log('\n❌ LOGIN FAILED');
      console.log('Error:', data.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testLogin();
