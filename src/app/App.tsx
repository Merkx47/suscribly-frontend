import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { BuildingIcon, StoreIcon, UserIcon, ArrowRightIcon } from '@/app/components/icons/FinanceIcons';
import { ReccurLogo } from '@/app/components/ReccurLogo';
import { Toaster } from '@/app/components/ui/sonner';

// Lazy load the portal components
import { lazy, Suspense } from 'react';

const PlatformAdminDashboard = lazy(() => import('@/app/components/portals/PlatformAdminDashboard').then(m => ({ default: m.PlatformAdminDashboard })));
const TenantDashboard = lazy(() => import('@/app/components/portals/TenantDashboard').then(m => ({ default: m.TenantDashboard })));
const CustomerPortal = lazy(() => import('@/app/components/portals/CustomerPortal').then(m => ({ default: m.CustomerPortal })));

// Authentication components
const AdminLogin = lazy(() => import('@/app/components/auth/AdminAuth').then(m => ({ default: m.AdminLogin })));
const TenantLogin = lazy(() => import('@/app/components/auth/TenantAuth').then(m => ({ default: m.TenantLogin })));
const TenantSignup = lazy(() => import('@/app/components/auth/TenantAuth').then(m => ({ default: m.TenantSignup })));
const CustomerLogin = lazy(() => import('@/app/components/auth/CustomerAuth').then(m => ({ default: m.CustomerLogin })));
const CustomerSignup = lazy(() => import('@/app/components/auth/CustomerAuth').then(m => ({ default: m.CustomerSignup })));
const CustomerPasswordSetup = lazy(() => import('@/app/components/auth/CustomerAuth').then(m => ({ default: m.CustomerPasswordSetup })));
const CustomerForgotPassword = lazy(() => import('@/app/components/auth/CustomerAuth').then(m => ({ default: m.CustomerForgotPassword })));
const CustomerForgotEmail = lazy(() => import('@/app/components/auth/CustomerAuth').then(m => ({ default: m.CustomerForgotEmail })));
const SubscriptionCheckout = lazy(() => import('@/app/components/customer/SubscriptionCheckout').then(m => ({ default: m.SubscriptionCheckout })));

