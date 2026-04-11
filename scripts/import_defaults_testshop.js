const { PrismaClient } = require('@prisma/client');

const DIESEL_SERVICES = [
  'Engine Diagnostics','Engine Repair','Engine Rebuild','Transmission Repair','Brake System','Air Brake Service','Electrical Diagnostics','Electrical Repair','Tire Service','Tire Replacement','Wheel Alignment','Suspension Repair','Hydraulic Systems','Air Conditioning','Exhaust Repair','DEF System','DPF Cleaning','Oil Change','Preventive Maintenance','DOT Inspections','Trailer Repair','Reefer Repair','Welding','Roadside Assistance'
];

const GAS_SERVICES = [
  'Engine Diagnostics','Engine Repair','Transmission Service','Transmission Repair','Brake Service','Brake Replacement','Oil Change','Tune-up','Electrical Diagnostics','Electrical Repair','Battery Service','Tire Rotation','Tire Replacement','Wheel Alignment','Suspension Repair','Air Conditioning','Heating Repair','Exhaust Repair','Catalytic Converter','Emissions Testing','State Inspection','Windshield Replacement','Fluid Service','Coolant Flush','Fuel System Cleaning','Timing Belt','Roadside Assistance'
];

(async () => {
  const prisma = new PrismaClient();
  try {
    const shop = await prisma.shop.findUnique({ where: { username: 'testshop' } });
    if (!shop) return console.log('testshop not found');
    const shopId = shop.id;
    let created = 0;
    for (const s of DIESEL_SERVICES) {
      await prisma.shopService.upsert({
        where: { shopId_serviceName: { shopId, serviceName: s } },
        create: { shopId, serviceName: s, category: 'diesel' },
        update: { category: 'diesel' }
      });
      created++;
    }
    for (const s of GAS_SERVICES) {
      await prisma.shopService.upsert({
        where: { shopId_serviceName: { shopId, serviceName: s } },
        create: { shopId, serviceName: s, category: 'gas' },
        update: { category: 'gas' }
      });
      created++;
    }
    console.log('Imported', created, 'services for', shop.username);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();