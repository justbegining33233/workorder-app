'use client';

import { useState, useEffect } from 'react';
import { SUBSCRIPTION_PLANS, type SubscriptionPlan, type SubscriptionFeatures } from '@/lib/subscription';

interface UpgradePromptProps {
  shopId: string;
  trigger: 'user-limit' | 'feature-limit' | 'manual';
  feature?: string;
  currentPlan?: SubscriptionPlan;
  onUpgrade?: (plan: SubscriptionPlan) => void;
  onDismiss?: () => void;
}

export default function UpgradePrompt({
  shopId,
  trigger,
  feature,
  currentPlan,
  onUpgrade,
  onDismiss
}: UpgradePromptProps) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    loadSuggestions();
  }, [shopId, trigger]);

  const loadSuggestions = async () => {
    try {
      let suggestionData: any[] = [];

      if (trigger === 'user-limit' || trigger === 'manual') {
        const res = await fetch(`/api/subscriptions/${shopId}/suggestions`);
        if (res.ok) suggestionData = await res.json();
      } else if (trigger === 'feature-limit' && feature) {
        // Generate suggestion based on feature
        suggestionData = [{
          reason: `${feature} is not available on your current plan`,
          recommendedPlan: getRecommendedPlanForFeature(feature, currentPlan),
        }];
      }

      setSuggestions(suggestionData);
    } catch (error) {
      console.error('Error loading upgrade suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendedPlanForFeature = (feature: string, currentPlan?: SubscriptionPlan): SubscriptionPlan => {
    const plans: SubscriptionPlan[] = ['starter', 'growth', 'professional', 'business', 'enterprise'];

    // Find the lowest plan that includes this feature
    for (const plan of plans) {
      if ((SUBSCRIPTION_PLANS[plan].features as any)[feature]) {
        return plan;
      }
    }

    return 'professional'; // fallback
  };

  const handleUpgrade = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    onUpgrade?.(plan);
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-blue-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-lg font-medium text-blue-900">
            Upgrade to Unlock More Features
          </h3>

          {suggestions.map((suggestion, index) => (
            <div key={index} className="mt-2">
              <p className="text-sm text-blue-700 mb-4">
                {suggestion.reason}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['growth', 'professional', 'business'] as SubscriptionPlan[]).map((plan) => {
                  const planDetails = SUBSCRIPTION_PLANS[plan];
                  const isRecommended = suggestion.recommendedPlan === plan;

                  return (
                    <div
                      key={plan}
                      className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                        isRecommended
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                      onClick={() => handleUpgrade(plan)}
                    >
                      {isRecommended && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            Recommended
                          </span>
                        </div>
                      )}

                      <div className="text-center">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {planDetails.name}
                        </h4>
                        <p className="text-2xl font-bold text-blue-600 mt-1">
                          ${planDetails.price}/mo
                        </p>
                        <ul className="text-sm text-gray-600 mt-3 space-y-1">
                          <li>Up to {planDetails.maxUsers === -1 ? 'unlimited' : planDetails.maxUsers} users</li>
                          <li>Up to {planDetails.maxShops === -1 ? 'unlimited' : planDetails.maxShops} shops</li>
                          {planDetails.features.inventory && <li>✓ Inventory Management</li>}
                          {planDetails.features.payroll && <li>✓ Payroll Automation</li>}
                          {planDetails.features.advancedReporting && <li>✓ Advanced Reporting</li>}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mt-6 flex justify-end space-x-3">
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Maybe Later
              </button>
            )}
            <button
              onClick={() => selectedPlan && handleUpgrade(selectedPlan)}
              disabled={!selectedPlan}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {selectedPlan ? `Upgrade to ${SUBSCRIPTION_PLANS[selectedPlan].name}` : 'Select a Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for showing upgrade prompts
export function useUpgradePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptProps, setPromptProps] = useState<Partial<UpgradePromptProps>>({});

  const showUpgradePrompt = (props: UpgradePromptProps) => {
    setPromptProps(props);
    setShowPrompt(true);
  };

  const hideUpgradePrompt = () => {
    setShowPrompt(false);
    setPromptProps({});
  };

  const UpgradePromptModal = () => {
    if (!showPrompt) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 transition-opacity" aria-hidden="true">
            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>

          <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <UpgradePrompt {...(promptProps as UpgradePromptProps)} onDismiss={hideUpgradePrompt} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return {
    showUpgradePrompt,
    hideUpgradePrompt,
    UpgradePromptModal,
  };
}