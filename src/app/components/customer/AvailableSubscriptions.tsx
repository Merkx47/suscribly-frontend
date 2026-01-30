import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { StoreIcon, CheckIcon, ArrowRightIcon, PackageIcon, ClockIcon } from '@/app/components/icons/FinanceIcons';

interface Business {
  id: string;
  name: string;
  description: string;
  category: string;
  logo?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  billingCycle: 'One-time' | 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';
  features: string[];
  tenantId: string;
  tenantName: string;
  trialPeriod?: number; // Number of days for free trial (0 or undefined means no trial)
}

export function AvailableSubscriptions() {
  const navigate = useNavigate();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  // Mock data - businesses the customer is registered with
  const availableBusinesses: Business[] = [
    {
      id: 'TNT001',
      name: 'DSTV Nigeria',
      description: 'Premium satellite television service with diverse entertainment channels',
      category: 'Entertainment',
    },
    {
      id: 'TNT002',
      name: 'BodyFit Wellness',
      description: 'Complete fitness and wellness center with modern facilities',
      category: 'Fitness',
    },
    {
      id: 'TNT003',
      name: 'uLesson',
      description: 'Digital learning platform for primary and secondary education',
      category: 'Education',
    },
  ];

  // Plans mapped by business ID
  const businessPlans: Record<string, SubscriptionPlan[]> = {
    'TNT001': [
      {
        id: 'PLAN001',
        name: 'DStv Compact',
        description: 'Quality entertainment for the whole family',
        amount: 10500,
        billingCycle: 'Monthly',
        features: ['120+ channels', 'Local & International shows', 'News & documentaries', 'Kids channels', 'Cancel anytime'],
        tenantId: 'TNT001',
        tenantName: 'DSTV Nigeria',
        trialPeriod: 7, // 7-day free trial
      },
      {
        id: 'PLAN002',
        name: 'DStv Compact Plus',
        description: 'More entertainment with sports channels',
        amount: 16600,
        billingCycle: 'Monthly',
        features: ['160+ channels', 'All Compact channels', 'SuperSport Select channels', 'More movie channels', 'ESPN channels', 'Cancel anytime'],
        tenantId: 'TNT001',
        tenantName: 'DSTV Nigeria',
        trialPeriod: 7, // 7-day free trial
      },
      {
        id: 'PLAN003',
        name: 'DStv Premium',
        description: 'Full bouquet with all channels and sports',
        amount: 24500,
        billingCycle: 'Monthly',
        features: ['220+ channels', 'All SuperSport channels', 'All movie channels', 'Premium international content', 'ShowMax included', 'Cancel anytime'],
        tenantId: 'TNT001',
        tenantName: 'DSTV Nigeria',
        trialPeriod: 14, // 14-day free trial
      },
    ],
    'TNT002': [
      {
        id: 'PLAN004',
        name: 'Basic Membership',
        description: 'Access to gym equipment and facilities',
        amount: 10000,
        billingCycle: 'Monthly',
        features: ['24/7 gym access', 'Cardio equipment', 'Weight training area', 'Locker facilities'],
        tenantId: 'TNT002',
        tenantName: 'BodyFit Wellness',
        trialPeriod: 0, // No trial - immediate charge
      },
      {
        id: 'PLAN005',
        name: 'Premium Membership',
        description: 'Complete wellness experience with classes and training',
        amount: 15000,
        billingCycle: 'Monthly',
        features: ['Everything in Basic', 'Group fitness classes', 'Personal training sessions', 'Sauna & steam room', 'Nutrition consultation', 'Priority booking'],
        tenantId: 'TNT002',
        tenantName: 'BodyFit Wellness',
        trialPeriod: 3, // 3-day free trial
      },
    ],
    'TNT003': [
      {
        id: 'PLAN006',
        name: 'Single Subject',
        description: 'Access to one subject of your choice',
        amount: 3000,
        billingCycle: 'Monthly',
        features: ['1 subject access', 'Video lessons', 'Practice questions', 'Progress tracking'],
        tenantId: 'TNT003',
        tenantName: 'uLesson',
        trialPeriod: 0, // No trial
      },
      {
        id: 'PLAN007',
        name: 'All Subjects',
        description: 'Complete access to all subjects',
        amount: 7000,
        billingCycle: 'Monthly',
        features: ['All subjects access', 'Unlimited video lessons', 'Practice & past questions', 'Performance analytics', 'Download for offline', 'Priority support'],
        tenantId: 'TNT003',
        tenantName: 'uLesson',
        trialPeriod: 7, // 7-day free trial
      },
      {
        id: 'PLAN008',
        name: 'Quarterly Package',
        description: 'Save more with 3-month access to all subjects',
        amount: 18000,
        billingCycle: 'Quarterly',
        features: ['All subjects for 3 months', 'Unlimited video lessons', 'Live classes', 'Personalized study plans', 'Exam preparation', 'Certificate on completion', 'Save ₦3,000'],
        tenantId: 'TNT003',
        tenantName: 'uLesson',
        trialPeriod: 14, // 14-day free trial
      },
    ],
  };

  const handleSubscribeClick = (plan: SubscriptionPlan) => {
    navigate('/customer/checkout', { state: { plan } });
  };

  const handleBackToBusinesses = () => {
    setSelectedBusiness(null);
  };

  // Show business list
  if (!selectedBusiness) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Available Services</h2>
          <p className="text-sm text-gray-600">Businesses you're registered with</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableBusinesses.map((business) => (
            <Card 
              key={business.id} 
              className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => setSelectedBusiness(business)}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <StoreIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs">
                    {business.category}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{business.name}</CardTitle>
                <CardDescription className="text-sm min-h-[40px]">
                  {business.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {businessPlans[business.id]?.length || 0} plan{businessPlans[business.id]?.length !== 1 ? 's' : ''} available
                  </span>
                  <ArrowRightIcon className="h-4 w-4 text-purple-600 group-hover:text-purple-800 transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show plans for selected business
  const plans = businessPlans[selectedBusiness.id] || [];

  return (
    <div className="space-y-6">
      <div>
        <Button 
          variant="ghost" 
          onClick={handleBackToBusinesses}
          className="mb-4 -ml-2"
        >
          <ArrowRightIcon className="h-4 w-4 mr-2 rotate-180" />
          Back to Services
        </Button>
        
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
            <StoreIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{selectedBusiness.name}</h2>
            <p className="text-sm text-gray-600">{selectedBusiness.description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="border-0 shadow-md hover:shadow-lg transition-shadow flex flex-col relative">
            {plan.trialPeriod && plan.trialPeriod > 0 && (
              <div className="absolute -top-2 -right-2 z-10">
                <Badge className="bg-green-500 text-white shadow-md px-2 py-1 text-xs font-semibold">
                  <ClockIcon className="h-3 w-3 mr-1 inline" />
                  {plan.trialPeriod}-day free trial
                </Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <PackageIcon className="h-5 w-5 text-purple-600" />
                </div>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  {plan.billingCycle}
                </Badge>
              </div>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <CardDescription className="text-sm">
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900">
                  ₦{plan.amount.toLocaleString()}
                  <span className="text-sm font-normal text-gray-600">/{plan.billingCycle.toLowerCase()}</span>
                </div>
              </div>

              <div className="space-y-2 mb-6 flex-1">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <CheckIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => handleSubscribeClick(plan)}
              >
                Subscribe Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

    </div>
  );
}
