import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  CheckCircleIcon,
  UserPlusIcon,
  CreditCardIcon,
  NairaIcon,
  PackageIcon,
} from '@/app/components/icons/FinanceIcons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  action: string;
}

interface OnboardingGuideProps {
  type: 'business' | 'customer';
  open: boolean;
  onClose: () => void;
}

export function OnboardingGuide({ type, open, onClose }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const businessSteps: OnboardingStep[] = [
    {
      id: 'business-setup',
      title: 'Complete Business Profile',
      description: 'Add your business details, bank account, and KYC documents',
      icon: UserPlusIcon,
      completed: true,
      action: 'Go to Settings',
    },
    {
      id: 'create-plan',
      title: 'Create Your First Plan',
      description: 'Set up subscription plans with flexible billing cycles',
      icon: PackageIcon,
      completed: false,
      action: 'Create Plan',
    },
    {
      id: 'add-customer',
      title: 'Invite First Customer',
      description: 'Add customers manually or share a subscription link',
      icon: UserPlusIcon,
      completed: false,
      action: 'Add Customer',
    },
    {
      id: 'first-charge',
      title: 'Process First Charge',
      description: 'Customer subscribes → Mandate authorization → Recurring charges',
      icon: NairaIcon,
      completed: false,
      action: 'View Dashboard',
    },
  ];

  const customerSteps: OnboardingStep[] = [
    {
      id: 'subscribe',
      title: 'Subscribe to a Plan',
      description: 'Choose a subscription plan from your favorite service',
      icon: PackageIcon,
      completed: true,
      action: 'Browse Plans',
    },
    {
      id: 'authorize-mandate',
      title: 'Authorize Direct Debit',
      description: 'Set up mandate for automatic payments from your bank account',
      icon: CreditCardIcon,
      completed: false,
      action: 'Set Up Payment',
    },
    {
      id: 'manage',
      title: 'Manage Subscriptions',
      description: 'View payment history, update details, or cancel anytime',
      icon: CheckCircleIcon,
      completed: false,
      action: 'View Subscriptions',
    },
  ];

  const steps = type === 'business' ? businessSteps : customerSteps;
  const completedCount = steps.filter((s) => s.completed).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              {type === 'business' ? 'Get Started with Suscribly' : 'Welcome to Your Subscriptions'}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </div>
          <DialogDescription>
            {type === 'business'
              ? 'Follow these steps to start collecting recurring payments'
              : 'Here\'s how to manage your subscriptions'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Setup Progress</span>
              <span className="font-medium">
                {completedCount} of {steps.length} completed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card
                  key={step.id}
                  className={`cursor-pointer transition-all ${
                    currentStep === index ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setCurrentStep(index)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {step.completed ? (
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{step.title}</h3>
                          {step.completed && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                        {!step.completed && (
                          <Button size="sm" variant="outline">
                            {step.action}
                            <svg className="h-4 w-4 ml-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {type === 'business' && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-base">Need Help Getting Started?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="text-gray-700">
                  Our support team is here to help you set up your subscription business.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="bg-white">
                    View Documentation
                  </Button>
                  <Button size="sm" variant="outline" className="bg-white">
                    Contact Support
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function OnboardingBanner({ type, onStart }: { type: 'business' | 'customer'; onStart: () => void }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <Card className="mb-6 bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {type === 'business' ? 'Complete Your Setup' : 'Get the Most from Your Subscriptions'}
              </h3>
              <p className="text-sm text-gray-600">
                {type === 'business'
                  ? 'Follow our quick setup guide to start accepting recurring payments'
                  : 'Learn how to manage your subscriptions and payment methods'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={onStart}>
              Start Guide
              <svg className="h-4 w-4 ml-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
