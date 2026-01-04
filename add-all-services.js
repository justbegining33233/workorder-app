const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DIESEL_SERVICES = [
  'Engine Diagnostics',
  'Engine Repair',
  'Engine Rebuild',
  'Transmission Repair',
  'Brake System',
  'Air Brake Service',
  'Electrical Diagnostics',
  'Electrical Repair',
  'Tire Service',
  'Tire Replacement',
  'Wheel Alignment',
  'Suspension Repair',
  'Hydraulic Systems',
  'Air Conditioning',
  'Exhaust Repair',
  'DEF System',
  'DPF Cleaning',
  'Oil Change',
  'Preventive Maintenance',
  'DOT Inspections',
  'Trailer Repair',
  'Reefer Repair',
  'Welding',
  'Roadside Assistance'
];

const GAS_SERVICES = [
  'Engine Diagnostics',
  'Engine Repair',
  'Transmission Service',
  'Transmission Repair',
  'Brake Service',
  'Brake Replacement',
  'Oil Change',
  'Tune-up',
  'Electrical Diagnostics',
  'Electrical Repair',
  'Battery Service',
  'Tire Rotation',
  'Tire Replacement',
  'Wheel Alignment',
  'Suspension Repair',
  'Air Conditioning',
  'Heating Repair',
  'Exhaust Repair',
  'Catalytic Converter',
  'Emissions Testing',
  'State Inspection',
  'Windshield Replacement',
  'Fluid Service',
  'Coolant Flush',
  'Fuel System Cleaning',
  'Timing Belt',
  'Roadside Assistance'
];

async function addAllServices() {
  try {
    const shopId = 'cmjv8gsr000017c5appehoqjb'; // test_prism1

    console.log('Adding all services to shop:', shopId);
    console.log(`Total services to add: ${DIESEL_SERVICES.length} diesel + ${GAS_SERVICES.length} gas = ${DIESEL_SERVICES.length + GAS_SERVICES.length}`);

    // Delete existing services first
    await prisma.shopService.deleteMany({
      where: { shopId }
    });
    console.log('✓ Deleted existing services');

    let addedCount = 0;

    // Add all diesel services
    for (const serviceName of DIESEL_SERVICES) {
      await prisma.shopService.create({
        data: {
          shopId,
          serviceName,
          category: 'diesel'
        }
      });
      addedCount++;
    }
    console.log(`✓ Added ${DIESEL_SERVICES.length} diesel services`);

    // Add all gas services (including duplicates - they'll show in both sections)
    for (const serviceName of GAS_SERVICES) {
      await prisma.shopService.create({
        data: {
          shopId,
          serviceName,
          category: 'gas'
        }
      });
      addedCount++;
    }
    console.log(`✓ Added ${GAS_SERVICES.length} gas services`);

    console.log(`\n✅ Successfully added ${addedCount} total services to the shop!`);

    // Verify
    const services = await prisma.shopService.findMany({
      where: { shopId },
      select: { serviceName: true, category: true }
    });

    console.log(`\nVerification: Found ${services.length} services in database`);
    console.log(`- Diesel: ${services.filter(s => s.category === 'diesel').length}`);
    console.log(`- Gas: ${services.filter(s => s.category === 'gas').length}`);

  } catch (error) {
    console.error('Error adding services:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAllServices();