// Page components
const Pricing = lazy(() => import('@/app/components/pages/Pricing').then(m => ({ default: m.Pricing })));
const Features = lazy(() => import('@/app/components/pages/Features').then(m => ({ default: m.Features })));
const ApiDocumentation = lazy(() => import('@/app/components/pages/ApiDocumentation').then(m => ({ default: m.ApiDocumentation })));
const AboutUs = lazy(() => import('@/app/components/pages/AboutUs').then(m => ({ default: m.AboutUs })));
const Contact = lazy(() => import('@/app/components/pages/Contact').then(m => ({ default: m.Contact })));
const Careers = lazy(() => import('@/app/components/pages/Careers').then(m => ({ default: m.Careers })));
const PrivacyPolicy = lazy(() => import('@/app/components/pages/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = lazy(() => import('@/app/components/pages/TermsOfService').then(m => ({ default: m.TermsOfService })));
const Compliance = lazy(() => import('@/app/components/pages/Compliance').then(m => ({ default: m.Compliance })));

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function PortalSelector() {
  const portals = [
    {
      path: '/admin/login',
      icon: BuildingIcon,
      title: 'Platform Admin',
      description: 'Manage all tenants and platform operations',
      color: 'bg-blue-600',
    },
    {
      path: '/business/login',
      icon: StoreIcon,
      title: 'Business Dashboard',
      description: 'Manage subscriptions, customers, and payments',
      color: 'bg-green-600',
    },
    {
      path: '/customer/login',
      icon: UserIcon,
      title: 'Customer Portal',
      description: 'View and manage your subscriptions',
      color: 'bg-purple-600',
    },
  ];

  const faqs = [
    {
      question: 'What is Reccur?',
      answer: 'Reccur is a B2B2C subscription management and recurring payment platform designed specifically for Nigerian businesses. It enables automated payment collection via bank account direct debits through NIBSS.'
    },
    {
      question: 'How does direct debit work?',
      answer: 'Customers authorize your business to collect payments directly from their bank accounts. Once a mandate is approved, payments are automatically deducted on the scheduled dates, reducing failed payments and improving cash flow.'
    },
    {
      question: 'What billing cycles are supported?',
      answer: 'Reccur supports one-time payments, daily, weekly, monthly, quarterly, yearly, and multi-year subscription billing cycles. You have full flexibility to create custom plans for your business.'
    },
    {
      question: 'Is my data secure?',
      answer: 'Yes, Reccur uses bank-grade security with encrypted data transmission and storage. All direct debit mandates are processed through NIBBS, ensuring compliance with Nigerian banking regulations.'
    },
    {
      question: 'How do I get started as a business?',
      answer: 'Click on the Business Dashboard portal above to sign up. Once registered, you can create subscription plans, add customers, and start collecting recurring payments immediately.'
    },
    {
      question: 'What fees does Reccur charge?',
      answer: 'Pricing is transparent and competitive. Contact our sales team for detailed pricing information tailored to your business volume and needs.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="flex items-center justify-center p-4 py-16">
        <div className="max-w-5xl w-full">
          <div className="text-center mb-12">
            <div className="mb-6 flex justify-center">
              <ReccurLogo size="xl" showText={true} />
            </div>
            <div className="mb-4">
              <p className="text-xl text-gray-600">
                B2B2C Subscription Management Platform
              </p>
            </div>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Automated recurring payments via bank account direct debits for Nigerian businesses
            </p>
            <div className="mt-8 flex gap-4 justify-center">
              <Link to="/business/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                  Start Free Trial
                </Button>
              </Link>
              <Link to="/customer/login">
                <Button variant="outline" className="px-8 py-6 text-lg border-gray-300">
                  Customer Login
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {portals.map((portal) => {
              const Icon = portal.icon;
              return (
                <Link key={portal.path} to={portal.path} className="block">
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group flex flex-col">
                    <CardHeader className="flex-1">
                      <div className={`w-14 h-14 ${portal.color} rounded-lg flex items-center justify-center mb-4`}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <CardTitle className="text-xl">{portal.title}</CardTitle>
                      <CardDescription className="text-sm h-10">
                        {portal.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700 transition-colors">
                        Access Portal
                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Key Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Why Choose Reccur?</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Everything you need to manage recurring payments and grow your subscription business
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Direct Debit Mandates</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Secure NIBSS-powered direct debit authorization with workflow tracking
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Flexible Billing</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Support for one-time, daily, weekly, monthly, quarterly, yearly, and multi-year subscriptions
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Complete Platform</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Two distinct portals for businesses and customers with role-based access
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Real-time Analytics</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Track revenue, subscriber growth, payment success rates, and more with comprehensive dashboards
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">API & Webhooks</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Powerful REST API and webhook notifications for seamless integration with your existing systems
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Team Management</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Role-based access control with team member management and activity tracking
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">How It Works</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Get started in minutes and start collecting recurring payments
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Sign Up</h3>
              <p className="text-sm text-gray-600">Create your business account in minutes</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Create Plans</h3>
              <p className="text-sm text-gray-600">Set up your subscription plans and pricing</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                3
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Add Customers</h3>
              <p className="text-sm text-gray-600">Invite customers and collect mandate authorization</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                4
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Get Paid</h3>
              <p className="text-sm text-gray-600">Receive automatic payments on schedule</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">Frequently Asked Questions</h2>
          <p className="text-gray-600 text-center mb-12">
            Everything you need to know about Reccur
          </p>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-green-600 text-white border-0">
            <CardHeader>
              <CardTitle className="text-3xl text-white">Ready to Get Started?</CardTitle>
              <CardDescription className="text-blue-50 text-lg">
                Join hundreds of Nigerian businesses using Reccur to manage recurring payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 justify-center">
                <Link to="/business/signup">
                  <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg">
                    Start Free Trial
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="outline" className="border-2 border-white text-white bg-white/20 hover:bg-white hover:text-blue-600 px-8 py-6 text-lg">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="mb-4">
                <ReccurLogo size="sm" showText={true} />
              </div>
              <p className="text-sm">
                Professional subscription management platform for Nigerian businesses
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link to="/features" className="hover:text-white">Features</Link></li>
                <li><Link to="/api-docs" className="hover:text-white">API Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/careers" className="hover:text-white">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link to="/compliance" className="hover:text-white">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 Reccur. All rights reserved. Professional, trustworthy, modern fintech platform for Nigerian businesses.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<PortalSelector />} />
          
          {/* Platform Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<PlatformAdminDashboard />} />

          {/* Business/Tenant Routes */}
          <Route path="/business/login" element={<TenantLogin />} />
          <Route path="/business/signup" element={<TenantSignup />} />
          <Route path="/business/dashboard" element={<TenantDashboard />} />

          {/* Customer Routes */}
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/customer/signup" element={<CustomerSignup />} />
          <Route path="/customer/setup-password" element={<CustomerPasswordSetup />} />
          <Route path="/customer/forgot-password" element={<CustomerForgotPassword />} />
          <Route path="/customer/forgot-email" element={<CustomerForgotEmail />} />
          <Route path="/customer/checkout" element={<SubscriptionCheckout />} />
          <Route path="/customer/dashboard" element={<CustomerPortal />} />
          
          {/* Product Pages */}
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/features" element={<Features />} />
          <Route path="/api-docs" element={<ApiDocumentation />} />
          
          {/* Company Pages */}
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/careers" element={<Careers />} />
          
          {/* Legal Pages */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/compliance" element={<Compliance />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
