import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { MetricCard } from '@/app/components/MetricCard';
import { StatusBadge } from '@/app/components/StatusBadges';
import { EmptyState } from '@/app/components/EmptyState';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Switch } from '@/app/components/ui/switch';
import { PortalHeader } from '@/app/components/PortalHeader';
import { TablePagination } from '@/app/components/TablePagination';
import {
  UsersIcon,
  NairaIcon,
  TrendingUpIcon,
  CalendarIcon,
  SearchIcon,
  PlusIcon,
  MoreVerticalIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  CreditCardIcon,
  FileTextIcon,
  UserPlusIcon,
  KeyIcon,
  WebhookIcon,
  PackageIcon,
  BanIcon,
  LogOutIcon,
  HomeIcon,
  SettingsIcon,
  BarChartIcon,
  StoreIcon,
  ShareIcon,
  MailIcon,
  PrinterIcon,
  CopyIcon,
  CheckIcon,
  RefreshIcon,
} from '@/app/components/icons/FinanceIcons';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  tenantMetrics,
  products,
  subscriptionPlans,
  customers,
  subscriptions,
  mandates,
  transactions,
  coupons,
  teamMembers,
  settlements,
  chartData,
} from '@/data/mockData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/app/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';

// Nigerian banks list for bank account linking
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

type ActiveSection = 'overview' | 'products' | 'plans' | 'customers' | 'subscriptions' | 'mandates' | 'transactions' | 'coupons' | 'webhooks' | 'settings';

interface NavItem {
  id: ActiveSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: HomeIcon },
  { id: 'products', label: 'Products', icon: StoreIcon },
  { id: 'plans', label: 'Plans', icon: PackageIcon },
  { id: 'customers', label: 'Customers', icon: UsersIcon },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCardIcon },
  { id: 'mandates', label: 'Mandates', icon: FileTextIcon },
  { id: 'transactions', label: 'Transactions', icon: NairaIcon },
  { id: 'coupons', label: 'Coupons', icon: BarChartIcon },
  { id: 'webhooks', label: 'Webhooks', icon: WebhookIcon },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

