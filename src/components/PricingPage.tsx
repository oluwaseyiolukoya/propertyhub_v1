import React, { useState, useEffect } from 'react';
import { Check, X, HelpCircle, Sparkles, Building2, Hammer } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import {
  ADD_ONS,
  formatCurrency,
  type UserType,
  type PricingPlan,
  type AddOn,
} from '../types/pricing';

interface PricingPageProps {
  onSelectPlan?: (planId: string, userType: UserType) => void;
  onContactSales?: () => void;
}

export const PricingPage: React.FC<PricingPageProps> = ({
  onSelectPlan,
  onContactSales,
}) => {
  const [selectedUserType, setSelectedUserType] = useState<UserType>('property-owner');
  const [propertyOwnerPlans, setPropertyOwnerPlans] = useState<PricingPlan[]>([]);
  const [propertyDeveloperPlans, setPropertyDeveloperPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPlans() {
      try {
        setLoading(true);
        console.log('🔄 [PricingPage] Fetching plans from API...');

        // Fetch from public endpoint (no auth required)
        // Use relative URL to leverage Vite proxy
        // Add cache-busting timestamp to prevent browser caching
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/public/plans?_t=${timestamp}`, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const result = await response.json();

        console.log('📦 [PricingPage] API Response:', {
          success: result.success,
          totalPlans: result.data?.length || 0
        });

        if (result.success && result.data) {
          const plans = result.data;

          // Convert database plans to PricingPlan format
          const ownerPlans: PricingPlan[] = plans
            .filter((p: any) => p.category === 'property_management' && p.isActive)
            .sort((a: any, b: any) => a.monthlyPrice - b.monthlyPrice)
            .map((p: any) => convertDbPlanToPricingPlan(p, 'property-owner'));

          const devPlans: PricingPlan[] = plans
            .filter((p: any) => p.category === 'development' && p.isActive)
            .sort((a: any, b: any) => a.monthlyPrice - b.monthlyPrice)
            .map((p: any) => convertDbPlanToPricingPlan(p, 'property-developer'));

          console.log('✅ [PricingPage] Converted plans:', {
            propertyManagement: ownerPlans.map(p => ({ name: p.name, price: p.price })),
            development: devPlans.map(p => ({ name: p.name, price: p.price }))
          });

          setPropertyOwnerPlans(ownerPlans);
          setPropertyDeveloperPlans(devPlans);
        }
      } catch (error) {
        console.error('❌ [PricingPage] Error loading plans:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPlans();
  }, []);

  // Convert database plan to PricingPlan format
  const convertDbPlanToPricingPlan = (dbPlan: any, userType: UserType): PricingPlan => {
    console.log(`🔄 [PricingPage] Converting plan: ${dbPlan.name} (₦${dbPlan.monthlyPrice})`);

    const features = Array.isArray(dbPlan.features)
      ? dbPlan.features.map((text: string) => ({ text, included: true }))
      : [];

    const storageGB = dbPlan.storageLimit >= 999999
      ? 'Unlimited'
      : `${Math.floor(dbPlan.storageLimit / 1024)}GB`;

    const converted = {
      id: dbPlan.id,
      name: dbPlan.name,
      description: dbPlan.description || '',
      price: dbPlan.monthlyPrice,
      currency: dbPlan.currency || 'NGN',
      billingPeriod: 'month' as const,
      userType,
      popular: dbPlan.isPopular || false,
      limits: {
        properties: dbPlan.propertyLimit || 0,
        units: dbPlan.propertyLimit ? dbPlan.propertyLimit * 20 : 0,
        projects: dbPlan.projectLimit || 0,
        users: dbPlan.userLimit >= 999 ? -1 : dbPlan.userLimit,
        storage: storageGB,
      },
      features,
      cta: {
        text: dbPlan.monthlyPrice > 50000 ? 'Contact Sales' : 'Start Free Trial',
        action: dbPlan.monthlyPrice > 50000 ? 'contact' : 'signup',
      },
    };

    console.log(`✅ [PricingPage] Converted: ${converted.name} → ₦${converted.price}`);
    return converted;
  };

  const handlePlanSelect = (plan: PricingPlan) => {
    if (plan.cta.action === 'contact' && onContactSales) {
      onContactSales();
    } else if (onSelectPlan) {
      onSelectPlan(plan.id, plan.userType);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your needs. All plans include a 14-day free trial.
          </p>
        </div>

        {/* User Type Tabs */}
        <Tabs
          value={selectedUserType}
          onValueChange={(value) => setSelectedUserType(value as UserType)}
          className="w-full"
        >
          <div className="flex justify-center mb-12">
            <TabsList className="grid w-full max-w-md grid-cols-2 h-14">
              <TabsTrigger
                value="property-owner"
                className="flex items-center gap-2 text-base"
              >
                <Building2 className="w-5 h-5" />
                <span className="hidden sm:inline">Property</span> Owners
              </TabsTrigger>
              <TabsTrigger
                value="property-developer"
                className="flex items-center gap-2 text-base"
              >
                <Hammer className="w-5 h-5" />
                <span className="hidden sm:inline">Property</span> Developers
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Property Owner Plans */}
          <TabsContent value="property-owner" className="mt-0">
            <div className="mb-8 text-center">
              <p className="text-lg text-gray-600">
                For landlords, property managers, and facility management companies
              </p>
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : propertyOwnerPlans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No plans available at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {propertyOwnerPlans.map((plan) => (
                  <PricingCard
                    key={plan.id}
                    plan={plan}
                    onSelect={() => handlePlanSelect(plan)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Property Developer Plans */}
          <TabsContent value="property-developer" className="mt-0">
            <div className="mb-8 text-center">
              <p className="text-lg text-gray-600">
                For construction management, project tracking & budgeting
              </p>
            </div>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            ) : propertyDeveloperPlans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No plans available at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {propertyDeveloperPlans.map((plan) => (
                  <PricingCard
                    key={plan.id}
                    plan={plan}
                    onSelect={() => handlePlanSelect(plan)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Add-ons Section */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Add-Ons & Extras
            </h2>
            <p className="text-lg text-gray-600">
              Customize your plan with additional features
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ADD_ONS.filter((addon) =>
              addon.userTypes.includes(selectedUserType)
            ).map((addon) => (
              <AddOnCard key={addon.id} addon={addon} />
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            <FAQItem
              question="Can I switch plans later?"
              answer="Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the difference."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards, debit cards, and bank transfers. For annual plans, we also offer invoice payment options."
            />
            <FAQItem
              question="Is there a free trial?"
              answer="Yes! All plans come with a 14-day free trial. No credit card required to start."
            />
            <FAQItem
              question="What happens when I exceed my plan limits?"
              answer="We'll notify you when you're approaching your limits. You can either upgrade your plan or purchase add-ons to increase your capacity."
            />
            <FAQItem
              question="Do you offer discounts for annual billing?"
              answer="Yes! Save 20% when you pay annually. Contact our sales team for enterprise pricing and custom solutions."
            />
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Still have questions?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Our team is here to help you find the perfect plan
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-orange-600 hover:bg-gray-100"
              onClick={onContactSales}
            >
              Contact Sales
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              Schedule a Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Pricing Card Component
const PricingCard: React.FC<{
  plan: PricingPlan;
  onSelect: () => void;
}> = ({ plan, onSelect }) => {
  return (
    <Card
      className={`relative flex flex-col ${
        plan.popular
          ? 'border-orange-500 border-2 shadow-xl scale-105'
          : 'border-gray-200'
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1">
            <Sparkles className="w-3 h-3 mr-1 inline" />
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="pb-8">
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription className="text-base mt-2">
          {plan.description}
        </CardDescription>
        <div className="mt-6">
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-gray-900">
              {formatCurrency(plan.price)}
            </span>
            <span className="text-gray-600 ml-2">/{plan.billingPeriod}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              {feature.included ? (
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
              )}
              <span
                className={`text-sm ${
                  feature.included ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {feature.text}
              </span>
              {feature.tooltip && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{feature.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        <Button
          className={`w-full ${
            plan.popular
              ? 'bg-orange-500 hover:bg-orange-600'
              : 'bg-gray-900 hover:bg-gray-800'
          }`}
          size="lg"
          onClick={onSelect}
        >
          {plan.cta.text}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Add-on Card Component
const AddOnCard: React.FC<{ addon: AddOn }> = ({ addon }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">{addon.name}</CardTitle>
        <CardDescription>{addon.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(addon.price)}
          </span>
          <span className="text-sm text-gray-600">{addon.unit}</span>
        </div>
      </CardContent>
    </Card>
  );
};

// FAQ Item Component
const FAQItem: React.FC<{ question: string; answer: string }> = ({
  question,
  answer,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          {question}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">{answer}</p>
      </CardContent>
    </Card>
  );
};

export default PricingPage;

