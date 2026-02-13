import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { StoreIcon, CheckIcon, ArrowRightIcon, PackageIcon, ClockIcon, RefreshIcon, AlertCircleIcon } from '@/app/components/icons/FinanceIcons';
import { customersApi } from '@/lib/api';
import type { CustomerBusinessInfo, CustomerPlanInfo } from '@/lib/api/customers';

export function AvailableSubscriptions() {
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<CustomerBusinessInfo[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<CustomerBusinessInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBusinesses = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await customersApi.getMyBusinesses();
      setBusinesses(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load available services');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBusinesses();
  }, []);

  const handleSubscribeClick = (plan: CustomerPlanInfo, business: CustomerBusinessInfo) => {
    navigate('/customer/checkout', {
      state: {
        plan: {
          planId: plan.planId,
          planName: plan.planName,
          planDescription: plan.planDescription,
          planAmount: plan.planAmount,
          planBillingInterval: plan.planBillingInterval,
          planTrialDays: plan.planTrialDays,
          planSetupFee: plan.planSetupFee,
          features: plan.features,
          businessId: business.businessId,
          businessName: business.businessName,
          customerId: business.customerId,
        },
      },
    });
  };

  // Plan card component
  const PlanCard = ({ plan, business }: { plan: CustomerPlanInfo; business: CustomerBusinessInfo }) => (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow flex flex-col relative">
      {plan.planTrialDays != null && plan.planTrialDays > 0 && (
        <div className="absolute -top-2 -right-2 z-10">
          <Badge className="bg-green-500 text-white shadow-md px-2 py-1 text-xs font-semibold">
            <ClockIcon className="h-3 w-3 mr-1 inline" />
            {plan.planTrialDays}-day free trial
          </Badge>
        </div>
      )}
      {plan.planIsPopular && (
        <div className="absolute -top-2 -left-2 z-10">
          <Badge className="bg-purple-600 text-white shadow-md px-2 py-1 text-xs font-semibold">
            Popular
          </Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <PackageIcon className="h-5 w-5 text-purple-600" />
          </div>
          {plan.planBillingInterval && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              {plan.planBillingInterval}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg">{plan.planName || 'Unnamed Plan'}</CardTitle>
        {plan.planDescription && (
          <CardDescription className="text-sm">{plan.planDescription}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="mb-4">
          <div className="text-3xl font-bold text-gray-900">
            ₦{Number(plan.planAmount || 0).toLocaleString()}
            <span className="text-sm font-normal text-gray-600">
              /{(plan.planBillingInterval || 'month').toLowerCase()}
            </span>
          </div>
          {plan.planSetupFee && Number(plan.planSetupFee) > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              + ₦{Number(plan.planSetupFee).toLocaleString()} setup fee
            </p>
          )}
        </div>

        {plan.features.length > 0 && (
          <div className="space-y-2 mb-6 flex-1">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <CheckIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        )}

        {plan.subscriptionStatus ? (
          <Button
            className="w-full"
            variant="outline"
            disabled
          >
            <CheckIcon className="h-4 w-4 mr-2" />
            {plan.subscriptionStatus === 'ACTIVE' ? 'Subscribed' :
             plan.subscriptionStatus === 'PENDING_ACTIVATION' ? 'Pending Activation' :
             plan.subscriptionStatus === 'TRIALING' ? 'In Trial' : 'Subscribed'}
          </Button>
        ) : (
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => handleSubscribeClick(plan, business)}
          >
            Subscribe Now
          </Button>
        )}
      </CardContent>
    </Card>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Available Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-md animate-pulse">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-gray-200 mb-3" />
                <div className="h-5 w-32 bg-gray-200 rounded" />
                <div className="h-4 w-48 bg-gray-100 rounded mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 w-24 bg-gray-100 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Available Services</h2>
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <div className="p-4 rounded-xl bg-red-100 text-red-600 w-fit mx-auto mb-4">
              <AlertCircleIcon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Failed to Load Services</h3>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={loadBusinesses}>
              <RefreshIcon className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (businesses.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Available Services</h2>
        <Card className="border-0 shadow-md">
          <CardContent className="py-12 text-center">
            <div className="p-4 rounded-xl bg-gray-100 text-gray-600 w-fit mx-auto mb-4">
              <StoreIcon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Services Available</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              You're not registered with any businesses yet. When a business adds you as a customer, their services will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Selected business - show products and plans
  if (selectedBusiness) {
    const allPlans = [
      ...selectedBusiness.products.flatMap((p) => p.plans),
      ...selectedBusiness.standalonePlans,
    ];
    const hasProducts = selectedBusiness.products.length > 0;
    const hasStandalonePlans = selectedBusiness.standalonePlans.length > 0;

    return (
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            onClick={() => setSelectedBusiness(null)}
            className="mb-4 -ml-2"
          >
            <ArrowRightIcon className="h-4 w-4 mr-2 rotate-180" />
            Back to Services
          </Button>

          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center overflow-hidden">
              {selectedBusiness.businessLogoUrl ? (
                <img
                  src={selectedBusiness.businessLogoUrl}
                  alt={selectedBusiness.businessName || ''}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <StoreIcon className="h-6 w-6 text-purple-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedBusiness.businessName || 'Business'}
              </h2>
              <p className="text-sm text-gray-600">
                {allPlans.length} plan{allPlans.length !== 1 ? 's' : ''} available
              </p>
            </div>
          </div>
        </div>

        {/* Products with their plans */}
        {hasProducts &&
          selectedBusiness.products.map((product) => (
            <div key={product.productId} className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{product.productName}</h3>
                {product.productDescription && (
                  <p className="text-sm text-gray-600">{product.productDescription}</p>
                )}
              </div>
              {product.plans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {product.plans.map((plan) => (
                    <PlanCard key={plan.planId} plan={plan} business={selectedBusiness} />
                  ))}
                </div>
              ) : (
                <Card className="border-0 shadow-sm">
                  <CardContent className="py-6 text-center">
                    <p className="text-sm text-muted-foreground">No plans available for this product yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ))}

        {/* Standalone plans */}
        {hasStandalonePlans && (
          <div className="space-y-4">
            {hasProducts && (
              <h3 className="text-lg font-semibold text-gray-900">Additional Plans</h3>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedBusiness.standalonePlans.map((plan) => (
                <PlanCard key={plan.planId} plan={plan} business={selectedBusiness} />
              ))}
            </div>
          </div>
        )}

        {/* No plans at all */}
        {allPlans.length === 0 && (
          <Card className="border-0 shadow-md">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">This business hasn't set up any subscription plans yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Business list view
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Available Services</h2>
        <p className="text-sm text-gray-600">Businesses you're registered with</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {businesses.map((business) => {
          const totalPlans =
            business.products.reduce((sum, p) => sum + p.plans.length, 0) +
            business.standalonePlans.length;

          return (
            <Card
              key={business.businessId}
              className="border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => setSelectedBusiness(business)}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-3">
                  <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors overflow-hidden">
                    {business.businessLogoUrl ? (
                      <img
                        src={business.businessLogoUrl}
                        alt={business.businessName || ''}
                        className="h-12 w-12 object-cover"
                      />
                    ) : (
                      <StoreIcon className="h-6 w-6 text-purple-600" />
                    )}
                  </div>
                </div>
                <CardTitle className="text-lg">{business.businessName || 'Business'}</CardTitle>
                <CardDescription className="text-sm min-h-[40px]">
                  {business.products.length > 0
                    ? `${business.products.length} product${business.products.length !== 1 ? 's' : ''}`
                    : 'View available plans'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {totalPlans} plan{totalPlans !== 1 ? 's' : ''} available
                  </span>
                  <ArrowRightIcon className="h-4 w-4 text-purple-600 group-hover:text-purple-800 transition-colors" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
