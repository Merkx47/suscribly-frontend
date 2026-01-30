import { useState } from 'react';
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
} from '@/app/components/icons/FinanceIcons';
import { subscriptions, transactions, mandates } from '@/data/mockData';
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
import { AddBankAccountModal } from '@/app/components/customer/AddBankAccountModal';

type ActiveSection = 'overview' | 'subscriptions' | 'payments' | 'bank-accounts' | 'settings';

interface NavItem {
  id: ActiveSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  linkedBy?: {
    type: 'customer' | 'business';
    businessName?: string;
  };
  createdDate: string;
}

// Initial bank accounts data including business-linked accounts
const initialBankAccounts: BankAccount[] = [
  {
    id: 'BA001',
    bankName: 'Access Bank',
    accountNumber: '0123456789',
    accountName: 'Adebayo Johnson',
    linkedBy: { type: 'customer' },
    createdDate: '2024-06-10',
  },
  {
    id: 'BA002',
    bankName: 'GTBank',
    accountNumber: '0234567890',
    accountName: 'Adebayo Johnson',
    linkedBy: { type: 'business', businessName: 'BodyFit Wellness' },
    createdDate: '2025-01-15',
  },
  {
    id: 'BA003',
    bankName: 'Zenith Bank',
    accountNumber: '0345678901',
    accountName: 'Adebayo Johnson',
    linkedBy: { type: 'business', businessName: 'DSTV Nigeria' },
    createdDate: '2025-01-20',
  },
];

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: HomeIcon },
  { id: 'subscriptions', label: 'My Subscriptions', icon: PackageIcon },
  { id: 'payments', label: 'Payment History', icon: FileTextIcon },
  { id: 'bank-accounts', label: 'Bank Accounts', icon: BuildingIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function CustomerPortal() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [additionalFeedback, setAdditionalFeedback] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showUnlinkDialog, setShowUnlinkDialog] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialBankAccounts);

  // Profile form states
  const [profileName, setProfileName] = useState('Adebayo Johnson');
  const [profileEmail, setProfileEmail] = useState('adebayo.j@email.com');
  const [profilePhone, setProfilePhone] = useState('+234 901 234 5678');
  const [profilePassword, setProfilePassword] = useState('');

  // Pagination and filter states
  const [transactionSearchQuery, setTransactionSearchQuery] = useState('');
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsPageSize, setTransactionsPageSize] = useState(10);

  // Current customer context - Adebayo Johnson (CUST001)
  const CURRENT_CUSTOMER_ID = 'CUST001';

  // Filter data for the current customer
  const customerSubscriptions = subscriptions.filter(
    sub => sub.customerId === CURRENT_CUSTOMER_ID && sub.status !== 'Cancelled'
  );
  const customerTransactions = transactions.filter(
    txn => txn.customerId === CURRENT_CUSTOMER_ID
  );
  const customerMandates = mandates.filter(
    m => m.customerId === CURRENT_CUSTOMER_ID
  );

  // Calculate actual KPIs for this customer
  const activeSubscriptionsCount = customerSubscriptions.filter(s => s.status === 'Active').length;
  const monthlySpend = customerSubscriptions
    .filter(s => s.status === 'Active')
    .reduce((sum, s) => sum + s.amount, 0);
  const totalPaid = customerTransactions
    .filter(t => t.status === 'Success')
    .reduce((sum, t) => sum + t.amount, 0);

  // Filter and pagination logic for transactions
  const filteredTransactions = customerTransactions.filter((txn) =>
    txn.customerName.toLowerCase().includes(transactionSearchQuery.toLowerCase()) ||
    txn.reference.toLowerCase().includes(transactionSearchQuery.toLowerCase())
  );

  const transactionsTotalPages = Math.ceil(filteredTransactions.length / transactionsPageSize);
  const paginatedTransactions = filteredTransactions.slice(
    (transactionsPage - 1) * transactionsPageSize,
    transactionsPage * transactionsPageSize
  );

  const handleViewDetails = (subscription: any) => {
    setSelectedSubscription(subscription);
    setShowDetailsDialog(true);
  };

  const handleCancelSubscription = (subscription: any) => {
    setSelectedSubscription(subscription);
    setCancellationReason('');
    setAdditionalFeedback('');
    setShowCancelDialog(true);
  };

  const confirmCancelSubscription = () => {
    toast.success(`Your ${selectedSubscription?.planName} subscription has been cancelled`);
    setShowCancelDialog(false);
    setCancellationReason('');
    setAdditionalFeedback('');
  };

  const handleSaveProfile = () => {
    toast.success('Your profile has been updated successfully');
  };

  const handleDownloadReceipt = (txn: any) => {
    toast.success(`Downloading receipt for ${txn.reference}`);
  };

  const handleUnlinkAccount = (account: BankAccount) => {
    setSelectedBankAccount(account);
    setShowUnlinkDialog(true);
  };

  const confirmUnlinkAccount = () => {
    if (selectedBankAccount) {
      setBankAccounts(prev => prev.filter(acc => acc.id !== selectedBankAccount.id));
      toast.success(`${selectedBankAccount.bankName} account (***${selectedBankAccount.accountNumber.slice(-4)}) has been unlinked`);
      setShowUnlinkDialog(false);
      setSelectedBankAccount(null);
    }
  };

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
        <Button
          className="bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => setActiveSection('overview')}
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Browse Plans
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {customerSubscriptions.map((subscription) => (
          <Card key={subscription.id} className="">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold">{subscription.planName}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{subscription.customerName}</p>
                </div>
                <div className="flex-shrink-0">
                  <StatusBadge status={subscription.status} type="subscription" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold font-mono tracking-tight">
                    ₦{subscription.amount.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground ml-1">/{subscription.frequency.toLowerCase()}</span>
                  </p>
                </div>

                <Separator />

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Next Billing Date</span>
                    <span className="font-medium">
                      {new Date(subscription.nextBillingDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Started On</span>
                    <span className="font-medium">
                      {new Date(subscription.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Mandate Status</span>
                    <StatusBadge status={subscription.mandateStatus} type="mandate" />
                  </div>
                </div>

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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Payments Section
  const PaymentsSection = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Payment History</h2>
      <Card className="">
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
                  <tr key={txn.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-sm">
                      {new Date(txn.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-sm font-medium">{txn.customerName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{txn.reference}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium font-mono text-right">
                      ₦{txn.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={txn.status} type="payment" />
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={txn.status !== 'Success'}
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
        </CardContent>
      </Card>
    </div>
  );

  // Bank Accounts Section
  const BankAccountsSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Linked Bank Accounts</h2>
        <Button
          className="bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => setShowAddBankModal(true)}
        >
          <PlusIcon className="h-4 w-4 mr-2 flex-shrink-0" />
          Add Account
        </Button>
      </div>

      {bankAccounts.length === 0 ? (
        <Card className="">
          <CardContent className="py-12 text-center">
            <div className="p-4 rounded-xl bg-gray-100 text-gray-600 w-fit mx-auto mb-4">
              <BuildingIcon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Bank Accounts Linked</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Add a bank account to enable automatic payments for your subscriptions.
            </p>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white"
              onClick={() => setShowAddBankModal(true)}
            >
              <PlusIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              Add Your First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bankAccounts.map((account) => (
            <Card key={account.id} className="">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gray-100 text-gray-600 flex-shrink-0">
                      <BuildingIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-base font-semibold">{account.bankName}</CardTitle>
                      <p className="text-sm text-muted-foreground font-mono">***{account.accountNumber.slice(-4)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
                      Linked
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Account Name</span>
                    <span className="font-medium">{account.accountName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Added On</span>
                    <span className="font-medium">
                      {new Date(account.createdDate).toLocaleDateString()}
                    </span>
                  </div>
                  {account.linkedBy?.type === 'business' && account.linkedBy.businessName && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Linked By</span>
                      <span className="font-medium text-blue-600">{account.linkedBy.businessName}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => handleUnlinkAccount(account)}
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

  // Settings Section
  const SettingsSection = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</Label>
                <Input
                  id="name"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</Label>
                <Input
                  id="phone"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-gray-500 uppercase tracking-wider">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                />
              </div>
            </div>
            <Separator />
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} className="bg-purple-600 hover:bg-purple-700 text-white">
                Save Changes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

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
        subtitle="Manage your subscriptions and payments"
        actions={
          <>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <LogOutIcon className="h-4 w-4 mr-2 flex-shrink-0" />
              Logout
            </Button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 text-white flex items-center justify-center font-semibold text-sm shadow-sm flex-shrink-0">
              AJ
            </div>
          </>
        }
      />

      <div className="flex">
        {/* Sidebar Navigation - HuaweiWorldAnalytics Style */}
        <aside className="w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 flex flex-col sticky top-16">
          {/* Navigation Section */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
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

          {/* Bottom Section */}
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
              Complete information about your {selectedSubscription?.planName} subscription
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan Name</Label>
                  <p className="text-sm font-medium">{selectedSubscription.planName}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedSubscription.status} type="subscription" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</Label>
                  <p className="text-sm font-medium font-mono">
                    ₦{selectedSubscription.amount.toLocaleString()}/{selectedSubscription.frequency.toLowerCase()}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Date</Label>
                  <p className="text-sm font-medium">
                    {new Date(selectedSubscription.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Next Billing Date</Label>
                  <p className="text-sm font-medium">
                    {new Date(selectedSubscription.nextBillingDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Mandate Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedSubscription.mandateStatus} type="mandate" />
                  </div>
                </div>
              </div>
            </div>
          )}
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
              Are you sure you want to cancel your {selectedSubscription?.planName} subscription? This action cannot be undone.
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
            <Button variant="destructive" onClick={confirmCancelSubscription}>
              Confirm Cancellation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Bank Account Modal */}
      <AddBankAccountModal
        open={showAddBankModal}
        onOpenChange={setShowAddBankModal}
        onSuccess={(newAccount) => {
          const newBankAccount: BankAccount = {
            id: `BA${Date.now()}`,
            bankName: newAccount.bankName,
            accountNumber: newAccount.accountNumber,
            accountName: newAccount.accountName || 'Account Holder',
            linkedBy: { type: 'customer' },
            createdDate: new Date().toISOString().split('T')[0],
          };
          setBankAccounts(prev => [...prev, newBankAccount]);
          toast.success(`Bank account ${newAccount.bankName} added successfully`);
        }}
      />

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
              This action cannot be undone. Please review the implications below.
            </DialogDescription>
          </DialogHeader>
          {selectedBankAccount && (
            <div className="space-y-4 py-2">
              {/* Bank Account Info */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="p-2.5 rounded-lg bg-white border border-gray-200 flex-shrink-0">
                  <BuildingIcon className="h-5 w-5 text-gray-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{selectedBankAccount.bankName}</p>
                  <p className="text-sm text-gray-500 font-mono">****{selectedBankAccount.accountNumber.slice(-4)}</p>
                </div>
              </div>

              {/* Warning - Subscriptions will be cancelled */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm font-semibold text-red-800 mb-2">⚠️ Important Warning</p>
                <p className="text-sm text-red-700 mb-3">
                  Unlinking this account will <strong>cancel all subscriptions</strong> that use it for payment:
                </p>
                {selectedBankAccount.linkedBy?.businessName && (
                  <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-red-200">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-red-800 font-medium">{selectedBankAccount.linkedBy.businessName}</span>
                    <span className="text-xs text-red-600 ml-auto">Will be cancelled</span>
                  </div>
                )}
                {!selectedBankAccount.linkedBy?.businessName && (
                  <p className="text-sm text-red-600">Any active subscriptions using this account will be cancelled.</p>
                )}
              </div>

              {/* What happens next */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-800 mb-2">What happens next:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>Subscriptions using this account will be immediately cancelled</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>You won&apos;t be charged from this account anymore</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>To resubscribe, you&apos;ll need to link a new payment method</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setShowUnlinkDialog(false)} className="flex-1 sm:flex-none">
              Keep Account
            </Button>
            <Button variant="destructive" onClick={confirmUnlinkAccount} className="flex-1 sm:flex-none">
              Unlink & Cancel Subscriptions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
