'use client';

import { useState } from 'react';
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '@/lib/subscription';
import {
  PLAN_AUDIENCE,
  PLAN_MARKETING_HIGHLIGHTS,
  PLAN_ORDER,
  PLAN_SUMMARY,
  getPlanCapacityLine,
} from '@/lib/subscription-copy';

interface PricingCardProps {
  plan: SubscriptionPlan;
  isPopular?: boolean;
  onSelect: (plan: SubscriptionPlan) => void;
}

function PricingCard({ plan, isPopular, onSelect }: PricingCardProps) {
  const planDetails = SUBSCRIPTION_PLANS[plan];

  return (
    <div className={`relative bg-white border rounded-lg shadow-sm ${isPopular ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'}`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white text-sm font-medium px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="p-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900">{planDetails.name}</h3>
          <p className="mt-4 text-4xl font-bold text-gray-900">
            ${planDetails.price}
            <span className="text-lg font-normal text-gray-600">/month</span>
          </p>
          <p className="mt-2 text-gray-600">{PLAN_AUDIENCE[plan]}</p>
          <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-gray-500">{getPlanCapacityLine(plan)}</p>
          <p className="mt-3 text-sm text-gray-500">{PLAN_SUMMARY[plan]}</p>
        </div>

        <ul className="mt-6 space-y-3">
          {PLAN_MARKETING_HIGHLIGHTS[plan].map((item) => (
            <li key={item} className="flex items-center text-gray-900">
              <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <button
            onClick={() => onSelect(plan)}
            className={`w-full py-3 px-4 rounded-md font-medium ${
              isPopular
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            } transition-colors`}
          >
            Choose {planDetails.name}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handlePlanSelect = (_plan: SubscriptionPlan) => {
    // Handle plan selection - redirect to signup or checkout
    // You would typically redirect to a checkout page or signup flow
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Choose the perfect plan for your shop
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Pick the plan that matches how you actually operate today, then scale into deeper workflow and multi-shop control.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mt-8 flex justify-center">
          <div className="bg-white p-1 rounded-lg border">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md font-medium ${
                billingCycle === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 rounded-md font-medium ${
                billingCycle === 'yearly'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="ml-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {PLAN_ORDER.map((plan) => (
            <PricingCard key={plan} plan={plan} isPopular={plan === 'professional'} onSelect={handlePlanSelect} />
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the billing.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens if I exceed my user limit?
              </h3>
              <p className="text-gray-600">
                We'll notify you when you're approaching your limit and prompt you to upgrade. You won't be able to add new users until you upgrade.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Yes. Paid plans include a free trial so you can validate your workflow before billing starts. The exact trial terms are shown in checkout.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee. If you're not satisfied, contact our support team for a full refund.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Ready to streamline your shop operations?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of diesel and gas shops already using FixTray
          </p>
          <button className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors">
            Start Free Trial
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Choose a plan, review the trial terms in checkout, and cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}
