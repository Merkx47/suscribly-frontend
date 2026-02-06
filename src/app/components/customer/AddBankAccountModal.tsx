import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { CheckIcon, AlertCircleIcon } from '@/app/components/icons/FinanceIcons';
import { toast } from 'sonner';
import { billingApi } from '@/lib/api';
import type { BankResponse } from '@/lib/api/billing';

export interface BankAccountDisplay {
  mandateId: string;
  bankId: string | null;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
}

interface AddBankAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (account: BankAccountDisplay) => void;
  banksMap?: Record<string, BankResponse>;
}

export function AddBankAccountModal({ open, onOpenChange, onSuccess, banksMap: externalBanksMap }: AddBankAccountModalProps) {
  const [selectedBankId, setSelectedBankId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Banks state - use passed-in map or load our own
  const [banks, setBanks] = useState<BankResponse[]>([]);
  const [banksMap, setBanksMap] = useState<Record<string, BankResponse>>({});
  const [isLoadingBanks, setIsLoadingBanks] = useState(false);

  useEffect(() => {
    if (externalBanksMap && Object.keys(externalBanksMap).length > 0) {
      setBanksMap(externalBanksMap);
      setBanks(
        Object.values(externalBanksMap)
          .filter((b) => b.bankName)
          .sort((a, b) => (a.bankName || '').localeCompare(b.bankName || ''))
      );
    } else if (open && banks.length === 0) {
      loadBanks();
    }
  }, [open, externalBanksMap]);

  const loadBanks = async () => {
    setIsLoadingBanks(true);
    try {
      const res = await billingApi.getBanks(0, 200);
      const bMap: Record<string, BankResponse> = {};
      res.content.forEach((bank) => {
        bMap[bank.bankId] = bank;
      });
      setBanksMap(bMap);
      setBanks(
        res.content
          .filter((b) => b.bankName)
          .sort((a, b) => (a.bankName || '').localeCompare(b.bankName || ''))
      );
    } catch {
      toast.error('Failed to load banks list');
    } finally {
      setIsLoadingBanks(false);
    }
  };

  const handleAccountNumberChange = async (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setAccountNumber(cleaned);
      setAccountName('');
      setVerifyError('');

      // Verify account when 10 digits entered and bank selected
      if (cleaned.length === 10 && selectedBankId) {
        const bank = banksMap[selectedBankId];
        if (!bank?.bankCode) {
          setVerifyError('Selected bank has no bank code for verification');
          return;
        }

        setIsVerifying(true);
        setVerifyError('');
        try {
          const result = await billingApi.verifyBankAccount({
            bankCode: bank.bankCode,
            accountNumber: cleaned,
          });
          if (result.accountName) {
            setAccountName(result.accountName);
            toast.success('Account verified successfully');
          } else {
            setVerifyError('Could not verify account. Please check details and try again.');
          }
        } catch (err: any) {
          setVerifyError(err?.response?.data?.message || err?.response?.data?.responseMessage || 'Account verification failed. Please check your details.');
        } finally {
          setIsVerifying(false);
        }
      }
    }
  };

  const handleBankChange = (bankId: string) => {
    setSelectedBankId(bankId);
    setAccountName('');
    setVerifyError('');

    // Re-verify if account number already entered
    if (accountNumber.length === 10) {
      handleAccountNumberChange(accountNumber);
    }
  };

  const handleAddAccount = async () => {
    if (!selectedBankId || !accountNumber || !accountName) {
      toast.error('Please complete all fields');
      return;
    }

    if (accountNumber.length !== 10) {
      toast.error('Account number must be 10 digits');
      return;
    }

    // Just collect verified bank details - no mandate creation here
    // Mandate will be created at subscription checkout time
    const bank = banksMap[selectedBankId];
    const newAccount: BankAccountDisplay = {
      mandateId: `new-${Date.now()}`,
      bankId: selectedBankId,
      bankName: bank?.bankName || 'Bank',
      accountNumber,
      accountName,
      isVerified: true,
    };

    toast.success('Bank account verified!');

    if (onSuccess) {
      onSuccess(newAccount);
    }

    onOpenChange(false);
    resetModal();
  };

  const resetModal = () => {
    setSelectedBankId('');
    setAccountNumber('');
    setAccountName('');
    setVerifyError('');
    setIsVerifying(false);
    setIsAdding(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) resetModal();
    }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Bank Account</DialogTitle>
          <DialogDescription>
            Enter your bank account details for recurring payments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="bank-name">Bank Name</Label>
              {isLoadingBanks ? (
                <div className="h-10 bg-gray-100 rounded-md animate-pulse mt-1" />
              ) : (
                <Select value={selectedBankId} onValueChange={handleBankChange}>
                  <SelectTrigger id="bank-name">
                    <SelectValue placeholder="Select your bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank.bankId} value={bank.bankId}>
                        {bank.bankName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div>
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                placeholder="Enter 10-digit account number"
                value={accountNumber}
                onChange={(e) => handleAccountNumberChange(e.target.value)}
                disabled={!selectedBankId}
              />
              {isVerifying && (
                <p className="text-sm text-blue-600 mt-1">Verifying account...</p>
              )}
              {verifyError && (
                <div className="flex items-start gap-2 mt-1">
                  <AlertCircleIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600">{verifyError}</p>
                </div>
              )}
            </div>

            {accountName && (
              <div>
                <Label>Account Name</Label>
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mt-1">
                  <CheckIcon className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900">{accountName}</span>
                </div>
              </div>
            )}
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
              onClick={handleAddAccount}
              disabled={!accountName || isVerifying || isAdding}
            >
              {isAdding ? 'Adding...' : 'Add Account'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
