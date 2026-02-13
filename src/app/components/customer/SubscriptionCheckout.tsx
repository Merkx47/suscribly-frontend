import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Separator } from '@/app/components/ui/separator';
import { Badge } from '@/app/components/ui/badge';
import { SuscriblyLogo } from '@/app/components/SuscriblyLogo';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/app/components/ui/input-otp';
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
import { billingApi, subscriptionsApi, customersApi } from '@/lib/api';
import type { BankResponse } from '@/lib/api/billing';
import type { BusinessPaymentDetails } from '@/lib/api/customers';

type CheckoutStep = 'select-account' | 'verify-otp' | 'validation-charge' | 'confirm' | 'success';

export function SubscriptionCheckout() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan;

  const [step, setStep] = useState<CheckoutStep>('select-account');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  // Real data state
  const [bankAccounts, setBankAccounts] = useState<BankAccountDisplay[]>([]);
  const [banksMap, setBanksMap] = useState<Record<string, BankResponse>>({});
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [loadError, setLoadError] = useState('');

  // OTP state
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpPhoneLastFour, setOtpPhoneLastFour] = useState('');
  const [otpEmailMasked, setOtpEmailMasked] = useState('');
  const [otpChannel, setOtpChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [verificationToken, setVerificationToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Validation charge state
  const [businessPaymentDetails, setBusinessPaymentDetails] = useState<BusinessPaymentDetails | null>(null);
  const [isLoadingPaymentDetails, setIsLoadingPaymentDetails] = useState(false);
  const [validationAcknowledged, setValidationAcknowledged] = useState(false);

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

  const handleContinueToOtp = () => {
    if (!selectedAccountId) {
      toast.error('Please select a bank account');
      return;
    }
    setStep('verify-otp');
    handleSendOtp();
  };

  const handleSendOtp = async (channel?: 'whatsapp' | 'email') => {
    if (!plan.customerId) {
      toast.error('Missing customer details');
      return;
    }
    const sendChannel = channel || otpChannel;
    setIsSendingOtp(true);
    try {
      const result = await customersApi.sendMandateOtp(plan.customerId, sendChannel);
      setOtpPhoneLastFour(result.phoneLastFour || '');
      setOtpEmailMasked(result.emailMasked || '');
      setOtpChannel(result.channel as 'whatsapp' | 'email');
      setOtpSent(true);
      toast.success(result.channel === 'email'
        ? 'Verification code sent to your email'
        : 'Verification code sent to your WhatsApp');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send verification code');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit code');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const result = await customersApi.verifyMandateOtp(plan.customerId, otpCode);
      setVerificationToken(result.verificationToken);
      toast.success('Identity verified successfully');
      setStep('validation-charge');
      loadBusinessPaymentDetails();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid or expired code');
      setOtpCode('');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const loadBusinessPaymentDetails = async () => {
    if (!plan.businessId) return;
    setIsLoadingPaymentDetails(true);
    try {
      const details = await customersApi.getBusinessPaymentDetails(plan.businessId);
      setBusinessPaymentDetails(details);
    } catch (err: any) {
      toast.error('Failed to load payment details');
    } finally {
      setIsLoadingPaymentDetails(false);
    }
  };

  const handleConfirmSubscription = async () => {
    if (!plan.customerId || !plan.planId) {
      toast.error('Missing subscription details. Please go back and try again.');
      return;
    }

    setIsSubscribing(true);
    try {
      const selectedAcc = bankAccounts.find((acc) => acc.mandateId === selectedAccountId);

      // Create subscription — backend auto-determines status and trial dates from Plan
      const subscription = await subscriptionsApi.create({
        subscriptionCustomerId: plan.customerId,
        subscriptionPlanId: plan.planId,
      });

      // Create mandate linking bank account to subscription (with verification token)
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
          mandateVerificationToken: verificationToken || undefined,
        });
      }

      toast.success(hasTrial ? 'Free trial started!' : 'Subscription activated!');
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
  const hasTrial = (plan?.planTrialDays ?? 0) > 0;

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

  const stepIndex = ['select-account', 'verify-otp', 'validation-charge', 'confirm', 'success'].indexOf(step);

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
              {[
                { label: 'Account', step: 'select-account' },
                { label: 'Verify', step: 'verify-otp' },
                { label: 'Validate', step: 'validation-charge' },
                { label: 'Confirm', step: 'confirm' },
                { label: 'Complete', step: 'success' },
              ].map((s, i) => (
                <span key={s.step} className="flex items-center gap-1">
                  {i > 0 && <ArrowRightIcon className="h-4 w-4 text-gray-400" />}
                  <span
                    className={`flex items-center gap-1 ${
                      step === s.step ? (s.step === 'success' ? 'text-green-600 font-medium' : 'text-purple-600 font-medium') : ''
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        step === s.step
                          ? s.step === 'success'
                            ? 'bg-green-600 text-white'
                            : 'bg-purple-600 text-white'
                          : stepIndex > i
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200'
                      }`}
                    >
                      {stepIndex > i ? <CheckIcon className="h-3 w-3" /> : i + 1}
                    </span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </span>
                </span>
              ))}
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
                      onClick={handleContinueToOtp}
                      disabled={!selectedAccountId}
                    >
                      Continue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 'verify-otp' && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Verify Your Identity</CardTitle>
                  <p className="text-sm text-gray-600">
                    {otpChannel === 'email'
                      ? `We sent a verification code to your email${otpEmailMasked ? ` (${otpEmailMasked})` : ''}`
                      : `We sent a verification code to your WhatsApp${otpPhoneLastFour ? ` (****${otpPhoneLastFour})` : ''}`}
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Channel selector */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => { if (otpChannel !== 'whatsapp') { setOtpChannel('whatsapp'); setOtpCode(''); handleSendOtp('whatsapp'); } }}
                      disabled={isSendingOtp}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        otpChannel === 'whatsapp'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        otpChannel === 'whatsapp' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <svg className={`h-5 w-5 ${otpChannel === 'whatsapp' ? 'text-green-600' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                          <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.305-.183-2.87.853.853-2.87-.183-.305A8 8 0 1112 20z"/>
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-medium ${otpChannel === 'whatsapp' ? 'text-green-900' : 'text-gray-700'}`}>WhatsApp</p>
                        <p className="text-xs text-gray-500">Send via WhatsApp</p>
                      </div>
                    </button>

                    <button
                      onClick={() => { if (otpChannel !== 'email') { setOtpChannel('email'); setOtpCode(''); handleSendOtp('email'); } }}
                      disabled={isSendingOtp}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        otpChannel === 'email'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        otpChannel === 'email' ? 'bg-purple-100' : 'bg-gray-100'
                      }`}>
                        <svg className={`h-5 w-5 ${otpChannel === 'email' ? 'text-purple-600' : 'text-gray-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="4" width="20" height="16" rx="2"/>
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                        </svg>
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-medium ${otpChannel === 'email' ? 'text-purple-900' : 'text-gray-700'}`}>Email</p>
                        <p className="text-xs text-gray-500">Send via email</p>
                      </div>
                    </button>
                  </div>

                  {/* Info banner */}
                  <div className={`${otpChannel === 'email' ? 'bg-purple-50 border-purple-200' : 'bg-green-50 border-green-200'} border rounded-xl p-4`}>
                    <div className="flex gap-3">
                      <div className={`h-10 w-10 rounded-lg ${otpChannel === 'email' ? 'bg-purple-100' : 'bg-green-100'} flex items-center justify-center flex-shrink-0`}>
                        {otpChannel === 'email' ? (
                          <svg className="h-5 w-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="4" width="20" height="16" rx="2"/>
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                          </svg>
                        ) : (
                          <svg className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.305-.183-2.87.853.853-2.87-.183-.305A8 8 0 1112 20z"/>
                          </svg>
                        )}
                      </div>
                      <div className={`text-sm ${otpChannel === 'email' ? 'text-purple-900' : 'text-green-900'}`}>
                        <p className="font-medium mb-1">{otpChannel === 'email' ? 'Email Verification' : 'WhatsApp Verification'}</p>
                        <p className={otpChannel === 'email' ? 'text-purple-800' : 'text-green-800'}>
                          Enter the 6-digit code sent to your {otpChannel === 'email' ? 'email' : 'WhatsApp'} to authorize the direct debit mandate on your account.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center py-6">
                    <InputOTP
                      maxLength={6}
                      value={otpCode}
                      onChange={setOtpCode}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={1} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={2} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={3} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={4} className="h-12 w-12 text-lg" />
                        <InputOTPSlot index={5} className="h-12 w-12 text-lg" />
                      </InputOTPGroup>
                    </InputOTP>

                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-500">
                        Didn't receive the code?{' '}
                        <button
                          onClick={() => handleSendOtp()}
                          disabled={isSendingOtp}
                          className="text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                        >
                          {isSendingOtp ? 'Sending...' : 'Resend Code'}
                        </button>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => {
                        setStep('select-account');
                        setOtpCode('');
                        setOtpSent(false);
                      }}
                      disabled={isVerifyingOtp}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={handleVerifyOtp}
                      disabled={otpCode.length !== 6 || isVerifyingOtp}
                    >
                      {isVerifyingOtp ? 'Verifying...' : 'Verify & Continue'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 'validation-charge' && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Mandate Validation Payment</CardTitle>
                  <p className="text-sm text-gray-600">
                    Please send ₦50 to the business account below to validate your mandate
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoadingPaymentDetails ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-24 bg-gray-100 rounded-xl" />
                      <div className="h-20 bg-gray-100 rounded-xl" />
                    </div>
                  ) : (
                    <>
                      {/* Business receiving account */}
                      <div className="bg-green-50 border-2 border-green-300 rounded-xl p-5">
                        <h4 className="font-semibold text-green-900 mb-3 text-base">
                          Send ₦50 to this account
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-800">Bank</span>
                            <span className="font-semibold text-green-900">{businessPaymentDetails?.bankName || 'Loading...'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-800">Account Number</span>
                            <span className="font-mono font-bold text-green-900 text-lg">{businessPaymentDetails?.accountNumber}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-green-800">Account Name</span>
                            <span className="font-semibold text-green-900">{businessPaymentDetails?.accountName}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-green-200">
                            <span className="text-sm text-green-800">Amount</span>
                            <span className="font-bold text-2xl text-green-900">₦50</span>
                          </div>
                        </div>
                      </div>

                      {/* From account */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">From your linked account</h4>
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                            <CreditCardIcon className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{selectedAccount?.bankName}</div>
                            <div className="text-sm text-gray-600">
                              {selectedAccount?.accountNumber} &bull; {selectedAccount?.accountName}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Info note */}
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex gap-3">
                          <AlertCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-amber-900">
                            <p className="font-medium mb-1">Why ₦50?</p>
                            <p className="text-amber-800">
                              This small payment validates your direct debit mandate and confirms your account is active.
                              It is a one-time charge sent to <span className="font-medium">{businessPaymentDetails?.businessName || plan.businessName}</span>.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Acknowledgement checkbox */}
                      <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 transition-colors hover:border-purple-300"
                        style={{ borderColor: validationAcknowledged ? '#9333ea' : '#e5e7eb', backgroundColor: validationAcknowledged ? '#faf5ff' : 'white' }}
                      >
                        <input
                          type="checkbox"
                          checked={validationAcknowledged}
                          onChange={(e) => setValidationAcknowledged(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <div className="text-sm text-gray-700">
                          I authorize sending ₦50 from my{' '}
                          <span className="font-medium">{selectedAccount?.bankName}</span> account ({selectedAccount?.accountNumber}) to{' '}
                          <span className="font-medium">{businessPaymentDetails?.businessName || plan.businessName}</span> for mandate validation.
                        </div>
                      </label>
                    </>
                  )}

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1 h-12"
                      onClick={() => {
                        setStep('verify-otp');
                        setValidationAcknowledged(false);
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => setStep('confirm')}
                      disabled={!validationAcknowledged || isLoadingPaymentDetails}
                    >
                      Continue to Confirm
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
                      <Badge className="ml-auto bg-green-100 text-green-700 text-xs">Verified</Badge>
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

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center justify-between text-sm text-amber-900">
                      <div>
                        <p className="font-medium">₦50 Validation Payment</p>
                        <p className="text-amber-800 mt-0.5">
                          Sent to {businessPaymentDetails?.businessName || plan.businessName} ({businessPaymentDetails?.accountNumber || ''})
                        </p>
                      </div>
                      <span className="font-bold text-lg">₦50</span>
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
                      onClick={() => setStep('validation-charge')}
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
