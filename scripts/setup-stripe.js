const { PrismaClient } = require('@prisma/client');
const { STRIPE_PRODUCTS, createOrRetrieveCustomer, createSubscription } = require('../lib/stripe');

const prisma = new PrismaClient();

async function setupStripeProducts() {
  console.log('Setting up Stripe products and prices...');

  // This script would be run to create products in Stripe
  // In a real implementation, you'd use the Stripe CLI or dashboard to create these
  // For now, this is a placeholder showing the structure

  console.log('Stripe Products Configuration:');
  Object.entries(STRIPE_PRODUCTS).forEach(([plan, config]) => {
    console.log(`${plan}:`);
    console.log(`  Product ID: ${config.productId}`);
    console.log(`  Price ID: ${config.priceId}`);
    console.log(`  Price: $${config.price}/month`);
    console.log(`  Max Users: ${config.maxUsers}`);
    console.log(`  Max Shops: ${config.maxShops}`);
    console.log('');
  });

  console.log('To set up in Stripe:');
  console.log('1. Go to your Stripe Dashboard');
  console.log('2. Create products for each plan');
  console.log('3. Add monthly prices to each product');
  console.log('4. Copy the product and price IDs to your .env file');
  console.log('');
  console.log('Environment variables needed:');
  console.log('STRIPE_STARTER_PRODUCT_ID=prod_...');
  console.log('STRIPE_STARTER_PRICE_ID=price_...');
  console.log('STRIPE_GROWTH_PRODUCT_ID=prod_...');
  console.log('STRIPE_GROWTH_PRICE_ID=price_...');
  console.log('// ... and so on for each plan');
}

async function createSampleSubscription() {
  console.log('Creating sample subscription...');

  try {
    // This is an example of how to create a subscription
    // In practice, this would be done through your signup flow

    const customer = await createOrRetrieveCustomer('admin@fixtray.com', 'FixTray Admin');
    console.log('Customer created/retrieved:', customer.id);

    const subscription = await createSubscription(customer.id, STRIPE_PRODUCTS.professional.priceId, {
      shopId: 'sample-shop-id',
    });
    console.log('Subscription created:', subscription.id);

    // Create subscription record in database
    await prisma.subscription.create({
      data: {
        shopId: 'sample-shop-id',
        plan: 'professional',
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: customer.id,
        maxUsers: STRIPE_PRODUCTS.professional.maxUsers,
        maxShops: STRIPE_PRODUCTS.professional.maxShops,
      },
    });

    console.log('Database record created');

  } catch (error) {
    console.error('Error creating sample subscription:', error);
  }
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'setup':
      await setupStripeProducts();
      break;
    case 'sample':
      await createSampleSubscription();
      break;
    default:
      console.log('Usage:');
      console.log('  node setup-stripe.js setup    - Show Stripe product configuration');
      console.log('  node setup-stripe.js sample   - Create a sample subscription');
  }

  await prisma.$disconnect();
}

main().catch(console.error);