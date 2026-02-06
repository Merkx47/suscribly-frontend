import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { SuscriblyLogo } from '@/app/components/SuscriblyLogo';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { KeyIcon, CodeIcon, BookOpenIcon } from '@/app/components/icons/FinanceIcons';

export function ApiDocumentation() {
  const endpoints = [
    {
      method: 'POST',
      path: '/api/v1/subscriptions',
      title: 'Create Subscription',
      description: 'Create a new subscription for a customer',
    },
    {
      method: 'GET',
      path: '/api/v1/subscriptions/:id',
      title: 'Get Subscription',
      description: 'Retrieve details of a specific subscription',
    },
    {
      method: 'PUT',
      path: '/api/v1/subscriptions/:id',
      title: 'Update Subscription',
      description: 'Update an existing subscription',
    },
    {
      method: 'DELETE',
      path: '/api/v1/subscriptions/:id/cancel',
      title: 'Cancel Subscription',
      description: 'Cancel an active subscription',
    },
    {
      method: 'POST',
      path: '/api/v1/mandates',
      title: 'Create Mandate',
      description: 'Initiate a new direct debit mandate',
    },
    {
      method: 'GET',
      path: '/api/v1/customers',
      title: 'List Customers',
      description: 'Retrieve a list of all customers',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <SuscriblyLogo size="md" showText={true} />
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost">Back to Home</Button>
              </Link>
              <Link to="/business/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                  Get API Keys
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">API Documentation</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Integrate Suscribly's recurring payment platform into your applications with our comprehensive REST API.
          </p>
        </div>

        {/* Quick Start */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <KeyIcon className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle className="text-gray-900">1. Get API Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Sign up for a Suscribly account and retrieve your API keys from the dashboard settings.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center mb-4">
                <CodeIcon className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-gray-900">2. Make API Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Use your secret key to authenticate requests to our RESTful API endpoints.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                <BookOpenIcon className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-gray-900">3. Handle Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Configure webhook endpoints to receive real-time notifications for events.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* API Reference */}
        <Card className="border-0 shadow-lg mb-16">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              All API requests must include your secret key in the Authorization header:
            </p>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <code className="text-green-400 text-sm font-mono">
                Authorization: Bearer sk_live_your_secret_key_here
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Tabs defaultValue="subscriptions" className="mb-16">
          <TabsList className="mb-8">
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="mandates">Mandates</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="subscriptions">
            <div className="space-y-6">
              {endpoints.slice(0, 4).map((endpoint, index) => (
                <Card key={index} className="border-0 shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-md text-sm font-semibold ${
                          endpoint.method === 'GET'
                            ? 'bg-blue-100 text-blue-700'
                            : endpoint.method === 'POST'
                            ? 'bg-green-100 text-green-700'
                            : endpoint.method === 'PUT'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {endpoint.method}
                      </span>
                      <code className="text-sm font-mono text-gray-700">{endpoint.path}</code>
                    </div>
                    <CardTitle className="text-gray-900">{endpoint.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{endpoint.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mandates">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 rounded-md text-sm font-semibold bg-green-100 text-green-700">
                    POST
                  </span>
                  <code className="text-sm font-mono text-gray-700">/api/v1/mandates</code>
                </div>
                <CardTitle className="text-gray-900">Create Direct Debit Mandate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Initiate a new direct debit mandate for recurring payments.
                </p>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-green-400 text-sm font-mono">
{`{
  "customer_id": "cus_123456789",
  "bank_code": "058",
  "account_number": "0123456789",
  "amount": 50000,
  "frequency": "monthly"
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-3 py-1 rounded-md text-sm font-semibold bg-blue-100 text-blue-700">
                    GET
                  </span>
                  <code className="text-sm font-mono text-gray-700">/api/v1/customers</code>
                </div>
                <CardTitle className="text-gray-900">List All Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Retrieve a paginated list of all your customers with their subscription details.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhooks">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-gray-900">Webhook Events</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Configure webhook endpoints to receive notifications for the following events:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <code className="text-sm font-mono">subscription.created</code>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <code className="text-sm font-mono">subscription.updated</code>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                    <code className="text-sm font-mono">payment.succeeded</code>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                    <code className="text-sm font-mono">payment.failed</code>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                    <code className="text-sm font-mono">mandate.approved</code>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <div className="text-center">
          <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-green-600 text-white max-w-3xl mx-auto">
            <CardContent className="py-12">
              <h2 className="text-3xl font-bold mb-4">Start Building Today</h2>
              <p className="text-xl text-blue-100 mb-8">
                Get your API keys and start integrating in minutes.
              </p>
              <Link to="/business/signup">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  Get Started Free
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
