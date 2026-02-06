import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { StatusBadge } from '@/app/components/StatusBadges';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Separator } from '@/app/components/ui/separator';
import { PortalHeader } from '@/app/components/PortalHeader';
import { TablePagination } from '@/app/components/TablePagination';
import {
  CreditCardIcon,
  CalendarIcon,
  FileTextIcon,
  LogOutIcon,
  XCircleIcon,
  DownloadIcon,
  BuildingIcon,
  SearchIcon,
  HomeIcon,
  SettingsIcon,
  PackageIcon,
  PlusIcon,
  RefreshIcon,
} from '@/app/components/icons/FinanceIcons';
import {
  authApi,
  subscriptionsApi,
  billingApi,
  plansApi,
} from '@/lib/api';
import type { SubscriptionResponse } from '@/lib/api/subscriptions';
import type { TransactionResponse, MandateResponse, BankResponse } from '@/lib/api/billing';
import type { PlanResponse } from '@/lib/api/plans';
import type { UserProfileResponse } from '@/lib/api/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Textarea } from '@/app/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { toast } from 'sonner';
import { AvailableSubscriptions } from '@/app/components/customer/AvailableSubscriptions';

type ActiveSection = 'overview' | 'subscriptions' | 'payments' | 'bank-accounts' | 'settings';

