'use client';

import { useState } from 'react';
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '@/lib/subscription';

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
          <p className="mt-2 text-gray-600">
            Best for: {getPlanDescription(plan)}
          </p>
        </div>

        <ul className="mt-6 space-y-3">
          <li className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Up to {planDetails.maxUsers === -1 ? 'unlimited' : planDetails.maxUsers} users
          </li>
          <li className="flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Up to {planDetails.maxShops === -1 ? 'unlimited' : planDetails.maxShops} shops
          </li>

          {/* Core Features */}
          <li className={`flex items-center ${planDetails.features.workOrders ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
            <svg className={`h-5 w-5 mr-3 ${planDetails.features.workOrders ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Work Order Management
          </li>

          <li className={`flex items-center ${planDetails.features.timeTracking ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
            <svg className={`h-5 w-5 mr-3 ${planDetails.features.timeTracking ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Time Tracking
          </li>

          {/* Advanced Features */}
          <li className={`flex items-center ${planDetails.features.inventory ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
            <svg className={`h-5 w-5 mr-3 ${planDetails.features.inventory ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Inventory Management
          </li>

          <li className={`flex items-center ${planDetails.features.payroll ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
            <svg className={`h-5 w-5 mr-3 ${planDetails.features.payroll ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Payroll Automation
          </li>

          <li className={`flex items-center ${planDetails.features.budgetTracking ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
            <svg className={`h-5 w-5 mr-3 ${planDetails.features.budgetTracking ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Budget Tracking
          </li>

          <li className={`flex items-center ${planDetails.features.advancedReporting ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
            <svg className={`h-5 w-5 mr-3 ${planDetails.features.advancedReporting ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Advanced Reporting
          </li>

          <li className={`flex items-center ${planDetails.features.messaging ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
            <svg className={`h-5 w-5 mr-3 ${planDetails.features.messaging ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Team Messaging
          </li>

          <li className={`flex items-center ${(planDetails.features as any).multiShopManagement ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
            <svg className={`h-5 w-5 mr-3 ${(planDetails.features as any).multiShopManagement ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Multi-Shop Management
          </li>

          <li className={`flex items-center ${(planDetails.features as any).apiAccess ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
            <svg className={`h-5 w-5 mr-3 ${(planDetails.features as any).apiAccess ? 'text-green-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            API Access
          </li>
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

function getPlanDescription(plan: SubscriptionPlan): string {
  switch (plan) {
    case 'starter':
      return 'Solo operators & very small shops';
    case 'growth':
      return 'Small shops with 2–5 technicians';
    case 'professional':
      return 'Established shops running payroll & inventory';
    case 'business':
      return 'High-volume shops & multi-location operators';
    case 'enterprise':
      return 'Franchises, fleets, and enterprise networks';
    default:
      return '';
  }
}

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    // Handle plan selection - redirect to signup or checkout
    console.log('Selected plan:', plan);
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
            Start with our core features and scale as your business grows
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
          <PricingCard plan="starter" onSelect={handlePlanSelect} />
          <PricingCard plan="growth" onSelect={handlePlanSelect} />
          <PricingCard plan="professional" isPopular={true} onSelect={handlePlanSelect} />
          <PricingCard plan="business" onSelect={handlePlanSelect} />
          <PricingCard plan="enterprise" onSelect={handlePlanSelect} />
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
                Yes! We offer a 14-day free trial of our Professional plan so you can test all features before committing.
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
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}