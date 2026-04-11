/**
 * FixTray — Stripe Product & Price Setup
 *
 * Creates all 5 subscription products + monthly prices in your Stripe account
 * and prints the env vars you need to paste into .env / Railway.
 *
 * Usage:
 *   node scripts/setup-stripe.js            # create products & prices
 *   node scripts/setup-stripe.js --check    # just show what's already set
 *
 * Requires: STRIPE_SECRET_KEY in .env (or as an env var)
 */
require('dotenv').config();

const Stripe = require('stripe');

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error('❌  STRIPE_SECRET_KEY is not set. Add it to your .env file first.');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

// ── Plan definitions (must match src/lib/stripe.ts) ──────────────────────────
const PLANS = [
  { key: 'STARTER',       name: 'FixTray Starter',       price: 9988,  maxUsers: 1,  maxShops: 1  },
  { key: 'GROWTH',        name: 'FixTray Growth',        price: 24988, maxUsers: 5,  maxShops: 1  },
  { key: 'PROFESSIONAL',  name: 'FixTray Professional',  price: 49988, maxUsers: 15, maxShops: 1  },
  { key: 'BUSINESS',      name: 'FixTray Business',      price: 74988, maxUsers: 40, maxShops: 5  },
  { key: 'ENTERPRISE',    name: 'FixTray Enterprise',    price: 99988, maxUsers: -1, maxShops: -1 },
];

async function checkExisting() {
  console.log('\n📋  Current env var status:\n');
  let allSet = true;
  for (const plan of PLANS) {
    const prodEnv = `STRIPE_${plan.key}_PRODUCT_ID`;
    const priceEnv = `STRIPE_${plan.key}_PRICE_ID`;
    const prodVal = process.env[prodEnv];
    const priceVal = process.env[priceEnv];
    const prodOk = prodVal && prodVal.startsWith('prod_');
    const priceOk = priceVal && priceVal.startsWith('price_');
    console.log(`  ${prodOk ? '✅' : '❌'}  ${prodEnv}=${prodVal || '(missing)'}`);
    console.log(`  ${priceOk ? '✅' : '❌'}  ${priceEnv}=${priceVal || '(missing)'}`);
    if (!prodOk || !priceOk) allSet = false;
  }
  console.log(allSet ? '\n✅  All Stripe env vars are set!' : '\n⚠️   Some env vars are missing — run this script without --check to create them.');
  return allSet;
}

async function createProducts() {
  console.log('\n🚀  Creating Stripe products & prices...\n');

  const envLines = [];

  for (const plan of PLANS) {
    const prodEnvKey = `STRIPE_${plan.key}_PRODUCT_ID`;
    const priceEnvKey = `STRIPE_${plan.key}_PRICE_ID`;

    // Check if product already exists by looking up by name
    let product;
    const existingProducts = await stripe.products.search({
      query: `name:"${plan.name}"`,
    });

    if (existingProducts.data.length > 0) {
      product = existingProducts.data[0];
      console.log(`  ♻️   ${plan.name} — already exists (${product.id})`);
    } else {
      product = await stripe.products.create({
        name: plan.name,
        description: `FixTray ${plan.key.charAt(0) + plan.key.slice(1).toLowerCase()} plan — up to ${plan.maxUsers === -1 ? 'unlimited' : plan.maxUsers} users, ${plan.maxShops === -1 ? 'unlimited' : plan.maxShops} shop(s)`,
        metadata: {
          fixtray_plan: plan.key.toLowerCase(),
          maxUsers: String(plan.maxUsers),
          maxShops: String(plan.maxShops),
        },
      });
      console.log(`  ✅  ${plan.name} — created (${product.id})`);
    }

    // Check if a monthly price already exists for this product
    let price;
    const existingPrices = await stripe.prices.list({
      product: product.id,
      active: true,
      type: 'recurring',
      limit: 10,
    });
    const matchingPrice = existingPrices.data.find(
      (p) => p.unit_amount === plan.price && p.recurring?.interval === 'month'
    );

    if (matchingPrice) {
      price = matchingPrice;
      console.log(`  ♻️   $${(plan.price / 100).toFixed(2)}/mo price — already exists (${price.id})`);
    } else {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price,
        currency: 'usd',
        recurring: { interval: 'month' },
        metadata: { fixtray_plan: plan.key.toLowerCase() },
      });
      console.log(`  ✅  $${(plan.price / 100).toFixed(2)}/mo price — created (${price.id})`);
    }

    envLines.push(`${prodEnvKey}=${product.id}`);
    envLines.push(`${priceEnvKey}=${price.id}`);
    console.log('');
  }

  // Print env block
  console.log('━'.repeat(60));
  console.log('📋  Add these to your .env / Railway environment:\n');
  console.log(envLines.join('\n'));
  console.log('\n' + '━'.repeat(60));

  // Offer to append to .env
  const fs = require('fs');
  const path = require('path');
  const envPath = path.resolve(__dirname, '..', '.env');

  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, 'utf8');
    let appended = 0;

    for (const line of envLines) {
      const [key] = line.split('=');
      // Only add if not already present
      if (!envContent.includes(key + '=')) {
        envContent += '\n' + line;
        appended++;
      } else {
        // Update existing value
        const regex = new RegExp(`^${key}=.*$`, 'm');
        envContent = envContent.replace(regex, line);
        appended++;
      }
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log(`\n✅  Updated ${appended} env vars in .env`);
  } else {
    console.log('\n⚠️   No .env file found — copy the values above manually.');
  }
}

async function main() {
  const arg = process.argv[2];

  if (arg === '--check') {
    await checkExisting();
  } else {
    await createProducts();
  }
}

main().catch((err) => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});