interface NavItem {
  id: ActiveSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: HomeIcon },
  { id: 'subscriptions', label: 'My Subscriptions', icon: PackageIcon },
  { id: 'payments', label: 'Payment History', icon: FileTextIcon },
  { id: 'bank-accounts', label: 'Bank Accounts', icon: BuildingIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

// Map URL paths to section IDs
const customerSectionMap: Record<string, ActiveSection> = {
  'dashboard': 'overview',
  'subscriptions': 'subscriptions',
  'payments': 'payments',
  'bank-accounts': 'bank-accounts',
  'settings': 'settings',
};

export function CustomerPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { customerId } = useParams();
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [selectedSubscription, setSelectedSubscription] = useState<SubscriptionResponse | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [additionalFeedback, setAdditionalFeedback] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [selectedMandate, setSelectedMandate] = useState<MandateResponse | null>(null);

  // Real data state
  const [userProfile, setUserProfile] = useState<UserProfileResponse | null>(null);
  const [customerSubscriptions, setCustomerSubscriptions] = useState<SubscriptionResponse[]>([]);
  const [customerTransactions, setCustomerTransactions] = useState<TransactionResponse[]>([]);
  const [customerMandates, setCustomerMandates] = useState<MandateResponse[]>([]);
  const [plansMap, setPlansMap] = useState<Record<string, PlanResponse>>({});
  const [banksList, setBanksList] = useState<BankResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  // Profile form states
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileCurrentPassword, setProfileCurrentPassword] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Pagination and filter states
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsPageSize, setTransactionsPageSize] = useState(10);

  // Sync URL to active section
  useEffect(() => {
    const path = location.pathname;
    const pathParts = path.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    const section = customerSectionMap[lastPart];
    if (section && section !== activeSection) {
      setActiveSection(section);
    }
  }, [location.pathname]);

  // Navigate to section URL when clicking sidebar
  const handleSectionChange = (sectionId: ActiveSection) => {
    const cid = customerId || 'me';
    const urlPath = sectionId === 'overview' ? 'dashboard' : sectionId;
    navigate(`/customer/${cid}/${urlPath}`);
    setActiveSection(sectionId);
  };

  // Load all customer data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profileRes, subsRes, txnRes, mandateRes, plansRes, banksRes] = await Promise.allSettled([
        authApi.getProfile(),
        subscriptionsApi.findAll(0, 100),
        billingApi.listTransactions(0, 100),
        billingApi.listMandates(0, 100),
        plansApi.findAll(0, 100),
        billingApi.getBanks(0, 200),
      ]);

      if (profileRes.status === 'fulfilled') {
        setUserProfile(profileRes.value);
        setProfileFirstName(profileRes.value.firstName || '');
        setProfileLastName(profileRes.value.lastName || '');
        setProfileEmail(profileRes.value.email || '');
        setProfilePhone(profileRes.value.phone || '');
      }

      if (subsRes.status === 'fulfilled') {
        setCustomerSubscriptions(subsRes.value.content || []);
      }

      if (txnRes.status === 'fulfilled') {
        setCustomerTransactions(txnRes.value.content || []);
      }

      if (mandateRes.status === 'fulfilled') {
        setCustomerMandates(mandateRes.value.content || []);
      }

      if (plansRes.status === 'fulfilled') {
        const map: Record<string, PlanResponse> = {};
        (plansRes.value.content || []).forEach((plan) => {
          map[plan.planId] = plan;
        });
        setPlansMap(map);
      }

      if (banksRes.status === 'fulfilled') {
        setBanksList(banksRes.value.content || []);
      }
    } catch (err) {
      console.error('Failed to load customer data:', err);
      toast.error('Failed to load some data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Helper: get plan for a subscription
  const getPlan = (sub: SubscriptionResponse | null): PlanResponse | null => {
    if (!sub?.subscriptionPlanId) return null;
    return plansMap[sub.subscriptionPlanId] || null;
  };

  // Helper: get bank name from bank ID
  const getBankName = (bankId: string | null | undefined): string => {
    if (!bankId) return 'Unknown Bank';
    const bank = banksList.find(b => b.bankId === bankId || b.bankCode === bankId);
    return bank?.bankName || bankId;
  };

  // Helper: format amount
  const formatAmount = (amount: string | null): number => {
    if (!amount) return 0;
    return parseFloat(amount) || 0;
  };

  // Calculate KPIs from real data
  const activeSubscriptions = customerSubscriptions.filter(s => s.subscriptionStatus === 'ACTIVE');
  const activeSubscriptionsCount = activeSubscriptions.length;
  const monthlySpend = activeSubscriptions.reduce((sum, s) => {
    const plan = getPlan(s);
    return sum + formatAmount(plan?.planAmount || null);
  }, 0);
  const totalPaid = customerTransactions
    .filter(t => t.transactionStatus === 'SUCCESS' || t.transactionStatus === 'COMPLETED')
    .reduce((sum, t) => sum + formatAmount(t.transactionAmount), 0);

  // Filter and pagination logic for transactions
  const filteredTransactions = customerTransactions.filter((txn) =>
    (txn.transactionDescription || '').toLowerCase().includes(transactionSearchQuery.toLowerCase()) ||
    (txn.transactionReference || '').toLowerCase().includes(transactionSearchQuery.toLowerCase())
  );

  const transactionsTotalPages = Math.ceil(filteredTransactions.length / transactionsPageSize);
  const paginatedTransactions = filteredTransactions.slice(
    (transactionsPage - 1) * transactionsPageSize,
    transactionsPage * transactionsPageSize
  );

  const handleViewDetails = (subscription: SubscriptionResponse) => {
    setSelectedSubscription(subscription);
    setShowDetailsDialog(true);
  };

  const handleCancelSubscription = (subscription: SubscriptionResponse) => {
    setSelectedSubscription(subscription);
    setCancellationReason('');
    setAdditionalFeedback('');
    setShowCancelDialog(true);
  };

  const confirmCancelSubscription = async () => {
    if (!selectedSubscription) return;
    setIsCancelling(true);
    try {
      await subscriptionsApi.cancel(selectedSubscription.subscriptionId, {
        subscriptionCancellationReason: cancellationReason
          ? `${cancellationReason}${additionalFeedback ? ': ' + additionalFeedback : ''}`
          : additionalFeedback || undefined,
      });
      const plan = getPlan(selectedSubscription);
      toast.success(`Your ${plan?.planName || 'subscription'} has been cancelled`);
      setShowCancelDialog(false);
      setCancellationReason('');
      setAdditionalFeedback('');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      // Update profile fields if changed
      const profileChanged =
        profileFirstName !== (userProfile?.firstName || '') ||
        profileLastName !== (userProfile?.lastName || '') ||
        profilePhone !== (userProfile?.phone || '');

      if (profileChanged) {
        const updated = await authApi.updateProfile({
          firstName: profileFirstName,
          lastName: profileLastName,
          phone: profilePhone,
        });
        setUserProfile(updated);
        toast.success('Profile updated successfully');
      }

      // Change password if fields are filled
      if (profileNewPassword) {
        await authApi.changePassword(profileCurrentPassword, profileNewPassword);
        setProfileCurrentPassword('');
        setProfileNewPassword('');
        toast.success('Password updated successfully');
      }

      if (!profileChanged && !profileNewPassword) {
        toast.info('No changes to save');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      navigate('/customer/login');
    }
  };

  const handleDownloadReceipt = (txn: TransactionResponse) => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) {
      toast.error('Please allow pop-ups to download receipts');
      return;
    }

    const date = txn.transactionCreatedAt
      ? new Date(txn.transactionCreatedAt).toLocaleDateString('en-NG', {
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
        })
      : 'N/A';
    const amount = formatAmount(txn.transactionAmount);
    const ref = txn.transactionReference || txn.transactionId || 'N/A';
    const status = txn.transactionStatus || 'N/A';
    const method = txn.transactionPaymentMethod || 'Direct Debit';
    const description = txn.transactionDescription || 'Subscription Payment';
    const customerName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}` : 'Customer';

    receiptWindow.document.write(`<!DOCTYPE html>
<html><head><title>Receipt - ${ref}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f3f4f6; padding: 20px; }
  .receipt { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
  .header { background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #fff; padding: 32px 24px; text-align: center; }
  .header h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
  .header p { font-size: 13px; opacity: 0.85; }
  .amount-box { text-align: center; padding: 24px; border-bottom: 1px solid #e5e7eb; }
  .amount-box .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .amount-box .amount { font-size: 32px; font-weight: 700; color: #111827; font-family: monospace; }
  .details { padding: 24px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
  .row:last-child { border-bottom: none; }
  .row .label { color: #6b7280; font-size: 13px; }
  .row .value { color: #111827; font-size: 13px; font-weight: 500; text-align: right; max-width: 60%; word-break: break-all; }
  .status-badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .status-success { background: #d1fae5; color: #065f46; }
  .status-other { background: #e5e7eb; color: #374151; }
  .footer { padding: 16px 24px; background: #f9fafb; text-align: center; font-size: 11px; color: #9ca3af; }
  @media print { body { background: #fff; padding: 0; } .receipt { box-shadow: none; } .no-print { display: none; } }
</style></head><body>
<div class="receipt">
  <div class="header">
    <h1>Suscribly</h1>
    <p>Payment Receipt</p>
  </div>
  <div class="amount-box">
    <div class="label">Amount Paid</div>
    <div class="amount">\u20A6${amount.toLocaleString()}</div>
  </div>
  <div class="details">
    <div class="row"><span class="label">Reference</span><span class="value" style="font-family:monospace">${ref}</span></div>
    <div class="row"><span class="label">Date</span><span class="value">${date}</span></div>
    <div class="row"><span class="label">Customer</span><span class="value">${customerName}</span></div>
    <div class="row"><span class="label">Description</span><span class="value">${description}</span></div>
    <div class="row"><span class="label">Payment Method</span><span class="value">${method}</span></div>
    <div class="row"><span class="label">Status</span><span class="value"><span class="status-badge ${status === 'SUCCESS' || status === 'COMPLETED' ? 'status-success' : 'status-other'}">${status}</span></span></div>
  </div>
  <div class="footer">
    <p>Suscribly &mdash; B2B2C Subscription Management Platform</p>
    <p style="margin-top: 4px;">This is an automatically generated receipt.</p>
  </div>
</div>
<div class="no-print" style="text-align:center; margin-top:20px;">
  <button onclick="window.print()" style="background:#7c3aed; color:#fff; border:none; padding:10px 32px; border-radius:8px; font-size:14px; cursor:pointer;">Print / Save as PDF</button>
</div>
</body></html>`);
    receiptWindow.document.close();
  };

  const handleUnlinkMandate = (mandate: MandateResponse) => {
    setSelectedMandate(mandate);
    setShowUnlinkDialog(true);
  };

  const confirmUnlinkAccount = async () => {
    if (!selectedMandate) return;
    try {
      await billingApi.deleteMandate(selectedMandate.mandateId);
      toast.success(`Bank account (***${(selectedMandate.mandateAccountNumber || '').slice(-4)}) has been unlinked`);
      setShowUnlinkDialog(false);
      setSelectedMandate(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to unlink account');
    }
  };

  // Get user initials for avatar
  const userInitials = userProfile
    ? `${(userProfile.firstName || '')[0] || ''}${(userProfile.lastName || '')[0] || ''}`.toUpperCase()
    : '??';

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // KPI Cards Component
  const KPICards = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Active Subscriptions
              </p>
              <p className="text-3xl font-bold font-mono tracking-tight">
                {activeSubscriptionsCount}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-100 text-gray-600 flex-shrink-0">
              <CreditCardIcon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Monthly Spend
              </p>
              <p className="text-3xl font-bold font-mono tracking-tight">
                ₦{monthlySpend.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-100 text-gray-600 flex-shrink-0">
              <CalendarIcon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Total Paid
              </p>
              <p className="text-3xl font-bold font-mono tracking-tight">
                ₦{totalPaid.toLocaleString()}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-gray-100 text-gray-600 flex-shrink-0">
              <FileTextIcon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Overview Section
  const OverviewSection = () => (
    <div className="space-y-6">
      <KPICards />
      <AvailableSubscriptions />
    </div>
  );

  // Subscriptions Section
  const SubscriptionsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">My Subscriptions</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={() => handleSectionChange('overview')}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Browse Plans
          </Button>
        </div>
      </div>

      {customerSubscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="p-4 rounded-xl bg-gray-100 text-gray-600 w-fit mx-auto mb-4">
              <PackageIcon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Subscriptions Yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Browse available plans to get started with your first subscription.
            </p>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => handleSectionChange('overview')}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Browse Plans
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {customerSubscriptions.map((subscription) => {
            const plan = getPlan(subscription);
            const amount = formatAmount(plan?.planAmount || null);
            const discountAmount = formatAmount(subscription.subscriptionDiscountAmount);
            const finalAmount = discountAmount > 0 ? amount - discountAmount : amount;
            return (
              <Card key={subscription.subscriptionId}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold">
                        {plan?.planName || 'Subscription'}
                      </CardTitle>
                      {plan?.planDescription && (
                        <p className="text-sm text-muted-foreground mt-1">{plan.planDescription}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <StatusBadge status={subscription.subscriptionStatus} type="subscription" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-3xl font-bold font-mono tracking-tight">
                        ₦{finalAmount.toLocaleString()}
                        <span className="text-sm font-normal text-muted-foreground ml-1">
                          /{(plan?.planBillingInterval || 'month').toLowerCase()}
                        </span>
                      </p>
                      {discountAmount > 0 && (
                        <p className="text-sm text-green-600 mt-1">
                          Discount: ₦{discountAmount.toLocaleString()} off
                        </p>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3 text-sm">
                      {subscription.subscriptionCurrentPeriodEnd && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Next Billing Date</span>
                          <span className="font-medium">
                            {new Date(subscription.subscriptionCurrentPeriodEnd).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {subscription.subscriptionStartDate && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Started On</span>
                          <span className="font-medium">
                            {new Date(subscription.subscriptionStartDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {subscription.subscriptionStatus === 'ACTIVE' && (
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleViewDetails(subscription)}
                        >
                          <FileTextIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => handleCancelSubscription(subscription)}
                        >
                          <XCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  // Payments Section
  const PaymentsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Payment History</h2>
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshIcon className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      <Card>
        <CardHeader>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder="Search payments..."
              value={transactionSearchQuery}
              onChange={(e) => setTransactionSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {customerTransactions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No payment history yet</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((txn) => (
                      <tr key={txn.transactionId} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4 text-sm">
                          {txn.transactionCreatedAt
                            ? new Date(txn.transactionCreatedAt).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="text-sm font-medium">{txn.transactionDescription || 'Payment'}</div>
                            <div className="text-xs text-muted-foreground font-mono">{txn.transactionReference || '-'}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium font-mono text-right">
                          ₦{formatAmount(txn.transactionAmount).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={txn.transactionStatus} type="payment" />
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={txn.transactionStatus !== 'SUCCESS' && txn.transactionStatus !== 'COMPLETED'}
                            onClick={() => handleDownloadReceipt(txn)}
                            className="hover:bg-muted"
                          >
                            <DownloadIcon className="h-4 w-4 flex-shrink-0" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-border/50">
                <TablePagination
                  currentPage={transactionsPage}
                  totalPages={transactionsTotalPages}
                  pageSize={transactionsPageSize}
                  totalItems={filteredTransactions.length}
                  onPageChange={setTransactionsPage}
                  onPageSizeChange={setTransactionsPageSize}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Bank Accounts Section (derived from mandates)
  const BankAccountsSection = () => {
    // Deduplicate mandates by account number + bank to get unique bank accounts
    const uniqueAccounts = new Map<string, MandateResponse>();
    customerMandates.forEach((m) => {
      const key = `${m.mandateAccountNumber}-${m.mandateBankId}`;
      if (!uniqueAccounts.has(key)) {
        uniqueAccounts.set(key, m);
      }
    });
    const bankAccounts = Array.from(uniqueAccounts.values());

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Linked Bank Accounts</h2>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {bankAccounts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="p-4 rounded-xl bg-gray-100 text-gray-600 w-fit mx-auto mb-4">
                <BuildingIcon className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Bank Accounts Linked</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Bank accounts are linked when a business sets up your subscription with direct debit.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {bankAccounts.map((mandate) => (
              <Card key={mandate.mandateId}>
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-gray-100 text-gray-600 flex-shrink-0">
                        <BuildingIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base font-semibold">
                          {getBankName(mandate.mandateBankId)}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground font-mono">
                          ***{(mandate.mandateAccountNumber || '').slice(-4)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <StatusBadge status={mandate.mandateStatus} type="mandate" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Account Name</span>
                      <span className="font-medium">{mandate.mandateAccountName || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Amount</span>
                      <span className="font-medium font-mono">
                        ₦{formatAmount(mandate.mandateAmount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Frequency</span>
                      <span className="font-medium">{mandate.mandateFrequency || '-'}</span>
                    </div>
                    {mandate.mandateCreatedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Added On</span>
                        <span className="font-medium">
                          {new Date(mandate.mandateCreatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => handleUnlinkMandate(mandate)}
                    >
                      <XCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      Unlink Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Settings Section
  const SettingsSection = () => {
    const profileChanged =
      profileFirstName !== (userProfile?.firstName || '') ||
      profileLastName !== (userProfile?.lastName || '') ||
      profilePhone !== (userProfile?.phone || '');
    const hasChanges = profileChanged || !!profileNewPassword;

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-xs font-medium text-gray-500 uppercase tracking-wider">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileFirstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-xs font-medium text-gray-500 uppercase tracking-wider">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileLastName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileEmail}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</Label>
                  <Input
                    id="phone"
                    value={profilePhone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfilePhone(e.target.value)}
                    placeholder="e.g. 08012345678"
                  />
                </div>
              </div>
              <Separator />
              <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                    value={profileCurrentPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-xs font-medium text-gray-500 uppercase tracking-wider">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={profileNewPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProfileNewPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={isSavingProfile || !hasChanges}
                >
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'subscriptions':
        return <SubscriptionsSection />;
      case 'payments':
        return <PaymentsSection />;
      case 'bank-accounts':
        return <BankAccountsSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader
        title="Customer Portal"
        subtitle={userProfile ? `Welcome, ${userProfile.firstName || 'Customer'}` : 'Manage your subscriptions and payments'}
        actions={
          <>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={handleLogout}>
              <LogOutIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              Logout
            </Button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 text-white flex items-center justify-center font-semibold text-sm shadow-sm flex-shrink-0">
              {userInitials}
            </div>
          </>
        }
      />

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 flex flex-col sticky top-16">
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium cursor-pointer ${
                      isActive
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="border-t border-gray-200 p-3 space-y-1">
            <button onClick={() => toast.info('Terms of Service coming soon')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span>Terms of Service</span>
            </button>
            <button onClick={() => toast.info('Help & Support coming soon')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Help & Support</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gradient-to-br from-slate-100/80 via-gray-100/50 to-purple-50/30 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="max-w-5xl">
            {renderActiveSection()}
          </div>
        </main>
      </div>

      {/* View Subscription Details Modal */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Subscription Details</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Complete information about your {getPlan(selectedSubscription)?.planName || 'subscription'}
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription && (() => {
            const plan = getPlan(selectedSubscription);
            const amount = formatAmount(plan?.planAmount || null);
            const discountAmount = formatAmount(selectedSubscription.subscriptionDiscountAmount);
            const finalAmount = discountAmount > 0 ? amount - discountAmount : amount;
            return (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan Name</Label>
                    <p className="text-sm font-medium">{plan?.planName || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</Label>
                    <div className="mt-1">
                      <StatusBadge status={selectedSubscription.subscriptionStatus} type="subscription" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</Label>
                    <p className="text-sm font-medium font-mono">
                      ₦{finalAmount.toLocaleString()}/{(plan?.planBillingInterval || 'month').toLowerCase()}
                    </p>
                    {discountAmount > 0 && (
                      <p className="text-xs text-green-600">
                        Original: ₦{amount.toLocaleString()} (₦{discountAmount.toLocaleString()} discount)
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Date</Label>
                    <p className="text-sm font-medium">
                      {selectedSubscription.subscriptionStartDate
                        ? new Date(selectedSubscription.subscriptionStartDate).toLocaleDateString()
                        : '-'}
                    </p>
                  </div>
                  {selectedSubscription.subscriptionCurrentPeriodEnd && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Next Billing Date</Label>
                      <p className="text-sm font-medium">
                        {new Date(selectedSubscription.subscriptionCurrentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {selectedSubscription.subscriptionTrialEnd && (
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Trial Ends</Label>
                      <p className="text-sm font-medium">
                        {new Date(selectedSubscription.subscriptionTrialEnd).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Modal */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your {getPlan(selectedSubscription)?.planName || 'subscription'}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for cancellation (optional)</Label>
              <RadioGroup value={cancellationReason} onValueChange={setCancellationReason}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="too-expensive" id="expensive" />
                  <Label htmlFor="expensive" className="font-normal cursor-pointer">Too expensive</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="not-using" id="not-using" />
                  <Label htmlFor="not-using" className="font-normal cursor-pointer">Not using enough</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="found-alternative" id="alternative" />
                  <Label htmlFor="alternative" className="font-normal cursor-pointer">Found an alternative</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="font-normal cursor-pointer">Other</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback">Additional feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Tell us more about your experience..."
                className="resize-none"
                value={additionalFeedback}
                onChange={(e) => setAdditionalFeedback(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Keep Subscription
            </Button>
            <Button variant="destructive" onClick={confirmCancelSubscription} disabled={isCancelling}>
              {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlink Bank Account Confirmation Dialog */}
      <Dialog open={showUnlinkDialog} onOpenChange={setShowUnlinkDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <XCircleIcon className="h-5 w-5 text-red-600" />
              </div>
              <DialogTitle className="text-lg font-semibold">Unlink Bank Account?</DialogTitle>
            </div>
            <DialogDescription className="text-gray-600">
              This will remove the mandate for this bank account. Active subscriptions using this account may be affected.
            </DialogDescription>
          </DialogHeader>
          {selectedMandate && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="p-2.5 rounded-lg bg-white border border-gray-200 flex-shrink-0">
                  <BuildingIcon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{getBankName(selectedMandate.mandateBankId)}</p>
                  <p className="text-sm text-gray-500 font-mono">****{(selectedMandate.mandateAccountNumber || '').slice(-4)}</p>
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm font-semibold text-red-800 mb-2">Important Warning</p>
                <p className="text-sm text-red-700">
                  Removing this mandate may cancel subscriptions that use this bank account for payment.
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowUnlinkDialog(false)} className="flex-1 sm:flex-none">
              Keep Account
            </Button>
            <Button variant="destructive" onClick={confirmUnlinkAccount} className="flex-1 sm:flex-none">
              Unlink Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
