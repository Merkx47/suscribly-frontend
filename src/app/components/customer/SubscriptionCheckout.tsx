import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Separator } from '@/app/components/ui/separator';
import { Badge } from '@/app/components/ui/badge';
import { SuscriblyLogo } from '@/app/components/SuscriblyLogo';
import {
  CreditCardIcon,
  CheckIcon,
  PlusIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  ClockIcon,
  CalendarIcon,
  RefreshIcon,
} from '@/app/components/icons/FinanceIcons';
import { toast } from 'sonner';
import { AddBankAccountModal } from './AddBankAccountModal';
import type { BankAccountDisplay } from './AddBankAccountModal';
import { billingApi, subscriptionsApi } from '@/lib/api';
import type { BankResponse } from '@/lib/api/billing';

export function SubscriptionCheckout() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan;

  const [step, setStep] = useState<'select-account' | 'confirm' | 'success'>('select-account');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Real data state
  const [bankAccounts, setBankAccounts] = useState<BankAccountDisplay[]>([]);
  const [banksMap, setBanksMap] = useState<Record<string, BankResponse>>({});
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Load existing mandates and banks on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingAccounts(true);
      setLoadError('');
      try {
        const [mandatesRes, banksRes] = await Promise.all([
          billingApi.listMandates(0, 100),
          billingApi.getBanks(0, 200),
        ]);

        // Build banks map for name resolution
        const bMap: Record<string, BankResponse> = {};
        banksRes.content.forEach((bank) => {
          bMap[bank.bankId] = bank;
        });
        setBanksMap(bMap);

        // Deduplicate mandates by account number + bank to show unique bank accounts
        const seen = new Set<string>();
        const accounts: BankAccountDisplay[] = [];
        for (const mandate of mandatesRes.content) {
          const key = `${mandate.mandateAccountNumber}-${mandate.mandateBankId}`;
          if (seen.has(key)) continue;
          seen.add(key);

          const bank = mandate.mandateBankId ? bMap[mandate.mandateBankId] : null;
          accounts.push({
            mandateId: mandate.mandateId,
            bankId: mandate.mandateBankId,
            bankName: bank?.bankName || 'Unknown Bank',
            accountNumber: mandate.mandateAccountNumber || '',
            accountName: mandate.mandateAccountName || mandate.mandatePayerName || '',
            isVerified: mandate.mandateWorkflowStatus === 'APPROVED' || mandate.mandateStatus === 'ACTIVE',
          });
        }
        setBankAccounts(accounts);
      } catch (err: any) {
        setLoadError(err?.response?.data?.message || 'Failed to load payment accounts');
      } finally {
        setIsLoadingAccounts(false);
      }
    };
    loadData();
  }, []);

  // If no plan data, show error
  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-gray-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">No subscription plan selected.</p>
            <Button onClick={() => navigate(-1)} className="bg-purple-600 hover:bg-purple-700 text-white">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleContinue = () => {
    if (!selectedAccountId) {
      toast.error('Please select a bank account');
      return;
    }
    setStep('confirm');
  };

  const handleConfirmSubscription = async () => {
    if (!plan.customerId || !plan.planId) {
      toast.error('Missing subscription details. Please go back and try again.');
      return;
    }

    setIsSubscribing(true);
    try {
      const selectedAcc = bankAccounts.find((acc) => acc.mandateId === selectedAccountId);

      // Create subscription with proper status
      const trialDays = plan.planTrialDays || 0;
      const now = new Date();
      const subscriptionData: any = {
        subscriptionCustomerId: plan.customerId,
        subscriptionPlanId: plan.planId,
        subscriptionStartDate: now.toISOString(),
        subscriptionStatus: trialDays > 0 ? 'TRIALING' : 'ACTIVE',
      };
      if (trialDays > 0) {
        subscriptionData.subscriptionTrialStart = now.toISOString();
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + trialDays);
        subscriptionData.subscriptionTrialEnd = trialEnd.toISOString();
      }

      const subscription = await subscriptionsApi.create(subscriptionData);

      // Create mandate linking bank account to subscription
      if (selectedAcc) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        await billingApi.createMandate({
          mandateSubscriptionId: subscription.subscriptionId,
          mandateAccountNumber: selectedAcc.accountNumber,
          mandateAccountName: selectedAcc.accountName,
          mandateBankId: selectedAcc.bankId || '',
          mandatePayerName: selectedAcc.accountName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          mandatePayerEmail: user.email || '',
          mandateAmount: plan.planAmount || '0',
          mandateFrequency: (plan.planBillingInterval || 'MONTHLY').toUpperCase(),
        });
      }

      toast.success(trialDays > 0 ? 'Free trial started!' : 'Subscription activated!');
      setStep('success');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create subscription. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleAddBankSuccess = (newAccount: BankAccountDisplay) => {
    setBankAccounts((prev) => [...prev, newAccount]);
    setSelectedAccountId(newAccount.mandateId);
  };

  const selectedAccount = bankAccounts.find((acc) => acc.mandateId === selectedAccountId);

  // Check if the plan has a trial period
  const hasTrial = plan?.planTrialDays && plan.planTrialDays > 0;

  // Calculate trial end date
  const getTrialEndDate = () => {
    if (!hasTrial) return null;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.planTrialDays);
    return endDate;
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const trialEndDate = getTrialEndDate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <SuscriblyLogo size="sm" showText={true} />
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className={`flex items-center gap-1 ${step === 'select-account' ? 'text-purple-600 font-medium' : ''}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'select-account' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>1</span>
                Select Account
              </span>
              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
              <span className={`flex items-center gap-1 ${step === 'confirm' ? 'text-purple-600 font-medium' : ''}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'confirm' ? 'bg-purple-600 text-white' : step === 'success' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>2</span>
                Confirm
              </span>
              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
              <span className={`flex items-center gap-1 ${step === 'success' ? 'text-green-600 font-medium' : ''}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'success' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>3</span>
                Complete
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'select-account' && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Select Payment Account</CardTitle>
                  <p className="text-sm text-gray-600">
                    Choose the bank account that will be debited for recurring payments
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoadingAccounts ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl animate-pulse">
                          <div className="h-12 w-12 rounded-xl bg-gray-200" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-24 bg-gray-200 rounded" />
                            <div className="h-3 w-40 bg-gray-100 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : loadError ? (
                    <div className="text-center py-6">
                      <AlertCircleIcon className="h-8 w-8 text-red-400 mx-auto mb-2" />
                      <p className="text-sm text-red-600 mb-3">{loadError}</p>
                      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        <RefreshIcon className="h-4 w-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  ) : (
                    <>
                      {bankAccounts.length > 0 && (
                        <RadioGroup value={selectedAccountId} onValueChange={setSelectedAccountId}>
                          <div className="space-y-3">
                            {bankAccounts.map((account) => (
                              <div key={account.mandateId} className="relative">
                                <RadioGroupItem
                                  value={account.mandateId}
                                  id={account.mandateId}
                                  className="peer sr-only"
                                />
                                <Label
                                  htmlFor={account.mandateId}
                                  className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors hover:border-purple-300 ${
                                    selectedAccountId === account.mandateId
                                      ? 'border-purple-600 bg-purple-50'
                                      : 'border-gray-200 bg-white'
                                  }`}
                                >
                                  <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                                    <CreditCardIcon className="h-6 w-6 text-purple-600" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-gray-900">{account.bankName}</span>
                                      {account.isVerified && (
                                        <Badge className="bg-green-100 text-green-700 text-xs">
                                          Verified
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {account.accountNumber} &bull; {account.accountName}
                                    </div>
                                  </div>
                                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${
                                    selectedAccountId === account.mandateId
                                      ? 'border-purple-600 bg-purple-600'
                                      : 'border-gray-300'
                                  }`}>
                                    {selectedAccountId === account.mandateId && (
                                      <CheckIcon className="h-4 w-4 text-white" />
                                    )}
                                  </div>
                                </Label>
                              </div>
                            ))}
                          </div>
                        </RadioGroup>
                      )}

                      {bankAccounts.length === 0 && (
                        <div className="text-center py-6">
                          <CreditCardIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-1">No saved bank accounts</p>
                          <p className="text-xs text-gray-500">Add a bank account to continue</p>
                        </div>
                      )}
                    </>
                  )}

                  <Button
                    variant="outline"
                    className="w-full border-dashed border-2 h-14 text-purple-600 hover:bg-purple-50"
                    onClick={() => setShowAddBankModal(true)}
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add New Bank Account
                  </Button>

                  {hasTrial ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex gap-3">
                        <ClockIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-green-900">
                          <p className="font-medium mb-1">Start your {plan.planTrialDays}-day free trial today</p>
                          <p className="text-green-800">
                            You won't be charged until {formatDate(trialEndDate)}. Your first payment of ₦{Number(plan.planAmount).toLocaleString()} will be charged on {formatDate(trialEndDate)}.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <div className="flex gap-3">
                        <AlertCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-900">
                          <p className="font-medium mb-1">Direct Debit Authorization</p>
                          <p className="text-blue-800">
                            By subscribing, you authorize {plan.businessName} to debit ₦{Number(plan.planAmount).toLocaleString()}{' '}
                            from your selected account every {(plan.planBillingInterval || 'month').toLowerCase()}. You can cancel anytime.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => navigate(-1)}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={handleContinue}
                      disabled={!selectedAccountId}
                    >
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 'confirm' && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Confirm Subscription</CardTitle>
                  <p className="text-sm text-gray-600">
                    Review your details and {hasTrial ? 'start your free trial' : 'activate your subscription'}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {hasTrial && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex gap-3">
                        <ClockIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-green-900">
                          <p className="font-medium mb-1">{plan.planTrialDays}-Day Free Trial</p>
                          <p className="text-green-800">
                            Your {plan.planTrialDays}-day free trial starts today. You won't be charged until {formatDate(trialEndDate)}.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Payment Account</h4>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                        <CreditCardIcon className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{selectedAccount?.bankName}</div>
                        <div className="text-sm text-gray-600">
                          {selectedAccount?.accountNumber} &bull; {selectedAccount?.accountName}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Subscription Details</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Plan</span>
                        <span className="font-medium text-gray-900">{plan.planName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Business</span>
                        <span className="font-medium text-gray-900">{plan.businessName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Amount</span>
                        <span className="font-medium text-gray-900">
                          ₦{Number(plan.planAmount).toLocaleString()}/{(plan.planBillingInterval || 'month').toLowerCase()}
                        </span>
                      </div>
                      {plan.planSetupFee && Number(plan.planSetupFee) > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Setup Fee</span>
                          <span className="font-medium text-gray-900">₦{Number(plan.planSetupFee).toLocaleString()}</span>
                        </div>
                      )}
                      {hasTrial && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">First Charge Date</span>
                          <span className="font-medium text-gray-900">{formatDate(trialEndDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-1">Direct Debit Authorization</p>
                      <p className="text-blue-800">
                        By confirming, you authorize recurring debits of ₦{Number(plan.planAmount).toLocaleString()} from your{' '}
                        {selectedAccount?.bankName} account ({selectedAccount?.accountNumber}) every{' '}
                        {(plan.planBillingInterval || 'month').toLowerCase()}.{' '}
                        {hasTrial ? `Your first charge will be on ${formatDate(trialEndDate)}.` : ''}{' '}
                        You can cancel anytime from your dashboard.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => setStep('select-account')}
                      disabled={isSubscribing}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={handleConfirmSubscription}
                      disabled={isSubscribing}
                    >
                      {isSubscribing
                        ? 'Processing...'
                        : hasTrial
                          ? `Start ${plan.planTrialDays}-Day Free Trial`
                          : 'Confirm Subscription'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 'success' && (
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-12 pb-12 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckIcon className="h-10 w-10 text-green-600" />
                  </div>
                  {hasTrial ? (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Trial Started!</h2>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Your {plan.planTrialDays}-day free trial for {plan.planName} has begun. Your subscription will begin billing on {formatDate(trialEndDate)}.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Activated!</h2>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        You have successfully subscribed to {plan.planName}.
                      </p>
                    </>
                  )}
                  <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto mb-8">
                    <div className="space-y-3 text-left">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Plan</span>
                        <span className="font-medium text-gray-900">{plan.planName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount</span>
                        <span className="font-medium text-gray-900">
                          ₦{Number(plan.planAmount).toLocaleString()}/{(plan.planBillingInterval || 'month').toLowerCase()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Account</span>
                        <span className="font-medium text-gray-900">{selectedAccount?.bankName}</span>
                      </div>
                      {hasTrial && (
                        <>
                          <Separator />
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Trial Ends</span>
                            <div className="text-right">
                              <span className="font-medium text-gray-900">{formatDate(trialEndDate)}</span>
                              <Badge className="ml-2 bg-green-100 text-green-700 text-xs">{plan.planTrialDays} days</Badge>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">First Charge</span>
                            <span className="font-medium text-gray-900">₦{Number(plan.planAmount).toLocaleString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  {hasTrial && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto mb-6">
                      <div className="flex items-center gap-2 justify-center text-green-800 text-sm">
                        <CalendarIcon className="h-4 w-4" />
                        <span>Reminder: You'll be charged on {formatDate(trialEndDate)}</span>
                      </div>
                    </div>
                  )}
                  <Button
                    className="bg-purple-600 hover:bg-purple-700 text-white h-12 px-8"
                    onClick={() => navigate(-1)}
                  >
                    Go to Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg sticky top-24">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{plan.planName}</h3>
                    <p className="text-sm text-gray-600">{plan.businessName}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {plan.planBillingInterval && (
                      <Badge className="bg-purple-100 text-purple-700">
                        {plan.planBillingInterval}
                      </Badge>
                    )}
                    {hasTrial && (
                      <Badge className="bg-green-500 text-white text-xs">
                        {plan.planTrialDays}-day free trial
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {plan.features?.length > 0 && (
                  <>
                    <div className="space-y-2">
                      {plan.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckIcon className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Separator />
                  </>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">₦{Number(plan.planAmount).toLocaleString()}</span>
                  </div>
                  {plan.planSetupFee && Number(plan.planSetupFee) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Setup Fee</span>
                      <span className="text-gray-900">₦{Number(plan.planSetupFee).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Billing</span>
                    <span className="text-gray-900">{plan.planBillingInterval || 'Monthly'}</span>
                  </div>
                  {hasTrial && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">First Charge Date</span>
                      <span className="text-gray-900">{trialEndDate?.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">{hasTrial ? 'Due Today' : 'Total'}</span>
                  <div className="text-right">
                    {hasTrial ? (
                      <>
                        <div className="text-2xl font-bold text-green-600">₦0</div>
                        <div className="text-xs text-gray-500">
                          ₦{Number(plan.planAmount).toLocaleString()} after trial
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-gray-900">
                          ₦{Number(plan.planAmount).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">per {(plan.planBillingInterval || 'month').toLowerCase()}</div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-800">
                    {hasTrial
                      ? `${plan.planTrialDays}-day free trial. Cancel anytime before ${trialEndDate?.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })} to avoid charges.`
                      : 'Cancel anytime. No hidden fees.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AddBankAccountModal
        open={showAddBankModal}
        onOpenChange={setShowAddBankModal}
        onSuccess={handleAddBankSuccess}
        banksMap={banksMap}
      />
    </div>
  );
}
