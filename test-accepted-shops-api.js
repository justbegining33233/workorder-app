// Test accepted shops API
const testAcceptedShops = async () => {
  try {
    console.log('\n🧪 Testing /api/shops/accepted endpoint...\n');
    
    const response = await fetch('http://localhost:3000/api/shops/accepted');

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const shops = await response.json();
      console.log(`Found ${shops.length} shop(s)\n`);
      
      shops.forEach((shop, idx) => {
        console.log(`${idx + 1}. ${shop.shopName} (ID: ${shop.id})`);
        console.log(`   Location: ${shop.location}`);
        console.log(`   Total Services: ${Array.isArray(shop.services) ? shop.services.length : 'N/A'}`);
        console.log(`   Diesel Services: ${Array.isArray(shop.dieselServices) ? shop.dieselServices.length : 'N/A'}`);
        console.log(`   Gas Services: ${Array.isArray(shop.gasServices) ? shop.gasServices.length : 'N/A'}`);
        
        if (Array.isArray(shop.dieselServices) && shop.dieselServices.length > 0) {
          console.log(`   First 3 diesel services:`);
          shop.dieselServices.slice(0, 3).forEach(s => {
            console.log(`     - ${s.serviceName}`);
          });
        }
        
        if (Array.isArray(shop.gasServices) && shop.gasServices.length > 0) {
          console.log(`   First 3 gas services:`);
          shop.gasServices.slice(0, 3).forEach(s => {
            console.log(`     - ${s.serviceName}`);
          });
        }
        console.log('');
      });
    } else {
      console.log('❌ Request failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

testAcceptedShops();
