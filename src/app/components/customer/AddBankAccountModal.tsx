import { useState } from 'react';
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
import { CheckIcon } from '@/app/components/icons/FinanceIcons';
import { toast } from 'sonner';

interface AddBankAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (account: any) => void;
}

const nigerianBanks = [
  'Access Bank',
  'GTBank',
  'First Bank',
  'Zenith Bank',
  'UBA',
  'Fidelity Bank',
  'Union Bank',
  'Stanbic IBTC',
  'Sterling Bank',
  'Wema Bank',
  'Ecobank',
  'FCMB',
  'Polaris Bank',
  'Keystone Bank',
  'Heritage Bank',
].sort();

export function AddBankAccountModal({ open, onOpenChange, onSuccess }: AddBankAccountModalProps) {
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleAccountNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setAccountNumber(cleaned);

      // Simulate account name lookup when 10 digits entered
      if (cleaned.length === 10 && bankName) {
        setIsVerifying(true);
        setTimeout(() => {
          setAccountName('Adebayo Johnson');
          setIsVerifying(false);
          toast.success('Account verified successfully');
        }, 1500);
      } else {
        setAccountName('');
      }
    }
  };

  const handleAddAccount = () => {
    if (!bankName || !accountNumber || !accountName) {
      toast.error('Please complete all fields');
      return;
    }

    if (accountNumber.length !== 10) {
      toast.error('Account number must be 10 digits');
      return;
    }

    setIsAdding(true);

    // Simulate adding account
    setTimeout(() => {
      const newAccount = {
        id: `BA${Date.now()}`,
        bankName,
        accountNumber,
        accountName,
        isVerified: true,
      };

      toast.success('Bank account added successfully!');

      if (onSuccess) {
        onSuccess(newAccount);
      }

      setIsAdding(false);
      onOpenChange(false);
      resetModal();
    }, 1000);
  };

  const resetModal = () => {
    setBankName('');
    setAccountNumber('');
    setAccountName('');
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
              <Select value={bankName} onValueChange={setBankName}>
                <SelectTrigger id="bank-name">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent>
                  {nigerianBanks.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="account-number">Account Number</Label>
              <Input
                id="account-number"
                placeholder="Enter 10-digit account number"
                value={accountNumber}
                onChange={(e) => handleAccountNumberChange(e.target.value)}
                disabled={!bankName}
              />
              {isVerifying && (
                <p className="text-sm text-blue-600 mt-1">Verifying account...</p>
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
