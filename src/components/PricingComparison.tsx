import React from 'react';
import { Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/button';
import {
  PROPERTY_OWNER_PLANS,
  PROPERTY_DEVELOPER_PLANS,
  type UserType,
} from '../types/pricing';

interface PricingComparisonProps {
  userType: UserType;
}

export const PricingComparison: React.FC<PricingComparisonProps> = ({
  userType,
}) => {
  const plans =
    userType === 'property-owner'
      ? PROPERTY_OWNER_PLANS
      : PROPERTY_DEVELOPER_PLANS;

  // Extract all unique features
  const allFeatures = Array.from(
    new Set(plans.flatMap((plan) => plan.features.map((f) => f.text)))
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left p-4 font-semibold text-gray-900">
              Features
            </th>
            {plans.map((plan) => (
              <th
                key={plan.id}
                className="text-center p-4 font-semibold text-gray-900"
              >
                <div className="flex flex-col items-center">
                  <span>{plan.name}</span>
                  <span className="text-sm font-normal text-gray-600 mt-1">
                    ₦{(plan.price / 1000).toFixed(1)}k/mo
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allFeatures.map((featureText, index) => (
            <tr
              key={index}
              className={`border-b border-gray-100 ${
                index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
              }`}
            >
              <td className="p-4 text-sm text-gray-700">{featureText}</td>
              {plans.map((plan) => {
                const feature = plan.features.find((f) => f.text === featureText);
                return (
                  <td key={plan.id} className="p-4 text-center">
                    {feature?.included ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PricingComparison;

