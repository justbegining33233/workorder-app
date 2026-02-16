# 🏦 Stripe Payment Gateway Setup Guide

This guide will walk you through connecting your bank account and setting up payments for FixTray subscription tiers.

## Overview

FixTray uses **Stripe** for payment processing. Stripe handles:
- ✅ Credit/debit card payments
- ✅ ACH bank transfers
- ✅ Recurring subscription billing
- ✅ Invoice generation
- ✅ Payment failure handling
- ✅ PCI compliance (you don't handle raw card data)

---

## Step 1: Create a Stripe Account

1. Go to [stripe.com](https://stripe.com) and click **Start now**
2. Enter your email and create a password
3. Verify your email address

---

## Step 2: Complete Business Verification

To receive payouts, Stripe requires verification:

1. **In Stripe Dashboard** → Click **Activate payments** (top banner)
2. **Business Type**: Select your business structure
   - Individual/Sole proprietor
   - LLC
   - Corporation
3. **Business Details**: 
   - Legal business name
   - Business address
   - Tax ID (EIN) or SSN for sole proprietors
   - Industry: "Software" or "Technology"
4. **Personal Verification**:
   - Legal name
   - Date of birth
   - Last 4 digits of SSN
   - Home address

---

## Step 3: Connect Your Bank Account

1. Go to **Settings** (gear icon) → **Payouts**
2. Click **Add bank account**
3. Enter:
   - Routing number (9 digits)
   - Account number
   - Account type (Checking recommended)
4. Stripe will verify with 2 micro-deposits (takes 1-2 business days)

**Payout Schedule Options:**
- Daily (default)
- Weekly
- Monthly

---

## Step 4: Get Your API Keys

1. Go to **Developers** → **API Keys**
2. You'll see:
   - **Publishable key**: `pk_test_...` (safe for frontend)
   - **Secret key**: `sk_test_...` (keep private!)

### Test Mode vs Live Mode

- **Test Mode**: Use `pk_test_...` and `sk_test_...` keys for development
- **Live Mode**: Use `pk_live_...` and `sk_live_...` keys for production

**Test Card Numbers:**
| Card | Number |
|------|--------|
| Success | 4242 4242 4242 4242 |
| Decline | 4000 0000 0000 0002 |
| 3D Secure | 4000 0025 0000 3155 |

---

## Step 5: Create Your Products in Stripe

1. Go to **Products** → **Add product**

### Create these 5 subscription products:

| Product Name | Price | Billing |
|--------------|-------|---------|
| FixTray Starter | $99 | Monthly, recurring |
| FixTray Growth | $199 | Monthly, recurring |
| FixTray Professional | $349 | Monthly, recurring |
| FixTray Business | $599 | Monthly, recurring |
| FixTray Enterprise | $999 | Monthly, recurring |

For each product:
1. Click **Add product**
2. Enter the name (e.g., "FixTray Starter")
3. Add a description
4. Under **Pricing**:
   - Select **Recurring**
   - Enter the price
   - Select **Monthly**
5. Click **Save product**

After creating each product, **copy the Price ID** (starts with `price_...`)

---

## Step 6: Update Environment Variables

Edit your `.env.local` file with your actual keys:

```env
# Stripe Payment Processing
STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_ACTUAL_KEY"
STRIPE_SECRET_KEY="sk_test_YOUR_ACTUAL_KEY"
STRIPE_WEBHOOK_SECRET="whsec_YOUR_WEBHOOK_SECRET"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_ACTUAL_KEY"

# Stripe Product Price IDs (copy from Stripe Dashboard after creating products)
STRIPE_STARTER_PRICE_ID="price_xxxxxxxxxxxxx"
STRIPE_GROWTH_PRICE_ID="price_xxxxxxxxxxxxx"
STRIPE_PROFESSIONAL_PRICE_ID="price_xxxxxxxxxxxxx"
STRIPE_BUSINESS_PRICE_ID="price_xxxxxxxxxxxxx"
STRIPE_ENTERPRISE_PRICE_ID="price_xxxxxxxxxxxxx"
```

---

## Step 7: Set Up Webhooks

Webhooks notify your app when payments succeed, fail, or subscriptions change.

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Enter your endpoint URL:
   - Local testing: Use [Stripe CLI](#local-testing-with-stripe-cli)
   - Production: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.trial_will_end`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_...`)
7. Add it to your `.env.local` as `STRIPE_WEBHOOK_SECRET`

---

## Step 8: Local Testing with Stripe CLI

For testing webhooks locally:

1. **Install Stripe CLI**:
   ```powershell
   # Windows (using scoop)
   scoop install stripe

   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to localhost**:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. This will give you a webhook signing secret for local testing

5. **Trigger test events**:
   ```bash
   stripe trigger payment_intent.succeeded
   stripe trigger customer.subscription.created
   ```

---

## Step 9: Configure Stripe Customer Portal

Let customers manage their own billing:

1. Go to **Settings** → **Billing** → **Customer portal**
2. Enable features:
   - ✅ Update payment methods
   - ✅ View invoices
   - ✅ Cancel subscriptions
   - ✅ Switch plans (upgrades/downgrades)
3. Save settings

---

## API Endpoints Created

Your app now has these Stripe endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stripe/checkout` | POST | Create checkout session for new subscriptions |
| `/api/stripe/portal` | POST | Open Stripe billing portal for existing customers |
| `/api/stripe/webhook` | POST | Handle Stripe events (payments, subscription changes) |

---

## How It Works

### New Customer Signup Flow:
1. Customer selects a plan during registration
2. App creates Stripe customer and subscription with 14-day trial
3. Customer enters payment method in Stripe Checkout
4. Stripe charges card after trial ends
5. Webhooks update your database on payment events

### Existing Customer Billing:
1. Customer clicks "Manage Billing" in settings
2. App redirects to Stripe Customer Portal
3. Customer can update card, cancel, or change plan
4. Webhooks notify your app of changes

---

## Going Live Checklist

Before accepting real payments:

- [ ] Complete Stripe business verification
- [ ] Connect and verify bank account
- [ ] Switch from test keys (`pk_test_`) to live keys (`pk_live_`)
- [ ] Create products in Live mode (they're separate from Test mode)
- [ ] Set up production webhook endpoint
- [ ] Test with real card (use a $1 test charge, then refund)
- [ ] Enable HTTPS on your domain
- [ ] Set up error monitoring for failed webhooks

---

## Fees

Stripe charges:
- **2.9% + $0.30** per successful card transaction
- **0.8%** for ACH Direct Debit (capped at $5)
- No monthly fees
- No setup fees

---

## Support

- Stripe Documentation: [stripe.com/docs](https://stripe.com/docs)
- Stripe Support: [support.stripe.com](https://support.stripe.com)
- Test Mode Dashboard: [dashboard.stripe.com/test](https://dashboard.stripe.com/test)

---

## Quick Reference

```
Stripe Dashboard: https://dashboard.stripe.com
API Keys: Developers → API Keys
Products: Products → Add product
Webhooks: Developers → Webhooks
Payouts: Settings → Payouts
Customer Portal: Settings → Billing → Customer portal
```
