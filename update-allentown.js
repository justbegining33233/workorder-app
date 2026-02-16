const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function updateAllentown() {
  // Find Allentown Auto Care
  const shop = await p.shop.findFirst({ 
    where: { shopName: { contains: 'Allentown' } }
  });
  
  if (!shop) {
    console.log('Allentown shop not found');
    return;
  }
  
  console.log('Found shop:', shop.shopName, '- ID:', shop.id);
  
  // Update shop to be a full-service 24/7 shop
  await p.shop.update({
    where: { id: shop.id },
    data: {
      shopName: 'Allentown 24/7 Auto & Diesel',
      shopType: 'both',
      capacity: 6,
      slotDuration: 30
    }
  });
  console.log('✓ Updated shop info (6 bays, 30-min slots)');
  
  // Delete existing schedules and create 24/7 schedule
  await p.shopSchedule.deleteMany({ where: { shopId: shop.id } });
  
  const schedules = [];
  for (let day = 0; day < 7; day++) {
    schedules.push({
      shopId: shop.id,
      dayOfWeek: day,
      isOpen: true,
      openTime: '00:00',
      closeTime: '23:30'
    });
  }
  await p.shopSchedule.createMany({ data: schedules });
  console.log('✓ Created 24/7 schedule (all days 00:00-23:30)');
  
  // Delete existing services
  await p.shopService.deleteMany({ where: { shopId: shop.id } });
  
  // All diesel services
  const dieselServices = [
    'Engine Diagnostics', 'Engine Repair', 'Engine Rebuild', 'Transmission Repair',
    'Brake System', 'Air Brake Service', 'Electrical Diagnostics', 'Electrical Repair',
    'Tire Service', 'Tire Replacement', 'Wheel Alignment', 'Suspension Repair',
    'Hydraulic Systems', 'Air Conditioning', 'Exhaust Repair', 'DEF System',
    'DPF Cleaning', 'Oil Change', 'Preventive Maintenance', 'DOT Inspections',
    'Trailer Repair', 'Reefer Repair', 'Welding', 'Roadside Assistance'
  ];
  
  // All gas services
  const gasServices = [
    'Engine Diagnostics', 'Engine Repair', 'Transmission Service', 'Transmission Repair',
    'Brake Service', 'Brake Replacement', 'Oil Change', 'Tune-up',
    'Electrical Diagnostics', 'Electrical Repair', 'Battery Service', 'Tire Rotation',
    'Tire Replacement', 'Wheel Alignment', 'Suspension Repair', 'Air Conditioning',
    'Heating Repair', 'Exhaust Repair', 'Catalytic Converter', 'Emissions Testing',
    'State Inspection', 'Windshield Replacement', 'Fluid Service', 'Coolant Flush',
    'Fuel System Cleaning', 'Timing Belt', 'Roadside Assistance'
  ];
  
  const services = [];
  
  // Add diesel services with estimated durations
  for (const name of dieselServices) {
    let duration = 60; // default 1 hour
    if (name.includes('Rebuild')) duration = 480; // 8 hours
    else if (name.includes('Repair')) duration = 120; // 2 hours
    else if (name === 'Oil Change') duration = 45;
    else if (name === 'DOT Inspections') duration = 90;
    
    services.push({
      shopId: shop.id,
      serviceName: name,
      category: 'diesel',
      duration: duration,
      description: null
    });
  }
  
  // Add gas services with estimated durations
  for (const name of gasServices) {
    let duration = 45; // default 45 min
    if (name.includes('Repair')) duration = 90;
    else if (name === 'Oil Change') duration = 30;
    else if (name === 'Tune-up') duration = 60;
    else if (name === 'State Inspection') duration = 30;
    else if (name === 'Timing Belt') duration = 180;
    
    services.push({
      shopId: shop.id,
      serviceName: name,
      category: 'gas',
      duration: duration,
      description: null
    });
  }
  
  await p.shopService.createMany({ data: services });
  console.log('✓ Added', services.length, 'services (' + dieselServices.length + ' diesel +', gasServices.length, 'gas)');
  
  console.log('\n✅ Allentown 24/7 Auto & Diesel is now the perfect shop!');
  console.log('   📍 Zip: 18101');
  console.log('   🕐 Open 24/7 (00:00-23:30 every day)');
  console.log('   🔧 6 service bays');
  console.log('   ⏱️ 30-minute appointment slots');
  console.log('   🚛 All diesel services (' + dieselServices.length + ')');
  console.log('   🚗 All gas services (' + gasServices.length + ')');
}

updateAllentown()
  .then(() => p.$disconnect())
  .catch(e => { console.error(e); p.$disconnect(); });
