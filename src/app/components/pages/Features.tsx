import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { ReccurLogo } from '@/app/components/ReccurLogo';
import {
  CreditCardIcon,
  UsersIcon,
  NairaIcon,
  CalendarIcon,
  CheckCircleIcon,
  FileTextIcon,
  WebhookIcon,
  KeyIcon,
  BellIcon,
  ShieldIcon,
  BarChartIcon,
  SettingsIcon,
} from '@/app/components/icons/FinanceIcons';

export function Features() {
  const features = [
    {
      icon: CreditCardIcon,
      title: 'Direct Debit Mandates',
      description:
        'Seamlessly set up and manage direct debit mandates with Nigerian banks. Track mandate status through 10 distinct workflow states.',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: UsersIcon,
      title: 'Customer Management',
      description:
        'Manage your customer base efficiently. View customer subscriptions, payment history, and mandate details all in one place.',
      color: 'bg-green-100 text-green-600',
    },
    {
      icon: CalendarIcon,
      title: 'Flexible Subscription Plans',
      description:
        'Create custom subscription plans with flexible billing cycles - daily, weekly, monthly, quarterly, or annual recurring payments.',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: NairaIcon,
      title: 'Automated Payments',
      description:
        'Automatically collect recurring payments from customers via bank account direct debits. Reduce failed payments and manual follow-ups.',
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      icon: BarChartIcon,
      title: 'Advanced Analytics',
      description:
        'Track revenue growth, subscriber metrics, payment success rates, and more with comprehensive dashboards and visual charts.',
      color: 'bg-orange-100 text-orange-600',
    },
    {
      icon: FileTextIcon,
      title: 'Settlement Management',
      description:
        'Track all settlements to your bank account with detailed transaction history and automated reconciliation.',
      color: 'bg-cyan-100 text-cyan-600',
    },
    {
      icon: WebhookIcon,
      title: 'Webhooks & Integrations',
      description:
        'Receive real-time notifications for all events. Integrate with your existing systems using our comprehensive webhook system.',
      color: 'bg-indigo-100 text-indigo-600',
    },
    {
      icon: KeyIcon,
      title: 'API Access',
      description:
        'Full API access to manage subscriptions, customers, and payments programmatically. Complete developer documentation included.',
      color: 'bg-rose-100 text-rose-600',
    },
    {
      icon: BellIcon,
      title: 'Smart Notifications',
      description:
        'Keep customers informed with automated email and SMS notifications for payments, renewals, and mandate updates.',
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      icon: ShieldIcon,
      title: 'Bank-Level Security',
      description:
        'Enterprise-grade security with encryption, secure API keys, and compliance with banking standards.',
      color: 'bg-red-100 text-red-600',
    },
    {
      icon: SettingsIcon,
      title: 'Team Collaboration',
      description:
        'Invite team members with role-based access control. Collaborate securely with different permission levels.',
      color: 'bg-teal-100 text-teal-600',
    },
    {
      icon: CheckCircleIcon,
      title: 'Discount Coupons',
      description:
        'Create promotional campaigns with percentage or fixed-amount discount coupons. Track coupon usage and redemptions.',
      color: 'bg-lime-100 text-lime-600',
    },
  ];

  const benefits = [
    {
      title: 'Reduce Churn',
      description: 'Automated recurring payments reduce failed transactions and customer churn.',
    },
    {
      title: 'Save Time',
      description: 'Eliminate manual payment collection and reconciliation processes.',
    },
    {
      title: 'Increase Revenue',
      description: 'Predictable recurring revenue with automated payment collection.',
    },
    {
      title: 'Better Insights',
      description: 'Comprehensive analytics help you make data-driven business decisions.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <ReccurLogo size="md" showText={true} />
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost">Back to Home</Button>
              </Link>
              <Link to="/business/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to Manage Subscriptions
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Powerful features designed specifically for the Nigerian market to help you automate recurring payments and grow your business.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className={`h-12 w-12 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits Section */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-12 mb-20 text-white">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Why Choose Reccur?</h2>
            <p className="text-xl text-blue-100">
              Built specifically for Nigerian businesses
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <h3 className="text-2xl font-bold mb-2">{benefit.title}</h3>
                <p className="text-blue-100">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="border-0 shadow-xl bg-white max-w-3xl mx-auto">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Join hundreds of Nigerian businesses automating their recurring payments.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/business/signup">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  >
                    Start Free Trial
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button size="lg" variant="outline">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
