import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Separator } from '@/app/components/ui/separator';
import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { 
  CreditCardIcon, 
  CheckIcon, 
  PlusIcon,
  BuildingIcon,
  AlertCircleIcon,
} from '@/app/components/icons/FinanceIcons';
import { toast } from 'sonner';
import { AddBankAccountModal } from './AddBankAccountModal';

interface SubscribeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: {
    id: string;
    name: string;
    description: string;
    amount: number;
    billingCycle: string;
    features: string[];
    tenantId: string;
    tenantName: string;
  };
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
}

export function SubscribeModal({ open, onOpenChange, plan }: SubscribeModalProps) {
  const [step, setStep] = useState<'select-account' | 'verify-payment'>('select-account');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);

  // Mock bank accounts - in real app, fetch from API
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

  const handleContinue = () => {
    if (!selectedAccountId) {
      toast.error('Please select a bank account');
      return;
    }

    const selectedAccount = bankAccounts.find(acc => acc.id === selectedAccountId);
    if (!selectedAccount?.isVerified) {
      toast.error('Please select a verified bank account');
      return;
    }

    setStep('verify-payment');
  };

  const handleConfirmSubscription = () => {
    setVerificationPending(true);
    
    // Simulate verification check
    setTimeout(() => {
      toast.success(`Successfully subscribed to ${plan.name}! Your first payment will be processed on the next billing cycle.`);
      setVerificationPending(false);
      onOpenChange(false);
      resetModal();
    }, 2000);
  };

  const resetModal = () => {
    setStep('select-account');
    setSelectedAccountId('');
    setVerificationPending(false);
  };

  const handleAddBankSuccess = (newAccount: BankAccount) => {
    setBankAccounts([...bankAccounts, newAccount]);
    setSelectedAccountId(newAccount.id);
  };

  const verificationAccountDetails = {
    bankName: 'Reccur Verification Account',
    accountNumber: '0123456789',
    accountName: 'Reccur Verification',
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) resetModal();
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subscribe to {plan.name}</DialogTitle>
            <DialogDescription>
              {step === 'select-account' 
                ? 'Select a bank account for recurring payments' 
                : 'Complete account verification to activate your subscription'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Plan Summary - Left Column */}
            <div className="lg:col-span-2">
              <Card className="bg-purple-50 border-purple-200 h-full">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-600">{plan.tenantName}</p>
                    </div>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      {plan.billingCycle}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-4">
                    ₦{plan.amount.toLocaleString()}
                    <span className="text-sm font-normal text-gray-600">/{plan.billingCycle.toLowerCase()}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                  <div className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckIcon className="h-3 w-3 text-purple-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Form Content - Right Column */}
            <div className="lg:col-span-3 space-y-6">
            {step === 'select-account' && (
              <>
                <div>
                  <Label className="text-base mb-3 block">Select Payment Account</Label>
                  <p className="text-sm text-gray-600 mb-4">
                    Choose the bank account that will be debited for recurring payments
                  </p>

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
                            className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors hover:border-purple-300 ${
                              selectedAccountId === account.id
                                ? 'border-purple-600 bg-purple-50'
                                : 'border-gray-200'
                            }`}
                          >
                            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <CreditCardIcon className="h-5 w-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">{account.bankName}</span>
                                {account.isVerified && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                    Verified
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                {account.accountNumber} • {account.accountName}
                              </div>
                            </div>
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                              selectedAccountId === account.id
                                ? 'border-purple-600 bg-purple-600'
                                : 'border-gray-300'
                            }`}>
                              {selectedAccountId === account.id && (
                                <CheckIcon className="h-3 w-3 text-white" />
                              )}
                            </div>
                          </Label>
                        </div>
                      ))}

                      <Button
                        variant="outline"
                        className="w-full border-dashed border-2 h-auto py-4"
                        onClick={() => setShowAddBankModal(true)}
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add New Bank Account
                      </Button>
                    </div>
                  </RadioGroup>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={handleContinue}
                    disabled={!selectedAccountId}
                  >
                    Continue
                  </Button>
                </div>
              </>
            )}

            {step === 'verify-payment' && (
              <>
                <div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex gap-3">
                      <AlertCircleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-amber-900">
                        <p className="font-medium mb-1">Account Verification Required</p>
                        <p className="text-amber-800">
                          To link your bank account and activate your subscription, please send exactly ₦50 
                          from your selected account to the details below. This is a one-time verification.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Selected Payment Account</h4>
                    <Card className="bg-gray-50">
                      <CardContent className="pt-4">
                        {bankAccounts.find(acc => acc.id === selectedAccountId) && (
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                              <CreditCardIcon className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {bankAccounts.find(acc => acc.id === selectedAccountId)?.bankName}
                              </div>
                              <div className="text-sm text-gray-600">
                                {bankAccounts.find(acc => acc.id === selectedAccountId)?.accountNumber} • 
                                {bankAccounts.find(acc => acc.id === selectedAccountId)?.accountName}
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Send ₦50 to Verify Account</h4>
                    <Card className="border-2 border-purple-200 bg-purple-50">
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <BuildingIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="text-xs text-gray-600 mb-1">Bank Name</div>
                              <div className="font-semibold text-gray-900">{verificationAccountDetails.bankName}</div>
                            </div>
                          </div>
                          <Separator />
                          <div className="flex items-start gap-3">
                            <CreditCardIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="text-xs text-gray-600 mb-1">Account Number</div>
                              <div className="font-semibold text-gray-900 text-lg">{verificationAccountDetails.accountNumber}</div>
                            </div>
                          </div>
                          <Separator />
                          <div className="flex items-start gap-3">
                            <CheckIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                            <div className="flex-1">
                              <div className="text-xs text-gray-600 mb-1">Account Name</div>
                              <div className="font-semibold text-gray-900">{verificationAccountDetails.accountName}</div>
                            </div>
                          </div>
                          <Separator />
                          <div className="bg-purple-100 rounded-lg p-3 text-center">
                            <div className="text-xs text-purple-700 mb-1">Amount to Send</div>
                            <div className="text-2xl font-bold text-purple-900">₦50.00</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-sm text-blue-900">
                      <p className="font-medium mb-2">Next Steps:</p>
                      <ol className="list-decimal list-inside space-y-1 text-blue-800">
                        <li>Transfer exactly ₦50 from your selected account to the account above</li>
                        <li>Click "I've Sent ₦50" below after completing the transfer</li>
                        <li>Once verified, the subscription amount will be debited immediately and your subscription will be activated</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep('select-account')}
                    disabled={verificationPending}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    onClick={handleConfirmSubscription}
                    disabled={verificationPending}
                  >
                    {verificationPending ? 'Verifying...' : "I've Sent ₦50"}
                  </Button>
                </div>
              </>
            )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddBankAccountModal
        open={showAddBankModal}
        onOpenChange={setShowAddBankModal}
        onSuccess={handleAddBankSuccess}
      />
    </>
  );
}