export function TenantDashboard() {
  // Current tenant context - DSTV Nigeria
  const CURRENT_TENANT_ID = 'TNT002';

  // Filter data for current tenant
  const tenantCustomers = customers.filter(c => c.tenantId === CURRENT_TENANT_ID);
  const tenantCustomerIds = tenantCustomers.map(c => c.id);
  const tenantSubscriptions = subscriptions.filter(s => tenantCustomerIds.includes(s.customerId));
  const tenantMandates = mandates.filter(m => tenantCustomerIds.includes(m.customerId));
  const tenantTransactions = transactions.filter(t => tenantCustomerIds.includes(t.customerId));
  const tenantPlans = subscriptionPlans.filter(p => p.tenantId === CURRENT_TENANT_ID);

  // Calculate actual metrics for current tenant (TNT002 - DSTV Nigeria)
  const activeSubscriptionsCount = tenantSubscriptions.filter(s => s.status === 'Active').length;
  const successfulTransactionsCount = tenantTransactions.filter(t => t.status === 'Success').length;
  const failedTransactionsCount = tenantTransactions.filter(t => t.status === 'Failed').length;
  const totalRevenue = tenantTransactions
    .filter(t => t.status === 'Success')
    .reduce((sum, t) => sum + t.amount, 0);
  const monthlyRevenue = tenantSubscriptions
    .filter(s => s.status === 'Active')
    .reduce((sum, s) => sum + s.amount, 0);
  const upcomingRenewalsCount = tenantSubscriptions.filter(s =>
    s.status === 'Active' && new Date(s.nextBillingDate) <= new Date('2026-02-28')
  ).length;

  const [activeSection, setActiveSection] = useState<ActiveSection>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [couponSearchQuery, setCouponSearchQuery] = useState('');
  const [teamSearchQuery, setTeamSearchQuery] = useState('');

  // Pagination states
  const [productsPage, setProductsPage] = useState(1);
  const [productsPageSize, setProductsPageSize] = useState(10);
  const [couponsPage, setCouponsPage] = useState(1);
  const [couponsPageSize, setCouponsPageSize] = useState(10);
  const [teamPage, setTeamPage] = useState(1);
  const [teamPageSize, setTeamPageSize] = useState(10);
  const [customersPage, setCustomersPage] = useState(1);
  const [customersPageSize, setCustomersPageSize] = useState(10);
  const [subscriptionsPage, setSubscriptionsPage] = useState(1);
  const [subscriptionsPageSize, setSubscriptionsPageSize] = useState(10);
  const [mandatesPage, setMandatesPage] = useState(1);
  const [mandatesPageSize, setMandatesPageSize] = useState(10);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [transactionsPageSize, setTransactionsPageSize] = useState(10);

  // Modal states
  const [createPlanModal, setCreatePlanModal] = useState(false);
  const [editPlanModal, setEditPlanModal] = useState(false);
  const [deletePlanModal, setDeletePlanModal] = useState(false);
  const [addCustomerModal, setAddCustomerModal] = useState(false);
  const [viewCustomerModal, setViewCustomerModal] = useState(false);
  const [editCustomerModal, setEditCustomerModal] = useState(false);
  const [deleteCustomerModal, setDeleteCustomerModal] = useState(false);
  const [viewSubscriptionModal, setViewSubscriptionModal] = useState(false);
  const [cancelSubscriptionModal, setCancelSubscriptionModal] = useState(false);
  const [viewMandateModal, setViewMandateModal] = useState(false);
  const [cancelMandateModal, setCancelMandateModal] = useState(false);
  const [createCouponModal, setCreateCouponModal] = useState(false);
  const [editCouponModal, setEditCouponModal] = useState(false);
  const [deleteCouponModal, setDeleteCouponModal] = useState(false);
  const [inviteTeamModal, setInviteTeamModal] = useState(false);
  const [editTeamMemberModal, setEditTeamMemberModal] = useState(false);
  const [removeTeamMemberModal, setRemoveTeamMemberModal] = useState(false);
  const [regenerateKeysModal, setRegenerateKeysModal] = useState(false);
  const [addWebhookModal, setAddWebhookModal] = useState(false);
  const [editWebhookModal, setEditWebhookModal] = useState(false);
  const [deleteWebhookModal, setDeleteWebhookModal] = useState(false);
  const [testWebhookModal, setTestWebhookModal] = useState(false);
  const [createProductModal, setCreateProductModal] = useState(false);
  const [editProductModal, setEditProductModal] = useState(false);
  const [deleteProductModal, setDeleteProductModal] = useState(false);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [verificationModal, setVerificationModal] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Selected items
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [selectedMandate, setSelectedMandate] = useState<any>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [selectedTeamMember, setSelectedTeamMember] = useState<any>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);

  // Form states for Product
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productAmount, setProductAmount] = useState('');

  // Form states for Plan
  const [planName, setPlanName] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planAmount, setPlanAmount] = useState('');
  const [planFrequency, setPlanFrequency] = useState('Monthly');
  const [planTrialPeriod, setPlanTrialPeriod] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  // Form states for Customer
  const [customerName, setCustomerName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Bank account linking states for Add Customer
  const [linkBankAccount, setLinkBankAccount] = useState(false);
  const [customerBankName, setCustomerBankName] = useState('');
  const [customerAccountNumber, setCustomerAccountNumber] = useState('');
  const [customerAccountName, setCustomerAccountName] = useState('');
  const [isLookingUpAccount, setIsLookingUpAccount] = useState(false);

  // Product/Plan selection states for Add Customer
  const [customerProductId, setCustomerProductId] = useState('');
  const [customerPlanId, setCustomerPlanId] = useState('');

  // Form states for Coupon
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState('Percentage');
  const [couponValue, setCouponValue] = useState('');
  const [couponLimit, setCouponLimit] = useState('');
  const [couponValidTo, setCouponValidTo] = useState('');

  // Form states for Team Member
  const [teamMemberEmail, setTeamMemberEmail] = useState('');
  const [teamMemberRole, setTeamMemberRole] = useState('Admin');

  // Form states for Webhook
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookEvent, setWebhookEvent] = useState('payment.success');
  const [webhookSecret, setWebhookSecret] = useState('');

  // Other form states
  const [cancellationReason, setCancellationReason] = useState('');

  // Password change form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Filter logic for products - only show products for current tenant (DSTV Nigeria)
  const filteredProducts = products
    .filter((product) => product.tenantId === CURRENT_TENANT_ID)
    .filter((product) =>
      product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(productSearchQuery.toLowerCase())
    );

  // Filter logic for coupons
  const filteredCoupons = coupons.filter((coupon) =>
    coupon.code.toLowerCase().includes(couponSearchQuery.toLowerCase())
  );

  // Filter logic for team members
  const filteredTeamMembers = teamMembers.filter((member) =>
    member.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(teamSearchQuery.toLowerCase())
  );

  // Filter customers for current tenant with search
  const filteredCustomers = tenantCustomers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter subscriptions for current tenant with search
  const filteredSubscriptions = tenantSubscriptions.filter(
    (sub) =>
      sub.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.planName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter mandates for current tenant with search
  const filteredMandates = tenantMandates.filter(
    (mandate) =>
      mandate.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mandate.bankName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter transactions for current tenant with search
  const filteredTransactions = tenantTransactions.filter(
    (txn) =>
      txn.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.reference.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination logic for products
  const productsTotalPages = Math.ceil(filteredProducts.length / productsPageSize);
  const paginatedProducts = filteredProducts.slice(
    (productsPage - 1) * productsPageSize,
    productsPage * productsPageSize
  );

  // Pagination logic for coupons
  const couponsTotalPages = Math.ceil(filteredCoupons.length / couponsPageSize);
  const paginatedCoupons = filteredCoupons.slice(
    (couponsPage - 1) * couponsPageSize,
    couponsPage * couponsPageSize
  );

  // Pagination logic for team members
  const teamTotalPages = Math.ceil(filteredTeamMembers.length / teamPageSize);
  const paginatedTeamMembers = filteredTeamMembers.slice(
    (teamPage - 1) * teamPageSize,
    teamPage * teamPageSize
  );

  // Pagination logic for customers (tenant-specific)
  const customersTotalPages = Math.ceil(filteredCustomers.length / customersPageSize);
  const paginatedCustomers = filteredCustomers.slice(
    (customersPage - 1) * customersPageSize,
    customersPage * customersPageSize
  );

  // Pagination logic for subscriptions (tenant-specific)
  const subscriptionsTotalPages = Math.ceil(filteredSubscriptions.length / subscriptionsPageSize);
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (subscriptionsPage - 1) * subscriptionsPageSize,
    subscriptionsPage * subscriptionsPageSize
  );

  // Pagination logic for mandates (tenant-specific)
  const mandatesTotalPages = Math.ceil(filteredMandates.length / mandatesPageSize);
  const paginatedMandates = filteredMandates.slice(
    (mandatesPage - 1) * mandatesPageSize,
    mandatesPage * mandatesPageSize
  );

  // Pagination logic for transactions (tenant-specific)
  const transactionsTotalPages = Math.ceil(filteredTransactions.length / transactionsPageSize);
  const paginatedTransactions = filteredTransactions.slice(
    (transactionsPage - 1) * transactionsPageSize,
    transactionsPage * transactionsPageSize
  );

  // Product handlers
  const handleCreateProduct = () => {
    setProductName('');
    setProductDescription('');
    setProductAmount('');
    setCreateProductModal(true);
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setProductName(product.name);
    setProductDescription(product.description);
    setProductAmount(product.amount.toString());
    setEditProductModal(true);
  };

  const handleDeleteProduct = (product: any) => {
    setSelectedProduct(product);
    setDeleteProductModal(true);
  };

  const confirmCreateProduct = () => {
    toast.success(`Product "${productName}" has been created`);
    setCreateProductModal(false);
  };

  const confirmEditProduct = () => {
    toast.success(`Product "${productName}" has been updated`);
    setEditProductModal(false);
  };

  const confirmDeleteProduct = () => {
    toast.success(`Product "${selectedProduct?.name}" has been deleted`);
    setDeleteProductModal(false);
  };

  // Product selection handler for Plan creation
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find((p) => p.id === productId);
    if (product) {
      setPlanAmount(product.amount.toString());
      setPlanDescription(product.description);
    }
  };

  // Plan handlers
  const handleCreatePlan = () => {
    setPlanName('');
    setPlanDescription('');
    setPlanAmount('');
    setPlanFrequency('Monthly');
    setPlanTrialPeriod('');
    setSelectedProductId('');
    setCreatePlanModal(true);
  };

  const handleEditPlan = (plan: any) => {
    setSelectedPlan(plan);
    setPlanName(plan.name);
    setPlanDescription(plan.description);
    setPlanAmount(plan.amount.toString());
    setPlanFrequency(plan.frequency);
    setPlanTrialPeriod(plan.trialPeriod.toString());
    setEditPlanModal(true);
  };

  const handleDeletePlan = (plan: any) => {
    setSelectedPlan(plan);
    setDeletePlanModal(true);
  };

  const confirmCreatePlan = () => {
    toast.success(`Plan "${planName}" has been created`);
    setCreatePlanModal(false);
  };

  const confirmEditPlan = () => {
    toast.success(`Plan "${planName}" has been updated`);
    setEditPlanModal(false);
  };

  const confirmDeletePlan = () => {
    toast.success(`Plan "${selectedPlan?.name}" has been deleted`);
    setDeletePlanModal(false);
  };

  // Customer handlers
  const handleAddCustomer = () => {
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setAddCustomerModal(true);
  };

  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setViewCustomerModal(true);
  };

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerEmail(customer.email);
    setCustomerPhone(customer.phone || '');
    setEditCustomerModal(true);
  };

  const handleDeleteCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setDeleteCustomerModal(true);
  };

  const handleCustomerAccountNumberChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 10) {
      setCustomerAccountNumber(cleaned);

      // Simulate account name lookup when 10 digits entered
      if (cleaned.length === 10 && customerBankName) {
        setIsLookingUpAccount(true);
        setTimeout(() => {
          // Simulate getting account name from bank
          const accountName = 'ADEBAYO JOHNSON OLUSEGUN';
          setCustomerAccountName(accountName);

          // Auto-populate first and last name
          const nameParts = accountName.split(' ');
          if (nameParts.length >= 1) {
            setCustomerName(nameParts[0]); // First name
          }
          if (nameParts.length >= 2) {
            setCustomerLastName(nameParts.slice(1).join(' ')); // Last name(s)
          }
          setIsLookingUpAccount(false);
        }, 1500);
      } else {
        setCustomerAccountName('');
      }
    }
  };

  const resetAddCustomerForm = () => {
    setCustomerName('');
    setCustomerLastName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setLinkBankAccount(false);
    setCustomerBankName('');
    setCustomerAccountNumber('');
    setCustomerAccountName('');
    setIsLookingUpAccount(false);
    setCustomerProductId('');
    setCustomerPlanId('');
  };

  const confirmAddCustomer = () => {
    // First validate basic required customer info
    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    if (!customerEmail.trim()) {
      toast.error('Please enter customer email address');
      return;
    }
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (linkBankAccount) {
      // Validate bank account fields
      if (!customerBankName || !customerAccountNumber || !customerAccountName) {
        toast.error('Please complete all bank account fields');
        return;
      }
      if (customerAccountNumber.length !== 10) {
        toast.error('Account number must be 10 digits');
        return;
      }
      // Validate plan selection when linking bank account
      if (!customerPlanId) {
        toast.error('Please select a subscription plan');
        return;
      }

      // Get the selected plan details
      const selectedPlan = subscriptionPlans.find(p => p.id === customerPlanId);
      const selectedProduct = products.find(p => p.id === customerProductId);

      // Create new mandate for this customer with actual plan details
      const fullName = customerLastName ? `${customerName} ${customerLastName}` : customerName;
      const newMandate = {
        id: `MND${Date.now()}`,
        customerId: `CUST${Date.now()}`,
        customerName: fullName || customerAccountName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        bankName: customerBankName,
        accountNumber: customerAccountNumber,
        status: 'Biller Initiated',
        amount: selectedPlan?.amount || 0,
        frequency: selectedPlan?.frequency || 'Monthly',
        planId: customerPlanId,
        planName: selectedPlan?.name,
        productName: selectedProduct?.name,
        createdDate: new Date().toISOString().split('T')[0],
      };

      // Set this mandate for verification modal
      setSelectedMandate(newMandate);

      // Close add customer modal and reset form
      setAddCustomerModal(false);
      resetAddCustomerForm();

      // Show success message and open verification modal
      toast.success('Customer added with bank account. Share verification details below.');
      setCopiedToClipboard(false);
      setVerificationModal(true);
    } else {
      toast.success(`Customer "${customerName}" has been added`);
      setAddCustomerModal(false);
      resetAddCustomerForm();
    }
  };

  const confirmEditCustomer = () => {
    toast.success(`Customer "${customerName}" has been updated`);
    setEditCustomerModal(false);
  };

  const confirmDeleteCustomer = () => {
    toast.success(`Customer "${selectedCustomer?.name}" has been deleted`);
    setDeleteCustomerModal(false);
  };

  // Subscription handlers
  const handleViewSubscription = (subscription: any) => {
    setSelectedSubscription(subscription);
    setViewSubscriptionModal(true);
  };

  const handleCancelSubscription = (subscription: any) => {
    setSelectedSubscription(subscription);
    setCancellationReason('');
    setCancelSubscriptionModal(true);
  };

  const confirmCancelSubscription = () => {
    toast.success(`Subscription has been cancelled`);
    setCancelSubscriptionModal(false);
  };

  // Mandate handlers
  const handleViewMandate = (mandate: any) => {
    setSelectedMandate(mandate);
    setViewMandateModal(true);
  };

  const handleCancelMandate = (mandate: any) => {
    setSelectedMandate(mandate);
    setCancelMandateModal(true);
  };

  const confirmCancelMandate = () => {
    toast.success(`Mandate has been cancelled`);
    setCancelMandateModal(false);
  };

  // Verification handlers
  const handleSendVerification = (mandate: any) => {
    setSelectedMandate(mandate);
    setCopiedToClipboard(false);
    setVerificationModal(true);
  };

  const handleSendVerificationForCustomer = (customer: any) => {
    // Find the mandate for this customer
    const customerMandate = mandates.find(m => m.customerId === customer.id);
    if (customerMandate) {
      setSelectedMandate(customerMandate);
      setCopiedToClipboard(false);
      setVerificationModal(true);
    } else {
      toast.error('No linked bank account found for this customer');
    }
  };

  const getVerificationText = () => {
    if (!selectedMandate) return '';

    return `MANDATE VERIFICATION INSTRUCTIONS
====================================

Dear ${selectedMandate.customerName},

To verify your bank account for direct debit, please make a transfer of exactly NGN 50.00 to the account below:

YOUR BANK ACCOUNT (Source)
--------------------------
Bank: ${selectedMandate.bankName}
Account: ***${selectedMandate.accountNumber.slice(-4)}

RECCUR VERIFICATION ACCOUNT (Destination)
-----------------------------------------
Bank: Sterling Bank
Account Number: 0123456789
Account Name: Reccur Technologies Ltd
Amount: NGN 50.00

IMPORTANT INSTRUCTIONS:
1. Transfer exactly NGN 50.00 from your linked bank account
2. Use your registered account ending in ${selectedMandate.accountNumber.slice(-4)}
3. The transfer must come from the same account linked to your mandate
4. Verification is usually completed within 24 hours

This one-time verification confirms that you own the bank account and authorizes future direct debits.

Thank you for your cooperation.

Best regards,
DSTV Nigeria`;
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getVerificationText());
      setCopiedToClipboard(true);
      toast.success('Verification details copied to clipboard');
      setTimeout(() => setCopiedToClipboard(false), 3000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleSendEmail = () => {
    if (!selectedMandate?.customerEmail) {
      toast.error('No email address available for this customer');
      return;
    }

    const subject = encodeURIComponent('Direct Debit Verification - Transfer ₦50.00');
    const body = encodeURIComponent(getVerificationText());
    window.open(`mailto:${selectedMandate.customerEmail}?subject=${subject}&body=${body}`, '_blank');
    toast.success(`Opening email client for ${selectedMandate.customerEmail}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    if (!selectedMandate?.customerPhone) {
      toast.error('No phone number available for this customer');
      return;
    }

    // Clean the phone number - remove spaces, dashes, and ensure it has country code
    let phoneNumber = selectedMandate.customerPhone.replace(/[\s-()]/g, '');

    // If number starts with 0, replace with Nigeria country code
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '234' + phoneNumber.substring(1);
    }
    // If number doesn't start with +, add it for international format
    if (!phoneNumber.startsWith('+') && !phoneNumber.startsWith('234')) {
      phoneNumber = '234' + phoneNumber;
    }
    // Remove + if present (WhatsApp API doesn't need it)
    phoneNumber = phoneNumber.replace('+', '');

    const message = encodeURIComponent(getVerificationText());
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    window.open(whatsappUrl, '_blank');
    toast.success(`Opening WhatsApp for ${selectedMandate.customerPhone}`);
  };

  // Coupon handlers
  const handleCreateCoupon = () => {
    setCouponCode('');
    setCouponType('Percentage');
    setCouponValue('');
    setCouponLimit('');
    setCouponValidTo('');
    setCreateCouponModal(true);
  };

  const handleEditCoupon = (coupon: any) => {
    setSelectedCoupon(coupon);
    setCouponCode(coupon.code);
    setCouponType(coupon.type);
    setCouponValue(coupon.value.toString());
    setCouponLimit(coupon.usageLimit.toString());
    setCouponValidTo(coupon.validTo);
    setEditCouponModal(true);
  };

  const handleDeleteCoupon = (coupon: any) => {
    setSelectedCoupon(coupon);
    setDeleteCouponModal(true);
  };

  const confirmCreateCoupon = () => {
    toast.success(`Coupon "${couponCode}" has been created`);
    setCreateCouponModal(false);
  };

  const confirmEditCoupon = () => {
    toast.success(`Coupon "${couponCode}" has been updated`);
    setEditCouponModal(false);
  };

  const confirmDeleteCoupon = () => {
    toast.success(`Coupon "${selectedCoupon?.code}" has been deleted`);
    setDeleteCouponModal(false);
  };

  // Team member handlers
  const handleInviteTeam = () => {
    setTeamMemberEmail('');
    setTeamMemberRole('Admin');
    setInviteTeamModal(true);
  };

  const handleEditTeamMember = (member: any) => {
    setSelectedTeamMember(member);
    setTeamMemberRole(member.role);
    setEditTeamMemberModal(true);
  };

  const handleRemoveTeamMember = (member: any) => {
    setSelectedTeamMember(member);
    setRemoveTeamMemberModal(true);
  };

  const confirmInviteTeam = () => {
    toast.success(`Invitation sent to ${teamMemberEmail}`);
    setInviteTeamModal(false);
  };

  const confirmEditTeamMember = () => {
    toast.success(`Team member role updated`);
    setEditTeamMemberModal(false);
  };

  const confirmRemoveTeamMember = () => {
    toast.success(`Team member removed`);
    setRemoveTeamMemberModal(false);
  };

  // API Keys handlers
  const handleRegenerateKeys = () => {
    setRegenerateKeysModal(true);
  };

  const confirmRegenerateKeys = () => {
    toast.success('API keys have been regenerated');
    setRegenerateKeysModal(false);
  };

  // Webhook handlers
  const handleAddWebhook = () => {
    setWebhookUrl('');
    setWebhookEvent('payment.success');
    setWebhookSecret('');
    setAddWebhookModal(true);
  };

  const handleTestWebhook = (webhook: any) => {
    setSelectedWebhook(webhook);
    setTestWebhookModal(true);
  };

  const confirmAddWebhook = () => {
    toast.success('Webhook has been added');
    setAddWebhookModal(false);
  };

  const confirmTestWebhook = () => {
    toast.success('Test event sent successfully');
    setTestWebhookModal(false);
  };

  const handleLogout = () => {
    toast.success('Logged out successfully');
    window.location.href = '/';
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    toast.success('Password changed successfully');
    setChangePasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Overview Section Component
  const OverviewSection = () => (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Dashboard for <span className="font-medium text-foreground">DSTV Nigeria</span>
        </p>
      </div>

      {/* KPI Cards - HuaweiWorldAnalytics Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Subscriptions Card */}
        <Card className="">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Active Subscriptions
                </p>
                <p className="text-3xl font-bold font-mono tracking-tight text-foreground">
                  {activeSubscriptionsCount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {upcomingRenewalsCount} renewals this month
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-100 text-gray-600 flex-shrink-0">
                <UsersIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Recurring Revenue Card */}
        <Card className="">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Monthly Revenue
                </p>
                <p className="text-3xl font-bold font-mono tracking-tight text-foreground">
                  ₦{monthlyRevenue.toLocaleString()}
                </p>
                <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                  <TrendingUpIcon className="h-3 w-3" />
                  +15.3% from last month
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-100 text-gray-600 flex-shrink-0">
                <NairaIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Successful Charges Card */}
        <Card className="">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Successful Charges
                </p>
                <p className="text-3xl font-bold font-mono tracking-tight text-foreground">
                  {successfulTransactionsCount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {failedTransactionsCount} failed this period
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-100 text-gray-600 flex-shrink-0">
                <TrendingUpIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Renewals Card */}
        <Card className="">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Upcoming Renewals
                </p>
                <p className="text-3xl font-bold font-mono tracking-tight text-foreground">
                  {upcomingRenewalsCount}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Due within 30 days
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gray-100 text-gray-600 flex-shrink-0">
                <CalendarIcon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Growth Chart - Full Width */}
      <Card className="">
        <CardHeader>
          <CardTitle className="text-foreground">Revenue Growth</CardTitle>
          <p className="text-sm text-muted-foreground">Monthly revenue over the past 12 months</p>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.revenue} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenueGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorRevenueGreenStroke" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="month"
                  stroke="#9ca3af"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={12}
                  width={80}
                  tickFormatter={(value) => `₦${(value / 1000000).toFixed(0)}M`}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [`₦${(value / 1000000).toFixed(1)}M`, 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="url(#colorRevenueGreenStroke)"
                  strokeWidth={2.5}
                  fill="url(#colorRevenueGreen)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Subscriber Growth Chart - Full Width */}
      <Card className="">
        <CardHeader>
          <CardTitle className="text-foreground">Subscriber Growth</CardTitle>
          <p className="text-sm text-muted-foreground">Active subscribers over the past 12 months</p>
        </CardHeader>
        <CardContent>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.subscribers} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} width={50} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), 'Subscribers']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff' }}
                />
                <Bar dataKey="count" fill="url(#colorBar)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tenantSubscriptions.slice(0, 5).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors duration-200">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{sub.customerName}</div>
                    <div className="text-sm text-muted-foreground">{sub.planName}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="font-medium font-mono text-foreground">₦{sub.amount.toLocaleString()}</div>
                    <StatusBadge status={sub.status} type="subscription" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tenantTransactions.slice(0, 5).map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors duration-200">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{txn.customerName}</div>
                    <div className="text-sm text-muted-foreground font-mono">{txn.reference}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="font-medium font-mono text-foreground">₦{txn.amount.toLocaleString()}</div>
                    <StatusBadge status={txn.status} type="payment" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Products Section Component
  const ProductsSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Products</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your product catalog</p>
        </div>
        <Button onClick={handleCreateProduct} className="bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>
      <Card className="">
        <CardHeader>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Product Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-150">
                    <td className="py-4 px-4">
                      <div className="font-medium text-foreground">{product.name}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-muted-foreground max-w-xs truncate">{product.description}</div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="font-medium font-mono text-foreground">₦{product.amount.toLocaleString()}</div>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={product.status} type="general" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-muted-foreground">{product.createdDate}</div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                            <EditIcon className="h-4 w-4 mr-2" />
                            Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteProduct(product)} className="text-red-600">
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={productsPage}
            totalPages={productsTotalPages}
            pageSize={productsPageSize}
            totalItems={filteredProducts.length}
            onPageChange={setProductsPage}
            onPageSizeChange={setProductsPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Plans Section Component
  const PlansSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Subscription Plans</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure pricing and billing options</p>
        </div>
        <Button onClick={handleCreatePlan} className="bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subscriptionPlans.filter(plan => plan.tenantId === CURRENT_TENANT_ID).map((plan) => (
          <Card key={plan.id} className="">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg text-foreground">{plan.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVerticalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                      <EditIcon className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => handleDeletePlan(plan)}>
                      <TrashIcon className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-mono text-foreground mb-4">
                ₦{plan.amount.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">/{plan.frequency.toLowerCase()}</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Subscribers</span>
                  <span className="font-medium text-foreground">{plan.subscribers}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Trial Period</span>
                  <span className="font-medium text-foreground">{plan.trialPeriod} days</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={plan.status} type="general" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Customers Section Component
  const CustomersSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Customers</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your customer base</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={handleAddCustomer} className="bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm">
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>
      <Card className="">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Subscriptions</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Paid</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-150">
                    <td className="py-4 px-4 font-medium text-foreground">{customer.name}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{customer.email}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={customer.status} type="general" />
                    </td>
                    <td className="py-4 px-4 text-sm text-foreground text-right">{customer.subscriptions}</td>
                    <td className="py-4 px-4 text-sm font-mono text-foreground text-right">₦{customer.totalPaid.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewCustomer(customer)}>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditCustomer(customer)}>
                            <EditIcon className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendVerificationForCustomer(customer)}>
                            <ShareIcon className="h-4 w-4 mr-2" />
                            Send Verification
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCustomer(customer)}>
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={customersPage}
            totalPages={customersTotalPages}
            pageSize={customersPageSize}
            totalItems={filteredCustomers.length}
            onPageChange={setCustomersPage}
            onPageSizeChange={setCustomersPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Subscriptions Section Component
  const SubscriptionsSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">All Subscriptions</h2>
        <p className="text-sm text-muted-foreground mt-1">Track and manage active subscriptions</p>
      </div>
      <Card className="">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Next Billing</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Mandate</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSubscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-150">
                    <td className="py-4 px-4 font-medium text-foreground">{sub.customerName}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{sub.planName}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={sub.status} type="subscription" />
                    </td>
                    <td className="py-4 px-4 text-sm font-mono text-foreground text-right">₦{sub.amount.toLocaleString()}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {new Date(sub.nextBillingDate).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={sub.mandateStatus} type="mandate" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewSubscription(sub)}>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {sub.status === 'Active' && (
                            <DropdownMenuItem className="text-red-600" onClick={() => handleCancelSubscription(sub)}>
                              <BanIcon className="h-4 w-4 mr-2" />
                              Cancel Subscription
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={subscriptionsPage}
            totalPages={subscriptionsTotalPages}
            pageSize={subscriptionsPageSize}
            totalItems={subscriptions.length}
            onPageChange={setSubscriptionsPage}
            onPageSizeChange={setSubscriptionsPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Mandates Section Component
  const [isRefreshingMandates, setIsRefreshingMandates] = useState(false);

  const handleRefreshMandates = () => {
    setIsRefreshingMandates(true);
    // Simulate API call to refresh mandate statuses from NIBSS
    setTimeout(() => {
      setIsRefreshingMandates(false);
      toast.success('Mandate statuses refreshed');
    }, 1500);
  };

  const MandatesSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Direct Debit Mandates</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage bank account authorizations</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefreshMandates}
          disabled={isRefreshingMandates}
          className="gap-2"
        >
          <RefreshIcon className={`h-4 w-4 ${isRefreshingMandates ? 'animate-spin' : ''}`} />
          {isRefreshingMandates ? 'Refreshing...' : 'Refresh Status'}
        </Button>
      </div>
      <Card className="">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Bank</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Account</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Frequency</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMandates.map((mandate) => (
                  <tr key={mandate.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-150">
                    <td className="py-4 px-4 font-medium text-foreground">{mandate.customerName}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{mandate.bankName}</td>
                    <td className="py-4 px-4 text-sm font-mono text-muted-foreground">***{mandate.accountNumber.slice(-4)}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={mandate.status} type="mandate" />
                    </td>
                    <td className="py-4 px-4 text-sm font-mono text-foreground text-right">₦{mandate.amount.toLocaleString()}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">{mandate.frequency}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {new Date(mandate.createdDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewMandate(mandate)}>
                            <EyeIcon className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleSendVerification(mandate)}>
                            <ShareIcon className="h-4 w-4 mr-2" />
                            Send Verification
                          </DropdownMenuItem>
                          {mandate.status === 'Active' && (
                            <DropdownMenuItem className="text-red-600" onClick={() => handleCancelMandate(mandate)}>
                              <BanIcon className="h-4 w-4 mr-2" />
                              Cancel Mandate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={mandatesPage}
            totalPages={mandatesTotalPages}
            pageSize={mandatesPageSize}
            totalItems={mandates.length}
            onPageChange={setMandatesPage}
            onPageSizeChange={setMandatesPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Transactions Section Component
  const TransactionsSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Transaction History</h2>
        <p className="text-sm text-muted-foreground mt-1">View all payment transactions</p>
      </div>
      <Card className="">
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Reference</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Retry Count</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-150">
                    <td className="py-4 px-4 font-mono text-sm text-foreground">{txn.reference}</td>
                    <td className="py-4 px-4 text-sm text-foreground">{txn.customerName}</td>
                    <td className="py-4 px-4 text-sm font-mono text-foreground text-right">₦{txn.amount.toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={txn.status} type="payment" />
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground text-right">{txn.retryCount}</td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                      {new Date(txn.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={transactionsPage}
            totalPages={transactionsTotalPages}
            pageSize={transactionsPageSize}
            totalItems={transactions.length}
            onPageChange={setTransactionsPage}
            onPageSizeChange={setTransactionsPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Coupons Section Component
  const CouponsSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Discount Coupons</h2>
          <p className="text-sm text-muted-foreground mt-1">Create and manage promotional codes</p>
        </div>
        <Button onClick={handleCreateCoupon} className="bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </div>
      <Card className="">
        <CardHeader>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search coupons..."
              value={couponSearchQuery}
              onChange={(e) => setCouponSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Code</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Discount</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Usage</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Valid Until</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCoupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-150">
                    <td className="py-4 px-4">
                      <div className="font-mono font-medium text-foreground">{coupon.code}</div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="text-sm font-mono text-foreground">
                        {coupon.type === 'Percentage' ? `${coupon.value}%` : `₦${coupon.value.toLocaleString()}`}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="text-sm text-foreground">
                        {coupon.usageCount}/{coupon.usageLimit}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-muted-foreground">
                        {new Date(coupon.validTo).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={coupon.status} type="general" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditCoupon(coupon)}>
                            <EditIcon className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCoupon(coupon)}>
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={couponsPage}
            totalPages={couponsTotalPages}
            pageSize={couponsPageSize}
            totalItems={filteredCoupons.length}
            onPageChange={setCouponsPage}
            onPageSizeChange={setCouponsPageSize}
          />
        </CardContent>
      </Card>
    </div>
  );

  // Webhooks Section Component
  const WebhooksSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Webhooks</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure API keys and webhook endpoints</p>
        </div>
        <Button onClick={handleAddWebhook} className="bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm">
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Webhook
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="">
          <CardHeader>
            <CardTitle className="text-foreground">API Keys</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Public Key</div>
                <div className="font-mono text-sm text-foreground break-all">
                  pk_test_1234567890abcdefghijklmnopqr
                </div>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Secret Key</div>
                <div className="font-mono text-sm text-muted-foreground">
                  sk_test_••••••••••••••••••••••••••••
                </div>
              </div>
              <Button variant="outline" className="w-full transition-colors duration-200" onClick={handleRegenerateKeys}>
                <KeyIcon className="h-4 w-4 mr-2" />
                Regenerate Keys
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader>
            <CardTitle className="text-foreground">Webhook Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={WebhookIcon}
              title="No webhooks configured"
              description="Set up webhook endpoints to receive real-time notifications"
              actionLabel="Add Webhook"
              onAction={handleAddWebhook}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Settings Section Component
  const SettingsSection = () => (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage team members and account settings</p>
      </div>

      {/* Team Members - Full Width */}
      <Card className="">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-foreground">Team Members</CardTitle>
            <Button onClick={handleInviteTeam} className="bg-primary hover:bg-primary/90 transition-colors duration-200 shadow-sm">
              <UserPlusIcon className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </div>
          <div className="relative max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              value={teamSearchQuery}
              onChange={(e) => setTeamSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Active</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTeamMembers.map((member) => (
                  <tr key={member.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-150">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium text-sm flex-shrink-0">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="font-medium text-foreground">{member.name}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-foreground">{member.role}</div>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={member.status} type="general" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm text-muted-foreground">{member.lastActive}</div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVerticalIcon className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditTeamMember(member)}>
                            <EditIcon className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleRemoveTeamMember(member)}>
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <TablePagination
            currentPage={teamPage}
            totalPages={teamTotalPages}
            pageSize={teamPageSize}
            totalItems={filteredTeamMembers.length}
            onPageChange={setTeamPage}
            onPageSizeChange={setTeamPageSize}
          />
        </CardContent>
      </Card>

      {/* Settlements - Full Width Grid */}
      <Card className="">
        <CardHeader>
          <CardTitle className="text-foreground">Settlements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {settlements.map((settlement) => (
              <div key={settlement.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors duration-200">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold font-mono text-foreground">₦{settlement.amount.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground font-mono">{settlement.reference}</div>
                  <div className="text-xs text-muted-foreground mt-1">{settlement.bankAccount}</div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <StatusBadge status={settlement.status} type="general" />
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(settlement.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'products':
        return <ProductsSection />;
      case 'plans':
        return <PlansSection />;
      case 'customers':
        return <CustomersSection />;
      case 'subscriptions':
        return <SubscriptionsSection />;
      case 'mandates':
        return <MandatesSection />;
      case 'transactions':
        return <TransactionsSection />;
      case 'coupons':
        return <CouponsSection />;
      case 'webhooks':
        return <WebhooksSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PortalHeader
        title="Business Dashboard"
        subtitle="DSTV Nigeria"
        userMenu={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200">
                <span className="text-sm font-medium text-foreground">Adewale Balogun</span>
                <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold shadow-sm cursor-pointer">
                  AB
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setChangePasswordModal(true)}>
                <KeyIcon className="w-4 h-4 mr-2" />
                Change Password
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOutIcon className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            <button onClick={() => toast.info('API documentation coming soon')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <span>API Docs</span>
            </button>
            <button onClick={() => toast.info('Help & Support coming soon')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 cursor-pointer">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Help & Support</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gradient-to-br from-slate-100/80 via-gray-100/50 to-purple-50/30 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {renderActiveSection()}
          </div>
        </main>
      </div>

      {/* Create Plan Modal */}
      <Dialog open={createPlanModal} onOpenChange={setCreatePlanModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Subscription Plan</DialogTitle>
            <DialogDescription>Add a new subscription plan for your customers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="product-select">Select Product</Label>
              <Select value={selectedProductId} onValueChange={handleProductSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a product..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ₦{product.amount.toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Selecting a product will auto-populate amount and description</p>
            </div>
            <div>
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input
                id="plan-name"
                placeholder="e.g., Premium Monthly Plan"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="plan-description">Description</Label>
              <Textarea
                id="plan-description"
                placeholder="Brief description of the plan"
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plan-amount">Amount (₦)</Label>
                <Input
                  id="plan-amount"
                  type="number"
                  placeholder="e.g., 5000"
                  value={planAmount}
                  onChange={(e) => setPlanAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="plan-frequency">Billing Frequency</Label>
                <Select value={planFrequency} onValueChange={setPlanFrequency}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="plan-trial">Trial Period (days)</Label>
              <Input
                id="plan-trial"
                type="number"
                placeholder="e.g., 7"
                value={planTrialPeriod}
                onChange={(e) => setPlanTrialPeriod(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatePlanModal(false)}>Cancel</Button>
            <Button onClick={confirmCreatePlan} className="bg-green-600 hover:bg-green-700">Create Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Modal */}
      <Dialog open={editPlanModal} onOpenChange={setEditPlanModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Plan</DialogTitle>
            <DialogDescription>Update plan details for {selectedPlan?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-plan-name">Plan Name</Label>
              <Input
                id="edit-plan-name"
                placeholder="e.g., Premium Plan"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-plan-description">Description</Label>
              <Textarea
                id="edit-plan-description"
                placeholder="Brief description of the plan"
                value={planDescription}
                onChange={(e) => setPlanDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-plan-amount">Amount (₦)</Label>
                <Input
                  id="edit-plan-amount"
                  type="number"
                  placeholder="e.g., 5000"
                  value={planAmount}
                  onChange={(e) => setPlanAmount(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-plan-frequency">Billing Frequency</Label>
                <Select value={planFrequency} onValueChange={setPlanFrequency}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-plan-trial">Trial Period (days)</Label>
              <Input
                id="edit-plan-trial"
                type="number"
                placeholder="e.g., 7"
                value={planTrialPeriod}
                onChange={(e) => setPlanTrialPeriod(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlanModal(false)}>Cancel</Button>
            <Button onClick={confirmEditPlan} className="bg-green-600 hover:bg-green-700">Update Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Modal */}
      <Dialog open={deletePlanModal} onOpenChange={setDeletePlanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedPlan?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePlanModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeletePlan}>Delete Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Customer Sheet */}
      <Sheet open={addCustomerModal} onOpenChange={(open) => {
        setAddCustomerModal(open);
        if (!open) resetAddCustomerForm();
      }}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-8">
          <SheetHeader className="mb-10">
            <SheetTitle className="text-2xl font-bold">Add Customer</SheetTitle>
            <SheetDescription className="text-base">
              Create a new customer account and optionally link their bank account
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-8">
            {/* Personal Details Section */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Personal Details
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-first-name" className="text-sm font-medium">First Name</Label>
                  <Input
                    id="customer-first-name"
                    placeholder="John"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-last-name" className="text-sm font-medium">Last Name</Label>
                  <Input
                    id="customer-last-name"
                    placeholder="Doe"
                    value={customerLastName}
                    onChange={(e) => setCustomerLastName(e.target.value)}
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="customer-email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="john@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="mt-1.5 h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-phone" className="text-sm font-medium">Phone Number</Label>
                  <Input
                    id="customer-phone"
                    type="tel"
                    placeholder="+234 801 234 5678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="mt-1.5 h-11"
                  />
                </div>
              </div>
            </div>

            {/* Bank Account Toggle - Clean switch */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border">
              <div>
                <p className="font-medium">Link Bank Account</p>
                <p className="text-sm text-muted-foreground">Add customer's bank details now</p>
              </div>
              <Switch
                checked={linkBankAccount}
                onCheckedChange={(checked) => {
                  setLinkBankAccount(checked);
                  if (!checked) {
                    setCustomerBankName('');
                    setCustomerAccountNumber('');
                    setCustomerAccountName('');
                  }
                }}
              />
            </div>

            {/* Bank Details Section - Only when toggle is on */}
            {linkBankAccount && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Bank Account Details
                </p>
                <div>
                  <Label htmlFor="customer-bank" className="text-sm font-medium">Bank Name</Label>
                  <Select value={customerBankName} onValueChange={(value) => {
                    setCustomerBankName(value);
                    // Reset account lookup when bank changes
                    if (customerAccountNumber.length === 10) {
                      setIsLookingUpAccount(true);
                      setTimeout(() => {
                        // Simulate getting account name from bank
                        const accountName = 'ADEBAYO JOHNSON OLUSEGUN';
                        setCustomerAccountName(accountName);

                        // Auto-populate first and last name
                        const nameParts = accountName.split(' ');
                        if (nameParts.length >= 1) {
                          setCustomerName(nameParts[0]); // First name
                        }
                        if (nameParts.length >= 2) {
                          setCustomerLastName(nameParts.slice(1).join(' ')); // Last name(s)
                        }
                        setIsLookingUpAccount(false);
                      }, 1500);
                    }
                  }}>
                    <SelectTrigger id="customer-bank" className="mt-1.5 h-11">
                      <SelectValue placeholder="Select bank" />
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
                  <Label htmlFor="customer-account-number" className="text-sm font-medium">Account Number</Label>
                  <Input
                    id="customer-account-number"
                    placeholder="Enter 10-digit account number"
                    value={customerAccountNumber}
                    onChange={(e) => handleCustomerAccountNumberChange(e.target.value)}
                    disabled={!customerBankName}
                    className="mt-1.5 h-11 font-mono"
                  />
                  {isLookingUpAccount && (
                    <p className="text-sm text-muted-foreground mt-2">Looking up account...</p>
                  )}
                </div>
                {customerAccountName && !isLookingUpAccount && (
                  <div className="p-4 rounded-lg bg-green-50/50 border border-green-200/50">
                    <p className="text-xs text-muted-foreground mb-1">Verified Account Name</p>
                    <p className="font-semibold text-green-900">{customerAccountName}</p>
                  </div>
                )}
              </div>
            )}

            {/* Subscription Plan Section - Only when bank account is verified */}
            {linkBankAccount && customerAccountName && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Subscription Plan
                </p>
                <div>
                  <Label className="text-sm font-medium">Select Plan</Label>
                  <Select value={customerPlanId} onValueChange={(val) => {
                    setCustomerPlanId(val);
                    // Auto-set product ID from plan
                    const plan = subscriptionPlans.find(p => p.id === val);
                    if (plan) setCustomerProductId(plan.productId || '');
                  }}>
                    <SelectTrigger className="mt-1.5 h-11">
                      <SelectValue placeholder="Select a subscription plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {subscriptionPlans.filter(p => p.status === 'Active').map(plan => {
                        const product = products.find(pr => pr.id === plan.productId);
                        return (
                          <SelectItem key={plan.id} value={plan.id}>
                            <span className="font-medium">{plan.name}</span>
                            <span className="text-muted-foreground ml-2">
                              {product?.name && `(${product.name}) `}- ₦{plan.amount.toLocaleString()}/{plan.frequency.toLowerCase()}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {customerPlanId && (() => {
                  const selectedPlan = subscriptionPlans.find(p => p.id === customerPlanId);
                  const selectedProduct = products.find(pr => pr.id === selectedPlan?.productId);
                  return (
                    <div className="p-5 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                          <CheckIcon className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-900">{selectedPlan?.name}</p>
                          <p className="text-xs text-green-700">{selectedProduct?.name}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-green-200">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Amount</p>
                          <p className="text-xl font-bold font-mono text-green-900">₦{selectedPlan?.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Billing Cycle</p>
                          <p className="text-lg font-semibold text-green-900">{selectedPlan?.frequency}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Info note - subtle */}
            {!linkBankAccount && (
              <div className="p-4 rounded-lg bg-muted/30 border">
                <p className="text-sm text-muted-foreground">
                  A welcome email will be sent with password setup instructions. Bank account can be added later during subscription.
                </p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 mt-8 pt-6 border-t">
            <Button variant="outline" className="flex-1" onClick={() => {
              setAddCustomerModal(false);
              resetAddCustomerForm();
            }}>
              Cancel
            </Button>
            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={confirmAddCustomer}>
              {linkBankAccount ? 'Add & Continue' : 'Send Invite'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* View Customer Modal */}
      <Dialog open={viewCustomerModal} onOpenChange={setViewCustomerModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>Complete information about {selectedCustomer?.name}</DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Name</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedCustomer.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Email</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedCustomer.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedCustomer.status} type="general" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Active Subscriptions</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedCustomer.subscriptions}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Total Paid</Label>
                  <p className="text-sm text-gray-900 mt-1">₦{selectedCustomer.totalPaid.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Customer Since</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedCustomer.joinedDate || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewCustomerModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog open={editCustomerModal} onOpenChange={setEditCustomerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-customer-name">Full Name</Label>
              <Input
                id="edit-customer-name"
                placeholder="e.g., John Doe"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-customer-email">Email Address</Label>
              <Input
                id="edit-customer-email"
                type="email"
                placeholder="e.g., john@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-customer-phone">Phone Number</Label>
              <Input
                id="edit-customer-phone"
                placeholder="e.g., +234 801 234 5678"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCustomerModal(false)}>Cancel</Button>
            <Button onClick={confirmEditCustomer} className="bg-green-600 hover:bg-green-700">Update Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Modal */}
      <Dialog open={deleteCustomerModal} onOpenChange={setDeleteCustomerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedCustomer?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCustomerModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteCustomer}>Delete Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Subscription Modal */}
      <Dialog open={viewSubscriptionModal} onOpenChange={setViewSubscriptionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>Complete information about this subscription</DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Customer</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedSubscription.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Plan</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedSubscription.planName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedSubscription.status} type="subscription" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Amount</Label>
                  <p className="text-sm text-gray-900 mt-1">₦{selectedSubscription.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Next Billing Date</Label>
                  <p className="text-sm text-gray-900 mt-1">{new Date(selectedSubscription.nextBillingDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Mandate Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedSubscription.mandateStatus} type="mandate" />
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewSubscriptionModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Modal */}
      <Dialog open={cancelSubscriptionModal} onOpenChange={setCancelSubscriptionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this subscription for {selectedSubscription?.customerName}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cancel-reason">Reason for Cancellation</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Enter the reason for cancelling this subscription..."
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelSubscriptionModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmCancelSubscription}>Cancel Subscription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Mandate Modal */}
      <Dialog open={viewMandateModal} onOpenChange={setViewMandateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mandate Details</DialogTitle>
            <DialogDescription>Complete information about this mandate</DialogDescription>
          </DialogHeader>
          {selectedMandate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Customer</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMandate.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Bank</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMandate.bankName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Account Number</Label>
                  <p className="text-sm text-gray-900 mt-1">***{selectedMandate.accountNumber.slice(-4)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Status</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedMandate.status} type="mandate" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Amount</Label>
                  <p className="text-sm text-gray-900 mt-1">₦{selectedMandate.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Frequency</Label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMandate.frequency}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Created Date</Label>
                  <p className="text-sm text-gray-900 mt-1">{new Date(selectedMandate.createdDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewMandateModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Mandate Modal */}
      <Dialog open={cancelMandateModal} onOpenChange={setCancelMandateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Mandate</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this direct debit mandate for {selectedMandate?.customerName}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelMandateModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmCancelMandate}>Cancel Mandate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Coupon Modal */}
      <Dialog open={createCouponModal} onOpenChange={setCreateCouponModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Discount Coupon</DialogTitle>
            <DialogDescription>Add a new discount coupon for customers</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="coupon-code">Coupon Code</Label>
              <Input
                id="coupon-code"
                placeholder="e.g., SAVE20"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coupon-type">Discount Type</Label>
                <Select value={couponType} onValueChange={setCouponType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Percentage">Percentage</SelectItem>
                    <SelectItem value="Fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="coupon-value">
                  {couponType === 'Percentage' ? 'Discount (%)' : 'Amount (₦)'}
                </Label>
                <Input
                  id="coupon-value"
                  type="number"
                  placeholder={couponType === 'Percentage' ? 'e.g., 20' : 'e.g., 1000'}
                  value={couponValue}
                  onChange={(e) => setCouponValue(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coupon-limit">Usage Limit</Label>
                <Input
                  id="coupon-limit"
                  type="number"
                  placeholder="e.g., 100"
                  value={couponLimit}
                  onChange={(e) => setCouponLimit(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="coupon-valid">Valid Until</Label>
                <Input
                  id="coupon-valid"
                  type="date"
                  value={couponValidTo}
                  onChange={(e) => setCouponValidTo(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateCouponModal(false)}>Cancel</Button>
            <Button onClick={confirmCreateCoupon} className="bg-green-600 hover:bg-green-700">Create Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Modal */}
      <Dialog open={editCouponModal} onOpenChange={setEditCouponModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Coupon</DialogTitle>
            <DialogDescription>Update coupon details for {selectedCoupon?.code}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-coupon-code">Coupon Code</Label>
              <Input
                id="edit-coupon-code"
                placeholder="e.g., SAVE20"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-coupon-type">Discount Type</Label>
                <Select value={couponType} onValueChange={setCouponType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Percentage">Percentage</SelectItem>
                    <SelectItem value="Fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-coupon-value">
                  {couponType === 'Percentage' ? 'Discount (%)' : 'Amount (₦)'}
                </Label>
                <Input
                  id="edit-coupon-value"
                  type="number"
                  placeholder={couponType === 'Percentage' ? 'e.g., 20' : 'e.g., 1000'}
                  value={couponValue}
                  onChange={(e) => setCouponValue(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-coupon-limit">Usage Limit</Label>
                <Input
                  id="edit-coupon-limit"
                  type="number"
                  placeholder="e.g., 100"
                  value={couponLimit}
                  onChange={(e) => setCouponLimit(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="edit-coupon-valid">Valid Until</Label>
                <Input
                  id="edit-coupon-valid"
                  type="date"
                  value={couponValidTo}
                  onChange={(e) => setCouponValidTo(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCouponModal(false)}>Cancel</Button>
            <Button onClick={confirmEditCoupon} className="bg-green-600 hover:bg-green-700">Update Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Coupon Modal */}
      <Dialog open={deleteCouponModal} onOpenChange={setDeleteCouponModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the coupon "{selectedCoupon?.code}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCouponModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteCoupon}>Delete Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Team Member Modal */}
      <Dialog open={inviteTeamModal} onOpenChange={setInviteTeamModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>Send an invitation to a new team member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="team-email">Email Address</Label>
              <Input
                id="team-email"
                type="email"
                placeholder="e.g., team@example.com"
                value={teamMemberEmail}
                onChange={(e) => setTeamMemberEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="team-role">Role</Label>
              <Select value={teamMemberRole} onValueChange={setTeamMemberRole}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                  <SelectItem value="Developer">Developer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteTeamModal(false)}>Cancel</Button>
            <Button onClick={confirmInviteTeam} className="bg-green-600 hover:bg-green-700">Send Invitation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Member Modal */}
      <Dialog open={editTeamMemberModal} onOpenChange={setEditTeamMemberModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Team Member Role</DialogTitle>
            <DialogDescription>Update the role for {selectedTeamMember?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-team-role">Role</Label>
              <Select value={teamMemberRole} onValueChange={setTeamMemberRole}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                  <SelectItem value="Developer">Developer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTeamMemberModal(false)}>Cancel</Button>
            <Button onClick={confirmEditTeamMember} className="bg-green-600 hover:bg-green-700">Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Team Member Modal */}
      <Dialog open={removeTeamMemberModal} onOpenChange={setRemoveTeamMemberModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {selectedTeamMember?.name} from your team?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTeamMemberModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmRemoveTeamMember}>Remove Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate API Keys Modal */}
      <Dialog open={regenerateKeysModal} onOpenChange={setRegenerateKeysModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate API Keys</DialogTitle>
            <DialogDescription>
              This will invalidate your current API keys. Any applications using the old keys will stop working.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegenerateKeysModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmRegenerateKeys}>Regenerate Keys</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Webhook Modal */}
      <Dialog open={addWebhookModal} onOpenChange={setAddWebhookModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Webhook</DialogTitle>
            <DialogDescription>Configure a webhook endpoint to receive real-time notifications</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://your-domain.com/webhook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="webhook-event">Event Type</Label>
              <Select value={webhookEvent} onValueChange={setWebhookEvent}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment.success">Payment Success</SelectItem>
                  <SelectItem value="payment.failed">Payment Failed</SelectItem>
                  <SelectItem value="subscription.created">Subscription Created</SelectItem>
                  <SelectItem value="subscription.cancelled">Subscription Cancelled</SelectItem>
                  <SelectItem value="mandate.created">Mandate Created</SelectItem>
                  <SelectItem value="mandate.cancelled">Mandate Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="webhook-secret">Secret Key (optional)</Label>
              <Input
                id="webhook-secret"
                type="password"
                placeholder="Secret for webhook verification"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddWebhookModal(false)}>Cancel</Button>
            <Button onClick={confirmAddWebhook} className="bg-green-600 hover:bg-green-700">Add Webhook</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Webhook Modal */}
      <Dialog open={testWebhookModal} onOpenChange={setTestWebhookModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Webhook</DialogTitle>
            <DialogDescription>
              Send a test event to your webhook endpoint to verify configuration
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestWebhookModal(false)}>Cancel</Button>
            <Button onClick={confirmTestWebhook} className="bg-green-600 hover:bg-green-700">Send Test Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Product Modal */}
      <Dialog open={createProductModal} onOpenChange={setCreateProductModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Create a product that you can use in subscription plans</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                placeholder="e.g., Premium Streaming Package"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="product-description">Description</Label>
              <Textarea
                id="product-description"
                placeholder="Brief description of the product"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="product-amount">Amount (₦)</Label>
              <Input
                id="product-amount"
                type="number"
                placeholder="e.g., 5000"
                value={productAmount}
                onChange={(e) => setProductAmount(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateProductModal(false)}>Cancel</Button>
            <Button onClick={confirmCreateProduct} className="bg-green-600 hover:bg-green-700">Create Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={editProductModal} onOpenChange={setEditProductModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-product-name">Product Name</Label>
              <Input
                id="edit-product-name"
                placeholder="e.g., Premium Streaming Package"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-product-description">Description</Label>
              <Textarea
                id="edit-product-description"
                placeholder="Brief description of the product"
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-product-amount">Amount (₦)</Label>
              <Input
                id="edit-product-amount"
                type="number"
                placeholder="e.g., 5000"
                value={productAmount}
                onChange={(e) => setProductAmount(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProductModal(false)}>Cancel</Button>
            <Button onClick={confirmEditProduct} className="bg-green-600 hover:bg-green-700">Update Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Modal */}
      <Dialog open={deleteProductModal} onOpenChange={setDeleteProductModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProductModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDeleteProduct}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <Dialog open={changePasswordModal} onOpenChange={setChangePasswordModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min. 8 characters)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordModal(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} className="bg-green-600 hover:bg-green-700">Change Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mandate Verification Sheet - Clean Silicon Valley Style */}
      <Sheet open={verificationModal} onOpenChange={setVerificationModal}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-8">
          <SheetHeader className="mb-10">
            <SheetTitle className="text-2xl font-bold">Payment Verification</SheetTitle>
            <SheetDescription className="text-base">
              Share these details with your customer to complete account verification
            </SheetDescription>
          </SheetHeader>

          {selectedMandate && (
            <>
              <div className="space-y-8" id="verification-content">
                {/* Status Banner - subtle */}
                <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50/50 border border-amber-200/50">
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-sm text-amber-700">Awaiting customer verification</span>
                </div>

                {/* Customer Account - Clean card */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Source Account
                  </p>
                  <div className="p-5 rounded-xl border bg-card/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bank</p>
                        <p className="text-lg font-semibold">{selectedMandate.bankName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Account</p>
                        <p className="text-lg font-mono">{selectedMandate.accountNumber}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs text-muted-foreground mb-1">Account Holder</p>
                      <p className="text-lg font-semibold">{selectedMandate.customerName}</p>
                    </div>
                    {selectedMandate.customerEmail && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Customer Email</p>
                        <p className="text-sm font-medium text-primary">{selectedMandate.customerEmail}</p>
                      </div>
                    )}
                    {selectedMandate.customerPhone && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground mb-1">Customer Phone</p>
                        <p className="text-sm font-medium text-[#25D366]">{selectedMandate.customerPhone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow indicator - simple */}
                <div className="flex justify-center">
                  <svg className="h-8 w-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>

                {/* Destination Account - Clean card with accent */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Destination Account
                  </p>
                  <div className="p-5 rounded-xl border-2 border-green-200 bg-green-50/30">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bank</p>
                        <p className="text-lg font-semibold">Sterling Bank</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Account</p>
                        <p className="text-lg font-mono">0123456789</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-green-200">
                      <p className="text-xs text-muted-foreground mb-1">Account Name</p>
                      <p className="text-lg font-semibold">Reccur Technologies Ltd</p>
                    </div>
                  </div>
                </div>

                {/* Subscription Plan Details - Only show if plan was selected */}
                {selectedMandate.planName && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Subscription Details
                    </p>
                    <div className="p-5 rounded-xl border bg-blue-50/30 border-blue-200/50">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Product</p>
                          <p className="text-lg font-semibold">{selectedMandate.productName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Plan</p>
                          <p className="text-lg font-semibold">{selectedMandate.planName}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-blue-200/50">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Recurring Amount</p>
                            <p className="text-2xl font-bold">₦{selectedMandate.amount?.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Billing Cycle</p>
                            <p className="text-lg font-medium">{selectedMandate.frequency}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Amount - Large and prominent */}
                <div className="text-center py-6">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Verification Amount
                  </p>
                  <p className="text-4xl font-bold font-mono">₦50.00</p>
                </div>

                {/* Instructions - Clean list */}
                <div className="p-5 rounded-xl bg-muted/30 border">
                  <p className="text-sm font-medium mb-3">Instructions for Customer</p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">1</span>
                      Transfer exactly ₦50.00 from the source account above
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">2</span>
                      We'll automatically verify the payment via NIBSS
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">3</span>
                      {selectedMandate.planName
                        ? `Once verified, ${selectedMandate.frequency?.toLowerCase()} debits of ₦${selectedMandate.amount?.toLocaleString()} will begin for ${selectedMandate.planName}`
                        : 'Once verified, the mandate will be activated for direct debit payments'}
                    </li>
                  </ul>
                </div>

                {/* Print-only content */}
                <div className="hidden print:block text-center mt-8 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">Generated on {new Date().toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">DSTV Nigeria - Subscription Management</p>
                </div>
              </div>

              {/* Actions - Clean buttons */}
              <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t print:hidden">
                <Button variant="outline" onClick={handleCopyToClipboard}>
                  {copiedToClipboard ? <CheckIcon className="h-4 w-4 mr-2" /> : <CopyIcon className="h-4 w-4 mr-2" />}
                  {copiedToClipboard ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="outline" onClick={handleSendEmail}>
                  <MailIcon className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  variant="outline"
                  onClick={handleShareWhatsApp}
                  className="border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10"
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </Button>
                <Button variant="outline" onClick={handlePrint}>
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setVerificationModal(false);
                    toast.success('Verification details shared. Mandate will activate once customer completes ₦50 transfer.');
                  }}
                >
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Done
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
