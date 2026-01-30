import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Separator } from '@/app/components/ui/separator';
import { Badge } from '@/app/components/ui/badge';
import { ReccurLogo } from '@/app/components/ReccurLogo';
import {
  CreditCardIcon,
  CheckIcon,
  PlusIcon,
  BuildingIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  ClockIcon,
  CalendarIcon,
} from '@/app/components/icons/FinanceIcons';
import { toast } from 'sonner';
import { AddBankAccountModal } from './AddBankAccountModal';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
}

export function SubscriptionCheckout() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan;

  const [step, setStep] = useState<'select-account' | 'verify-payment' | 'success'>('select-account');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: 'BA001',
      bankName: 'GTBank',
      accountNumber: '0123456789',
      accountName: 'Adebayo Johnson',
      isVerified: true,
    },
    {
      id: 'BA002',
      bankName: 'Access Bank',
      accountNumber: '0987654321',
      accountName: 'Adebayo Johnson',
      isVerified: true,
    },
  ]);

  const verificationAccountDetails = {
    bankName: 'Sterling Bank',
    accountNumber: '0123456789',
    accountName: 'Reccur Technologies Ltd',
  };

  // If no plan data, redirect back
  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-gray-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600 mb-4">No subscription plan selected.</p>
            <Button onClick={() => navigate('/customer/dashboard')} className="bg-purple-600 hover:bg-purple-700 text-white">
              Go to Dashboard
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
    setStep('verify-payment');
  };

  const handleConfirmSubscription = () => {
    setVerificationPending(true);
    setTimeout(() => {
      setVerificationPending(false);
      setStep('success');
    }, 2000);
  };

  const handleAddBankSuccess = (newAccount: BankAccount) => {
    setBankAccounts([...bankAccounts, newAccount]);
    setSelectedAccountId(newAccount.id);
  };

  const selectedAccount = bankAccounts.find(acc => acc.id === selectedAccountId);

  // Check if the plan has a trial period
  const hasTrial = plan?.trialPeriod && plan.trialPeriod > 0;

  // Calculate trial end date
  const getTrialEndDate = () => {
    if (!hasTrial) return null;
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.trialPeriod);
    return endDate;
  };

  // Format date for display
  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const trialEndDate = getTrialEndDate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/customer/dashboard')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ReccurLogo size="sm" showText={true} />
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className={`flex items-center gap-1 ${step === 'select-account' ? 'text-purple-600 font-medium' : ''}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'select-account' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>1</span>
                Select Account
              </span>
              <ArrowRightIcon className="h-4 w-4 text-gray-400" />
              <span className={`flex items-center gap-1 ${step === 'verify-payment' ? 'text-purple-600 font-medium' : ''}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 'verify-payment' ? 'bg-purple-600 text-white' : step === 'success' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>2</span>
                Verify
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
                  <RadioGroup value={selectedAccountId} onValueChange={setSelectedAccountId}>
                    <div className="space-y-3">
                      {bankAccounts.map((account) => (
                        <div key={account.id} className="relative">
                          <RadioGroupItem
                            value={account.id}
                            id={account.id}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={account.id}
                            className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors hover:border-purple-300 ${
                              selectedAccountId === account.id
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
                              selectedAccountId === account.id
                                ? 'border-purple-600 bg-purple-600'
                                : 'border-gray-300'
                            }`}>
                              {selectedAccountId === account.id && (
                                <CheckIcon className="h-4 w-4 text-white" />
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

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
                          <p className="font-medium mb-1">Start your {plan.trialPeriod}-day free trial today</p>
                          <p className="text-green-800">
                            You won't be charged until {formatDate(trialEndDate)}. Your first payment of ₦{plan.amount.toLocaleString()} will be charged on {formatDate(trialEndDate)}.
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
                            By subscribing, you authorize {plan.tenantName} to debit ₦{plan.amount.toLocaleString()}{' '}
                            from your selected account every {plan.billingCycle.toLowerCase()}. You can cancel anytime.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => navigate('/customer/dashboard')}
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

            {step === 'verify-payment' && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Verify Your Account</CardTitle>
                  <p className="text-sm text-gray-600">
                    Complete a one-time verification to {hasTrial ? 'start your free trial' : 'activate your subscription'}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {hasTrial && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex gap-3">
                        <ClockIcon className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-green-900">
                          <p className="font-medium mb-1">{plan.trialPeriod}-Day Free Trial</p>
                          <p className="text-green-800">
                            Start your {plan.trialPeriod}-day free trial today. You won't be charged until {formatDate(trialEndDate)}.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex gap-3">
                      <AlertCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-900">
                        <p className="font-medium mb-1">Account Verification Required</p>
                        <p className="text-amber-800">
                          To link your bank account and {hasTrial ? 'start your free trial' : 'activate your subscription'}, please send exactly ₦50
                          from your selected account to the details below. This is a one-time verification.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Your Payment Account</h4>
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
                    <h4 className="font-medium text-gray-900 mb-3">Send ₦50 to This Account</h4>
                    <Card className="border-2 border-purple-200 bg-purple-50">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex items-start gap-4">
                          <BuildingIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-600 mb-1">Bank Name</div>
                            <div className="font-semibold text-gray-900">{verificationAccountDetails.bankName}</div>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-4">
                          <CreditCardIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-600 mb-1">Account Number</div>
                            <div className="font-semibold text-gray-900 text-xl">{verificationAccountDetails.accountNumber}</div>
                          </div>
                        </div>
                        <Separator />
                        <div className="flex items-start gap-4">
                          <CheckIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-xs text-gray-600 mb-1">Account Name</div>
                            <div className="font-semibold text-gray-900">{verificationAccountDetails.accountName}</div>
                          </div>
                        </div>
                        <div className="bg-purple-100 rounded-xl p-4 text-center">
                          <div className="text-xs text-purple-700 mb-1">Amount to Send</div>
                          <div className="text-3xl font-bold text-purple-900">₦50.00</div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-2">Next Steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-800">
                        <li>Transfer exactly ₦50 from your selected account to the account above</li>
                        <li>Click "I've Sent ₦50" below after completing the transfer</li>
                        {hasTrial ? (
                          <li>Once verified, your {plan.trialPeriod}-day free trial will begin immediately</li>
                        ) : (
                          <li>Once verified, your subscription will be activated immediately</li>
                        )}
                      </ol>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => setStep('select-account')}
                      disabled={verificationPending}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={handleConfirmSubscription}
                      disabled={verificationPending}
                    >
                      {verificationPending ? 'Verifying...' : "I've Sent ₦50"}
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
                        Your {plan.trialPeriod}-day free trial for {plan.name} has begun. Your subscription will begin billing on {formatDate(trialEndDate)}.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Activated!</h2>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        First payment processed. You have successfully subscribed to {plan.name}.
                      </p>
                    </>
                  )}
                  <div className="bg-gray-50 rounded-xl p-6 max-w-md mx-auto mb-8">
                    <div className="space-y-3 text-left">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Plan</span>
                        <span className="font-medium text-gray-900">{plan.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount</span>
                        <span className="font-medium text-gray-900">₦{plan.amount.toLocaleString()}/{plan.billingCycle.toLowerCase()}</span>
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
                              <Badge className="ml-2 bg-green-100 text-green-700 text-xs">{plan.trialPeriod} days</Badge>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">First Charge</span>
                            <span className="font-medium text-gray-900">₦{plan.amount.toLocaleString()}</span>
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
                    onClick={() => navigate('/customer/dashboard')}
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
                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-600">{plan.tenantName}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge className="bg-purple-100 text-purple-700">
                      {plan.billingCycle}
                    </Badge>
                    {hasTrial && (
                      <Badge className="bg-green-500 text-white text-xs">
                        {plan.trialPeriod}-day free trial
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  {plan.features?.map((feature: string, index: number) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckIcon className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">₦{plan.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Billing</span>
                    <span className="text-gray-900">{plan.billingCycle}</span>
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
                        <div className="text-2xl font-bold text-green-600">
                          ₦0
                        </div>
                        <div className="text-xs text-gray-500">
                          ₦{plan.amount.toLocaleString()} after trial
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-gray-900">
                          ₦{plan.amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">per {plan.billingCycle.toLowerCase()}</div>
                      </>
                    )}
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-green-800">
                    {hasTrial
                      ? `${plan.trialPeriod}-day free trial. Cancel anytime before ${trialEndDate?.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })} to avoid charges.`
                      : 'Cancel anytime. No hidden fees.'
                    }
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
      />
    </div>
  );
}
