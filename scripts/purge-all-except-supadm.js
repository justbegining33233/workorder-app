require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

async function del(prisma, model, label) {
  try {
    const r = await prisma[model].deleteMany({});
    console.log(`  Deleted ${r.count} ${label}`);
  } catch (e) {
    console.log(`  Skipped ${label}: ${e.message.split('\n')[0]}`);
  }
}

(async () => {
  const prisma = new PrismaClient();
  try {
    console.log('Starting purge of all users except supadm1006...\n');

    // Deepest children first
    await del(prisma, 'automationExecution', 'automation executions');
    await del(prisma, 'automationRule', 'automation rules');
    await del(prisma, 'stateInspection', 'state inspections');
    await del(prisma, 'referral', 'referrals');
    await del(prisma, 'workAuthorization', 'work authorizations');
    await del(prisma, 'dVIItem', 'DVI items');
    await del(prisma, 'dVIInspection', 'DVI inspections');
    await del(prisma, 'coreReturn', 'core returns');
    await del(prisma, 'fleetInvoice', 'fleet invoices');
    await del(prisma, 'fleetVehicle', 'fleet vehicles');
    await del(prisma, 'fleetAccount', 'fleet accounts');
    await del(prisma, 'loanerVehicle', 'loaner vehicles');
    await del(prisma, 'bay', 'bays');
    await del(prisma, 'recurringWorkOrder', 'recurring work orders');
    await del(prisma, 'pageView', 'page views');
    await del(prisma, 'paymentHistory', 'payment history');
    await del(prisma, 'subscription', 'subscriptions');
    await del(prisma, 'pushSubscription', 'push subscriptions');
    await del(prisma, 'techTracking', 'tech tracking');
    await del(prisma, 'customerMessage', 'customer messages');
    await del(prisma, 'customerDocument', 'customer documents');
    await del(prisma, 'favoriteShop', 'favorite shops');
    await del(prisma, 'review', 'reviews');
    await del(prisma, 'appointment', 'appointments');
    await del(prisma, 'directMessage', 'direct messages');
    await del(prisma, 'auditLog', 'audit logs');
    await del(prisma, 'purchaseOrderItem', 'purchase order items');
    await del(prisma, 'purchaseOrder', 'purchase orders');
    await del(prisma, 'inventoryStock', 'inventory stock');
    await del(prisma, 'inventoryRequest', 'inventory requests');
    await del(prisma, 'shopSettings', 'shop settings');
    await del(prisma, 'timeEntry', 'time entries');
    await del(prisma, 'refreshToken', 'refresh tokens');
    await del(prisma, 'activityLog', 'activity logs');
    await del(prisma, 'paymentMethod', 'payment methods');
    await del(prisma, 'inventoryItem', 'inventory items');
    await del(prisma, 'notification', 'notifications');
    await del(prisma, 'message', 'messages');
    await del(prisma, 'statusHistory', 'status history');
    await del(prisma, 'workOrder', 'work orders');
    await del(prisma, 'vehicle', 'vehicles');
    await del(prisma, 'shopLaborRate', 'shop labor rates');
    await del(prisma, 'shopService', 'shop services');
    await del(prisma, 'shopBlockedDate', 'shop blocked dates');
    await del(prisma, 'shopSchedule', 'shop schedules');
    await del(prisma, 'rewardClaim', 'reward claims');
    await del(prisma, 'verificationToken', 'verification tokens');
    await del(prisma, 'customer', 'customers');
    await del(prisma, 'tech', 'techs');
    await del(prisma, 'shop', 'shops');

    console.log('\nDone. Only supadm1006 admin remains.');
  } catch (err) {
    console.error('Fatal error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
})();
